import { useState, useEffect, useCallback } from "react";
import type { ServiceConfig, NetworkConfig, VolumeConfig } from "../types/compose";
import type { VPNConfig } from "../types/vpn-configs";
import { validateServices } from "../utils/validation";
import { generateYaml } from "../utils/yaml-generator";
import { defaultVPNConfig } from "../utils/default-configs";

export interface UseYamlValidationOptions {
  services: ServiceConfig[];
  networks: NetworkConfig[];
  volumes: VolumeConfig[];
  vpnConfig: VPNConfig;
}

export function useYamlValidation({
  services,
  networks,
  volumes,
  vpnConfig,
}: UseYamlValidationOptions) {
  const [yaml, setYaml] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationSuccess, setValidationSuccess] = useState(false);

  // Auto-generate YAML when services, networks, volumes, or vpnConfig change
  useEffect(() => {
    setYaml(
      generateYaml(services, networks, volumes, vpnConfig || defaultVPNConfig())
    );
  }, [services, networks, volumes, vpnConfig]);

  const validateAndReformat = useCallback(() => {
    try {
      setValidationError(null);
      setValidationSuccess(false);

      // Validate services
      const errors = validateServices(services);

      if (errors.length > 0) {
        setValidationError(errors.join("; "));
        return;
      }

      // Regenerate YAML using the imported generateYaml function
      // This preserves VPN configs, JSON content, and proper formatting
      const reformatted = generateYaml(
        services,
        networks,
        volumes,
        vpnConfig || defaultVPNConfig()
      );
      setYaml(reformatted);
      setValidationSuccess(true);
      setTimeout(() => setValidationSuccess(false), 3000);
    } catch (error: any) {
      setValidationError(error.message || "Invalid YAML format");
      setValidationSuccess(false);
    }
  }, [services, networks, volumes, vpnConfig]);

  return {
    yaml,
    setYaml,
    validationError,
    validationSuccess,
    validateAndReformat,
  };
}
