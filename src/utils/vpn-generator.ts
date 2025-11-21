// VPN Service Generation Utilities

import type { VPNConfig } from "../types/vpn-configs";
import type { NetworkConfig, VolumeConfig } from "../types/compose";

export function generateTailscaleServeConfig(
  _targetService: string,
  externalPort: string,
  internalPort: string,
  path: string,
  protocol: "HTTPS" | "HTTP",
  certDomain: string
): string {
  const config: any = {
    TCP: {
      [externalPort]: {
        HTTPS: protocol === "HTTPS",
      },
    },
  };

  if (protocol === "HTTPS") {
    const certDomainKey = certDomain
      ? certDomain
      : "$${TS_CERT_DOMAIN}";
    config.Web = {
      [`${certDomainKey}:${externalPort}`]: {
        Handlers: {
          [path]: {
            Proxy: `http://127.0.0.1:${internalPort}`,
          },
        },
      },
    };
  } else {
    config.TCP[externalPort] = {
      HTTP: true,
      Handlers: {
        [path]: {
          Proxy: `http://127.0.0.1:${internalPort}`,
        },
      },
    };
  }

  return JSON.stringify(config, null, 2);
}

export function getVpnServiceName(vpnType: string): string {
  return vpnType;
}

export function generateVpnService(vpnConfig: VPNConfig | undefined): any {
  if (!vpnConfig || !vpnConfig.enabled || !vpnConfig.type) return null;

  const serviceName = getVpnServiceName(vpnConfig.type);
  let service: any = {
    restart: "always",
  };

  switch (vpnConfig.type) {
    case "tailscale": {
      const ts = vpnConfig.tailscale!;
      service.image = "tailscale/tailscale:latest";
      service.privileged = true;
      service.volumes = [
        "tailscale:/var/lib/tailscale",
        "/dev/net/tun:/dev/net/tun",
      ];
      service.environment = {
        TS_STATE_DIR: "/var/lib/tailscale",
        TS_ACCEPT_DNS: ts.acceptDns ? "true" : "false",
        TS_AUTH_ONCE: ts.authOnce ? "true" : "false",
        TS_USERSPACE: ts.userspace ? "true" : "false",
        TS_AUTHKEY: ts.authKey ? "$TS_AUTHKEY" : undefined,
        TS_HOSTNAME: ts.hostname || undefined,
      };

      if (ts.exitNode) {
        service.environment.TS_EXTRA_ARGS = `--exit-node=$TS_EXIT_NODE${ts.exitNodeAllowLan ? " --exit-node-allow-lan-access" : ""}`;
      }

      if (ts.enableServe && ts.serveTargetService) {
        service.environment.TS_SERVE_CONFIG = "/etc/tailscale/serve.json";
        service.configs = [
          {
            source: "serve-config",
            target: "/etc/tailscale/serve.json",
          },
        ];
      }

      // Remove undefined environment variables
      Object.keys(service.environment).forEach(
        (key) =>
          service.environment[key] === undefined &&
          delete service.environment[key]
      );
      break;
    }
    case "newt": {
      const newt = vpnConfig.newt!;
      service.image = "fosrl/newt";
      service.container_name = "newt";
      service.environment = {
        PANGOLIN_ENDPOINT: newt.endpoint,
        NEWT_ID: newt.newtId ? "${NEWT_ID}" : undefined,
        NEWT_SECRET: newt.newtSecret ? "${NEWT_SECRET}" : undefined,
      };
      service.networks = [newt.networkName];
      Object.keys(service.environment).forEach(
        (key) =>
          service.environment[key] === undefined &&
          delete service.environment[key]
      );
      break;
    }
    case "cloudflared": {
      const cf = vpnConfig.cloudflared!;
      service.image = "cloudflare/cloudflared";
      service.command = cf.noAutoupdate
        ? "--no-autoupdate tunnel run"
        : "tunnel run";
      service.environment = {
        TUNNEL_TOKEN: cf.tunnelToken ? "${TUNNEL_TOKEN}" : undefined,
      };
      Object.keys(service.environment).forEach(
        (key) =>
          service.environment[key] === undefined &&
          delete service.environment[key]
      );
      break;
    }
    case "wireguard": {
      const wg = vpnConfig.wireguard!;
      service.image = "linuxserver/wireguard:latest";
      service.cap_add = ["NET_ADMIN", "SYS_MODULE"];
      service.environment = {
        PUID: "1000",
        PGID: "1000",
        TZ: "Etc/UTC",
      };
      service.sysctls = ["net.ipv4.conf.all.src_valid_mark=1"];
      service.volumes = [wg.configPath + ":/config"];
      break;
    }
    case "zerotier": {
      const zt = vpnConfig.zerotier!;
      service.image = "zerotier/zerotier:latest";
      service.privileged = true;
      service.networks = ["host"];
      service.volumes = [zt.identityPath + ":/var/lib/zerotier-one"];
      service.environment = {
        ZT_NC_NETWORK: zt.networkId ? "${ZT_NETWORK_ID}" : undefined,
      };
      Object.keys(service.environment).forEach(
        (key) =>
          service.environment[key] === undefined &&
          delete service.environment[key]
      );
      break;
    }
    case "netbird": {
      const nb = vpnConfig.netbird!;
      service.image = "netbirdio/netbird:latest";
      service.privileged = true;
      service.cap_add = ["NET_ADMIN", "SYS_MODULE"];
      service.sysctls = [
        "net.ipv4.ip_forward=1",
        "net.ipv6.conf.all.forwarding=1",
      ];
      service.environment = {
        NETBIRD_SETUP_KEY: nb.setupKey ? "${NETBIRD_SETUP_KEY}" : undefined,
        NETBIRD_MANAGEMENT_URL: nb.managementUrl || undefined,
      };
      Object.keys(service.environment).forEach(
        (key) =>
          service.environment[key] === undefined &&
          delete service.environment[key]
      );
      break;
    }
  }

  return { [serviceName]: service };
}

export function getVpnVolumes(vpnConfig: VPNConfig | undefined): VolumeConfig[] {
  if (!vpnConfig || !vpnConfig.enabled || !vpnConfig.type) return [];

  const volumes: VolumeConfig[] = [];

  switch (vpnConfig.type) {
    case "tailscale": {
      volumes.push({
        name: "tailscale",
        driver: "",
        driver_opts: [],
        labels: [],
        external: false,
        name_external: "",
        driver_opts_type: "",
        driver_opts_device: "",
        driver_opts_o: "",
      });
      break;
    }
  }

  return volumes;
}

export function getVpnNetworks(vpnConfig: VPNConfig | undefined): NetworkConfig[] {
  if (!vpnConfig || !vpnConfig.enabled || !vpnConfig.type) return [];

  const networks: NetworkConfig[] = [];

  switch (vpnConfig.type) {
    case "newt": {
      const newt = vpnConfig.newt!;
      networks.push({
        name: newt.networkName,
        driver: "",
        driver_opts: [],
        attachable: false,
        labels: [],
        external: true,
        name_external: newt.networkName,
        internal: false,
        enable_ipv6: false,
        ipam: {
          driver: "",
          config: [],
          options: [],
        },
      });
      break;
    }
  }

  return networks;
}
