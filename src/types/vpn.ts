// VPN provider abstraction types

export interface VPNProviderConfig {
  enabled: boolean;
  type: string;
  servicesUsingVpn: string[];
}

export interface VPNServiceGenerator {
  generateService(config: VPNProviderConfig): any;
  generateVolumes(config: VPNProviderConfig): any[];
  generateNetworks(config: VPNProviderConfig): any[];
  getServiceName(): string;
  usesNetworkMode(): boolean;
  supportsHealthCheck(): boolean;
}

export type VPNProviderType = 
  | "tailscale"
  | "newt"
  | "cloudflared"
  | "wireguard"
  | "zerotier"
  | "netbird";

export interface VPNProviderRegistry {
  register(type: VPNProviderType, provider: VPNServiceGenerator): void;
  get(type: VPNProviderType): VPNServiceGenerator | undefined;
  getAll(): VPNProviderType[];
}

