import { useState, useCallback } from "react";
import type {
  NetworkConfig,
  ServiceConfig,
  VolumeConfig,
} from "../types/compose";
import type { VPNConfig } from "../types/vpn-configs";
import {
  createValidatedComposeOutput,
  invalidOutputMessage,
  type ComposeOutputFormat,
} from "../utils/validation/outputs";

export type ConversionType = "docker-run" | "systemd" | "env" | "redact" | "komodo";

export interface UseConversionDialogOptions {
  services: ServiceConfig[];
  networks?: NetworkConfig[];
  volumes?: VolumeConfig[];
  selectedIdx: number | null;
  yaml: string;
  vpnConfig: VPNConfig;
}

export function useConversionDialog({
  services,
  networks = [],
  volumes = [],
  selectedIdx,
  yaml,
  vpnConfig,
}: UseConversionDialogOptions) {
  const [conversionDialogOpen, setConversionDialogOpen] = useState(false);
  const [conversionType, setConversionType] = useState<ConversionType | "">("");
  const [conversionOutput, setConversionOutput] = useState<string>("");
  const [conversionValid, setConversionValid] = useState(true);

  const handleConversion = useCallback(
    (type: ConversionType) => {
      setConversionType(type);

      const result = createValidatedComposeOutput(type as ComposeOutputFormat, {
        services,
        networks,
        volumes,
        selectedIdx,
        yaml,
        vpn: vpnConfig,
      });

      setConversionValid(result.ok);
      setConversionOutput(result.ok ? result.output : invalidOutputMessage(result));
      setConversionDialogOpen(true);
    },
    [services, networks, volumes, selectedIdx, yaml, vpnConfig],
  );

  const closeDialog = useCallback(() => {
    setConversionDialogOpen(false);
  }, []);

  return {
    conversionDialogOpen,
    setConversionDialogOpen,
    conversionType,
    conversionOutput,
    conversionValid,
    handleConversion,
    closeDialog,
  };
}
