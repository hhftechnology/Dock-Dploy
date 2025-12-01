import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSelectionState } from "../../hooks/useSelectionState";
import { useVpnConfig } from "../../hooks/useVpnConfig";
import { useTemplateStore } from "../../hooks/useTemplateStore";
import { useYamlValidation } from "../../hooks/useYamlValidation";
import { useNetworkVolumeManager } from "../../hooks/useNetworkVolumeManager";
import { useEditorSize } from "../../hooks/useEditorSize";
import { ServiceListSidebar } from "../../components/compose-builder/ServiceListSidebar";
import { VpnConfigSection } from "../../components/compose-builder/VpnConfigSection";
import { NetworkForm } from "../../components/compose-builder/NetworkForm";
import { VolumeForm } from "../../components/compose-builder/VolumeForm";
import { ServiceForm } from "../../components/compose-builder/ServiceForm";
import { CodeEditor } from "../../components/CodeEditor";
import { SidebarUI } from "../../components/SidebarUI";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../../components/ui/dropdown-menu";
import { Checkbox } from "../../components/ui/checkbox";
import type {
  ServiceConfig,
  Healthcheck,
} from "../../types/compose";

// Re-export types (these are imported directly in export statement to avoid unused import warnings)
export type {
  ServiceConfig,
  NetworkConfig,
  VolumeConfig,
} from "../../types/compose";
export type { VPNConfig } from "../../types/vpn-configs";

import {
  defaultService,
} from "../../utils/default-configs";
import { redactSensitiveData } from "../../utils/validation";
import {
  parseComposeService,
  parseComposeTemplate,
} from "../../utils/template-import";
import { copyToClipboard, downloadFile } from "../../utils/clipboard";
import {
  convertToDockerRun,
  convertToSystemd,
  generateKomodoToml,
  generateEnvFile as generateEnvFileUtil,
} from "../../utils/converters";
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarTrigger,
} from "../../components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Alert, AlertTitle, AlertDescription } from "../../components/ui/alert";
import { Textarea } from "../../components/ui/textarea";
import {
  Download,
  CheckCircle2,
  AlertCircle,
  Copy,
  Settings,
} from "lucide-react";

function App() {
  const [services, setServices] = useState<ServiceConfig[]>([defaultService()]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const {
    selectedIdx,
    selectedType,
    selectedNetworkIdx,
    selectedVolumeIdx,
    selectService,
    selectNetwork,
    selectVolume,
  } = useSelectionState();

  // Network and Volume Management
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

  const { networks, volumes, addNetwork, bulkAddNetworks, updateNetwork, removeNetwork, addVolume, bulkAddVolumes, updateVolume, removeVolume } = networkVolumeManager;
  const {
    vpnConfig,
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
  } = useVpnConfig();
  const {
    yaml,
    validationError,
    validationSuccess,
    validateAndReformat,
  } = useYamlValidation({
    services,
    networks,
    volumes,
    vpnConfig,
  });

  // Editor size management
  const { codeFileRef, editorSize } = useEditorSize();

  // Conversion dialog state
  const [conversionDialogOpen, setConversionDialogOpen] = useState(false);
  const [conversionType, setConversionType] = useState<string>("");
  const [conversionOutput, setConversionOutput] = useState<string>("");
  const [clearEnvAfterDownload, setClearEnvAfterDownload] = useState(false);

  // Template store
  const templateStore = useTemplateStore();

  function handleConversion(type: string) {
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
          output = generateEnvFileUtil(services, vpnConfig);
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
  }



  // Helper to get new services array with selected service validation
  function getNewServices(): [ServiceConfig[], number] | null {
    if (typeof selectedIdx !== "number") return null;
    return [[...services], selectedIdx];
  }

  function updateServiceField(field: keyof ServiceConfig, value: any) {
    const result = getNewServices();
    if (!result) return;
    const [newServices, idx] = result;
    (newServices[idx] as any)[field] = value;
    setServices(newServices);
  }

  function updateListField(
    field: keyof ServiceConfig,
    idx: number,
    value: any
  ) {
    const result = getNewServices();
    if (!result) return;
    const [newServices, selectedIdx] = result;
    (newServices[selectedIdx][field] as any[])[idx] = value;
    setServices(newServices);
  }

  function addListField(field: keyof ServiceConfig) {
    const result = getNewServices();
    if (!result) return;
    const [newServices, idx] = result;
    if (field === "environment") {
      newServices[idx].environment.push({ key: "", value: "" });
    } else {
      (newServices[idx][field] as any[]).push("");
    }
    setServices(newServices);
  }

  function removeListField(field: keyof ServiceConfig, idx: number) {
    const result = getNewServices();
    if (!result) return;
    const [newServices, selectedIdx] = result;
    (newServices[selectedIdx][field] as any[]).splice(idx, 1);
    setServices(newServices);
  }

  // Generic helper for simple string array fields
  function updateStringArrayField(
    field: keyof ServiceConfig,
    idx: number,
    value: string
  ) {
    const result = getNewServices();
    if (!result) return;
    const [newServices, selectedIdx] = result;
    const service = newServices[selectedIdx];
    const arrayField = (service as any)[field] as string[] | undefined;
    if (!arrayField) {
      (service as any)[field] = [];
    }
    ((service as any)[field] as string[])[idx] = value;
    setServices(newServices);
  }

  function addStringArrayField(field: keyof ServiceConfig) {
    const result = getNewServices();
    if (!result) return;
    const [newServices, selectedIdx] = result;
    const service = newServices[selectedIdx];
    const arrayField = (service as any)[field] as string[] | undefined;
    if (!arrayField) {
      (service as any)[field] = [];
    }
    ((service as any)[field] as string[]).push("");
    setServices(newServices);
  }

  function removeStringArrayField(field: keyof ServiceConfig, idx: number) {
    const result = getNewServices();
    if (!result) return;
    const [newServices, selectedIdx] = result;
    const service = newServices[selectedIdx];
    const arrayField = (service as any)[field] as string[] | undefined;
    if (arrayField) {
      arrayField.splice(idx, 1);
      setServices(newServices);
    }
  }

  function addService() {
    const newServices = [...services, defaultService()];
    setServices(newServices);
    selectService(services.length);
  }
  function removeService(idx: number) {
    const newServices = services.filter((_, i) => i !== idx);
    // If removing the last service, add a new empty one
    const finalServices =
      newServices.length === 0 ? [defaultService()] : newServices;
    setServices(finalServices);
    const newSelectedIdx =
      typeof selectedIdx === "number"
        ? Math.max(
            0,
            Math.min(
              finalServices.length - 1,
              selectedIdx - (idx <= selectedIdx ? 1 : 0)
            )
          )
        : 0;
    selectService(newSelectedIdx);
  }

  function updatePortField(
    idx: number,
    field: "host" | "container" | "protocol",
    value: string
  ) {
    const result = getNewServices();
    if (!result) return;
    const [newServices, selectedIdx] = result;
    if (field === "protocol") {
      newServices[selectedIdx].ports[idx][field] = value;
    } else {
      newServices[selectedIdx].ports[idx][field] = value.replace(/[^0-9]/g, "");
    }
    setServices(newServices);
  }
  function addPortField() {
    const result = getNewServices();
    if (!result) return;
    const [newServices, selectedIdx] = result;
    newServices[selectedIdx].ports.push({
      host: "",
      container: "",
      protocol: "none",
    });
    setServices(newServices);
  }
  function removePortField(idx: number) {
    const result = getNewServices();
    if (!result) return;
    const [newServices, selectedIdx] = result;
    newServices[selectedIdx].ports.splice(idx, 1);
    setServices(newServices);
  }

  function updateVolumeField(
    idx: number,
    field: "host" | "container" | "read_only",
    value: string | boolean
  ) {
    const result = getNewServices();
    if (!result) return;
    const [newServices, selectedIdx] = result;
    (newServices[selectedIdx].volumes[idx] as any)[field] = value;
    setServices(newServices);
  }
  function addVolumeField() {
    const result = getNewServices();
    if (!result) return;
    const [newServices, selectedIdx] = result;
    newServices[selectedIdx].volumes.push({
      host: "",
      container: "",
      read_only: false,
    });
    setServices(newServices);
  }
  function removeVolumeField(idx: number) {
    const result = getNewServices();
    if (!result) return;
    const [newServices, selectedIdx] = result;
    newServices[selectedIdx].volumes.splice(idx, 1);
    setServices(newServices);
  }

  function updateHealthcheckField(field: keyof Healthcheck, value: string) {
    const result = getNewServices();
    if (!result) return;
    const [newServices, selectedIdx] = result;
    if (!newServices[selectedIdx].healthcheck)
      newServices[selectedIdx].healthcheck = {
        test: "",
        interval: "",
        timeout: "",
        retries: "",
        start_period: "",
        start_interval: "",
      };
    newServices[selectedIdx].healthcheck![field] = value;
    setServices(newServices);
  }

  // Use generic helpers for simple string array fields
  const updateDependsOn = (idx: number, value: string) =>
    updateStringArrayField("depends_on" as keyof ServiceConfig, idx, value);
  const addDependsOn = () =>
    addStringArrayField("depends_on" as keyof ServiceConfig);
  const removeDependsOn = (idx: number) =>
    removeStringArrayField("depends_on" as keyof ServiceConfig, idx);

  const updateSecurityOpt = (idx: number, value: string) =>
    updateStringArrayField("security_opt" as keyof ServiceConfig, idx, value);
  const addSecurityOpt = () =>
    addStringArrayField("security_opt" as keyof ServiceConfig);
  const removeSecurityOpt = (idx: number) =>
    removeStringArrayField("security_opt" as keyof ServiceConfig, idx);

  const updateCapAdd = (idx: number, value: string) =>
    updateStringArrayField("cap_add" as keyof ServiceConfig, idx, value);
  const addCapAdd = () => addStringArrayField("cap_add" as keyof ServiceConfig);
  const removeCapAdd = (idx: number) =>
    removeStringArrayField("cap_add" as keyof ServiceConfig, idx);

  const updateCapDrop = (idx: number, value: string) =>
    updateStringArrayField("cap_drop" as keyof ServiceConfig, idx, value);
  const addCapDrop = () =>
    addStringArrayField("cap_drop" as keyof ServiceConfig);
  const removeCapDrop = (idx: number) =>
    removeStringArrayField("cap_drop" as keyof ServiceConfig, idx);

  // Helper functions for sysctls (object array with key/value)
  function updateSysctl(idx: number, field: "key" | "value", value: string) {
    const result = getNewServices();
    if (!result) return;
    const [newServices, selectedIdx] = result;
    if (!newServices[selectedIdx].sysctls)
      newServices[selectedIdx].sysctls = [];
    newServices[selectedIdx].sysctls![idx] = {
      ...newServices[selectedIdx].sysctls![idx],
      [field]: value,
    };
    setServices(newServices);
  }
  function addSysctl() {
    const result = getNewServices();
    if (!result) return;
    const [newServices, selectedIdx] = result;
    if (!newServices[selectedIdx].sysctls)
      newServices[selectedIdx].sysctls = [];
    newServices[selectedIdx].sysctls!.push({ key: "", value: "" });
    setServices(newServices);
  }
  function removeSysctl(idx: number) {
    const result = getNewServices();
    if (!result) return;
    const [newServices, selectedIdx] = result;
    newServices[selectedIdx].sysctls!.splice(idx, 1);
    setServices(newServices);
  }

  // Use generic helpers for simple string array fields
  const updateDevice = (idx: number, value: string) =>
    updateStringArrayField("devices" as keyof ServiceConfig, idx, value);
  const addDevice = () => addStringArrayField("devices" as keyof ServiceConfig);
  const removeDevice = (idx: number) =>
    removeStringArrayField("devices" as keyof ServiceConfig, idx);

  const updateTmpfs = (idx: number, value: string) =>
    updateStringArrayField("tmpfs" as keyof ServiceConfig, idx, value);
  const addTmpfs = () => addStringArrayField("tmpfs" as keyof ServiceConfig);
  const removeTmpfs = (idx: number) =>
    removeStringArrayField("tmpfs" as keyof ServiceConfig, idx);

  // Helper functions for ulimits (object array with name/soft/hard)
  function updateUlimit(
    idx: number,
    field: "name" | "soft" | "hard",
    value: string
  ) {
    const result = getNewServices();
    if (!result) return;
    const [newServices, selectedIdx] = result;
    if (!newServices[selectedIdx].ulimits)
      newServices[selectedIdx].ulimits = [];
    newServices[selectedIdx].ulimits![idx] = {
      ...newServices[selectedIdx].ulimits![idx],
      [field]: value,
    };
    setServices(newServices);
  }
  function addUlimit() {
    const result = getNewServices();
    if (!result) return;
    const [newServices, selectedIdx] = result;
    if (!newServices[selectedIdx].ulimits)
      newServices[selectedIdx].ulimits = [];
    newServices[selectedIdx].ulimits!.push({ name: "", soft: "", hard: "" });
    setServices(newServices);
  }
  function removeUlimit(idx: number) {
    const result = getNewServices();
    if (!result) return;
    const [newServices, selectedIdx] = result;
    newServices[selectedIdx].ulimits!.splice(idx, 1);
    setServices(newServices);
  }

  function updateResourceField(
    type: "limits" | "reservations",
    field: "cpus" | "memory",
    value: string
  ) {
    const result = getNewServices();
    if (!result) return;
    const [newServices, selectedIdx] = result;
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
      if (
        Object.keys(newServices[selectedIdx].deploy!.resources![type]!)
          .length === 0
      ) {
        delete newServices[selectedIdx].deploy!.resources![type];
      }
      if (
        Object.keys(newServices[selectedIdx].deploy!.resources!).length === 0
      ) {
        delete newServices[selectedIdx].deploy!.resources;
        if (Object.keys(newServices[selectedIdx].deploy!).length === 0) {
          delete newServices[selectedIdx].deploy;
        }
      }
    } else {
      (newServices[selectedIdx].deploy!.resources![type] as any)[field] = value;
    }
    setServices(newServices);
  }

  // Network and volume functions are now provided by useNetworkVolumeManager hook

  // Template fetching functions

  function handleAddComposeServiceFull(
    svc: any,
    allNetworks: any,
    allVolumes: any
  ) {
    const parsed = parseComposeService(svc, allNetworks, allVolumes);

    // Calculate the new service index after filtering out unnamed services
    const currentServices = services;
    const filteredServices = currentServices.filter(
      (svc) => svc.name && svc.name.trim() !== ""
    );
    const newServiceIndex = filteredServices.length;

    setServices((prev) => {
      // Remove any unnamed services (empty name) when adding from marketplace
      const filtered = prev.filter((svc) => svc.name && svc.name.trim() !== "");
      const updated = [...filtered, parsed.service];
      return updated;
    });

    // Add parsed networks and volumes using bulk methods
    if (parsed.networks.length > 0) {
      bulkAddNetworks(parsed.networks);
    }

    if (parsed.volumes.length > 0) {
      bulkAddVolumes(parsed.volumes);
    }

    selectService(newServiceIndex);
  }

  async function importTemplate(template: any) {
    try {
      // Parse docker-compose.yml
      const { services: servicesArray, networks, volumes } =
        parseComposeTemplate(template.composeContent);

      // Add services one by one
      for (const service of servicesArray) {
        handleAddComposeServiceFull(service, networks, volumes);
      }

      // Close dialogs
      templateStore.setTemplateDetailOpen(false);
      templateStore.setTemplateStoreOpen(false);
    } catch (error: any) {
      console.error("Error importing template:", error);
      throw new Error(`Failed to import template: ${error.message}`);
    }
  }


  const svc =
    selectedIdx !== null &&
    typeof selectedIdx === "number" &&
    services[selectedIdx]
      ? services[selectedIdx]
      : services[0];

  const restartOptions = [
    { value: "", label: "None" },
    { value: "no", label: "no" },
    { value: "always", label: "always" },
    { value: "on-failure", label: "on-failure" },
    { value: "unless-stopped", label: "unless-stopped" },
  ];

  return (
    <>
    <SidebarProvider
        defaultOpen={true}
        className="h-[calc(100vh-4rem)]"
        style={{
          height: "calc(100vh - 4rem)",
          minHeight: 0,
          maxHeight: "calc(100vh - 4rem)",
        }}
      >
        <Sidebar collapsible="icon">
          <SidebarUI />
        </Sidebar>
        <SidebarInset className="relative h-full min-h-0 overflow-hidden">
          {/* 2-column layout: Left sidebar + Main content */}
          <div className="flex h-full min-h-0 w-full gap-0 overflow-hidden">
            <SidebarTrigger className="fixed top-20 left-4 z-50 lg:hidden" />

            {/* Floating Expand Button (visible when sidebar is collapsed on desktop) */}


            {/* Left Sidebar Column - Services, VPN, Networks, Volumes */}
            <aside className={`flex-shrink-0 h-full border-r border-border/50 flex flex-col overflow-hidden bg-card transition-all duration-300 ${
              sidebarCollapsed ? 'w-0 lg:w-0' : 'w-full lg:w-80'
            }`}>
              {/* Collapse Button */}
              <div className={`flex items-center justify-between h-14 px-4 border-b border-border/50 bg-card ${sidebarCollapsed ? 'hidden' : ''}`}>
                <h2 className="font-semibold text-base text-foreground flex items-center gap-2">
                  <div className="h-5 w-1 bg-primary rounded-full"></div>
                  Configuration
                </h2>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="h-8 w-8 hover:bg-primary/10 flex-shrink-0"
                  title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  <svg
                    className={`h-4 w-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M15 19l-7-7 7-7" />
                  </svg>
                </Button>
              </div>

              {/* Services Section */}
              <div className="flex-shrink-0 border-b border-border/50">
                <ServiceListSidebar
                  services={services}
                  selectedIdx={selectedIdx}
                  selectedType={selectedType}
                  onSelectService={(idx) => {
                    selectService(idx);
                  }}
                  onAddService={() => {
                    selectService(services.length);
                    addService();
                  }}
                  onRemoveService={removeService}
                  templateStore={templateStore}
                />
              </div>

              {/* VPN, Networks & Volumes Section */}
              <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-4">
                {/* VPN Configuration */}
                <VpnConfigSection
                  vpnConfig={vpnConfig}
                  vpnConfigOpen={vpnConfigOpen}
                  setVpnConfigOpen={setVpnConfigOpen}
                  updateVpnType={updateVpnType}
                  updateTailscaleConfig={updateTailscaleConfig}
                  updateNewtConfig={updateNewtConfig}
                  updateCloudflaredConfig={updateCloudflaredConfig}
                  updateWireguardConfig={updateWireguardConfig}
                  updateZerotierConfig={updateZerotierConfig}
                  updateNetbirdConfig={updateNetbirdConfig}
                  updateServicesUsingVpn={updateServicesUsingVpn}
                  updateVpnNetworks={updateVpnNetworks}
                  services={services}
                  networks={networks}
                />

                {/* Networks Management */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-foreground/90">Networks</h3>
                    <Button size="sm" variant="outline" onClick={addNetwork} className="h-7 text-xs">
                      + Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {networks.map((n, idx) => (
                      <Card
                        key={idx}
                        className={`relative p-2.5 pr-8 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50 ${
                          selectedType === "network" && selectedNetworkIdx === idx
                            ? "border-primary border-2 bg-primary/5 shadow-sm"
                            : "border-border hover:bg-accent/50"
                        }`}
                        onClick={() => {
                          selectNetwork(idx);
                        }}
                      >
                        <div className="flex flex-col items-start">
                          <div className="font-medium text-sm text-left truncate w-full pr-6">
                            {n.name || (
                              <span className="text-muted-foreground italic">
                                (unnamed network)
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground text-left truncate w-full">
                            {n.driver || <span className="italic">no driver</span>}
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNetwork(idx);
                          }}
                          className="absolute top-0.5 right-0.5 h-6 w-6 hover:bg-destructive/20 hover:text-destructive transition-colors"
                        >
                        <svg
                          width="16"
                          height="16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                        </Button>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Volumes Management */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-foreground/90">Volumes</h3>
                    <Button size="sm" variant="outline" onClick={addVolume} className="h-7 text-xs">
                      + Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {volumes.map((v, idx) => (
                      <Card
                        key={idx}
                        className={`relative p-2.5 pr-8 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50 ${
                          selectedType === "volume" && selectedVolumeIdx === idx
                            ? "border-primary border-2 bg-primary/5 shadow-sm"
                            : "border-border hover:bg-accent/50"
                        }`}
                        onClick={() => {
                          selectVolume(idx);
                        }}
                      >
                        <div className="flex flex-col items-start">
                          <div className="font-medium text-sm text-left truncate w-full pr-6">
                            {v.name || (
                              <span className="text-muted-foreground italic">
                                (unnamed volume)
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground text-left truncate w-full">
                            {v.driver || <span className="italic">no driver</span>}
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeVolume(idx);
                          }}
                          className="absolute top-0.5 right-0.5 h-6 w-6 hover:bg-destructive/20 hover:text-destructive transition-colors"
                        >
                        <svg
                          width="16"
                          height="16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                        </Button>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* Floating Expand Button (when sidebar is collapsed) */}
            {sidebarCollapsed && (
              <div className="absolute left-0 top-20 z-40 flex items-center">
                <Button
                  onClick={() => setSidebarCollapsed(false)}
                  className="h-24 w-7 rounded-l-none rounded-r-lg shadow-lg hover:w-9 transition-all flex items-center justify-center p-0 bg-primary hover:bg-primary/90"
                  title="Expand sidebar"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
            )}

            {/* Main Content Area - Configuration Forms and YAML Preview */}
            <div className="flex-1 flex flex-col lg:flex-row h-full min-h-0 overflow-hidden">
              {/* Configuration Form */}
              <section className="flex-1 h-full min-h-0 p-4 lg:p-6 flex flex-col gap-4 bg-background overflow-y-auto border-r border-border/50">
              {selectedType === "service" && (
                <ServiceForm
                  service={svc}
                  restartOptions={restartOptions}
                  selectedIdx={selectedIdx}
                  services={services}
                  setServices={setServices}
                  updateServiceField={updateServiceField}
                  updatePortField={updatePortField}
                  addPortField={addPortField}
                  removePortField={removePortField}
                  updateListField={updateListField}
                  addListField={addListField}
                  removeListField={removeListField}
                  updateVolumeField={updateVolumeField}
                  addVolumeField={addVolumeField}
                  removeVolumeField={removeVolumeField}
                  updateHealthcheckField={updateHealthcheckField}
                  updateDependsOn={updateDependsOn}
                  addDependsOn={addDependsOn}
                  removeDependsOn={removeDependsOn}
                  updateResourceField={updateResourceField}
                  updateSecurityOpt={updateSecurityOpt}
                  addSecurityOpt={addSecurityOpt}
                  removeSecurityOpt={removeSecurityOpt}
                  updateCapAdd={updateCapAdd}
                  addCapAdd={addCapAdd}
                  removeCapAdd={removeCapAdd}
                  updateCapDrop={updateCapDrop}
                  addCapDrop={addCapDrop}
                  removeCapDrop={removeCapDrop}
                  updateSysctl={updateSysctl}
                  addSysctl={addSysctl}
                  removeSysctl={removeSysctl}
                  updateDevice={updateDevice}
                  addDevice={addDevice}
                  removeDevice={removeDevice}
                  updateTmpfs={updateTmpfs}
                  addTmpfs={addTmpfs}
                  removeTmpfs={removeTmpfs}
                  updateUlimit={updateUlimit}
                  addUlimit={addUlimit}
                  removeUlimit={removeUlimit}
                />
              )}

              {selectedType === "network" && selectedNetworkIdx !== null && (
                <NetworkForm
                  network={networks[selectedNetworkIdx]}
                  onUpdate={(field, value) =>
                    updateNetwork(selectedNetworkIdx, field, value)
                  }
                />
              )}

              {selectedType === "volume" && selectedVolumeIdx !== null && (
                <VolumeForm
                  volume={volumes[selectedVolumeIdx]}
                  onUpdate={(field, value) =>
                    updateVolume(selectedVolumeIdx, field, value)
                  }
                />
              )}
              </section>

              {/* Docker Compose Preview */}
              <section className="flex-shrink-0 lg:flex-1 h-[40vh] lg:h-full flex flex-col bg-card/30 p-4 lg:p-6 overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-1 bg-primary rounded-full"></div>
                  <h2 className="font-bold text-lg text-foreground">
                    Docker Compose
                  </h2>
                </div>
                <div className="flex items-center gap-2 flex-wrap">{validationError && (
                    <Alert variant="destructive" className="py-1.5 px-3 text-xs inline-flex items-center gap-1.5 w-auto">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <AlertTitle className="text-xs m-0">
                        {validationError}
                      </AlertTitle>
                    </Alert>
                  )}
                  {validationSuccess && (
                    <Alert className="py-1.5 px-3 text-xs bg-green-500/10 border-green-500/30 inline-flex items-center gap-1.5 w-auto">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      <AlertTitle className="text-xs text-green-600 dark:text-green-400 m-0">
                        Valid
                      </AlertTitle>
                    </Alert>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={validateAndReformat}
                    className="shadow-sm hover:shadow-md transition-all"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Validate & Reformat
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline" className="shadow-sm hover:shadow-md transition-all">
                        <Settings className="h-4 w-4 mr-1" />
                        Convert
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={() => handleConversion("docker-run")}
                      >
                        To Docker Run
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleConversion("systemd")}
                      >
                        To Systemd Service
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleConversion("env")}>
                        Generate .env File
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleConversion("redact")}
                      >
                        Redact Sensitive Data
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleConversion("komodo")}
                      >
                        Generate Komodo .toml (from Portainer)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div
                ref={codeFileRef}
                className="flex-1 w-full h-full min-h-[200px] lg:min-h-[400px] min-w-0 overflow-hidden rounded-lg border border-border/50 shadow-inner bg-sidebar"
              >
                {editorSize.width > 0 && editorSize.height > 0 && (
                  <CodeEditor
                    content={yaml}
                    onContentChange={() => {}}
                    width={editorSize.width}
                    height={editorSize.height}
                  />
                )}
              </div>
              </section>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* Conversion Dialog */}
      <Dialog
        open={conversionDialogOpen}
        onOpenChange={(open) => {
          setConversionDialogOpen(open);
          if (!open) {
            setClearEnvAfterDownload(false);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {conversionType === "docker-run" && "Docker Run Command"}
              {conversionType === "systemd" && "Systemd Service File"}
              {conversionType === "env" && ".env File"}
              {conversionType === "redact" && "Redacted Compose File"}
              {conversionType === "komodo" && "Komodo .toml Configuration"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {conversionType === "env" && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="text-xs font-semibold">
                  Privacy Notice
                </AlertTitle>
                <AlertDescription className="text-xs">
                  All information stays in your browser and is never sent to any
                  server. After downloading, you can optionally clear all
                  environment variables from the form below.
                </AlertDescription>
              </Alert>
            )}
            <div className="relative">
              <Textarea
                value={conversionOutput}
                readOnly
                className="font-mono text-sm min-h-[300px]"
              />
            </div>
            {conversionType === "env" && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="clear-env-after-download"
                  checked={clearEnvAfterDownload}
                  onCheckedChange={(checked) =>
                    setClearEnvAfterDownload(checked === true)
                  }
                />
                <Label
                  htmlFor="clear-env-after-download"
                  className="text-sm font-normal cursor-pointer"
                >
                  Clear all environment variables from the form after download
                </Label>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => copyToClipboard(conversionOutput)}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const filename =
                    conversionType === "docker-run"
                      ? "docker-run.sh"
                      : conversionType === "systemd"
                        ? "service.service"
                        : conversionType === "env"
                          ? ".env"
                          : conversionType === "komodo"
                            ? "komodo.toml"
                            : "compose-redacted.yml";
                  const mimeType =
                    conversionType === "systemd"
                      ? "text/plain"
                      : conversionType === "env"
                        ? "text/plain"
                        : conversionType === "komodo"
                          ? "text/plain"
                          : "text/yaml";
                  downloadFile(conversionOutput, filename, mimeType);

                  // Clear environment variables if checkbox is checked and it's an .env file
                  if (conversionType === "env" && clearEnvAfterDownload) {
                    const newServices = services.map((svc) => ({
                      ...svc,
                      environment: [],
                    }));
                    setServices(newServices);
                    setClearEnvAfterDownload(false);
                  }
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Detail Dialog */}
      <Dialog
        open={templateStore.templateDetailOpen}
        onOpenChange={(open) => {
          templateStore.setTemplateDetailOpen(open);
          if (!open) {
            templateStore.setSelectedTemplate(null);
            templateStore.setTemplateDetailTab("overview");
          }
        }}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-2xl md:max-w-4xl lg:max-w-5xl max-h-[95vh] sm:max-h-[90vh] flex flex-col p-4 sm:p-6">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>
              {templateStore.selectedTemplate?.name || "Template Details"}
            </DialogTitle>
          </DialogHeader>
          {templateStore.selectedTemplate && (
            <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-hidden">
              {/* Tab Buttons */}
              <div className="flex gap-2 sm:gap-3 border-b pb-2 flex-shrink-0">
                <Button
                  variant={
                    templateStore.templateDetailTab === "overview" ? "default" : "ghost"
                  }
                  size="sm"
                  className="text-xs sm:text-sm"
                  onClick={() => templateStore.setTemplateDetailTab("overview")}
                >
                  Overview
                </Button>
                <Button
                  variant={
                    templateStore.templateDetailTab === "compose" ? "default" : "ghost"
                  }
                  size="sm"
                  className="text-xs sm:text-sm"
                  onClick={() => templateStore.setTemplateDetailTab("compose")}
                >
                  Docker Compose
                </Button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 min-h-0 overflow-auto">
                {templateStore.templateDetailTab === "overview" && (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                      {templateStore.selectedTemplate.logoUrl && (
                        <img
                          src={templateStore.selectedTemplate.logoUrl}
                          alt={templateStore.selectedTemplate.name}
                          className="w-12 h-12 sm:w-16 sm:h-16 object-contain flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg sm:text-xl font-bold break-words">
                          {templateStore.selectedTemplate.name}
                        </h3>
                        {templateStore.selectedTemplate.version && (
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Version {templateStore.selectedTemplate.version}
                          </p>
                        )}
                        <p className="text-xs sm:text-sm text-muted-foreground mt-2 break-words">
                          {templateStore.selectedTemplate.description}
                        </p>
                        {templateStore.selectedTemplate.tags &&
                          templateStore.selectedTemplate.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {templateStore.selectedTemplate.tags.map((tag: string) => (
                                <span
                                  key={tag}
                                  className="px-2 py-1 text-xs bg-primary/10 text-primary rounded border border-primary/20"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        {templateStore.selectedTemplate.links && (
                          <div className="flex flex-wrap gap-3 sm:gap-4 mt-4">
                            {templateStore.selectedTemplate.links.github && (
                              <a
                                href={templateStore.selectedTemplate.links.github}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs sm:text-sm text-primary hover:underline"
                              >
                                GitHub
                              </a>
                            )}
                            {templateStore.selectedTemplate.links.website && (
                              <a
                                href={templateStore.selectedTemplate.links.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs sm:text-sm text-primary hover:underline"
                              >
                                Website
                              </a>
                            )}
                            {templateStore.selectedTemplate.links.docs && (
                              <a
                                href={templateStore.selectedTemplate.links.docs}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs sm:text-sm text-primary hover:underline"
                              >
                                Docs
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {templateStore.templateDetailTab === "compose" && (
                  <div className="flex flex-col gap-3 sm:gap-4 h-full min-h-0">
                    {templateStore.selectedTemplate.composeContent ? (
                      <>
                        <div className="border rounded-lg overflow-hidden flex-1 min-h-[300px] sm:min-h-[400px] flex flex-col">
                          <CodeEditor
                            content={templateStore.selectedTemplate.composeContent}
                            onContentChange={() => {}}
                            width="100%"
                            height="100%"
                          />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end pt-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto"
                            onClick={() => {
                              copyToClipboard(templateStore.selectedTemplate.composeContent);
                            }}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Compose
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto"
                            onClick={() => {
                              downloadFile(
                                templateStore.selectedTemplate.composeContent,
                                "docker-compose.yml",
                                "text/yaml"
                              );
                            }}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        Docker Compose content not available
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Import Button */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end border-t pt-4 mt-auto flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    templateStore.setTemplateDetailOpen(false);
                    templateStore.setTemplateStoreOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={async () => {
                    try {
                      await importTemplate(templateStore.selectedTemplate);
                      templateStore.setTemplateDetailOpen(false);
                      templateStore.setTemplateStoreOpen(false);
                    } catch (error: any) {
                      templateStore.setTemplateError(
                        `Failed to import template: ${error.message}`
                      );
                    }
                  }}
                >
                  Import Template
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export const Route = createFileRoute("/docker/compose-builder")({
  component: App,
});
