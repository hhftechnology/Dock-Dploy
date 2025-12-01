import jsyaml from "js-yaml";
import type { ServiceConfig, NetworkConfig, VolumeConfig } from "../types/compose";
import { defaultService } from "./default-configs";

export interface ParsedComposeData {
  service: ServiceConfig;
  networks: NetworkConfig[];
  volumes: VolumeConfig[];
}

export interface ComposeServiceInput {
  name: string;
  image: string;
  rawService: any;
}

/**
 * Parses a Docker Compose service into our ServiceConfig format
 */
export function parseComposeService(
  svc: ComposeServiceInput,
  allNetworks?: Record<string, any>,
  allVolumes?: Record<string, any>
): ParsedComposeData {
  const serviceData = svc.rawService || {};
  const actualServiceData = serviceData.rawService || serviceData;

  const parseCommandArray = (cmd: any): string => {
    if (Array.isArray(cmd)) {
      return JSON.stringify(cmd);
    }
    return cmd || "";
  };

  const newService: ServiceConfig = {
    ...defaultService(),
    name: svc.name,
    image: svc.image,
    container_name: actualServiceData.container_name || "",
    command: parseCommandArray(actualServiceData.command),
    restart: actualServiceData.restart || "",
    ports: Array.isArray(actualServiceData.ports)
      ? actualServiceData.ports.map((p: string) => {
          // Handle format: "host:container/protocol" or "container/protocol" or just "container"
          if (p.includes(":")) {
            const parts = p.split(":");
            const host = parts[0];
            const containerWithProtocol = parts[1] || "";
            const [container, protocol] = containerWithProtocol.split("/");
            return {
              host,
              container,
              protocol: protocol || "none",
            };
          } else {
            // No colon means it's just a container port, possibly with protocol
            const [container, protocol] = p.split("/");
            return {
              host: "",
              container,
              protocol: protocol || "none",
            };
          }
        })
      : [],
    expose: Array.isArray(actualServiceData.expose)
      ? actualServiceData.expose
      : actualServiceData.expose
        ? [String(actualServiceData.expose)]
        : [],
    volumes: Array.isArray(actualServiceData.volumes)
      ? actualServiceData.volumes.map((v: any) => {
          if (typeof v === "string") {
            const parts = v.split(":");
            const host = parts[0];
            const container = parts[1] || "";
            const read_only = parts[2] === "ro";
            return { host, container, read_only };
          } else if (typeof v === "object" && v !== null) {
            return {
              host: v.source || "",
              container: v.target || "",
              read_only: v.read_only || false,
            };
          }
          return { host: "", container: "", read_only: false };
        })
      : [],
    volumes_syntax:
      Array.isArray(actualServiceData.volumes) &&
      actualServiceData.volumes.length > 0 &&
      typeof actualServiceData.volumes[0] === "object"
        ? "dict"
        : "array",
    environment: Array.isArray(actualServiceData.environment)
      ? actualServiceData.environment.map((e: string) => {
          const [key, ...rest] = e.split("=");
          return { key, value: rest.join("=") };
        })
      : actualServiceData.environment &&
          typeof actualServiceData.environment === "object"
        ? Object.entries(actualServiceData.environment).map(
            ([key, value]: [string, any]) => ({ key, value: String(value) })
          )
        : [],
    environment_syntax: Array.isArray(actualServiceData.environment)
      ? "array"
      : "dict",
    healthcheck: actualServiceData.healthcheck
      ? {
          test: parseCommandArray(actualServiceData.healthcheck.test),
          interval: actualServiceData.healthcheck.interval || "",
          timeout: actualServiceData.healthcheck.timeout || "",
          retries: actualServiceData.healthcheck.retries
            ? String(actualServiceData.healthcheck.retries)
            : "",
          start_period: actualServiceData.healthcheck.start_period || "",
          start_interval: actualServiceData.healthcheck.start_interval || "",
        }
      : undefined,
    depends_on: Array.isArray(actualServiceData.depends_on)
      ? actualServiceData.depends_on
      : actualServiceData.depends_on
        ? Object.keys(actualServiceData.depends_on)
        : [],
    entrypoint: parseCommandArray(actualServiceData.entrypoint),
    env_file: Array.isArray(actualServiceData.env_file)
      ? actualServiceData.env_file.join(",")
      : actualServiceData.env_file || "",
    extra_hosts: Array.isArray(actualServiceData.extra_hosts)
      ? actualServiceData.extra_hosts
      : [],
    dns: Array.isArray(actualServiceData.dns) ? actualServiceData.dns : [],
    networks: Array.isArray(actualServiceData.networks)
      ? actualServiceData.networks
      : actualServiceData.networks
        ? Object.keys(actualServiceData.networks)
        : [],
    user: actualServiceData.user || "",
    working_dir: actualServiceData.working_dir || "",
    labels: actualServiceData.labels
      ? Array.isArray(actualServiceData.labels)
        ? actualServiceData.labels.map((l: string) => {
            const [key, ...rest] = l.split("=");
            return { key, value: rest.join("=") };
          })
        : Object.entries(actualServiceData.labels).map(
            ([key, value]: [string, any]) => ({ key, value: String(value) })
          )
      : [],
    privileged:
      actualServiceData.privileged !== undefined
        ? !!actualServiceData.privileged
        : undefined,
    read_only:
      actualServiceData.read_only !== undefined
        ? !!actualServiceData.read_only
        : undefined,
    shm_size: actualServiceData.shm_size || "",
    security_opt: Array.isArray(actualServiceData.security_opt)
      ? actualServiceData.security_opt
      : [],
    network_mode: actualServiceData.network_mode || "",
    cap_add: Array.isArray(actualServiceData.cap_add)
      ? actualServiceData.cap_add
      : [],
    cap_drop: Array.isArray(actualServiceData.cap_drop)
      ? actualServiceData.cap_drop
      : [],
    sysctls:
      actualServiceData.sysctls && typeof actualServiceData.sysctls === "object"
        ? Array.isArray(actualServiceData.sysctls)
          ? actualServiceData.sysctls.map((s: string) => {
              const [key, value] = s.split("=");
              return { key: key || "", value: value || "" };
            })
          : Object.entries(actualServiceData.sysctls).map(
              ([key, value]: [string, any]) => ({
                key,
                value: String(value),
              })
            )
        : [],
    devices: Array.isArray(actualServiceData.devices)
      ? actualServiceData.devices
      : [],
    tmpfs: Array.isArray(actualServiceData.tmpfs)
      ? actualServiceData.tmpfs
      : actualServiceData.tmpfs
        ? Object.keys(actualServiceData.tmpfs).map(
            (key) => `${key}:${actualServiceData.tmpfs[key] || ""}`
          )
        : [],
    ulimits:
      actualServiceData.ulimits &&
      typeof actualServiceData.ulimits === "object"
        ? Object.entries(actualServiceData.ulimits).map(
            ([name, limit]: [string, any]) => ({
              name,
              soft:
                limit && typeof limit === "object" && limit.soft
                  ? String(limit.soft)
                  : "",
              hard:
                limit && typeof limit === "object" && limit.hard
                  ? String(limit.hard)
                  : "",
            })
          )
        : [],
    init:
      actualServiceData.init !== undefined ? !!actualServiceData.init : undefined,
    stop_grace_period: actualServiceData.stop_grace_period || "",
    stop_signal: actualServiceData.stop_signal || "",
    tty:
      actualServiceData.tty !== undefined ? !!actualServiceData.tty : undefined,
    stdin_open:
      actualServiceData.stdin_open !== undefined
        ? !!actualServiceData.stdin_open
        : undefined,
    hostname: actualServiceData.hostname || "",
    domainname: actualServiceData.domainname || "",
    mac_address: actualServiceData.mac_address || "",
    ipc_mode: actualServiceData.ipc || "",
    pid: actualServiceData.pid || "",
    uts: actualServiceData.uts || "",
    cgroup_parent: actualServiceData.cgroup_parent || "",
    isolation: actualServiceData.isolation || "",
    deploy: actualServiceData.deploy?.resources
      ? {
          resources: {
            limits: {
              cpus:
                actualServiceData.deploy.resources.limits?.cpus || undefined,
              memory:
                actualServiceData.deploy.resources.limits?.memory || undefined,
            },
            reservations: {
              cpus:
                actualServiceData.deploy.resources.reservations?.cpus ||
                undefined,
              memory:
                actualServiceData.deploy.resources.reservations?.memory ||
                undefined,
            },
          },
        }
      : undefined,
  };

  // Parse networks
  const networkConfigs: NetworkConfig[] =
    allNetworks && Object.keys(allNetworks).length > 0
      ? Object.entries(allNetworks).map(([name, config]: [string, any]) => ({
          name,
          driver: config.driver || "",
          driver_opts: config.driver_opts
            ? Object.entries(config.driver_opts).map(
                ([key, value]: [string, any]) => ({ key, value: String(value) })
              )
            : [],
          attachable:
            config.attachable !== undefined ? !!config.attachable : false,
          labels: config.labels
            ? Array.isArray(config.labels)
              ? config.labels.map((l: string) => {
                  const [key, ...rest] = l.split("=");
                  return { key, value: rest.join("=") };
                })
              : Object.entries(config.labels).map(
                  ([key, value]: [string, any]) => ({
                    key,
                    value: String(value),
                  })
                )
            : [],
          external: !!config.external,
          name_external:
            config.external && typeof config.external === "object"
              ? config.external.name || ""
              : "",
          internal: config.internal !== undefined ? !!config.internal : false,
          enable_ipv6:
            config.enable_ipv6 !== undefined ? !!config.enable_ipv6 : false,
          ipam: {
            driver: config.ipam?.driver || "",
            config: config.ipam?.config || [],
            options: config.ipam?.options
              ? Object.entries(config.ipam.options).map(
                  ([key, value]: [string, any]) => ({
                    key,
                    value: String(value),
                  })
                )
              : [],
          },
        }))
      : [];

  // Parse volumes
  const volumeConfigs: VolumeConfig[] =
    allVolumes && Object.keys(allVolumes).length > 0
      ? Object.entries(allVolumes).map(([name, config]: [string, any]) => {
          let driverOptsType = "";
          let driverOptsDevice = "";
          let driverOptsO = "";

          if (config && config.driver_opts) {
            driverOptsType = config.driver_opts.type || "";
            driverOptsDevice = config.driver_opts.device || "";
            driverOptsO = config.driver_opts.o || "";
          }

          return {
            name,
            driver: config && config.driver ? config.driver : "",
            driver_opts:
              config && config.driver_opts
                ? Object.entries(config.driver_opts).map(
                    ([key, value]: [string, any]) => ({
                      key,
                      value: String(value),
                    })
                  )
                : [],
            labels:
              config && config.labels
                ? Array.isArray(config.labels)
                  ? config.labels.map((l: string) => {
                      const [key, ...rest] = l.split("=");
                      return { key, value: rest.join("=") };
                    })
                  : Object.entries(config.labels).map(
                      ([key, value]: [string, any]) => ({
                        key,
                        value: String(value),
                      })
                    )
                : [],
            external: !!config?.external,
            name_external:
              config?.external && typeof config.external === "object"
                ? config.external.name || ""
                : "",
            driver_opts_type: driverOptsType,
            driver_opts_device: driverOptsDevice,
            driver_opts_o: driverOptsO,
          };
        })
      : [];

  return {
    service: newService,
    networks: networkConfigs,
    volumes: volumeConfigs,
  };
}

/**
 * Parses a Docker Compose YAML template and returns all services, networks, and volumes
 */
export function parseComposeTemplate(composeContent: string): {
  services: ComposeServiceInput[];
  networks: Record<string, any>;
  volumes: Record<string, any>;
} {
  const doc = jsyaml.load(composeContent) as any;

  if (!doc || !doc.services) {
    throw new Error("Invalid docker-compose.yml in template");
  }

  // Extract all services from compose file
  const servicesArray: ComposeServiceInput[] = Object.entries(
    doc.services
  ).map(([svcName, svcObj]: [string, any]) => ({
    name: svcName,
    image: svcObj.image || "",
    rawService: svcObj,
  }));

  return {
    services: servicesArray,
    networks: doc.networks || {},
    volumes: doc.volumes || {},
  };
}

