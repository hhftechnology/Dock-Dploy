// ServiceFormApi: a single context that bundles every callback the legacy
// `ServiceForm` props bag exposed. Tab sub-components consume this directly
// so they don't need 40+ individual props passed through.

import { createContext, useContext, type ReactNode } from "react";
import type { ServiceConfig, Healthcheck } from "../../types/compose";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export interface ServiceFormApi {
  service: ServiceConfig;
  restartOptions: Array<{ value: string; label: string }>;

  updateServiceField: (field: keyof ServiceConfig, value: Any) => void;

  // Port + volume + env helpers
  updatePortField: (
    idx: number,
    field: "host" | "container" | "protocol",
    value: string,
  ) => void;
  addPortField: () => void;
  removePortField: (idx: number) => void;

  updateVolumeField: (
    idx: number,
    field: "host" | "container" | "read_only",
    value: string | boolean,
  ) => void;
  addVolumeField: () => void;
  removeVolumeField: (idx: number) => void;

  updateListField: (
    field: keyof ServiceConfig,
    idx: number,
    value: Any,
  ) => void;
  addListField: (field: keyof ServiceConfig) => void;
  removeListField: (field: keyof ServiceConfig, idx: number) => void;

  // Healthcheck
  updateHealthcheckField: (field: keyof Healthcheck, value: string) => void;

  // Depends-on (string-array helpers)
  updateDependsOn: (idx: number, value: string) => void;
  addDependsOn: () => void;
  removeDependsOn: (idx: number) => void;

  // Resources (deploy)
  updateResourceField: (
    type: "limits" | "reservations",
    field: "cpus" | "memory",
    value: string,
  ) => void;

  // Security / capabilities
  updateSecurityOpt: (idx: number, value: string) => void;
  addSecurityOpt: () => void;
  removeSecurityOpt: (idx: number) => void;
  updateCapAdd: (idx: number, value: string) => void;
  addCapAdd: () => void;
  removeCapAdd: (idx: number) => void;
  updateCapDrop: (idx: number, value: string) => void;
  addCapDrop: () => void;
  removeCapDrop: (idx: number) => void;

  // Sysctls / devices / tmpfs / ulimits
  updateSysctl: (idx: number, field: "key" | "value", value: string) => void;
  addSysctl: () => void;
  removeSysctl: (idx: number) => void;
  updateDevice: (idx: number, value: string) => void;
  addDevice: () => void;
  removeDevice: (idx: number) => void;
  updateTmpfs: (idx: number, value: string) => void;
  addTmpfs: () => void;
  removeTmpfs: (idx: number) => void;
  updateUlimit: (
    idx: number,
    field: "name" | "soft" | "hard",
    value: string,
  ) => void;
  addUlimit: () => void;
  removeUlimit: (idx: number) => void;
}

const Ctx = createContext<ServiceFormApi | null>(null);

export function ServiceFormApiProvider({
  api,
  children,
}: {
  api: ServiceFormApi;
  children: ReactNode;
}) {
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useServiceFormApi(): ServiceFormApi {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error(
      "useServiceFormApi must be used inside <ServiceFormApiProvider>",
    );
  }
  return ctx;
}
