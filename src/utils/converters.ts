// Conversion utilities for Docker Compose to other formats

import type { ServiceConfig } from "../types/compose";
import type { VPNConfig } from "../types/vpn-configs";
import jsyaml from "js-yaml";

// Convert Docker Compose service to docker run command
export function convertToDockerRun(service: ServiceConfig): string {
  let cmd = "docker run";

  if (service.container_name) {
    cmd += ` --name ${service.container_name}`;
  }

  if (service.restart) {
    cmd += ` --restart ${service.restart}`;
  }

  service.ports.forEach((p) => {
    if (p.host && p.container) {
      const protocol =
        p.protocol && p.protocol !== "none" ? `/${p.protocol}` : "";
      cmd += ` -p ${p.host}:${p.container}${protocol}`;
    }
  });

  service.volumes.forEach((v) => {
    if (v.host && v.container) {
      cmd += ` -v ${v.host}:${v.container}`;
      if (v.read_only) cmd += ":ro";
    }
  });

  service.environment.forEach((e) => {
    if (e.key) {
      cmd += ` -e ${e.key}=${e.value || ""}`;
    }
  });

  if (service.user) {
    cmd += ` --user ${service.user}`;
  }

  if (service.working_dir) {
    cmd += ` -w ${service.working_dir}`;
  }

  if (service.privileged) {
    cmd += " --privileged";
  }

  if (service.read_only) {
    cmd += " --read-only";
  }

  if (service.shm_size) {
    cmd += ` --shm-size ${service.shm_size}`;
  }

  service.security_opt?.forEach((opt) => {
    if (opt) cmd += ` --security-opt ${opt}`;
  });

  service.extra_hosts?.forEach((host) => {
    if (host) cmd += ` --add-host ${host}`;
  });

  service.dns?.forEach((dns) => {
    if (dns) cmd += ` --dns ${dns}`;
  });

  if (service.networks && service.networks.length > 0) {
    cmd += ` --network ${service.networks[0]}`;
  }

  cmd += ` ${service.image || ""}`;

  if (service.command) {
    try {
      const parsed = JSON.parse(service.command);
      if (Array.isArray(parsed)) {
        cmd += ` ${parsed.join(" ")}`;
      } else {
        cmd += ` ${service.command}`;
      }
    } catch {
      cmd += ` ${service.command}`;
    }
  }

  return cmd;
}

// Convert Docker Compose service to systemd service file
export function convertToSystemd(service: ServiceConfig): string {
  const containerName = service.container_name || service.name;

  let unit = `[Unit]
Description=Docker Container ${containerName}
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/usr/bin/docker start ${containerName}
ExecStop=/usr/bin/docker stop ${containerName}
Restart=${service.restart === "always" ? "always" : service.restart === "unless-stopped" ? "on-failure" : "no"}

[Install]
WantedBy=multi-user.target
`;

  return unit;
}

// Generate Komodo .toml from YAML
export function generateKomodoToml(yaml: string): string {
  try {
    // Extract services from compose file if available
    const composeData = jsyaml.load(yaml) as any;
    const services = composeData?.services || {};

    let toml = `# Komodo configuration generated from Portainer stack
# Generated from Docker Compose configuration

`;

    Object.entries(services).forEach(([name, service]: [string, any]) => {
      toml += `[${name}]\n`;
      if (service.image) {
        toml += `image = "${service.image}"\n`;
      }
      if (service.container_name) {
        toml += `container_name = "${service.container_name}"\n`;
      }
      if (service.restart) {
        toml += `restart = "${service.restart}"\n`;
      }
      if (service.ports && Array.isArray(service.ports)) {
        toml += `ports = [\n`;
        service.ports.forEach((port: string) => {
          toml += `  "${port}",\n`;
        });
        toml += `]\n`;
      }
      if (service.volumes && Array.isArray(service.volumes)) {
        toml += `volumes = [\n`;
        service.volumes.forEach((vol: string) => {
          toml += `  "${vol}",\n`;
        });
        toml += `]\n`;
      }
      if (service.environment) {
        if (Array.isArray(service.environment)) {
          toml += `environment = [\n`;
          service.environment.forEach((env: string) => {
            toml += `  "${env}",\n`;
          });
          toml += `]\n`;
        } else {
          toml += `environment = {}\n`;
          Object.entries(service.environment).forEach(
            ([key, value]: [string, any]) => {
              toml += `environment.${key} = "${value}"\n`;
            }
          );
        }
      }
      toml += `\n`;
    });

    return toml;
  } catch (error: any) {
    return `# Komodo configuration generated from Docker Compose
# Note: Error parsing configuration: ${error.message}
# Please adjust manually

[service]
name = "service"
image = ""

# Add configuration as needed
`;
  }
}

// Generate .env file from services and VPN config
export function generateEnvFile(
  services: ServiceConfig[],
  vpnConfig?: VPNConfig
): string {
  const envVars = new Set<string>();

  // Extract env vars from services
  services.forEach((service) => {
    service.environment.forEach(({ key, value }) => {
      if (key && value && value.startsWith("${") && value.endsWith("}")) {
        const envKey = value.slice(2, -1);
        envVars.add(`${envKey}=`);
      }
    });
  });

  // Add VPN-specific env vars
  if (vpnConfig?.enabled && vpnConfig.type) {
    switch (vpnConfig.type) {
      case "tailscale":
        if (vpnConfig.tailscale?.authKey) {
          envVars.add("TS_AUTHKEY=");
        }
        break;
      case "newt":
        if (vpnConfig.newt?.newtId) {
          envVars.add("NEWT_ID=");
        }
        if (vpnConfig.newt?.newtSecret) {
          envVars.add("NEWT_SECRET=");
        }
        break;
      case "cloudflared":
        if (vpnConfig.cloudflared?.tunnelToken) {
          envVars.add("TUNNEL_TOKEN=");
        }
        break;
      case "zerotier":
        if (vpnConfig.zerotier?.networkId) {
          envVars.add("ZT_NETWORK_ID=");
        }
        break;
      case "netbird":
        if (vpnConfig.netbird?.setupKey) {
          envVars.add("NETBIRD_SETUP_KEY=");
        }
        break;
    }
  }

  return Array.from(envVars).sort().join("\n");
}
