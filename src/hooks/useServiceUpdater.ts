import { useState, useCallback } from "react";
import type { ServiceConfig, Healthcheck } from "../types/compose";
import { defaultService } from "../utils/default-configs";

export function useServiceUpdater(
  initialServices: ServiceConfig[] = [defaultService()]
) {
  const [services, setServices] = useState<ServiceConfig[]>(initialServices);

  // Helper to get new services array with validation
  const getNewServices = useCallback(
    (selectedIdx: number | null): [ServiceConfig[], number] | null => {
      if (typeof selectedIdx !== "number") return null;
      return [[...services], selectedIdx];
    },
    [services]
  );

  // Service field updates
  const updateServiceField = useCallback(
    (selectedIdx: number | null, field: keyof ServiceConfig, value: any) => {
      const result = getNewServices(selectedIdx);
      if (!result) return;
      const [newServices, idx] = result;
      (newServices[idx] as any)[field] = value;
      setServices(newServices);
    },
    [getNewServices]
  );

  // List field updates (for environment, etc.)
  const updateListField = useCallback(
    (
      selectedIdx: number | null,
      field: keyof ServiceConfig,
      idx: number,
      value: any
    ) => {
      const result = getNewServices(selectedIdx);
      if (!result) return;
      const [newServices, sIdx] = result;
      (newServices[sIdx][field] as any[])[idx] = value;
      setServices(newServices);
    },
    [getNewServices]
  );

  const addListField = useCallback(
    (selectedIdx: number | null, field: keyof ServiceConfig) => {
      const result = getNewServices(selectedIdx);
      if (!result) return;
      const [newServices, idx] = result;
      if (field === "environment") {
        newServices[idx].environment.push({ key: "", value: "" });
      } else {
        (newServices[idx][field] as any[]).push("");
      }
      setServices(newServices);
    },
    [getNewServices]
  );

  const removeListField = useCallback(
    (selectedIdx: number | null, field: keyof ServiceConfig, idx: number) => {
      const result = getNewServices(selectedIdx);
      if (!result) return;
      const [newServices, sIdx] = result;
      (newServices[sIdx][field] as any[]).splice(idx, 1);
      setServices(newServices);
    },
    [getNewServices]
  );

  // String array field updates
  const updateStringArrayField = useCallback(
    (
      selectedIdx: number | null,
      field: keyof ServiceConfig,
      idx: number,
      value: string
    ) => {
      const result = getNewServices(selectedIdx);
      if (!result) return;
      const [newServices, sIdx] = result;
      const service = newServices[sIdx];
      const arrayField = (service as any)[field] as string[] | undefined;
      if (!arrayField) {
        (service as any)[field] = [];
      }
      ((service as any)[field] as string[])[idx] = value;
      setServices(newServices);
    },
    [getNewServices]
  );

  const addStringArrayField = useCallback(
    (selectedIdx: number | null, field: keyof ServiceConfig) => {
      const result = getNewServices(selectedIdx);
      if (!result) return;
      const [newServices, idx] = result;
      const service = newServices[idx];
      const arrayField = (service as any)[field] as string[] | undefined;
      if (!arrayField) {
        (service as any)[field] = [];
      }
      ((service as any)[field] as string[]).push("");
      setServices(newServices);
    },
    [getNewServices]
  );

  const removeStringArrayField = useCallback(
    (selectedIdx: number | null, field: keyof ServiceConfig, idx: number) => {
      const result = getNewServices(selectedIdx);
      if (!result) return;
      const [newServices, sIdx] = result;
      const service = newServices[sIdx];
      const arrayField = (service as any)[field] as string[] | undefined;
      if (arrayField) {
        arrayField.splice(idx, 1);
        setServices(newServices);
      }
    },
    [getNewServices]
  );

  // Service management
  const addService = useCallback(() => {
    const newServices = [...services, defaultService()];
    setServices(newServices);
    return services.length; // Return new index
  }, [services]);

  const removeService = useCallback((idx: number) => {
    const newServices = services.filter((_, i) => i !== idx);
    const finalServices =
      newServices.length === 0 ? [defaultService()] : newServices;
    setServices(finalServices);
    return finalServices.length - 1; // Return safe index
  }, [services]);

  // Port field updates
  const updatePortField = useCallback(
    (
      selectedIdx: number | null,
      idx: number,
      field: "host" | "container" | "protocol",
      value: string
    ) => {
      const result = getNewServices(selectedIdx);
      if (!result) return;
      const [newServices, sIdx] = result;
      if (field === "protocol") {
        newServices[sIdx].ports[idx][field] = value;
      } else {
        newServices[sIdx].ports[idx][field] = value.replace(/[^0-9]/g, "");
      }
      setServices(newServices);
    },
    [getNewServices]
  );

  const addPortField = useCallback(
    (selectedIdx: number | null) => {
      const result = getNewServices(selectedIdx);
      if (!result) return;
      const [newServices, idx] = result;
      newServices[idx].ports.push({
        host: "",
        container: "",
        protocol: "none",
      });
      setServices(newServices);
    },
    [getNewServices]
  );

  const removePortField = useCallback(
    (selectedIdx: number | null, idx: number) => {
      const result = getNewServices(selectedIdx);
      if (!result) return;
      const [newServices, sIdx] = result;
      newServices[sIdx].ports.splice(idx, 1);
      setServices(newServices);
    },
    [getNewServices]
  );

  // Volume field updates
  const updateVolumeField = useCallback(
    (
      selectedIdx: number | null,
      idx: number,
      field: "host" | "container" | "read_only",
      value: string | boolean
    ) => {
      const result = getNewServices(selectedIdx);
      if (!result) return;
      const [newServices, sIdx] = result;
      (newServices[sIdx].volumes[idx] as any)[field] = value;
      setServices(newServices);
    },
    [getNewServices]
  );

  const addVolumeField = useCallback(
    (selectedIdx: number | null) => {
      const result = getNewServices(selectedIdx);
      if (!result) return;
      const [newServices, idx] = result;
      newServices[idx].volumes.push({
        host: "",
        container: "",
        read_only: false,
      });
      setServices(newServices);
    },
    [getNewServices]
  );

  const removeVolumeField = useCallback(
    (selectedIdx: number | null, idx: number) => {
      const result = getNewServices(selectedIdx);
      if (!result) return;
      const [newServices, sIdx] = result;
      newServices[sIdx].volumes.splice(idx, 1);
      setServices(newServices);
    },
    [getNewServices]
  );

  // Healthcheck updates
  const updateHealthcheckField = useCallback(
    (
      selectedIdx: number | null,
      field: keyof Healthcheck,
      value: string
    ) => {
      const result = getNewServices(selectedIdx);
      if (!result) return;
      const [newServices, idx] = result;
      if (!newServices[idx].healthcheck)
        newServices[idx].healthcheck = {
          test: "",
          interval: "",
          timeout: "",
          retries: "",
          start_period: "",
          start_interval: "",
        };
      newServices[idx].healthcheck![field] = value;
      setServices(newServices);
    },
    [getNewServices]
  );

  // Sysctl updates
  const updateSysctl = useCallback(
    (
      selectedIdx: number | null,
      idx: number,
      field: "key" | "value",
      value: string
    ) => {
      const result = getNewServices(selectedIdx);
      if (!result) return;
      const [newServices, sIdx] = result;
      if (!newServices[sIdx].sysctls) newServices[sIdx].sysctls = [];
      newServices[sIdx].sysctls![idx] = {
        ...newServices[sIdx].sysctls![idx],
        [field]: value,
      };
      setServices(newServices);
    },
    [getNewServices]
  );

  const addSysctl = useCallback(
    (selectedIdx: number | null) => {
      const result = getNewServices(selectedIdx);
      if (!result) return;
      const [newServices, idx] = result;
      if (!newServices[idx].sysctls) newServices[idx].sysctls = [];
      newServices[idx].sysctls!.push({ key: "", value: "" });
      setServices(newServices);
    },
    [getNewServices]
  );

  const removeSysctl = useCallback(
    (selectedIdx: number | null, idx: number) => {
      const result = getNewServices(selectedIdx);
      if (!result) return;
      const [newServices, sIdx] = result;
      newServices[sIdx].sysctls!.splice(idx, 1);
      setServices(newServices);
    },
    [getNewServices]
  );

  // Ulimit updates
  const updateUlimit = useCallback(
    (
      selectedIdx: number | null,
      idx: number,
      field: "name" | "soft" | "hard",
      value: string
    ) => {
      const result = getNewServices(selectedIdx);
      if (!result) return;
      const [newServices, sIdx] = result;
      if (!newServices[sIdx].ulimits) newServices[sIdx].ulimits = [];
      newServices[sIdx].ulimits![idx] = {
        ...newServices[sIdx].ulimits![idx],
        [field]: value,
      };
      setServices(newServices);
    },
    [getNewServices]
  );

  const addUlimit = useCallback(
    (selectedIdx: number | null) => {
      const result = getNewServices(selectedIdx);
      if (!result) return;
      const [newServices, idx] = result;
      if (!newServices[idx].ulimits) newServices[idx].ulimits = [];
      newServices[idx].ulimits!.push({ name: "", soft: "", hard: "" });
      setServices(newServices);
    },
    [getNewServices]
  );

  const removeUlimit = useCallback(
    (selectedIdx: number | null, idx: number) => {
      const result = getNewServices(selectedIdx);
      if (!result) return;
      const [newServices, sIdx] = result;
      newServices[sIdx].ulimits!.splice(idx, 1);
      setServices(newServices);
    },
    [getNewServices]
  );

  // Resource field updates
  const updateResourceField = useCallback(
    (
      selectedIdx: number | null,
      type: "limits" | "reservations",
      field: "cpus" | "memory",
      value: string
    ) => {
      const result = getNewServices(selectedIdx);
      if (!result) return;
      const [newServices, idx] = result;
      if (!newServices[idx].deploy) {
        newServices[idx].deploy = { resources: {} };
      }
      if (!newServices[idx].deploy!.resources) {
        newServices[idx].deploy!.resources = {};
      }
      if (!newServices[idx].deploy!.resources![type]) {
        newServices[idx].deploy!.resources![type] = {};
      }
      newServices[idx].deploy!.resources![type]![field] = value;
      setServices(newServices);
    },
    [getNewServices]
  );

  return {
    services,
    setServices,
    updateServiceField,
    updateListField,
    addListField,
    removeListField,
    updateStringArrayField,
    addStringArrayField,
    removeStringArrayField,
    addService,
    removeService,
    updatePortField,
    addPortField,
    removePortField,
    updateVolumeField,
    addVolumeField,
    removeVolumeField,
    updateHealthcheckField,
    updateSysctl,
    addSysctl,
    removeSysctl,
    updateUlimit,
    addUlimit,
    removeUlimit,
    updateResourceField,
  };
}
