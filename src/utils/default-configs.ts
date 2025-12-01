// Default configuration factories for Docker Compose entities

import type {
  ServiceConfig,
  NetworkConfig,
  VolumeConfig,
} from "../types/compose";
import type {
  TailscaleConfig,
  NewtConfig,
  CloudflaredConfig,
  WireguardConfig,
  ZerotierConfig,
  NetbirdConfig,
  VPNConfig,
} from "../types/vpn-configs";

export function defaultTailscaleConfig(): TailscaleConfig {
  return {
    authKey: "",
    hostname: "",
    acceptDns: false,
    authOnce: true,
    userspace: false,
    exitNode: "",
    exitNodeAllowLan: false,
    enableServe: false,
    serveConfig: "",
    certDomain: "",
    serveTargetService: "",
    serveExternalPort: "443",
    serveInternalPort: "8080",
    servePath: "/",
    serveProtocol: "HTTPS",
    serveInsideProtocol: "http",
    // ScaleTail patterns - defaults
    containerName: "",
    enableHealthCheck: true,
    healthCheckEndpoint: "/healthz",
    localAddrPort: "127.0.0.1:41234",
    dns: [],
    configPath: "./config",
    stateDir: "./state",
    tmpfsEnabled: false,
    tmpfsPath: "/tmp",
    capAdd: ["NET_ADMIN"],
    serveConfigPath: "/config/serve.json",
  };
}

export function defaultNewtConfig(): NewtConfig {
  return {
    endpoint: "https://app.pangolin.net",
    newtId: "",
    newtSecret: "",
    networkName: "newt",
  };
}

export function defaultCloudflaredConfig(): CloudflaredConfig {
  return {
    tunnelToken: "",
    noAutoupdate: true,
  };
}

export function defaultWireguardConfig(): WireguardConfig {
  return {
    configPath: "/etc/wireguard/wg0.conf",
    interfaceName: "wg0",
  };
}

export function defaultZerotierConfig(): ZerotierConfig {
  return {
    networkId: "",
    identityPath: "/var/lib/zerotier-one",
  };
}

export function defaultNetbirdConfig(): NetbirdConfig {
  return {
    setupKey: "",
    managementUrl: "",
  };
}

export function defaultVPNConfig(): VPNConfig {
  return {
    enabled: false,
    type: null,
    servicesUsingVpn: [],
  };
}

export function defaultService(): ServiceConfig {
  return {
    name: "",
    image: "",
    container_name: "",
    ports: [],
    expose: [],
    volumes: [],
    environment: [],
    environment_syntax: "array",
    volumes_syntax: "array",
    command: "",
    restart: "",
    healthcheck: undefined,
    depends_on: [],
    entrypoint: "",
    env_file: "",
    extra_hosts: [],
    dns: [],
    networks: [],
    user: "",
    working_dir: "",
    labels: [],
    privileged: undefined,
    read_only: undefined,
    shm_size: "",
    security_opt: [],
    network_mode: "",
    cap_add: [],
    cap_drop: [],
    sysctls: [],
    devices: [],
    tmpfs: [],
    ulimits: [],
    init: undefined,
    stop_grace_period: "",
    stop_signal: "",
    tty: undefined,
    stdin_open: undefined,
    hostname: "",
    domainname: "",
    mac_address: "",
    ipc_mode: "",
    pid: "",
    uts: "",
    cgroup_parent: "",
    isolation: "",
    deploy: undefined,
  };
}

export function defaultNetwork(): NetworkConfig {
  return {
    name: "",
    driver: "",
    driver_opts: [],
    attachable: false,
    labels: [],
    external: false,
    name_external: "",
    internal: false,
    enable_ipv6: false,
    ipam: {
      driver: "",
      config: [],
      options: [],
    },
  };
}

export function defaultVolume(): VolumeConfig {
  return {
    name: "",
    driver: "",
    driver_opts: [],
    labels: [],
    external: false,
    name_external: "",
    driver_opts_type: "",
    driver_opts_device: "",
    driver_opts_o: "",
  };
}
