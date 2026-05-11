// Orchestrator: composes the service / network / volume / vpn builders
// into the final YAML string. Public entry point.

import type {
  NetworkConfig,
  ServiceConfig,
  VolumeConfig,
} from "../../types/compose";
import type { VPNConfig } from "../../types/vpn-configs";
import { defaultVPNConfig } from "../default-configs";
import { getVpnServiceName } from "../vpn-generator";
import { buildServiceEntry } from "./service";
import { buildNetworksBlock } from "./network";
import { buildVolumesBlock } from "./volume";
import { annotateVpnComments, injectVpnArtifacts } from "./vpn";
import { yamlStringify } from "./stringify";

export { yamlStringify } from "./stringify";

export function generateYaml(
  services: ServiceConfig[],
  networks: NetworkConfig[],
  volumes: VolumeConfig[],
  vpnConfig?: VPNConfig,
): string {
  const vpn = vpnConfig || defaultVPNConfig();
  const vpnServiceName = vpn.enabled && vpn.type ? getVpnServiceName(vpn.type) : null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const compose: Record<string, any> = { services: {} };

  services.forEach((svc) => {
    if (!svc.name) return;
    compose.services[svc.name] = buildServiceEntry(svc, vpn, vpnServiceName);
  });

  const { networks: networksWithVpn, volumes: volumesWithVpn } = injectVpnArtifacts(
    compose,
    vpn,
    networks,
    volumes,
  );

  const networksBlock = buildNetworksBlock(networksWithVpn);
  if (networksBlock) compose.networks = networksBlock;

  const volumesBlock = buildVolumesBlock(volumesWithVpn);
  if (volumesBlock) compose.volumes = volumesBlock;

  const yaml = yamlStringify(compose);
  return annotateVpnComments(yaml, vpn);
}
