import { useState, useCallback } from "react";
import type { ServiceConfig } from "../types/compose";
import type { VPNConfig } from "../types/vpn-configs";
import {
  convertToDockerRun,
  convertToSystemd,
  generateKomodoToml,
  generateEnvFile,
} from "../utils/converters";
import { redactSensitiveData } from "../utils/validation";

export type ConversionType = "docker-run" | "systemd" | "env" | "redact" | "komodo";

export interface UseConversionDialogOptions {
  services: ServiceConfig[];
  selectedIdx: number | null;
  yaml: string;
  vpnConfig: VPNConfig;
}

export function useConversionDialog({
  services,
  selectedIdx,
  yaml,
  vpnConfig,
}: UseConversionDialogOptions) {
  const [conversionDialogOpen, setConversionDialogOpen] = useState(false);
  const [conversionType, setConversionType] = useState<ConversionType | "">("");
  const [conversionOutput, setConversionOutput] = useState<string>("");

  const handleConversion = useCallback(
    (type: ConversionType) => {
      setConversionType(type);
      let output = "";

      try {
        switch (type) {
          case "docker-run":
            if (selectedIdx !== null && services[selectedIdx]) {
              output = convertToDockerRun(services[selectedIdx]);
            } else {
              output = services.map((s) => convertToDockerRun(s)).join("\n\n");
            }
            break;
          case "systemd":
            if (selectedIdx !== null && services[selectedIdx]) {
              output = convertToSystemd(services[selectedIdx]);
            } else {
              output = services.map((s) => convertToSystemd(s)).join("\n\n");
            }
            break;
          case "env":
            output = generateEnvFile(services, vpnConfig);
            break;
          case "redact":
            output = redactSensitiveData(yaml);
            break;
          case "komodo":
            output = generateKomodoToml(yaml);
            break;
          default:
            output = "Unknown conversion type";
        }
        setConversionOutput(output);
        setConversionDialogOpen(true);
      } catch (error: any) {
        setConversionOutput(`Error: ${error.message}`);
        setConversionDialogOpen(true);
      }
    },
    [services, selectedIdx, yaml, vpnConfig]
  );

  const closeDialog = useCallback(() => {
    setConversionDialogOpen(false);
  }, []);

  return {
    conversionDialogOpen,
    setConversionDialogOpen,
    conversionType,
    conversionOutput,
    handleConversion,
    closeDialog,
  };
}
