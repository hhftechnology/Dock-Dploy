import { useState, useCallback } from "react";
import type { VPNConfig } from "../types/vpn-configs";
import {
  defaultVPNConfig,
  defaultTailscaleConfig,
  defaultNewtConfig,
  defaultCloudflaredConfig,
  defaultWireguardConfig,
  defaultZerotierConfig,
  defaultNetbirdConfig,
} from "../utils/default-configs";

export interface UseVpnConfigReturn {
  vpnConfig: VPNConfig;
  setVpnConfig: React.Dispatch<React.SetStateAction<VPNConfig>>;
  vpnConfigOpen: boolean;
  setVpnConfigOpen: (open: boolean) => void;
  updateVpnType: (type: VPNConfig["type"]) => void;
  updateTailscaleConfig: (updates: Partial<VPNConfig["tailscale"]>) => void;
  updateNewtConfig: (updates: Partial<VPNConfig["newt"]>) => void;
  updateCloudflaredConfig: (updates: Partial<VPNConfig["cloudflared"]>) => void;
  updateWireguardConfig: (updates: Partial<VPNConfig["wireguard"]>) => void;
  updateZerotierConfig: (updates: Partial<VPNConfig["zerotier"]>) => void;
  updateNetbirdConfig: (updates: Partial<VPNConfig["netbird"]>) => void;
  updateServicesUsingVpn: (services: string[]) => void;
  updateVpnNetworks: (networks: string[]) => void;
}

export function useVpnConfig(
  initialConfig?: VPNConfig
): UseVpnConfigReturn {
  const [vpnConfig, setVpnConfig] = useState<VPNConfig>(
    initialConfig || defaultVPNConfig()
  );
  const [vpnConfigOpen, setVpnConfigOpen] = useState(false);

  const updateVpnType = useCallback((type: VPNConfig["type"] | "none") => {
    setVpnConfig((prev) => {
      const currentConfig = prev || defaultVPNConfig();
      const newType = type === "none" ? null : (type as VPNConfig["type"]);
      return {
        ...currentConfig,
        enabled: newType !== null,
        type: newType,
        tailscale:
          newType === "tailscale"
            ? currentConfig.tailscale || defaultTailscaleConfig()
            : undefined,
        newt:
          newType === "newt"
            ? currentConfig.newt || defaultNewtConfig()
            : undefined,
        cloudflared:
          newType === "cloudflared"
            ? currentConfig.cloudflared || defaultCloudflaredConfig()
            : undefined,
        wireguard:
          newType === "wireguard"
            ? currentConfig.wireguard || defaultWireguardConfig()
            : undefined,
        zerotier:
          newType === "zerotier"
            ? currentConfig.zerotier || defaultZerotierConfig()
            : undefined,
        netbird:
          newType === "netbird"
            ? currentConfig.netbird || defaultNetbirdConfig()
            : undefined,
      };
    });
  }, []);

  const updateTailscaleConfig = useCallback(
    (updates: Partial<VPNConfig["tailscale"]>) => {
      if (!updates) return;
      setVpnConfig((prev) => {
        const currentTailscale = prev.tailscale!;
        const newUpdates = { ...updates };

        // Auto-adjust port when protocol changes (unless user manually changed it)
        if (currentTailscale && updates.serveProtocol && updates.serveProtocol !== currentTailscale.serveProtocol) {
          const currentPort = currentTailscale.serveExternalPort;
          const currentProtocol = currentTailscale.serveProtocol;

          // Only auto-adjust if port is at default for current protocol
          if (
            (currentProtocol === "HTTPS" && currentPort === "443") ||
            (currentProtocol === "HTTP" && currentPort === "80") ||
            !currentPort // No port set yet
          ) {
            newUpdates.serveExternalPort = updates.serveProtocol === "HTTPS" ? "443" : "80";
          }
        }

        return {
          ...prev,
          tailscale: {
            ...currentTailscale,
            ...newUpdates,
          },
        };
      });
    },
    []
  );

  const updateNewtConfig = useCallback(
    (updates: Partial<VPNConfig["newt"]>) => {
      setVpnConfig((prev) => ({
        ...prev,
        newt: {
          ...prev.newt!,
          ...updates,
        },
      }));
    },
    []
  );

  const updateCloudflaredConfig = useCallback(
    (updates: Partial<VPNConfig["cloudflared"]>) => {
      setVpnConfig((prev) => ({
        ...prev,
        cloudflared: {
          ...prev.cloudflared!,
          ...updates,
        },
      }));
    },
    []
  );

  const updateWireguardConfig = useCallback(
    (updates: Partial<VPNConfig["wireguard"]>) => {
      setVpnConfig((prev) => ({
        ...prev,
        wireguard: {
          ...prev.wireguard!,
          ...updates,
        },
      }));
    },
    []
  );

  const updateZerotierConfig = useCallback(
    (updates: Partial<VPNConfig["zerotier"]>) => {
      setVpnConfig((prev) => ({
        ...prev,
        zerotier: {
          ...prev.zerotier!,
          ...updates,
        },
      }));
    },
    []
  );

  const updateNetbirdConfig = useCallback(
    (updates: Partial<VPNConfig["netbird"]>) => {
      setVpnConfig((prev) => ({
        ...prev,
        netbird: {
          ...prev.netbird!,
          ...updates,
        },
      }));
    },
    []
  );

  const updateServicesUsingVpn = useCallback((services: string[]) => {
    setVpnConfig((prev) => ({
      ...prev,
      servicesUsingVpn: services,
    }));
  }, []);

  const updateVpnNetworks = useCallback((networks: string[]) => {
    setVpnConfig((prev) => ({
      ...prev,
      networks,
    }));
  }, []);

  return {
    vpnConfig,
    setVpnConfig,
    vpnConfigOpen,
    setVpnConfigOpen,
    updateVpnType,
    updateTailscaleConfig,
    updateNewtConfig,
    updateCloudflaredConfig,
    updateWireguardConfig,
    updateZerotierConfig,
    updateNetbirdConfig,
    updateServicesUsingVpn,
    updateVpnNetworks,
  };
}

