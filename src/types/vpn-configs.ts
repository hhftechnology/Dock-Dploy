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

export interface NewtConfig {
  endpoint: string;
  newtId: string;
  newtSecret: string;
  networkName: string;
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
