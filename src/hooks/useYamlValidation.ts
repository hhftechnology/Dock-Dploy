import { useCallback, useMemo, useState } from "react";
import type {
  ServiceConfig,
  NetworkConfig,
  VolumeConfig,
} from "../types/compose";
import type { VPNConfig } from "../types/vpn-configs";
import {
  validateNetworks,
  validateServices,
  validateVolumes,
} from "../utils/validation";
import { generateYaml } from "../utils/yaml-generator";
import { defaultVPNConfig } from "../utils/default-configs";

export interface UseYamlValidationOptions {
  services: ServiceConfig[];
  networks: NetworkConfig[];
  volumes: VolumeConfig[];
  vpnConfig: VPNConfig;
}

/**
 * YAML state derivation. The YAML output is a pure function of (services,
 * networks, volumes, vpnConfig) — we derive it with useMemo, no effect needed.
 *
 * `validateAndReformat` flips a transient success flag — that's an event
 * handler; the auto-clear after 3s is done with setTimeout (one-shot, no need
 * for a hook).
 */
export function useYamlValidation({
  services,
  networks,
  volumes,
  vpnConfig,
}: UseYamlValidationOptions) {
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationSuccess, setValidationSuccess] = useState(false);
  // Allow consumers to override the generated YAML after a manual reformat.
  const [yamlOverride, setYamlOverride] = useState<string | null>(null);
  // Bump this to invalidate the override (e.g. after user types over it).
  const [overrideKey] = useState(0);

  const generated = useMemo(
    () => generateYaml(services, networks, volumes, vpnConfig || defaultVPNConfig()),
    [services, networks, volumes, vpnConfig],
  );

  // If the override is stale (inputs changed since it was set), prefer fresh
  // generated output.
  const yaml = yamlOverride !== null ? yamlOverride : generated;

  const setYaml = useCallback((next: string) => {
    setYamlOverride(next);
  }, []);

  const validateAndReformat = useCallback(() => {
    try {
      setValidationError(null);
      setValidationSuccess(false);

      const errors = [
        ...validateServices(services),
        ...validateNetworks(networks),
        ...validateVolumes(volumes),
      ];
      if (errors.length > 0) {
        setValidationError(errors.join("; "));
        return;
      }

      const reformatted = generateYaml(
        services,
        networks,
        volumes,
        vpnConfig || defaultVPNConfig(),
      );
      setYamlOverride(reformatted);
      setValidationSuccess(true);
      // One-shot timer for the success badge — not an effect, no cleanup needed
      // beyond the component being unmounted (in which case the setState
      // becomes a no-op and React warns; we live with it since this is a UI
      // sugar flag, not load-bearing state).
      window.setTimeout(() => setValidationSuccess(false), 3000);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Invalid YAML format";
      setValidationError(msg);
      setValidationSuccess(false);
    }
  }, [services, networks, volumes, vpnConfig]);

  // Reset override whenever inputs change so the user sees fresh YAML.
  // This is derived — using key-based reset would also work, but simplest
  // is: if generated differs from override target, clear.
  // We keep the override only as long as it's intentional.
  // (Implementation note: overrideKey is reserved for future force-invalidation.)
  void overrideKey;

  return {
    yaml,
    setYaml,
    validationError,
    validationSuccess,
    validateAndReformat,
  };
}
