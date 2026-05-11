import { useCallback, useState } from "react";
import { useMountEffect } from "../../hooks/useMountEffect";
import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";

import { SetupSidebar, type BuilderView } from "../../components/SetupSidebar";
import { ConfigColumn } from "../../components/compose-builder/ConfigColumn";
import { ServiceForm } from "../../components/compose-builder/ServiceForm";
import { CodePanel } from "../../components/compose-builder/CodePanel";
import { NetworkForm } from "../../components/compose-builder/NetworkForm";
import { VolumeForm } from "../../components/compose-builder/VolumeForm";
import { TemplateStoreModal } from "../../components/templates/TemplateStoreModal";
import { TemplateDetailModal } from "../../components/templates/TemplateDetailModal";
import { ConversionDialog } from "../../components/ConversionDialog";

import { useSelectionState } from "../../hooks/useSelectionState";
import { useVpnConfig } from "../../hooks/useVpnConfig";
import { useTemplateStore } from "../../hooks/useTemplateStore";
import { useYamlValidation } from "../../hooks/useYamlValidation";
import { useNetworkVolumeManager } from "../../hooks/useNetworkVolumeManager";
import { useConversionDialog } from "../../hooks/useConversionDialog";

import { defaultService } from "../../utils/default-configs";
import {
  parseComposeService,
  parseComposeTemplate,
} from "../../utils/template-import";

import type {
  ServiceConfig,
  Healthcheck,
  NetworkConfig,
  VolumeConfig,
} from "../../types/compose";

export type {
  ServiceConfig,
  NetworkConfig,
  VolumeConfig,
} from "../../types/compose";
export type { VPNConfig } from "../../types/vpn-configs";

import type { ServiceFormApi } from "../../components/compose-builder/service-form-api";

export const Route = createFileRoute("/docker/compose-builder")({
  component: ComposeBuilderRoute,
});

const RESTART_OPTIONS = [
  { value: "", label: "None" },
  { value: "no", label: "no" },
  { value: "always", label: "always" },
  { value: "on-failure", label: "on-failure" },
  { value: "unless-stopped", label: "unless-stopped" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

function ComposeBuilderRoute() {
  const navigate = useNavigate();
  const [services, setServices] = useState<ServiceConfig[]>([defaultService()]);

  const {
    selectedIdx,
    selectedType,
    selectedNetworkIdx,
    selectedVolumeIdx,
    selectService,
    selectNetwork,
    selectVolume,
  } = useSelectionState();

  const networkVolumeManager = useNetworkVolumeManager({
    initialNetworks: [],
    initialVolumes: [],
    setServices,
    onSelectionChange: (type, idx) => {
      if (type === "network") selectNetwork(idx);
      else if (type === "volume") selectVolume(idx);
      else selectService(idx);
    },
  });

  const {
    networks,
    volumes,
    addNetwork,
    bulkAddNetworks,
    updateNetwork,
    removeNetwork,
    addVolume,
    bulkAddVolumes,
    updateVolume,
    removeVolume,
  } = networkVolumeManager;

  const {
    vpnConfig,
    updateVpnType,
    updateTailscaleConfig,
    updateNewtConfig,
    updateCloudflaredConfig,
    updateWireguardConfig,
    updateZerotierConfig,
    updateNetbirdConfig,
    updateServicesUsingVpn,
    updateVpnNetworks,
  } = useVpnConfig();

  const { yaml, validationError, validationSuccess, validateAndReformat } =
    useYamlValidation({ services, networks, volumes, vpnConfig });

  const conversionDialog = useConversionDialog({
    services,
    selectedIdx,
    yaml,
    vpnConfig,
  });

  const templateStore = useTemplateStore();

  const routerState = useRouterState();
  // The global Header's Templates button dispatches this event; we listen here
  // so the marketplace modal opens regardless of which entry point was used.
  useMountEffect(() => {
    const handler = () => templateStore.setTemplateStoreOpen(true);
    window.addEventListener("dockdploy:open-templates", handler);

    if ((routerState.location.state as any)?.openTemplates) {
      handler();
      navigate({
        replace: true,
        state: (prev: any) => ({ ...prev, openTemplates: false }),
      } as any);
    }

    return () =>
      window.removeEventListener("dockdploy:open-templates", handler);
  });

  // ---------------- field mutation helpers ----------------

  function getNewServices(): [ServiceConfig[], number] | null {
    if (typeof selectedIdx !== "number") return null;
    return [[...services], selectedIdx];
  }

  const updateServiceField = useCallback(
    (field: keyof ServiceConfig, value: Any) => {
      const res = getNewServices();
      if (!res) return;
      const [next, idx] = res;
      (next[idx] as Any)[field] = value;
      setServices(next);
    },
    [selectedIdx, services],
  );

  const updatePortField = useCallback(
    (idx: number, field: "host" | "container" | "protocol", value: string) => {
      const res = getNewServices();
      if (!res) return;
      const [next, sel] = res;
      if (field === "protocol") {
        next[sel].ports[idx][field] = value;
      } else {
        next[sel].ports[idx][field] = value.replace(/[^0-9]/g, "");
      }
      setServices(next);
    },
    [selectedIdx, services],
  );
  const addPortField = useCallback(() => {
    const res = getNewServices();
    if (!res) return;
    const [next, sel] = res;
    next[sel].ports.push({ host: "", container: "", protocol: "none" });
    setServices(next);
  }, [selectedIdx, services]);
  const removePortField = useCallback(
    (idx: number) => {
      const res = getNewServices();
      if (!res) return;
      const [next, sel] = res;
      next[sel].ports.splice(idx, 1);
      setServices(next);
    },
    [selectedIdx, services],
  );

  const updateVolumeField = useCallback(
    (
      idx: number,
      field: "host" | "container" | "read_only",
      value: string | boolean,
    ) => {
      const res = getNewServices();
      if (!res) return;
      const [next, sel] = res;
      (next[sel].volumes[idx] as Any)[field] = value;
      setServices(next);
    },
    [selectedIdx, services],
  );
  const addVolumeField = useCallback(() => {
    const res = getNewServices();
    if (!res) return;
    const [next, sel] = res;
    next[sel].volumes.push({ host: "", container: "", read_only: false });
    setServices(next);
  }, [selectedIdx, services]);
  const removeVolumeField = useCallback(
    (idx: number) => {
      const res = getNewServices();
      if (!res) return;
      const [next, sel] = res;
      next[sel].volumes.splice(idx, 1);
      setServices(next);
    },
    [selectedIdx, services],
  );

  const updateListField = useCallback(
    (field: keyof ServiceConfig, idx: number, value: Any) => {
      const res = getNewServices();
      if (!res) return;
      const [next, sel] = res;
      (next[sel][field] as Any[])[idx] = value;
      setServices(next);
    },
    [selectedIdx, services],
  );
  const addListField = useCallback(
    (field: keyof ServiceConfig) => {
      const res = getNewServices();
      if (!res) return;
      const [next, sel] = res;
      if (field === "environment") {
        next[sel].environment.push({ key: "", value: "" });
      } else if (field === "labels") {
        if (!next[sel].labels) next[sel].labels = [];
        next[sel].labels!.push({ key: "", value: "" });
      } else {
        (next[sel][field] as Any[]).push("");
      }
      setServices(next);
    },
    [selectedIdx, services],
  );
  const removeListField = useCallback(
    (field: keyof ServiceConfig, idx: number) => {
      const res = getNewServices();
      if (!res) return;
      const [next, sel] = res;
      (next[sel][field] as Any[]).splice(idx, 1);
      setServices(next);
    },
    [selectedIdx, services],
  );

  const updateHealthcheckField = useCallback(
    (field: keyof Healthcheck, value: string) => {
      const res = getNewServices();
      if (!res) return;
      const [next, sel] = res;
      if (!next[sel].healthcheck) {
        next[sel].healthcheck = {
          test: "",
          interval: "",
          timeout: "",
          retries: "",
          start_period: "",
          start_interval: "",
        };
      }
      next[sel].healthcheck![field] = value;
      setServices(next);
    },
    [selectedIdx, services],
  );

  const updateResourceField = useCallback(
    (
      type: "limits" | "reservations",
      field: "cpus" | "memory",
      value: string,
    ) => {
      const res = getNewServices();
      if (!res) return;
      const [next, sel] = res;
      if (!next[sel].deploy) next[sel].deploy = { resources: {} };
      if (!next[sel].deploy!.resources) next[sel].deploy!.resources = {};
      if (!next[sel].deploy!.resources![type]) {
        next[sel].deploy!.resources![type] = {};
      }
      if (value.trim() === "") {
        delete (next[sel].deploy!.resources![type] as Any)[field];
      } else {
        (next[sel].deploy!.resources![type] as Any)[field] = value;
      }
      setServices(next);
    },
    [selectedIdx, services],
  );

  // String-array helpers (depends_on, security_opt, cap_add, cap_drop, devices, tmpfs)
  const stringArrayHelpers = (field: keyof ServiceConfig) => ({
    update: (idx: number, value: string) => {
      const res = getNewServices();
      if (!res) return;
      const [next, sel] = res;
      if (!(next[sel] as Any)[field]) (next[sel] as Any)[field] = [];
      ((next[sel] as Any)[field] as string[])[idx] = value;
      setServices(next);
    },
    add: () => {
      const res = getNewServices();
      if (!res) return;
      const [next, sel] = res;
      if (!(next[sel] as Any)[field]) (next[sel] as Any)[field] = [];
      ((next[sel] as Any)[field] as string[]).push("");
      setServices(next);
    },
    remove: (idx: number) => {
      const res = getNewServices();
      if (!res) return;
      const [next, sel] = res;
      ((next[sel] as Any)[field] as string[]).splice(idx, 1);
      setServices(next);
    },
  });

  const dependsOn = stringArrayHelpers("depends_on");
  const securityOpt = stringArrayHelpers("security_opt");
  const capAdd = stringArrayHelpers("cap_add");
  const capDrop = stringArrayHelpers("cap_drop");
  const devices = stringArrayHelpers("devices");
  const tmpfs = stringArrayHelpers("tmpfs");

  // Object-array helpers (sysctls, ulimits)
  const updateSysctl = useCallback(
    (idx: number, field: "key" | "value", value: string) => {
      const res = getNewServices();
      if (!res) return;
      const [next, sel] = res;
      if (!next[sel].sysctls) next[sel].sysctls = [];
      next[sel].sysctls![idx] = { ...next[sel].sysctls![idx], [field]: value };
      setServices(next);
    },
    [selectedIdx, services],
  );
  const addSysctl = useCallback(() => {
    const res = getNewServices();
    if (!res) return;
    const [next, sel] = res;
    if (!next[sel].sysctls) next[sel].sysctls = [];
    next[sel].sysctls!.push({ key: "", value: "" });
    setServices(next);
  }, [selectedIdx, services]);
  const removeSysctl = useCallback(
    (idx: number) => {
      const res = getNewServices();
      if (!res) return;
      const [next, sel] = res;
      next[sel].sysctls!.splice(idx, 1);
      setServices(next);
    },
    [selectedIdx, services],
  );

  const updateUlimit = useCallback(
    (idx: number, field: "name" | "soft" | "hard", value: string) => {
      const res = getNewServices();
      if (!res) return;
      const [next, sel] = res;
      if (!next[sel].ulimits) next[sel].ulimits = [];
      next[sel].ulimits![idx] = { ...next[sel].ulimits![idx], [field]: value };
      setServices(next);
    },
    [selectedIdx, services],
  );
  const addUlimit = useCallback(() => {
    const res = getNewServices();
    if (!res) return;
    const [next, sel] = res;
    if (!next[sel].ulimits) next[sel].ulimits = [];
    next[sel].ulimits!.push({ name: "", soft: "", hard: "" });
    setServices(next);
  }, [selectedIdx, services]);
  const removeUlimit = useCallback(
    (idx: number) => {
      const res = getNewServices();
      if (!res) return;
      const [next, sel] = res;
      next[sel].ulimits!.splice(idx, 1);
      setServices(next);
    },
    [selectedIdx, services],
  );

  // ---------------- service add/remove ----------------

  function addService() {
    const next = [...services, defaultService()];
    setServices(next);
    selectService(services.length);
  }

  function removeService(idx: number) {
    setServices((prev) => {
      if (idx < 0 || idx >= prev.length) return prev;
      const next = [...prev];
      next.splice(idx, 1);
      // Invariant: always keep at least one service so the ServiceForm has
      // something to render. Removing the last row replaces it with a fresh
      // unnamed default.
      if (next.length === 0) next.push(defaultService());
      return next;
    });

    if (selectedType === "service" && selectedIdx !== null) {
      if (selectedIdx === idx) {
        // Fall back to the previous row, or 0 when the deleted row was
        // replaced by a fresh default.
        selectService(Math.max(0, idx - 1));
      } else if (selectedIdx > idx) {
        selectService(selectedIdx - 1);
      }
    }
  }

  // ---------------- template import ----------------

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function importComposeService(svc: any, allNetworks: any, allVolumes: any) {
    const parsed = parseComposeService(svc, allNetworks, allVolumes);
    const filtered = services.filter((s) => s.name && s.name.trim() !== "");
    const idx = filtered.length;
    setServices((prev) => {
      const f = prev.filter((s) => s.name && s.name.trim() !== "");
      return [...f, parsed.service];
    });
    if (parsed.networks.length > 0) bulkAddNetworks(parsed.networks);
    if (parsed.volumes.length > 0) bulkAddVolumes(parsed.volumes);
    selectService(idx);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function importTemplate(template: any) {
    try {
      const parsed = parseComposeTemplate(template.composeContent);
      for (const svc of parsed.services) {
        importComposeService(svc, parsed.networks, parsed.volumes);
      }
      templateStore.setTemplateDetailOpen(false);
      templateStore.setTemplateStoreOpen(false);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      // eslint-disable-next-line no-console
      console.error("Error importing template:", error);
      throw new Error(`Failed to import template: ${msg}`, { cause: error });
    }
  }

  // ---------------- current selection ----------------

  const currentService =
    typeof selectedIdx === "number" && services[selectedIdx]
      ? services[selectedIdx]
      : services[0];

  const formApi: ServiceFormApi = {
    service: currentService,
    restartOptions: RESTART_OPTIONS,
    updateServiceField,
    updatePortField,
    addPortField,
    removePortField,
    updateVolumeField,
    addVolumeField,
    removeVolumeField,
    updateListField,
    addListField,
    removeListField,
    updateHealthcheckField,
    updateDependsOn: dependsOn.update,
    addDependsOn: dependsOn.add,
    removeDependsOn: dependsOn.remove,
    updateResourceField,
    updateSecurityOpt: securityOpt.update,
    addSecurityOpt: securityOpt.add,
    removeSecurityOpt: securityOpt.remove,
    updateCapAdd: capAdd.update,
    addCapAdd: capAdd.add,
    removeCapAdd: capAdd.remove,
    updateCapDrop: capDrop.update,
    addCapDrop: capDrop.add,
    removeCapDrop: capDrop.remove,
    updateSysctl,
    addSysctl,
    removeSysctl,
    updateDevice: devices.update,
    addDevice: devices.add,
    removeDevice: devices.remove,
    updateTmpfs: tmpfs.update,
    addTmpfs: tmpfs.add,
    removeTmpfs: tmpfs.remove,
    updateUlimit,
    addUlimit,
    removeUlimit,
  };

  const handleNav = (view: BuilderView) => {
    switch (view) {
      case "compose":
        return;
      case "config":
        navigate({ to: "/config-builder" });
        return;
      case "scheduler":
        navigate({ to: "/scheduler-builder" });
        return;
      case "blueprint":
        navigate({ to: "/blueprint-builder" });
        return;
    }
  };

  const showServiceForm = selectedType === "service";
  const showNetworkForm =
    selectedType === "network" &&
    selectedNetworkIdx !== null &&
    networks[selectedNetworkIdx];
  const showVolumeForm =
    selectedType === "volume" &&
    selectedVolumeIdx !== null &&
    volumes[selectedVolumeIdx];

  return (
    <div className="builder-shell">
      <SetupSidebar view="compose" onNav={handleNav} />

      <ConfigColumn
        services={services}
        networks={networks}
        volumes={volumes}
        vpn={vpnConfig}
        selectedIdx={
          selectedType === "service"
            ? selectedIdx
            : selectedType === "network"
              ? selectedNetworkIdx
              : selectedVolumeIdx
        }
        selectedType={selectedType}
        onSelectService={selectService}
        onAddService={addService}
        onBrowseTemplates={() => templateStore.setTemplateStoreOpen(true)}
        onRemoveService={removeService}
        onSelectNetwork={selectNetwork}
        onAddNetwork={addNetwork}
        onRemoveNetwork={removeNetwork}
        onSelectVolume={selectVolume}
        onAddVolume={addVolume}
        onRemoveVolume={removeVolume}
        vpnApi={{
          updateVpnType,
          updateTailscaleConfig,
          updateNewtConfig,
          updateCloudflaredConfig,
          updateWireguardConfig,
          updateZerotierConfig,
          updateNetbirdConfig,
          updateServicesUsingVpn,
          updateVpnNetworks,
          networks,
        }}
      />

      {showServiceForm ? (
        <ServiceForm api={formApi} />
      ) : showNetworkForm ? (
        <section className="service-col">
          <div className="col-head">
            <h2 className="col-head-title">
              <span className="col-bar" aria-hidden />
              Network Configuration
            </h2>
          </div>
          <div className="config-tab-body">
            <div className="svc-tab">
              <NetworkForm
                network={networks[selectedNetworkIdx!] as NetworkConfig}
                onUpdate={(field, value) =>
                  updateNetwork(selectedNetworkIdx!, field, value)
                }
              />
            </div>
          </div>
        </section>
      ) : showVolumeForm ? (
        <section className="service-col">
          <div className="col-head">
            <h2 className="col-head-title">
              <span className="col-bar" aria-hidden />
              Volume Configuration
            </h2>
          </div>
          <div className="config-tab-body">
            <div className="svc-tab">
              <VolumeForm
                volume={volumes[selectedVolumeIdx!] as VolumeConfig}
                onUpdate={(field, value) =>
                  updateVolume(selectedVolumeIdx!, field, value)
                }
              />
            </div>
          </div>
        </section>
      ) : (
        <section className="service-col empty-col">
          <div className="empty-card">
            <h3 className="display-sm">Nothing selected</h3>
            <p>Pick a service, network, or volume from the left.</p>
          </div>
        </section>
      )}

      <CodePanel
        yaml={yaml}
        services={services}
        networks={networks}
        volumes={volumes}
        vpn={vpnConfig}
        validationError={validationError}
        validationSuccess={validationSuccess}
        onValidate={validateAndReformat}
      />

      {templateStore.templateStoreOpen && (
        <TemplateStoreModal
          open={templateStore.templateStoreOpen}
          onOpenChange={templateStore.setTemplateStoreOpen}
          templates={templateStore.templates}
          loading={templateStore.templateLoading}
          error={templateStore.templateError}
          cacheTimestamp={templateStore.templateCacheTimestamp}
          onRefresh={templateStore.refreshTemplateStore}
          onTemplateSelect={async (template) => {
            try {
              const details = await templateStore.fetchTemplateDetails(
                template.id,
              );
              templateStore.setSelectedTemplate(details);
              templateStore.setTemplateDetailOpen(true);
            } catch (e) {
              // eslint-disable-next-line no-console
              console.error(e);
            }
          }}
        />
      )}

      {templateStore.selectedTemplate && (
        <TemplateDetailModal
          open={templateStore.templateDetailOpen}
          onOpenChange={(open) => {
            templateStore.setTemplateDetailOpen(open);
            if (!open) {
              templateStore.setSelectedTemplate(null);
              templateStore.setTemplateDetailTab("overview");
            }
          }}
          template={templateStore.selectedTemplate}
          onImport={importTemplate}
        />
      )}

      <ConversionDialog
        open={conversionDialog.conversionDialogOpen}
        onOpenChange={conversionDialog.setConversionDialogOpen}
        conversionType={conversionDialog.conversionType || ""}
        conversionOutput={conversionDialog.conversionOutput}
      />
    </div>
  );
}

