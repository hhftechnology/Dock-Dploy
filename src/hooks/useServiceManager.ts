import { useState, useCallback } from "react";
import type { ServiceConfig, Healthcheck } from "../types/compose";
import { defaultService } from "../utils/default-configs";

export interface UseServiceManagerReturn {
  services: ServiceConfig[];
  selectedIdx: number | null;
  setSelectedIdx: (idx: number | null) => void;
  updateServiceField: (field: keyof ServiceConfig, value: any) => void;
  updateListField: (field: keyof ServiceConfig, idx: number, value: any) => void;
  addListField: (field: keyof ServiceConfig) => void;
  removeListField: (field: keyof ServiceConfig, idx: number) => void;
  addService: () => void;
  removeService: (idx: number) => void;
  // Ports
  updatePortField: (idx: number, field: "host" | "container" | "protocol", value: string) => void;
  addPortField: () => void;
  removePortField: (idx: number) => void;
  // Volumes
  updateVolumeField: (idx: number, field: "host" | "container" | "read_only", value: string | boolean) => void;
  addVolumeField: () => void;
  removeVolumeField: (idx: number) => void;
  // Healthcheck
  updateHealthcheckField: (field: keyof Healthcheck, value: string) => void;
  // Dependencies
  updateDependsOn: (idx: number, value: string) => void;
  addDependsOn: () => void;
  removeDependsOn: (idx: number) => void;
  // Security
  updateSecurityOpt: (idx: number, value: string) => void;
  addSecurityOpt: () => void;
  removeSecurityOpt: (idx: number) => void;
  // Capabilities
  updateCapAdd: (idx: number, value: string) => void;
  addCapAdd: () => void;
  removeCapAdd: (idx: number) => void;
  updateCapDrop: (idx: number, value: string) => void;
  addCapDrop: () => void;
  removeCapDrop: (idx: number) => void;
  // Sysctls
  updateSysctl: (idx: number, field: "key" | "value", value: string) => void;
  addSysctl: () => void;
  removeSysctl: (idx: number) => void;
  // Devices
  updateDevice: (idx: number, value: string) => void;
  addDevice: () => void;
  removeDevice: (idx: number) => void;
  // Tmpfs
  updateTmpfs: (idx: number, value: string) => void;
  addTmpfs: () => void;
  removeTmpfs: (idx: number) => void;
  // Ulimits
  updateUlimit: (idx: number, field: "name" | "soft" | "hard", value: string) => void;
  addUlimit: () => void;
  removeUlimit: (idx: number) => void;
  // Labels
  updateLabel: (idx: number, field: "key" | "value", value: string) => void;
  addLabel: () => void;
  removeLabel: (idx: number) => void;
  // Resources
  updateResourceField: (type: "limits" | "reservations", field: "cpus" | "memory", value: string) => void;
}

export function useServiceManager(
  initialServices: ServiceConfig[] = [defaultService()],
  onSelectionChange?: (type: "service" | "network" | "volume", idx: number | null) => void
): UseServiceManagerReturn {
  const [services, setServices] = useState<ServiceConfig[]>(initialServices);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(0);

  const updateServiceField = useCallback((field: keyof ServiceConfig, value: any) => {
    setServices((prev) => {
      if (typeof selectedIdx !== "number") return prev;
      const newServices = [...prev];
      (newServices[selectedIdx] as any)[field] = value;
      return newServices;
    });
  }, [selectedIdx]);

  const updateListField = useCallback((field: keyof ServiceConfig, idx: number, value: any) => {
    setServices((prev) => {
      if (typeof selectedIdx !== "number") return prev;
      const newServices = [...prev];
      (newServices[selectedIdx][field] as any[])[idx] = value;
      return newServices;
    });
  }, [selectedIdx]);

  const addListField = useCallback((field: keyof ServiceConfig) => {
    setServices((prev) => {
      if (typeof selectedIdx !== "number") return prev;
      const newServices = [...prev];
      if (field === "environment") {
        newServices[selectedIdx].environment.push({ key: "", value: "" });
      } else {
        (newServices[selectedIdx][field] as any[]).push("");
      }
      return newServices;
    });
  }, [selectedIdx]);

  const removeListField = useCallback((field: keyof ServiceConfig, idx: number) => {
    setServices((prev) => {
      if (typeof selectedIdx !== "number") return prev;
      const newServices = [...prev];
      (newServices[selectedIdx][field] as any[]).splice(idx, 1);
      return newServices;
    });
  }, [selectedIdx]);

  const addService = useCallback(() => {
    setServices((prev) => {
      const newServices = [...prev, defaultService()];
      setSelectedIdx(prev.length);
      onSelectionChange?.("service", prev.length);
      return newServices;
    });
  }, [onSelectionChange]);

  const removeService = useCallback((idx: number) => {
    setServices((prev) => {
      const newServices = prev.filter((_, i) => i !== idx);
      const finalServices = newServices.length === 0 ? [defaultService()] : newServices;

      const newSelectedIdx = typeof selectedIdx === "number"
        ? Math.max(0, Math.min(finalServices.length - 1, selectedIdx - (idx <= selectedIdx ? 1 : 0)))
        : 0;

      setSelectedIdx(newSelectedIdx);
      return finalServices;
    });
  }, [selectedIdx]);

  const updatePortField = useCallback((idx: number, field: "host" | "container" | "protocol", value: string) => {
    setServices((prev) => {
      if (typeof selectedIdx !== "number") return prev;
      const newServices = [...prev];
      if (field === "protocol") {
        newServices[selectedIdx].ports[idx][field] = value;
      } else {
        newServices[selectedIdx].ports[idx][field] = value.replace(/[^0-9]/g, "");
      }
      return newServices;
    });
  }, [selectedIdx]);

  const addPortField = useCallback(() => {
    setServices((prev) => {
      if (typeof selectedIdx !== "number") return prev;
      const newServices = [...prev];
      newServices[selectedIdx].ports.push({ host: "", container: "", protocol: "none" });
      return newServices;
    });
  }, [selectedIdx]);

  const removePortField = useCallback((idx: number) => {
    setServices((prev) => {
      if (typeof selectedIdx !== "number") return prev;
      const newServices = [...prev];
      newServices[selectedIdx].ports.splice(idx, 1);
      return newServices;
    });
  }, [selectedIdx]);

  const updateVolumeField = useCallback((idx: number, field: "host" | "container" | "read_only", value: string | boolean) => {
    setServices((prev) => {
      if (typeof selectedIdx !== "number") return prev;
      const newServices = [...prev];
      (newServices[selectedIdx].volumes[idx] as any)[field] = value;
      return newServices;
    });
  }, [selectedIdx]);

  const addVolumeField = useCallback(() => {
    setServices((prev) => {
      if (typeof selectedIdx !== "number") return prev;
      const newServices = [...prev];
      newServices[selectedIdx].volumes.push({ host: "", container: "", read_only: false });
      return newServices;
    });
  }, [selectedIdx]);

  const removeVolumeField = useCallback((idx: number) => {
    setServices((prev) => {
      if (typeof selectedIdx !== "number") return prev;
      const newServices = [...prev];
      newServices[selectedIdx].volumes.splice(idx, 1);
      return newServices;
    });
  }, [selectedIdx]);

  const updateHealthcheckField = useCallback((field: keyof Healthcheck, value: string) => {
    setServices((prev) => {
      if (typeof selectedIdx !== "number") return prev;
      const newServices = [...prev];
      if (!newServices[selectedIdx].healthcheck) {
        newServices[selectedIdx].healthcheck = {
          test: "",
          interval: "",
          timeout: "",
          retries: "",
          start_period: "",
          start_interval: "",
        };
      }
      newServices[selectedIdx].healthcheck![field] = value;
      return newServices;
    });
  }, [selectedIdx]);

  const updateDependsOn = useCallback((idx: number, value: string) => {
    setServices((prev) => {
      if (typeof selectedIdx !== "number") return prev;
      const newServices = [...prev];
      newServices[selectedIdx].depends_on![idx] = value;
      return newServices;
    });
  }, [selectedIdx]);

  const addDependsOn = useCallback(() => {
    setServices((prev) => {
      if (typeof selectedIdx !== "number") return prev;
      const newServices = [...prev];
      if (!newServices[selectedIdx].depends_on) newServices[selectedIdx].depends_on = [];
      newServices[selectedIdx].depends_on!.push("");
      return newServices;
    });
  }, [selectedIdx]);

  const removeDependsOn = useCallback((idx: number) => {
    setServices((prev) => {
      if (typeof selectedIdx !== "number") return prev;
      const newServices = [...prev];
      newServices[selectedIdx].depends_on!.splice(idx, 1);
      return newServices;
    });
  }, [selectedIdx]);

  const updateSecurityOpt = useCallback((idx: number, value: string) => {
    setServices((prev) => {
      if (typeof selectedIdx !== "number") return prev;
      const newServices = [...prev];
      newServices[selectedIdx].security_opt![idx] = value;
      return newServices;
    });
  }, [selectedIdx]);

  const addSecurityOpt = useCallback(() => {
    setServices((prev) => {
      if (typeof selectedIdx !== "number") return prev;
      const newServices = [...prev];
      if (!newServices[selectedIdx].security_opt) newServices[selectedIdx].security_opt = [];
      newServices[selectedIdx].security_opt!.push("");
      return newServices;
    });
  }, [selectedIdx]);

  const removeSecurityOpt = useCallback((idx: number) => {
    setServices((prev) => {
      if (typeof selectedIdx !== "number") return prev;
      const newServices = [...prev];
      newServices[selectedIdx].security_opt!.splice(idx, 1);
      return newServices;
    });
  }, [selectedIdx]);

  const updateCapAdd = useCallback((idx: number, value: string) => {
    setServices((prev) => {
      if (typeof selectedIdx !== "number") return prev;
      const newServices = [...prev];
      if (!newServices[selectedIdx].cap_add) newServices[selectedIdx].cap_add = [];
      newServices[selectedIdx].cap_add![idx] = value;
      return newServices;
    });
  }, [selectedIdx]);

  const addCapAdd = useCallback(() => {
    setServices((prev) => {
      if (typeof selectedIdx !== "number") return prev;
      const newServices = [...prev];
      if (!newServices[selectedIdx].cap_add) newServices[selectedIdx].cap_add = [];
      newServices[selectedIdx].cap_add!.push("");
      return newServices;
    });
  }, [selectedIdx]);

  const removeCapAdd = useCallback((idx: number) => {
    setServices((prev) => {
      if (typeof selectedIdx !== "number") return prev;
      const newServices = [...prev];
      newServices[selectedIdx].cap_add!.splice(idx, 1);
      return newServices;
    });
  }, [selectedIdx]);

  const updateCapDrop = useCallback((idx: number, value: string) => {
    setServices((prev) => {
      if (typeof selectedIdx !== "number") return prev;
      const newServices = [...prev];
      if (!newServices[selectedIdx].cap_drop) newServices[selectedIdx].cap_drop = [];
      newServices[selectedIdx].cap_drop![idx] = value;
      return newServices;
    });
  }, [selectedIdx]);

  const addCapDrop = useCallback(() => {
    setServices((prev) => {
      if (typeof selectedIdx !== "number") return prev;
      const newServices = [...prev];
      if (!newServices[selectedIdx].cap_drop) newServices[selectedIdx].cap_drop = [];
      newServices[selectedIdx].cap_drop!.push("");
      return newServices;
    });
  }, [selectedIdx]);

  const removeCapDrop = useCallback((idx: number) => {
    setServices((prev) => {
      if (typeof selectedIdx !== "number") return prev;
      const newServices = [...prev];
      newServices[selectedIdx].cap_drop!.splice(idx, 1);
      return newServices;
    });
  }, [selectedIdx]);

  const updateSysctl = useCallback((idx: number, field: "key" | "value", value: string) => {
    setServices((prev) => {
      if (typeof selectedIdx !== "number") return prev;
      const newServices = [...prev];
      if (!newServices[selectedIdx].sysctls) newServices[selectedIdx].sysctls = [];
      newServices[selectedIdx].sysctls![idx] = {
        ...newServices[selectedIdx].sysctls![idx],
        [field]: value,
      };
      return newServices;
    });
  }, [selectedIdx]);

  const addSysctl = useCallback(() => {
    setServices((prev) => {
      if (typeof selectedIdx !== "number") return prev;
      const newServices = [...prev];
      if (!newServices[selectedIdx].sysctls) newServices[selectedIdx].sysctls = [];
      newServices[selectedIdx].sysctls!.push({ key: "", value: "" });
      return newServices;
    });
  }, [selectedIdx]);

  const removeSysctl = useCallback((idx: number) => {
    setServices((prev) => {
      if (typeof selectedIdx !== "number") return prev;
      const newServices = [...prev];
      newServices[selectedIdx].sysctls!.splice(idx, 1);
      return newServices;
    });
  }, [selectedIdx]);

  const updateDevice = useCallback((idx: number, value: string) => {
    setServices((prev) => {
      if (typeof selectedIdx !== "number") return prev;
      const newServices = [...prev];
      if (!newServices[selectedIdx].devices) newServices[selectedIdx].devices = [];
      newServices[selectedIdx].devices![idx] = value;
      return newServices;
    });
  }, [selectedIdx]);

  const addDevice = useCallback(() => {
    setServices((prev) => {
      if (typeof selectedIdx !== "number") return prev;
      const newServices = [...prev];
      if (!newServices[selectedIdx].devices) newServices[selectedIdx].devices = [];
      newServices[selectedIdx].devices!.push("");
      return newServices;
    });
  }, [selectedIdx]);

  const removeDevice = useCallback((idx: number) => {
    setServices((prev) => {
      if (typeof selectedIdx !== "number") return prev;
      const newServices = [...prev];
      newServices[selectedIdx].devices!.splice(idx, 1);
      return newServices;
    });
  }, [selectedIdx]);

  const updateTmpfs = useCallback((idx: number, value: string) => {
    setServices((prev) => {
      if (typeof selectedIdx !== "number") return prev;
      const newServices = [...prev];
      if (!newServices[selectedIdx].tmpfs) newServices[selectedIdx].tmpfs = [];
      newServices[selectedIdx].tmpfs![idx] = value;
      return newServices;
    });
  }, [selectedIdx]);

  const addTmpfs = useCallback(() => {
    setServices((prev) => {
      if (typeof selectedIdx !== "number") return prev;
      const newServices = [...prev];
      if (!newServices[selectedIdx].tmpfs) newServices[selectedIdx].tmpfs = [];
      newServices[selectedIdx].tmpfs!.push("");
      return newServices;
    });
  }, [selectedIdx]);

  const removeTmpfs = useCallback((idx: number) => {
    setServices((prev) => {
      if (typeof selectedIdx !== "number") return prev;
      const newServices = [...prev];
      newServices[selectedIdx].tmpfs!.splice(idx, 1);
      return newServices;
    });
  }, [selectedIdx]);

  const updateUlimit = useCallback((idx: number, field: "name" | "soft" | "hard", value: string) => {
    setServices((prev) => {
      if (typeof selectedIdx !== "number") return prev;
      const newServices = [...prev];
      if (!newServices[selectedIdx].ulimits) newServices[selectedIdx].ulimits = [];
      newServices[selectedIdx].ulimits![idx] = {
        ...newServices[selectedIdx].ulimits![idx],
        [field]: value,
      };
      return newServices;
    });
  }, [selectedIdx]);

  const addUlimit = useCallback(() => {
    setServices((prev) => {
      if (typeof selectedIdx !== "number") return prev;
      const newServices = [...prev];
      if (!newServices[selectedIdx].ulimits) newServices[selectedIdx].ulimits = [];
      newServices[selectedIdx].ulimits!.push({ name: "", soft: "", hard: "" });
      return newServices;
    });
  }, [selectedIdx]);

  const removeUlimit = useCallback((idx: number) => {
    setServices((prev) => {
      if (typeof selectedIdx !== "number") return prev;
      const newServices = [...prev];
      newServices[selectedIdx].ulimits!.splice(idx, 1);
      return newServices;
    });
  }, [selectedIdx]);

  const updateLabel = useCallback((idx: number, field: "key" | "value", value: string) => {
    setServices((prev) => {
      if (typeof selectedIdx !== "number") return prev;
      const newServices = [...prev];
      if (!newServices[selectedIdx].labels) newServices[selectedIdx].labels = [];
      newServices[selectedIdx].labels![idx] = {
        ...newServices[selectedIdx].labels![idx],
        [field]: value,
      };
      return newServices;
    });
  }, [selectedIdx]);

  const addLabel = useCallback(() => {
    setServices((prev) => {
      if (typeof selectedIdx !== "number") return prev;
      const newServices = [...prev];
      if (!newServices[selectedIdx].labels) newServices[selectedIdx].labels = [];
      newServices[selectedIdx].labels!.push({ key: "", value: "" });
      return newServices;
    });
  }, [selectedIdx]);

  const removeLabel = useCallback((idx: number) => {
    setServices((prev) => {
      if (typeof selectedIdx !== "number") return prev;
      const newServices = [...prev];
      newServices[selectedIdx].labels!.splice(idx, 1);
      return newServices;
    });
  }, [selectedIdx]);

  const updateResourceField = useCallback((
    type: "limits" | "reservations",
    field: "cpus" | "memory",
    value: string
  ) => {
    setServices((prev) => {
      if (typeof selectedIdx !== "number") return prev;
      const newServices = [...prev];

      if (!newServices[selectedIdx].deploy) {
        newServices[selectedIdx].deploy = { resources: {} };
      }
      if (!newServices[selectedIdx].deploy!.resources) {
        newServices[selectedIdx].deploy!.resources = {};
      }
      if (!newServices[selectedIdx].deploy!.resources![type]) {
        newServices[selectedIdx].deploy!.resources![type] = {};
      }

      if (value.trim() === "") {
        delete (newServices[selectedIdx].deploy!.resources![type] as any)[field];
        if (Object.keys(newServices[selectedIdx].deploy!.resources![type]!).length === 0) {
          delete newServices[selectedIdx].deploy!.resources![type];
        }
        if (Object.keys(newServices[selectedIdx].deploy!.resources!).length === 0) {
          delete newServices[selectedIdx].deploy!.resources;
          if (Object.keys(newServices[selectedIdx].deploy!).length === 0) {
            delete newServices[selectedIdx].deploy;
          }
        }
      } else {
        (newServices[selectedIdx].deploy!.resources![type] as any)[field] = value;
      }

      return newServices;
    });
  }, [selectedIdx]);

  return {
    services,
    selectedIdx,
    setSelectedIdx,
    updateServiceField,
    updateListField,
    addListField,
    removeListField,
    addService,
    removeService,
    updatePortField,
    addPortField,
    removePortField,
    updateVolumeField,
    addVolumeField,
    removeVolumeField,
    updateHealthcheckField,
    updateDependsOn,
    addDependsOn,
    removeDependsOn,
    updateSecurityOpt,
    addSecurityOpt,
    removeSecurityOpt,
    updateCapAdd,
    addCapAdd,
    removeCapAdd,
    updateCapDrop,
    addCapDrop,
    removeCapDrop,
    updateSysctl,
    addSysctl,
    removeSysctl,
    updateDevice,
    addDevice,
    removeDevice,
    updateTmpfs,
    addTmpfs,
    removeTmpfs,
    updateUlimit,
    addUlimit,
    removeUlimit,
    updateLabel,
    addLabel,
    removeLabel,
    updateResourceField,
  };
}
