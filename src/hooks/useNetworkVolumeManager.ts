import { useState, useCallback } from "react";
import type { NetworkConfig, VolumeConfig, ServiceConfig } from "../types/compose";
import { defaultNetwork, defaultVolume } from "../utils/default-configs";

export interface UseNetworkVolumeManagerReturn {
  // Networks
  networks: NetworkConfig[];
  selectedNetworkIdx: number | null;
  setSelectedNetworkIdx: (idx: number | null) => void;
  addNetwork: () => void;
  bulkAddNetworks: (networks: NetworkConfig[]) => void;
  updateNetwork: (idx: number, field: keyof NetworkConfig, value: any) => void;
  removeNetwork: (idx: number) => void;
  // Volumes
  volumes: VolumeConfig[];
  selectedVolumeIdx: number | null;
  setSelectedVolumeIdx: (idx: number | null) => void;
  addVolume: () => void;
  bulkAddVolumes: (volumes: VolumeConfig[]) => void;
  updateVolume: (idx: number, field: keyof VolumeConfig, value: any) => void;
  removeVolume: (idx: number) => void;
}

export interface UseNetworkVolumeManagerOptions {
  initialNetworks?: NetworkConfig[];
  initialVolumes?: VolumeConfig[];
  setServices?: (services: ServiceConfig[] | ((prev: ServiceConfig[]) => ServiceConfig[])) => void;
  onSelectionChange?: (type: "service" | "network" | "volume", idx: number | null) => void;
}

export function useNetworkVolumeManager({
  initialNetworks = [],
  initialVolumes = [],
  setServices,
  onSelectionChange,
}: UseNetworkVolumeManagerOptions = {}): UseNetworkVolumeManagerReturn {
  const [networks, setNetworks] = useState<NetworkConfig[]>(initialNetworks);
  const [volumes, setVolumes] = useState<VolumeConfig[]>(initialVolumes);
  const [selectedNetworkIdx, setSelectedNetworkIdx] = useState<number | null>(null);
  const [selectedVolumeIdx, setSelectedVolumeIdx] = useState<number | null>(null);

  // Network management
  const addNetwork = useCallback(() => {
    setNetworks((prev) => {
      const newNetworks = [...prev, defaultNetwork()];
      setSelectedNetworkIdx(newNetworks.length - 1);
      onSelectionChange?.("network", newNetworks.length - 1);
      return newNetworks;
    });
    setSelectedVolumeIdx(null);
  }, [onSelectionChange]);

  const updateNetwork = useCallback((idx: number, field: keyof NetworkConfig, value: any) => {
    setNetworks((prev) => {
      const newNetworks = [...prev];

      // If renaming a network, update all service references
      if (field === "name" && setServices) {
        const oldName = newNetworks[idx].name;
        newNetworks[idx][field] = value;

        setServices((prevServices) =>
          prevServices.map((svc) => ({
            ...svc,
            networks: svc.networks?.map((n) => (n === oldName ? value : n)) || [],
          }))
        );

        return newNetworks;
      }

      (newNetworks[idx] as any)[field] = value;
      return newNetworks;
    });
  }, [setServices]);

  const removeNetwork = useCallback((idx: number) => {
    setNetworks((prev) => {
      const newNetworks = [...prev];
      const removedName = newNetworks[idx].name;
      newNetworks.splice(idx, 1);

      // Remove network references from services
      if (setServices) {
        setServices((prevServices) =>
          prevServices.map((svc) => ({
            ...svc,
            networks: svc.networks?.filter((n) => n !== removedName) || [],
          }))
        );
      }

      if (newNetworks.length === 0) {
        setSelectedNetworkIdx(null);
        onSelectionChange?.("service", null);
      } else {
        setSelectedNetworkIdx(0);
      }

      return newNetworks;
    });
  }, [setServices, onSelectionChange]);

  // Volume management
  const addVolume = useCallback(() => {
    setVolumes((prev) => {
      const newVolumes = [...prev, defaultVolume()];
      setSelectedVolumeIdx(newVolumes.length - 1);
      onSelectionChange?.("volume", newVolumes.length - 1);
      return newVolumes;
    });
    setSelectedNetworkIdx(null);
  }, [onSelectionChange]);

  const updateVolume = useCallback((idx: number, field: keyof VolumeConfig, value: any) => {
    setVolumes((prev) => {
      const newVolumes = [...prev];

      // If renaming a volume, update all service references
      if (field === "name" && setServices) {
        const oldName = newVolumes[idx].name;
        newVolumes[idx][field] = value;

        setServices((prevServices) =>
          prevServices.map((svc) => ({
            ...svc,
            volumes:
              svc.volumes?.map((v) =>
                v.host === oldName ? { ...v, host: value } : v
              ) || [],
          }))
        );

        return newVolumes;
      }

      (newVolumes[idx] as any)[field] = value;
      return newVolumes;
    });
  }, [setServices]);

  const removeVolume = useCallback((idx: number) => {
    setVolumes((prev) => {
      const newVolumes = [...prev];
      const removedName = newVolumes[idx].name;
      newVolumes.splice(idx, 1);

      // Remove volume references from services
      if (setServices) {
        setServices((prevServices) =>
          prevServices.map((svc) => ({
            ...svc,
            volumes: svc.volumes?.filter((v) => v.host !== removedName) || [],
          }))
        );
      }

      if (newVolumes.length === 0) {
        setSelectedVolumeIdx(null);
        onSelectionChange?.("service", null);
      } else {
        setSelectedVolumeIdx(0);
      }

      return newVolumes;
    });
  }, [setServices, onSelectionChange]);

  // Bulk add methods for template imports
  const bulkAddNetworks = useCallback((newNetworks: NetworkConfig[]) => {
    setNetworks((prev) => {
      const existingNames = new Set(prev.map((n) => n.name));
      const uniqueNetworks = newNetworks.filter((n) => !existingNames.has(n.name));
      return [...prev, ...uniqueNetworks];
    });
  }, []);

  const bulkAddVolumes = useCallback((newVolumes: VolumeConfig[]) => {
    setVolumes((prev) => {
      const existingNames = new Set(prev.map((v) => v.name));
      const uniqueVolumes = newVolumes.filter((v) => !existingNames.has(v.name));
      return [...prev, ...uniqueVolumes];
    });
  }, []);

  return {
    networks,
    selectedNetworkIdx,
    setSelectedNetworkIdx,
    addNetwork,
    bulkAddNetworks,
    updateNetwork,
    removeNetwork,
    volumes,
    selectedVolumeIdx,
    setSelectedVolumeIdx,
    addVolume,
    bulkAddVolumes,
    updateVolume,
    removeVolume,
  };
}
