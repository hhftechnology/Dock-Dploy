// VPN integration for the YAML pipeline.
// - Injects the VPN sidecar service into compose.services
// - Augments top-level networks / volumes with VPN-provided entries
// - Appends Tailscale serve config block
// - Annotates the emitted YAML with VPN comment headers

import type { NetworkConfig, VolumeConfig } from "../../types/compose";
import type { VPNConfig } from "../../types/vpn-configs";
import {
  generateVpnService,
  getVpnVolumes,
  getVpnNetworks,
  generateTailscaleServeConfig,
} from "../vpn-generator";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Compose = Record<string, any>;

export function injectVpnArtifacts(
  compose: Compose,
  vpn: VPNConfig,
  networks: NetworkConfig[],
  volumes: VolumeConfig[],
): { networks: NetworkConfig[]; volumes: VolumeConfig[] } {
  let nextNetworks = networks;
  let nextVolumes = volumes;

  if (!vpn.enabled || !vpn.type) {
    return { networks: nextNetworks, volumes: nextVolumes };
  }

  const vpnService = generateVpnService(vpn);
  if (vpnService) {
    Object.assign(compose.services, vpnService);
  }

  const vpnVolumes = getVpnVolumes(vpn);
  if (vpnVolumes.length > 0) {
    nextVolumes = [...nextVolumes, ...vpnVolumes];
  }

  const vpnNetworks = getVpnNetworks(vpn);
  if (vpnNetworks.length > 0) {
    nextNetworks = [...nextNetworks, ...vpnNetworks];
  }

  // Tailscale serve configs become top-level `configs:` entries.
  if (
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
      ts.serveInsideProtocol || "http",
    );
    if (!compose.configs) compose.configs = {};
    compose.configs["serve-config"] = { content: serveConfig };
  }

  return { networks: nextNetworks, volumes: nextVolumes };
}

/**
 * Post-pass: walk the emitted YAML text and prepend a comment block describing
 * the VPN sidecar. Operates on the string (not the object graph) because
 * comments aren't representable in our object model.
 */
export function annotateVpnComments(yaml: string, vpn: VPNConfig): string {
  if (!vpn.enabled || !vpn.type) return yaml;

  const lines = yaml.split("\n");
  const out: string[] = [];
  let inVpnService = false;
  let inServicesSection = false;
  let inVolumesSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

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

    if (
      inServicesSection &&
      !inVolumesSection &&
      (trimmed.startsWith(`${vpn.type}:`) || trimmed === `${vpn.type}:`)
    ) {
      inVpnService = true;
      out.push("");
      out.push(`# ${vpn.type} VPN Sidecar Configuration`);
      if (vpn.type === "tailscale") {
        out.push("# Routes traffic through Tailscale VPN");
        if (vpn.tailscale?.hostname) {
          out.push(`# Hostname: ${vpn.tailscale.hostname}`);
        }
        if (vpn.tailscale?.enableServe) {
          out.push("# Tailscale Serve enabled - exposes service on Tailnet");
        }
      }
    }

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

    out.push(line);
  }

  return out.join("\n");
}
