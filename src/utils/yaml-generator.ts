// YAML Generation Utilities for Docker Compose

import type {
  ServiceConfig,
  NetworkConfig,
  VolumeConfig,
} from "../types/compose";
import type { VPNConfig } from "../types/vpn-configs";
import {
  generateVpnService,
  getVpnVolumes,
  getVpnNetworks,
  getVpnServiceName,
  generateTailscaleServeConfig,
} from "./vpn-generator";
import { defaultVPNConfig } from "./default-configs";

export function generateYaml(
  services: ServiceConfig[],
  networks: NetworkConfig[],
  volumes: VolumeConfig[],
  vpnConfig?: VPNConfig
): string {
  // Ensure vpnConfig has a default value
  const vpn = vpnConfig || defaultVPNConfig();

  const compose: any = { services: {} };
  services.forEach((svc) => {
    if (!svc.name) return;

    const parseCommandString = (cmd: string): string[] => {
      if (!cmd) return [];
      if (Array.isArray(cmd)) {
        return cmd;
      }

      try {
        const parsed = JSON.parse(cmd);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {}
      const parts = cmd.match(/(?:"[^"]*"|'[^']*'|\S+)/g) || [];
      return parts.map((part) => {
        const trimmed = part.replace(/^["']|["']$/g, "");
        return trimmed;
      });
    };

    // Check if service should use VPN
    const shouldUseVpn =
      vpn.enabled &&
      vpnConfig?.type &&
      vpn.servicesUsingVpn.includes(svc.name);

    const vpnServiceName =
      vpn.enabled && vpn.type ? getVpnServiceName(vpn.type) : null;

    // VPN types that use network_mode
    const usesNetworkMode =
      vpn.enabled &&
      vpn.type &&
      ["tailscale", "cloudflared"].includes(vpn.type) &&
      shouldUseVpn;

    compose.services[svc.name] = {
      image: svc.image || undefined,
      container_name: svc.container_name || undefined,
      command: svc.command ? parseCommandString(svc.command) : undefined,
      restart: svc.restart || undefined,
      // If using VPN with network_mode, don't expose ports (they go through VPN)
      ports: usesNetworkMode
        ? undefined
        : svc.ports.length
          ? svc.ports
              .map((p) => {
                if (!p.container) return undefined;
                const portStr =
                  p.host && p.container
                    ? `${p.host}:${p.container}`
                    : p.container;
                // Only add protocol if it's not "none"
                return p.protocol && p.protocol !== "none"
                  ? `${portStr}/${p.protocol}`
                  : portStr;
              })
              .filter(Boolean)
          : undefined,
      expose:
        svc.expose && svc.expose.length > 0
          ? svc.expose.filter(Boolean)
          : undefined,
      // Network mode: use VPN network_mode if enabled, otherwise use user-defined
      network_mode:
        usesNetworkMode && vpnServiceName
          ? `service:${vpnServiceName}`
          : svc.network_mode || undefined,
      volumes: svc.volumes.length
        ? svc.volumes_syntax === "dict"
          ? svc.volumes
              .map((v) => {
                if (v.host && v.container) {
                  const vol: any = {
                    type: "bind",
                    source: v.host,
                    target: v.container,
                  };
                  if (v.read_only) {
                    vol.read_only = true;
                  }
                  return vol;
                } else if (v.container) {
                  // Anonymous volume - just target path
                  return {
                    type: "volume",
                    target: v.container,
                  };
                }
                return undefined;
              })
              .filter(Boolean)
          : svc.volumes
              .map((v) => {
                if (v.host && v.container) {
                  return v.read_only
                    ? `${v.host}:${v.container}:ro`
                    : `${v.host}:${v.container}`;
                }
                return v.container ? v.container : undefined;
              })
              .filter(Boolean)
        : undefined,
      environment: svc.environment.length
        ? svc.environment_syntax === "dict"
          ? svc.environment
              .filter(({ key }) => key)
              .reduce(
                (acc, { key, value }) => {
                  acc[key] = value;
                  return acc;
                },
                {} as Record<string, string>
              )
          : svc.environment
              .filter(({ key }) => key)
              .map(({ key, value }) => `${key}=${value}`)
        : undefined,
      healthcheck:
        svc.healthcheck && svc.healthcheck.test
          ? {
              test: parseCommandString(svc.healthcheck.test),
              interval: svc.healthcheck.interval || undefined,
              timeout: svc.healthcheck.timeout || undefined,
              retries: svc.healthcheck.retries || undefined,
              start_period: svc.healthcheck.start_period || undefined,
              start_interval: svc.healthcheck.start_interval || undefined,
            }
          : undefined,
      depends_on:
        svc.depends_on && svc.depends_on.filter(Boolean).length
          ? svc.depends_on.filter(Boolean)
          : undefined,
      entrypoint: svc.entrypoint
        ? parseCommandString(svc.entrypoint)
        : undefined,
      env_file:
        svc.env_file && svc.env_file.trim()
          ? svc.env_file.split(",").map((f) => f.trim())
          : undefined,
      extra_hosts:
        svc.extra_hosts && svc.extra_hosts.filter(Boolean).length
          ? svc.extra_hosts.filter(Boolean)
          : undefined,
      dns:
        svc.dns && svc.dns.filter(Boolean).length
          ? svc.dns.filter(Boolean)
          : undefined,
      networks: usesNetworkMode
        ? undefined
        : shouldUseVpn && vpn.type === "newt" && vpn.newt
          ? [vpn.newt.networkName]
          : svc.networks && svc.networks.filter(Boolean).length
            ? svc.networks.filter(Boolean)
            : undefined,
      user: svc.user || undefined,
      working_dir: svc.working_dir || undefined,
      labels:
        svc.labels && svc.labels.filter((l) => l.key).length
          ? svc.labels
              .filter((l) => l.key)
              .map(({ key, value }) => `${key}=${value}`)
          : undefined,
      privileged: svc.privileged !== undefined ? svc.privileged : undefined,
      read_only: svc.read_only !== undefined ? svc.read_only : undefined,
      shm_size: svc.shm_size || undefined,
      security_opt:
        svc.security_opt && svc.security_opt.filter(Boolean).length
          ? svc.security_opt.filter(Boolean)
          : undefined,
      cap_add:
        svc.cap_add && svc.cap_add.filter(Boolean).length
          ? svc.cap_add.filter(Boolean)
          : undefined,
      cap_drop:
        svc.cap_drop && svc.cap_drop.filter(Boolean).length
          ? svc.cap_drop.filter(Boolean)
          : undefined,
      sysctls:
        svc.sysctls && svc.sysctls.filter((s) => s.key).length
          ? svc.sysctls
              .filter((s) => s.key)
              .reduce(
                (acc, { key, value }) => {
                  acc[key] = value || undefined;
                  return acc;
                },
                {} as Record<string, string | undefined>
              )
          : undefined,
      devices:
        svc.devices && svc.devices.filter(Boolean).length
          ? svc.devices.filter(Boolean)
          : undefined,
      tmpfs:
        svc.tmpfs && svc.tmpfs.filter(Boolean).length
          ? svc.tmpfs.filter(Boolean)
          : undefined,
      ulimits:
        svc.ulimits && svc.ulimits.filter((u) => u.name).length
          ? svc.ulimits
              .filter((u) => u.name)
              .reduce(
                (acc, u) => {
                  if (u.soft && u.hard) {
                    acc[u.name] = {
                      soft: parseInt(u.soft),
                      hard: parseInt(u.hard),
                    };
                  } else if (u.soft) {
                    acc[u.name] = { soft: parseInt(u.soft) };
                  } else if (u.hard) {
                    acc[u.name] = { hard: parseInt(u.hard) };
                  } else {
                    acc[u.name] = {};
                  }
                  return acc;
                },
                {} as Record<string, any>
              )
          : undefined,
      init: svc.init !== undefined ? svc.init : undefined,
      stop_grace_period: svc.stop_grace_period || undefined,
      stop_signal: svc.stop_signal || undefined,
      tty: svc.tty !== undefined ? svc.tty : undefined,
      stdin_open: svc.stdin_open !== undefined ? svc.stdin_open : undefined,
      hostname: svc.hostname || undefined,
      domainname: svc.domainname || undefined,
      mac_address: svc.mac_address || undefined,
      ipc: svc.ipc_mode || undefined,
      pid: svc.pid || undefined,
      uts: svc.uts || undefined,
      cgroup_parent: svc.cgroup_parent || undefined,
      isolation: svc.isolation || undefined,
      deploy:
        svc.deploy && svc.deploy.resources
          ? (() => {
              const limits: any = {};
              if (svc.deploy.resources.limits?.cpus)
                limits.cpus = svc.deploy.resources.limits.cpus;
              if (svc.deploy.resources.limits?.memory)
                limits.memory = svc.deploy.resources.limits.memory;

              const reservations: any = {};
              if (svc.deploy.resources.reservations?.cpus)
                reservations.cpus = svc.deploy.resources.reservations.cpus;
              if (svc.deploy.resources.reservations?.memory)
                reservations.memory =
                  svc.deploy.resources.reservations.memory;

              const resources: any = {};
              if (Object.keys(limits).length > 0) resources.limits = limits;
              if (Object.keys(reservations).length > 0)
                resources.reservations = reservations;

              return Object.keys(resources).length > 0
                ? { resources }
                : undefined;
            })()
          : undefined,
    };
  });
  for (const name in compose.services) {
    Object.keys(compose.services[name]).forEach(
      (k) =>
        compose.services[name][k] === undefined &&
        delete compose.services[name][k]
    );
  }

  // Add VPN service if enabled
  if (vpn.enabled && vpn.type) {
    const vpnService = generateVpnService(vpn);
    if (vpnService) {
      Object.assign(compose.services, vpnService);
    }
  }

  // Add VPN volumes
  const vpnVolumes = getVpnVolumes(vpn);
  if (vpnVolumes.length > 0) {
    volumes = [...volumes, ...vpnVolumes];
  }

  // Add VPN networks
  const vpnNetworks = getVpnNetworks(vpn);
  if (vpnNetworks.length > 0) {
    networks = [...networks, ...vpnNetworks];
  }

  // Add Tailscale serve configs if enabled
  if (
    vpn.enabled &&
    vpn.type === "tailscale" &&
    vpn.tailscale?.enableServe &&
    vpn.tailscale?.serveTargetService
  ) {
    const ts = vpn.tailscale;
    const serveConfig = generateTailscaleServeConfig(
      ts.serveTargetService,
      ts.serveExternalPort,
      ts.serveInternalPort,
      ts.servePath,
      ts.serveProtocol,
      ts.certDomain,
      ts.serveInsideProtocol || "http"
    );

    if (!compose.configs) {
      compose.configs = {};
    }
    compose.configs["serve-config"] = {
      content: serveConfig,
    };
  }

  if (networks.length) {
    compose.networks = {};
    networks.forEach((n) => {
      if (!n.name) return;
      if (n.external) {
        compose.networks[n.name] = {
          external: n.name_external ? { name: n.name_external } : true,
        };
      } else {
        compose.networks[n.name] = {
          driver: n.driver || undefined,
          attachable: n.attachable !== undefined ? n.attachable : undefined,
          internal: n.internal !== undefined ? n.internal : undefined,
          enable_ipv6:
            n.enable_ipv6 !== undefined ? n.enable_ipv6 : undefined,
          driver_opts:
            n.driver_opts && n.driver_opts.length
              ? n.driver_opts
                  .filter((opt) => opt.key)
                  .reduce(
                    (acc, { key, value }) => {
                      acc[key] = value;
                      return acc;
                    },
                    {} as Record<string, string>
                  )
              : undefined,
          labels:
            n.labels && n.labels.length
              ? n.labels
                  .filter((l) => l.key)
                  .map(({ key, value }) => `${key}=${value}`)
              : undefined,
          ipam:
            n.ipam.driver || n.ipam.config.length || n.ipam.options.length
              ? {
                  driver: n.ipam.driver || undefined,
                  config: n.ipam.config.length ? n.ipam.config : undefined,
                  options: n.ipam.options.length
                    ? n.ipam.options
                        .filter((opt) => opt.key)
                        .reduce(
                          (acc, { key, value }) => {
                            acc[key] = value;
                            return acc;
                          },
                          {} as Record<string, string>
                        )
                    : undefined,
                }
              : undefined,
        };
      }
      Object.keys(compose.networks[n.name]).forEach(
        (k) =>
          compose.networks[n.name][k] === undefined &&
          delete compose.networks[n.name][k]
      );
    });
  }
  if (volumes.length) {
    compose.volumes = {};
    volumes.forEach((v) => {
      if (!v.name) return;
      if (v.external) {
        const externalVolume: any = {
          external: v.name_external ? { name: v.name_external } : true,
        };

        if (v.driver) {
          externalVolume.driver = v.driver;
        }

        const driverOpts: Record<string, string> = {};

        if (v.driver_opts && v.driver_opts.length) {
          v.driver_opts
            .filter((opt) => opt.key)
            .forEach(({ key, value }) => {
              driverOpts[key] = value;
            });
        }

        if (v.driver_opts_type) driverOpts.type = v.driver_opts_type;
        if (v.driver_opts_device) driverOpts.device = v.driver_opts_device;
        if (v.driver_opts_o) driverOpts.o = v.driver_opts_o;

        if (Object.keys(driverOpts).length > 0) {
          externalVolume.driver_opts = driverOpts;
        }

        if (v.labels && v.labels.length) {
          externalVolume.labels = v.labels
            .filter((l) => l.key)
            .map(({ key, value }) => `${key}=${value}`);
        }

        compose.volumes[v.name] = externalVolume;
      } else {
        const driverOpts: Record<string, string> = {};

        if (v.driver_opts && v.driver_opts.length) {
          v.driver_opts
            .filter((opt) => opt.key)
            .forEach(({ key, value }) => {
              driverOpts[key] = value;
            });
        }

        if (v.driver_opts_type) driverOpts.type = v.driver_opts_type;
        if (v.driver_opts_device) driverOpts.device = v.driver_opts_device;
        if (v.driver_opts_o) driverOpts.o = v.driver_opts_o;

        compose.volumes[v.name] = {
          driver: v.driver || undefined,
          driver_opts:
            Object.keys(driverOpts).length > 0 ? driverOpts : undefined,
          labels:
            v.labels && v.labels.length
              ? v.labels
                  .filter((l) => l.key)
                  .map(({ key, value }) => `${key}=${value}`)
              : undefined,
        };
      }
      Object.keys(compose.volumes[v.name]).forEach(
        (k) =>
          compose.volumes[v.name][k] === undefined &&
          delete compose.volumes[v.name][k]
      );
    });
  }
  let yamlOutput = yamlStringify(compose);

  // Add comments to YAML for VPN services
  if (vpn.enabled && vpn.type) {
    const lines = yamlOutput.split("\n");
    const commentedLines: string[] = [];
    let inVpnService = false;
    let inServicesSection = false;
    let inVolumesSection = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Track which section we're in
      if (trimmed === "services:") {
        inServicesSection = true;
        inVolumesSection = false;
      } else if (trimmed === "volumes:") {
        inVolumesSection = true;
        inServicesSection = false;
      } else if (trimmed === "networks:" || trimmed === "configs:") {
        inServicesSection = false;
        inVolumesSection = false;
      }

      // Detect VPN service (only in services section, not volumes)
      if (
        inServicesSection &&
        !inVolumesSection &&
        (trimmed.startsWith(`${vpn.type}:`) || trimmed === `${vpn.type}:`)
      ) {
        inVpnService = true;
        commentedLines.push("");
        commentedLines.push(`# ${vpn.type} VPN Sidecar Configuration`);
        if (vpn.type === "tailscale") {
          commentedLines.push("# Routes traffic through Tailscale VPN");
          if (vpn.tailscale?.hostname) {
            commentedLines.push(`# Hostname: ${vpn.tailscale.hostname}`);
          }
          if (vpn.tailscale?.enableServe) {
            commentedLines.push(
              "# Tailscale Serve enabled - exposes service on Tailnet"
            );
          }
        }
      }

      // Detect end of service (next service or section)
      if (
        inVpnService &&
        trimmed &&
        !trimmed.startsWith(" ") &&
        !trimmed.startsWith("-") &&
        trimmed.endsWith(":") &&
        trimmed !== `${vpn.type}:`
      ) {
        inVpnService = false;
      }

      commentedLines.push(line);
    }

    yamlOutput = commentedLines.join("\n");
  }

  return yamlOutput;
}

export function yamlStringify(obj: any, indent = 0, parentKey = ""): string {
  const pad = (n: number) => "  ".repeat(n);
  if (typeof obj !== "object" || obj === null) return String(obj);
  if (Array.isArray(obj)) {
    const shouldBeSingleLine =
      ["command", "entrypoint"].includes(parentKey) ||
      (parentKey === "test" && indent > 0);
    if (shouldBeSingleLine && obj.length > 0 && typeof obj[0] === "string") {
      return `[${obj.map((v) => `"${v}"`).join(", ")}]`;
    }
    return obj
      .map(
        (v) =>
          `\n${pad(indent)}- ${yamlStringify(v, indent + 1, parentKey).trimStart()}`
      )
      .join("");
  }
  const entries = Object.entries(obj)
    .map(([k, v]) => {
      if (v === undefined) return "";
      if (typeof v === "object" && v !== null && !Array.isArray(v)) {
        return `\n${pad(indent)}${k}:` + yamlStringify(v, indent + 1, k);
      }
      if (Array.isArray(v)) {
        if (
          ["command", "entrypoint"].includes(k) ||
          (k === "test" && indent > 0)
        ) {
          return `\n${pad(indent)}${k}: [${v.map((item) => `"${item}"`).join(", ")}]`;
        }
        return `\n${pad(indent)}${k}: ` + yamlStringify(v, indent + 1, k);
      }
      // Handle multi-line strings (like JSON in configs.content) using literal block scalar
      if (
        typeof v === "string" &&
        k === "content" &&
        parentKey &&
        v.includes("\n")
      ) {
        // Use YAML literal block scalar (|) to preserve multi-line strings
        const lines = v.split("\n");
        const escapedLines = lines.map((line, idx) => {
          // Escape special YAML characters if needed
          if (line.trim() === "" && idx === lines.length - 1) return "";
          return line;
        });
        return `\n${pad(indent)}${k}: |\n${escapedLines.map((line) => `${pad(indent + 1)}${line}`).join("\n")}`;
      }
      // For regular strings, output as-is (don't add quotes unless necessary)
      // Port strings (like "8080:8080" or "8080/tcp") should not be quoted
      if (typeof v === "string") {
        // Don't quote port mappings (format: "host:container" or "port/protocol")
        const isPortMapping = /^\d+(:\d+)?(\/\w+)?$/.test(v);
        // Don't quote simple numeric strings or port-like values
        if (isPortMapping || /^\d+$/.test(v)) {
          return `\n${pad(indent)}${k}: ${v}`;
        }
        // Only quote if the string contains special YAML characters that need escaping
        // But exclude colons in port mappings which are already handled above
        const needsQuotes =
          /^[\d-]|[:{}\[\],&*#?|>'"%@`]/.test(v) || v.trim() !== v;
        return `\n${pad(indent)}${k}: ${needsQuotes ? `"${v.replace(/"/g, '\\"')}"` : v}`;
      }
      return `\n${pad(indent)}${k}: ${v}`;
    })
    .join("");
  return indent === 0 && entries.startsWith("\n")
    ? entries.slice(1)
    : entries;
}
