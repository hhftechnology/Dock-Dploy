// VPN Provider Configuration Types

export interface TailscaleConfig {
  authKey: string;
  hostname: string;
  acceptDns: boolean;
  authOnce: boolean;
  userspace: boolean;
  exitNode: string;
  exitNodeAllowLan: boolean;
  enableServe: boolean;
  serveConfig: string; // JSON string
  certDomain: string;
  serveTargetService: string;
  serveExternalPort: string;
  serveInternalPort: string;
  servePath: string;
  serveProtocol: "HTTPS" | "HTTP";
  serveInsideProtocol: "http" | "https" | "https+insecure";
  containerName: string;
  enableHealthCheck: boolean;
  healthCheckEndpoint: string;
  localAddrPort: string;
  dns: string[];
  configPath: string;
  stateDir: string;
  tmpfsEnabled: boolean;
  tmpfsPath: string;
  capAdd: string[];
  serveConfigPath: string;
}

export type NewtLogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";

export interface NewtConfig {
  // Core (existing)
  endpoint: string;
  newtId: string;
  newtSecret: string;
  networkName: string;

  // Pangolin Newt extras (see docs.pangolin.net/manage/sites/configure-site).
  // Optional — empty string / false / 0 = "use Newt default".
  name: string;
  port: string;
  mtu: string;
  dns: string;
  logLevel: NewtLogLevel;
  interfaceName: string;
  pingInterval: string;
  pingTimeout: string;
  configFile: string;
  healthFile: string;
  dockerSocket: string;
  dockerEnforceNetworkValidation: boolean;
  updown: string;
  blueprintFile: string;
  provisioningBlueprintFile: string;
  provisioningKey: string;
  noCloud: boolean;
  disableClients: boolean;
  metrics: boolean;
  otlp: boolean;
  metricsAdminAddr: string;
  enforceHcCert: boolean;
  tlsClientCertFile: string;
  tlsClientKey: string;
  tlsClientCa: string;
  preferEndpoint: string;
  region: string;
}

export interface CloudflaredConfig {
  tunnelToken: string;
  noAutoupdate: boolean;
}

export interface WireguardConfig {
  configPath: string;
  interfaceName: string;
}

export interface ZerotierConfig {
  networkId: string;
  identityPath: string;
}

export interface NetbirdConfig {
  setupKey: string;
  managementUrl: string;
}

export interface VPNConfig {
  enabled: boolean;
  type:
    | "tailscale"
    | "newt"
    | "cloudflared"
    | "wireguard"
    | "zerotier"
    | "netbird"
    | null;
  tailscale?: TailscaleConfig;
  newt?: NewtConfig;
  cloudflared?: CloudflaredConfig;
  wireguard?: WireguardConfig;
  zerotier?: ZerotierConfig;
  netbird?: NetbirdConfig;
  servicesUsingVpn: string[]; // Service names that should use VPN
  networks?: string[]; // Networks the VPN service should attach to
}
