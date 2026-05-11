// Canonical fixtures used by golden tests.
// These are deliberately exhaustive so any decomposition of the YAML / converter
// pipeline that drifts output by a single byte fails immediately.

import type {
  ServiceConfig,
  NetworkConfig,
  VolumeConfig,
} from "../types/compose";
import type { VPNConfig } from "../types/vpn-configs";
import {
  defaultService,
  defaultNetwork,
  defaultVolume,
  defaultVPNConfig,
  defaultTailscaleConfig,
  defaultWireguardConfig,
  defaultCloudflaredConfig,
  defaultNewtConfig,
  defaultZerotierConfig,
  defaultNetbirdConfig,
} from "../utils/default-configs";

export interface Scenario {
  name: string;
  services: ServiceConfig[];
  networks: NetworkConfig[];
  volumes: VolumeConfig[];
  vpn?: VPNConfig;
}

function svc(overrides: Partial<ServiceConfig>): ServiceConfig {
  return { ...defaultService(), ...overrides };
}

function net(overrides: Partial<NetworkConfig>): NetworkConfig {
  return { ...defaultNetwork(), ...overrides };
}

function vol(overrides: Partial<VolumeConfig>): VolumeConfig {
  return { ...defaultVolume(), ...overrides };
}

const minimal: Scenario = {
  name: "minimal-single-service",
  services: [
    svc({ name: "web", image: "nginx:latest", restart: "unless-stopped" }),
  ],
  networks: [],
  volumes: [],
};

const portsAndEnvArray: Scenario = {
  name: "ports-and-env-array",
  services: [
    svc({
      name: "api",
      image: "node:22-alpine",
      restart: "always",
      ports: [
        { host: "3000", container: "3000", protocol: "tcp" },
        { host: "9229", container: "9229", protocol: "tcp" },
      ],
      environment: [
        { key: "NODE_ENV", value: "production" },
        { key: "PORT", value: "3000" },
        { key: "DATABASE_URL", value: "${DATABASE_URL}" },
      ],
      environment_syntax: "array",
    }),
  ],
  networks: [],
  volumes: [],
};

const envDictWithVolumes: Scenario = {
  name: "env-dict-with-named-volume",
  services: [
    svc({
      name: "db",
      image: "postgres:16",
      restart: "unless-stopped",
      environment: [
        { key: "POSTGRES_USER", value: "app" },
        { key: "POSTGRES_PASSWORD", value: "${POSTGRES_PASSWORD}" },
        { key: "POSTGRES_DB", value: "app" },
      ],
      environment_syntax: "dict",
      volumes: [
        { host: "pg-data", container: "/var/lib/postgresql/data" },
        { host: "./init.sql", container: "/docker-entrypoint-initdb.d/init.sql", read_only: true },
      ],
      volumes_syntax: "array",
    }),
  ],
  networks: [],
  volumes: [
    vol({ name: "pg-data", driver: "local" }),
  ],
};

const multiServiceWithDeps: Scenario = {
  name: "multi-service-with-deps-and-networks",
  services: [
    svc({
      name: "web",
      image: "nginx:1.27-alpine",
      restart: "unless-stopped",
      ports: [{ host: "80", container: "80", protocol: "tcp" }],
      depends_on: ["api"],
      networks: ["frontend"],
    }),
    svc({
      name: "api",
      image: "node:22-alpine",
      restart: "unless-stopped",
      depends_on: ["db"],
      environment: [{ key: "DATABASE_URL", value: "${DATABASE_URL}" }],
      environment_syntax: "array",
      networks: ["frontend", "backend"],
    }),
    svc({
      name: "db",
      image: "postgres:16",
      restart: "unless-stopped",
      environment: [
        { key: "POSTGRES_USER", value: "app" },
        { key: "POSTGRES_PASSWORD", value: "${POSTGRES_PASSWORD}" },
      ],
      environment_syntax: "array",
      volumes: [{ host: "pg-data", container: "/var/lib/postgresql/data" }],
      networks: ["backend"],
    }),
  ],
  networks: [
    net({ name: "frontend", driver: "bridge" }),
    net({ name: "backend", driver: "bridge", internal: true }),
  ],
  volumes: [vol({ name: "pg-data", driver: "local" })],
};

const withHealthcheckAndDeploy: Scenario = {
  name: "healthcheck-and-deploy-resources",
  services: [
    svc({
      name: "api",
      image: "ghcr.io/example/api:1.0.0",
      restart: "unless-stopped",
      ports: [{ host: "8080", container: "8080", protocol: "tcp" }],
      healthcheck: {
        test: "CMD curl -f http://localhost:8080/health || exit 1",
        interval: "30s",
        timeout: "5s",
        retries: "3",
        start_period: "10s",
        start_interval: "5s",
      },
      deploy: {
        resources: {
          limits: { cpus: "1.0", memory: "512M" },
          reservations: { cpus: "0.25", memory: "128M" },
        },
      },
      labels: [
        { key: "traefik.enable", value: "true" },
        { key: "traefik.http.routers.api.rule", value: "Host(`api.example.com`)" },
      ],
    }),
  ],
  networks: [],
  volumes: [],
};

const withCapsAndSecurity: Scenario = {
  name: "caps-security-and-lifecycle",
  services: [
    svc({
      name: "tailscale-sidecar",
      image: "tailscale/tailscale:stable",
      restart: "unless-stopped",
      cap_add: ["NET_ADMIN", "NET_RAW"],
      cap_drop: ["ALL"],
      privileged: false,
      read_only: false,
      tty: true,
      stdin_open: true,
      init: true,
      stop_grace_period: "10s",
      stop_signal: "SIGTERM",
      hostname: "ts-host",
      sysctls: [{ key: "net.ipv4.ip_forward", value: "1" }],
      devices: ["/dev/net/tun:/dev/net/tun"],
      tmpfs: ["/tmp"],
      ulimits: [{ name: "nofile", soft: "65535", hard: "65535" }],
      security_opt: ["no-new-privileges:true"],
    }),
  ],
  networks: [],
  volumes: [],
};

function vpnTailscaleScenario(): Scenario {
  return {
    name: "vpn-tailscale-attached",
    services: [
      svc({
        name: "web",
        image: "nginx:latest",
        restart: "unless-stopped",
      }),
    ],
    networks: [],
    volumes: [],
    vpn: {
      ...defaultVPNConfig(),
      enabled: true,
      type: "tailscale",
      tailscale: {
        ...defaultTailscaleConfig(),
        authKey: "${TS_AUTHKEY}",
        hostname: "edge",
      },
      servicesUsingVpn: ["web"],
    },
  };
}

function vpnWireguardScenario(): Scenario {
  return {
    name: "vpn-wireguard-attached",
    services: [
      svc({ name: "torrent", image: "linuxserver/qbittorrent:latest", restart: "unless-stopped" }),
    ],
    networks: [],
    volumes: [],
    vpn: {
      ...defaultVPNConfig(),
      enabled: true,
      type: "wireguard",
      wireguard: defaultWireguardConfig(),
      servicesUsingVpn: ["torrent"],
    },
  };
}

function vpnCloudflaredScenario(): Scenario {
  return {
    name: "vpn-cloudflared-tunnel",
    services: [
      svc({ name: "app", image: "ghcr.io/example/app:latest", restart: "unless-stopped" }),
    ],
    networks: [],
    volumes: [],
    vpn: {
      ...defaultVPNConfig(),
      enabled: true,
      type: "cloudflared",
      cloudflared: { ...defaultCloudflaredConfig(), tunnelToken: "${TUNNEL_TOKEN}" },
      servicesUsingVpn: [],
    },
  };
}

function vpnNewtScenario(): Scenario {
  return {
    name: "vpn-newt-tunnel",
    services: [
      svc({ name: "app", image: "ghcr.io/example/app:latest", restart: "unless-stopped" }),
    ],
    networks: [],
    volumes: [],
    vpn: {
      ...defaultVPNConfig(),
      enabled: true,
      type: "newt",
      newt: { ...defaultNewtConfig(), newtId: "${NEWT_ID}", newtSecret: "${NEWT_SECRET}" },
      servicesUsingVpn: ["app"],
    },
  };
}

function vpnZerotierScenario(): Scenario {
  return {
    name: "vpn-zerotier-network",
    services: [
      svc({ name: "node", image: "ghcr.io/example/node:latest", restart: "unless-stopped" }),
    ],
    networks: [],
    volumes: [],
    vpn: {
      ...defaultVPNConfig(),
      enabled: true,
      type: "zerotier",
      zerotier: { ...defaultZerotierConfig(), networkId: "${ZT_NETWORK_ID}" },
      servicesUsingVpn: ["node"],
    },
  };
}

function vpnNetbirdScenario(): Scenario {
  return {
    name: "vpn-netbird-mesh",
    services: [
      svc({ name: "agent", image: "ghcr.io/example/agent:latest", restart: "unless-stopped" }),
    ],
    networks: [],
    volumes: [],
    vpn: {
      ...defaultVPNConfig(),
      enabled: true,
      type: "netbird",
      netbird: { ...defaultNetbirdConfig(), setupKey: "${NB_SETUP_KEY}" },
      servicesUsingVpn: ["agent"],
    },
  };
}

export const SCENARIOS: Scenario[] = [
  minimal,
  portsAndEnvArray,
  envDictWithVolumes,
  multiServiceWithDeps,
  withHealthcheckAndDeploy,
  withCapsAndSecurity,
  vpnTailscaleScenario(),
  vpnWireguardScenario(),
  vpnCloudflaredScenario(),
  vpnNewtScenario(),
  vpnZerotierScenario(),
  vpnNetbirdScenario(),
];
