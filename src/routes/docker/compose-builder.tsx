import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CodeEditor } from "../../components/CodeEditor";
import { SidebarUI } from "../../components/SidebarUI";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Separator } from "../../components/ui/separator";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "../../components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../../components/ui/dropdown-menu";
import { Toggle } from "../../components/ui/toggle";
import { Checkbox } from "../../components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import jsyaml from "js-yaml";
import type {
  ServiceConfig,
  NetworkConfig,
  VolumeConfig,
  Healthcheck,
} from "../../types/compose";
import type { VPNConfig } from "../../types/vpn-configs";
import {
  defaultService,
  defaultNetwork,
  defaultVolume,
  defaultVPNConfig,
  defaultTailscaleConfig,
  defaultNewtConfig,
  defaultCloudflaredConfig,
  defaultWireguardConfig,
  defaultZerotierConfig,
  defaultNetbirdConfig,
} from "../../utils/default-configs";
import { generateYaml } from "../../utils/yaml-generator";
import { validateServices, redactSensitiveData } from "../../utils/validation";
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
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "../../components/ui/tooltip";
import { Textarea } from "../../components/ui/textarea";
import {
  Download,
  CheckCircle2,
  AlertCircle,
  Copy,
  Settings,
  Shield,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

// Re-export types
export type {
  ServiceConfig,
  NetworkConfig,
  VolumeConfig,
} from "../../types/compose";
export type { VPNConfig } from "../../types/vpn-configs";

function App() {
  const [services, setServices] = useState<ServiceConfig[]>([defaultService()]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(0);
  const [selectedType, setSelectedType] = useState<
    "service" | "network" | "volume"
  >("service");
  const [selectedNetworkIdx, setSelectedNetworkIdx] = useState<null | number>(
    null
  );
  const [selectedVolumeIdx, setSelectedVolumeIdx] = useState<null | number>(
    null
  );
  const [yaml, setYaml] = useState("");
  const [networks, setNetworks] = useState<NetworkConfig[]>([]);
  const [volumes, setVolumes] = useState<VolumeConfig[]>([]);
  const [vpnConfig, setVpnConfig] = useState<VPNConfig>(defaultVPNConfig());
  const [vpnConfigOpen, setVpnConfigOpen] = useState(false);
  const codeFileRef = useRef<HTMLDivElement>(null);
  const [editorSize, setEditorSize] = useState({ width: 0, height: 0 });
  const [conversionDialogOpen, setConversionDialogOpen] = useState(false);
  const [conversionType, setConversionType] = useState<string>("");
  const [conversionOutput, setConversionOutput] = useState<string>("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationSuccess, setValidationSuccess] = useState(false);
  const [clearEnvAfterDownload, setClearEnvAfterDownload] = useState(false);
  // Template store state
  const [templateStoreOpen, setTemplateStoreOpen] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [templateSearch, setTemplateSearch] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [templateDetailOpen, setTemplateDetailOpen] = useState(false);
  const [templateDetailTab, setTemplateDetailTab] = useState<
    "overview" | "compose"
  >("overview");
  const [templateCache, setTemplateCache] = useState<any[]>(() => {
    const cached = localStorage.getItem("templateStoreCache");
    return cached ? JSON.parse(cached) : [];
  });
  const [templateCacheTimestamp, setTemplateCacheTimestamp] = useState<
    number | null
  >(() => {
    const cached = localStorage.getItem("templateStoreCacheTimestamp");
    return cached ? parseInt(cached) : null;
  });

  useLayoutEffect(() => {
    if (!codeFileRef.current) return;
    const handleResize = () => {
      const rect = codeFileRef.current?.getBoundingClientRect();
      if (rect) {
        // Ensure minimum dimensions for small screens
        setEditorSize({
          width: Math.max(rect.width, 300),
          height: Math.max(rect.height, 200),
        });
      }
    };
    handleResize();
    const ro = new window.ResizeObserver(handleResize);
    ro.observe(codeFileRef.current);

    // Also listen to window resize for better responsiveness
    window.addEventListener("resize", handleResize);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, [codeFileRef]);

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

  // Validation and reformatting
  function validateAndReformat() {
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
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  function downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    setYaml(
      generateYaml(services, networks, volumes, vpnConfig || defaultVPNConfig())
    );
  }, [services, networks, volumes, vpnConfig]);

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
    setSelectedIdx(services.length);
    setSelectedType("service");
    setSelectedNetworkIdx(null);
    setSelectedVolumeIdx(null);
  }
  function removeService(idx: number) {
    const newServices = services.filter((_, i) => i !== idx);
    // If removing the last service, add a new empty one
    const finalServices =
      newServices.length === 0 ? [defaultService()] : newServices;
    setServices(finalServices);
    setSelectedIdx(
      typeof selectedIdx === "number"
        ? Math.max(
            0,
            Math.min(
              finalServices.length - 1,
              selectedIdx - (idx <= selectedIdx ? 1 : 0)
            )
          )
        : 0
    );
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

  function addNetwork() {
    const newNetworks = [...networks, defaultNetwork()];
    setNetworks(newNetworks);
    setSelectedType("network");
    setSelectedNetworkIdx(newNetworks.length - 1);
    setSelectedIdx(null);
    setSelectedVolumeIdx(null);
  }
  function updateNetwork(idx: number, field: keyof NetworkConfig, value: any) {
    const newNetworks = [...networks];
    if (field === "name") {
      const oldName = newNetworks[idx].name;
      newNetworks[idx][field] = value;
      setNetworks(newNetworks);
      setServices((prev) => {
        const newSvcs = prev.map((svc) => ({
          ...svc,
          networks: svc.networks?.map((n) => (n === oldName ? value : n)) || [],
        }));
        return newSvcs;
      });
      return;
    }
    (newNetworks[idx] as any)[field] = value;
    setNetworks(newNetworks);
  }
  function removeNetwork(idx: number) {
    const newNetworks = [...networks];
    const removedName = newNetworks[idx].name;
    newNetworks.splice(idx, 1);
    setNetworks(newNetworks);
    const newServices = services.map((svc) => ({
      ...svc,
      networks: svc.networks?.filter((n) => n !== removedName) || [],
    }));
    setServices(newServices);
    if (newNetworks.length === 0) {
      setSelectedType("service");
      setSelectedNetworkIdx(null);
    } else {
      setSelectedNetworkIdx(0);
    }
  }
  function addVolume() {
    const newVolumes = [...volumes, defaultVolume()];
    setVolumes(newVolumes);
    setSelectedType("volume");
    setSelectedVolumeIdx(newVolumes.length - 1);
    setSelectedIdx(null);
    setSelectedNetworkIdx(null);
  }
  function updateVolume(idx: number, field: keyof VolumeConfig, value: any) {
    const newVolumes = [...volumes];
    if (field === "name") {
      const oldName = newVolumes[idx].name;
      newVolumes[idx][field] = value;
      setVolumes(newVolumes);
      setServices((prev) => {
        const newSvcs = prev.map((svc) => ({
          ...svc,
          volumes:
            svc.volumes?.map((v) =>
              v.host === oldName ? { ...v, host: value } : v
            ) || [],
        }));
        return newSvcs;
      });
      return;
    }
    (newVolumes[idx] as any)[field] = value;
    setVolumes(newVolumes);
  }
  function removeVolume(idx: number) {
    const newVolumes = [...volumes];
    const removedName = newVolumes[idx].name;
    newVolumes.splice(idx, 1);
    setVolumes(newVolumes);
    const newServices = services.map((svc) => ({
      ...svc,
      volumes: svc.volumes?.filter((v) => v.host !== removedName) || [],
    }));
    setServices(newServices);
    if (newVolumes.length === 0) {
      setSelectedType("service");
      setSelectedVolumeIdx(null);
    } else {
      setSelectedVolumeIdx(0);
    }
  }

  // Template fetching functions
  async function fetchTemplatesFromGitHub(backgroundUpdate: boolean = false) {
    if (!backgroundUpdate) {
      setTemplateLoading(true);
      setTemplateError(null);
    }

    const GITHUB_OWNER = "hhftechnology";
    const GITHUB_REPO = "Market";
    const GITHUB_BRANCH = "main";
    const GITHUB_RAW_BASE = "https://raw.githubusercontent.com";

    try {
      // Fetch meta.json
      const metaUrl = `${GITHUB_RAW_BASE}/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/meta.json`;
      const metaResponse = await fetch(metaUrl);

      if (!metaResponse.ok) {
        throw new Error(
          `Failed to fetch templates: ${metaResponse.statusText}`
        );
      }

      const templatesMeta: any[] = await metaResponse.json();

      // Store templates with metadata
      setTemplates(templatesMeta);
      setTemplateCache(templatesMeta);
      setTemplateCacheTimestamp(Date.now());
      localStorage.setItem("templateStoreCache", JSON.stringify(templatesMeta));
      localStorage.setItem("templateStoreCacheTimestamp", String(Date.now()));

      if (!backgroundUpdate) {
        setTemplateLoading(false);
      }
    } catch (error: any) {
      console.error("Error fetching templates:", error);
      if (!backgroundUpdate) {
        setTemplateLoading(false);
        setTemplateError(error.message || "Failed to load templates");
      }
    }
  }

  // Fetch template details (compose, template.toml, logo)
  async function fetchTemplateDetails(templateId: string): Promise<any> {
    const GITHUB_OWNER = "hhftechnology";
    const GITHUB_REPO = "Marketplace";
    const GITHUB_BRANCH = "main";
    const GITHUB_RAW_BASE = "https://raw.githubusercontent.com";

    const template = templates.find((t) => t.id === templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    try {
      const basePath = `compose-files/${templateId}`;

      // Fetch docker-compose.yml
      const composeUrl = `${GITHUB_RAW_BASE}/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${basePath}/docker-compose.yml`;
      const composeResponse = await fetch(composeUrl);
      if (!composeResponse.ok) {
        throw new Error(
          `Failed to fetch docker-compose.yml: ${composeResponse.statusText}`
        );
      }
      const composeContent = await composeResponse.text();

      // Fetch template.toml
      let templateTomlContent = null;
      let parsedTemplate = null;
      try {
        const tomlUrl = `${GITHUB_RAW_BASE}/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${basePath}/template.toml`;
        const tomlResponse = await fetch(tomlUrl);
        if (tomlResponse.ok) {
          templateTomlContent = await tomlResponse.text();
          const { parseTemplateToml } = await import(
            "../../utils/template-parser"
          );
          parsedTemplate = parseTemplateToml(templateTomlContent);
        }
      } catch (e) {
        console.warn(`Template ${templateId} has no template.toml file`);
      }

      // Build logo URL if logo exists
      let logoUrl = null;
      if (template.logo) {
        logoUrl = `${GITHUB_RAW_BASE}/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${basePath}/${template.logo}`;
      }

      return {
        ...template,
        composeContent,
        templateTomlContent,
        parsedTemplate,
        logoUrl,
      };
    } catch (error: any) {
      console.error(
        `Error fetching template details for ${templateId}:`,
        error
      );
      throw error;
    }
  }

  // Initialize templates when store opens
  useEffect(() => {
    if (!templateStoreOpen) return;

    const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
    const now = Date.now();

    // Check if we have valid cached data
    if (
      templateCache.length > 0 &&
      templateCacheTimestamp &&
      now - templateCacheTimestamp < CACHE_DURATION
    ) {
      setTemplates(templateCache);
      setTemplateLoading(false);
      setTemplateError(null);

      // Still check for updates in the background
      fetchTemplatesFromGitHub(true);
      return;
    }

    fetchTemplatesFromGitHub(false);
  }, [templateStoreOpen, templateCache, templateCacheTimestamp]);

  function refreshTemplateStore() {
    setTemplateCache([]);
    setTemplateCacheTimestamp(null);
    localStorage.removeItem("templateStoreCache");
    localStorage.removeItem("templateStoreCacheTimestamp");
    fetchTemplatesFromGitHub(false);
  }

  function handleAddComposeServiceFull(
    svc: any,
    allNetworks: any,
    allVolumes: any
  ) {
    const serviceData = svc.rawService || {};

    const actualServiceData = serviceData.rawService || serviceData;

    const parseCommandArray = (cmd: any): string => {
      if (Array.isArray(cmd)) {
        return JSON.stringify(cmd);
      }
      return cmd || "";
    };

    const newService: ServiceConfig = {
      ...defaultService(),
      name: svc.name,
      image: svc.image,
      container_name: actualServiceData.container_name || "",
      command: parseCommandArray(actualServiceData.command),
      restart: actualServiceData.restart || "",
      ports: Array.isArray(actualServiceData.ports)
        ? actualServiceData.ports.map((p: string) => {
            // Handle format: "host:container/protocol" or "container/protocol" or just "container"
            if (p.includes(":")) {
              const parts = p.split(":");
              const host = parts[0];
              const containerWithProtocol = parts[1] || "";
              const [container, protocol] = containerWithProtocol.split("/");
              return {
                host,
                container,
                protocol: protocol || "none",
              };
            } else {
              // No colon means it's just a container port, possibly with protocol
              const [container, protocol] = p.split("/");
              return {
                host: "",
                container,
                protocol: protocol || "none",
              };
            }
          })
        : [],
      expose: Array.isArray(actualServiceData.expose)
        ? actualServiceData.expose
        : actualServiceData.expose
          ? [String(actualServiceData.expose)]
          : [],
      volumes: Array.isArray(actualServiceData.volumes)
        ? actualServiceData.volumes.map((v: any) => {
            if (typeof v === "string") {
              const parts = v.split(":");
              const host = parts[0];
              const container = parts[1] || "";
              const read_only = parts[2] === "ro";
              return { host, container, read_only };
            } else if (typeof v === "object" && v !== null) {
              return {
                host: v.source || "",
                container: v.target || "",
                read_only: v.read_only || false,
              };
            }
            return { host: "", container: "", read_only: false };
          })
        : [],
      volumes_syntax:
        Array.isArray(actualServiceData.volumes) &&
        actualServiceData.volumes.length > 0 &&
        typeof actualServiceData.volumes[0] === "object"
          ? "dict"
          : "array",
      environment: Array.isArray(actualServiceData.environment)
        ? actualServiceData.environment.map((e: string) => {
            const [key, ...rest] = e.split("=");
            return { key, value: rest.join("=") };
          })
        : actualServiceData.environment &&
            typeof actualServiceData.environment === "object"
          ? Object.entries(actualServiceData.environment).map(
              ([key, value]: [string, any]) => ({ key, value: String(value) })
            )
          : [],
      environment_syntax: Array.isArray(actualServiceData.environment)
        ? "array"
        : "dict",
      healthcheck: actualServiceData.healthcheck
        ? {
            test: parseCommandArray(actualServiceData.healthcheck.test),
            interval: actualServiceData.healthcheck.interval || "",
            timeout: actualServiceData.healthcheck.timeout || "",
            retries: actualServiceData.healthcheck.retries
              ? String(actualServiceData.healthcheck.retries)
              : "",
            start_period: actualServiceData.healthcheck.start_period || "",
            start_interval: actualServiceData.healthcheck.start_interval || "",
          }
        : undefined,
      depends_on: Array.isArray(actualServiceData.depends_on)
        ? actualServiceData.depends_on
        : actualServiceData.depends_on
          ? Object.keys(actualServiceData.depends_on)
          : [],
      entrypoint: parseCommandArray(actualServiceData.entrypoint),
      env_file: Array.isArray(actualServiceData.env_file)
        ? actualServiceData.env_file.join(",")
        : actualServiceData.env_file || "",
      extra_hosts: Array.isArray(actualServiceData.extra_hosts)
        ? actualServiceData.extra_hosts
        : [],
      dns: Array.isArray(actualServiceData.dns) ? actualServiceData.dns : [],
      networks: Array.isArray(actualServiceData.networks)
        ? actualServiceData.networks
        : actualServiceData.networks
          ? Object.keys(actualServiceData.networks)
          : [],
      user: actualServiceData.user || "",
      working_dir: actualServiceData.working_dir || "",
      labels: actualServiceData.labels
        ? Array.isArray(actualServiceData.labels)
          ? actualServiceData.labels.map((l: string) => {
              const [key, ...rest] = l.split("=");
              return { key, value: rest.join("=") };
            })
          : Object.entries(actualServiceData.labels).map(
              ([key, value]: [string, any]) => ({ key, value: String(value) })
            )
        : [],
      privileged:
        actualServiceData.privileged !== undefined
          ? !!actualServiceData.privileged
          : undefined,
      read_only:
        actualServiceData.read_only !== undefined
          ? !!actualServiceData.read_only
          : undefined,
      shm_size: actualServiceData.shm_size || "",
      security_opt: Array.isArray(actualServiceData.security_opt)
        ? actualServiceData.security_opt
        : [],
      network_mode: actualServiceData.network_mode || "",
      cap_add: Array.isArray(actualServiceData.cap_add)
        ? actualServiceData.cap_add
        : [],
      cap_drop: Array.isArray(actualServiceData.cap_drop)
        ? actualServiceData.cap_drop
        : [],
      sysctls:
        actualServiceData.sysctls &&
        typeof actualServiceData.sysctls === "object"
          ? Array.isArray(actualServiceData.sysctls)
            ? actualServiceData.sysctls.map((s: string) => {
                const [key, value] = s.split("=");
                return { key: key || "", value: value || "" };
              })
            : Object.entries(actualServiceData.sysctls).map(
                ([key, value]: [string, any]) => ({
                  key,
                  value: String(value),
                })
              )
          : [],
      devices: Array.isArray(actualServiceData.devices)
        ? actualServiceData.devices
        : [],
      tmpfs: Array.isArray(actualServiceData.tmpfs)
        ? actualServiceData.tmpfs
        : actualServiceData.tmpfs
          ? Object.keys(actualServiceData.tmpfs).map(
              (key) => `${key}:${actualServiceData.tmpfs[key] || ""}`
            )
          : [],
      ulimits:
        actualServiceData.ulimits &&
        typeof actualServiceData.ulimits === "object"
          ? Object.entries(actualServiceData.ulimits).map(
              ([name, limit]: [string, any]) => ({
                name,
                soft:
                  limit && typeof limit === "object" && limit.soft
                    ? String(limit.soft)
                    : "",
                hard:
                  limit && typeof limit === "object" && limit.hard
                    ? String(limit.hard)
                    : "",
              })
            )
          : [],
      init:
        actualServiceData.init !== undefined
          ? !!actualServiceData.init
          : undefined,
      stop_grace_period: actualServiceData.stop_grace_period || "",
      stop_signal: actualServiceData.stop_signal || "",
      tty:
        actualServiceData.tty !== undefined
          ? !!actualServiceData.tty
          : undefined,
      stdin_open:
        actualServiceData.stdin_open !== undefined
          ? !!actualServiceData.stdin_open
          : undefined,
      hostname: actualServiceData.hostname || "",
      domainname: actualServiceData.domainname || "",
      mac_address: actualServiceData.mac_address || "",
      ipc_mode: actualServiceData.ipc || "",
      pid: actualServiceData.pid || "",
      uts: actualServiceData.uts || "",
      cgroup_parent: actualServiceData.cgroup_parent || "",
      isolation: actualServiceData.isolation || "",
      deploy: actualServiceData.deploy?.resources
        ? {
            resources: {
              limits: {
                cpus:
                  actualServiceData.deploy.resources.limits?.cpus || undefined,
                memory:
                  actualServiceData.deploy.resources.limits?.memory ||
                  undefined,
              },
              reservations: {
                cpus:
                  actualServiceData.deploy.resources.reservations?.cpus ||
                  undefined,
                memory:
                  actualServiceData.deploy.resources.reservations?.memory ||
                  undefined,
              },
            },
          }
        : undefined,
    };
    // Calculate the new service index after filtering out unnamed services
    const currentServices = services;
    const filteredServices = currentServices.filter(
      (svc) => svc.name && svc.name.trim() !== ""
    );
    const newServiceIndex = filteredServices.length;

    setServices((prev) => {
      // Remove any unnamed services (empty name) when adding from marketplace
      const filtered = prev.filter((svc) => svc.name && svc.name.trim() !== "");
      const updated = [...filtered, newService];
      return updated;
    });
    if (allNetworks && Object.keys(allNetworks).length > 0) {
      const networkConfigs: NetworkConfig[] = Object.entries(allNetworks).map(
        ([name, config]: [string, any]) => ({
          name,
          driver: config.driver || "",
          driver_opts: config.driver_opts
            ? Object.entries(config.driver_opts).map(
                ([key, value]: [string, any]) => ({ key, value: String(value) })
              )
            : [],
          attachable:
            config.attachable !== undefined ? !!config.attachable : false,
          labels: config.labels
            ? Array.isArray(config.labels)
              ? config.labels.map((l: string) => {
                  const [key, ...rest] = l.split("=");
                  return { key, value: rest.join("=") };
                })
              : Object.entries(config.labels).map(
                  ([key, value]: [string, any]) => ({
                    key,
                    value: String(value),
                  })
                )
            : [],
          external: !!config.external,
          name_external:
            config.external && typeof config.external === "object"
              ? config.external.name || ""
              : "",
          internal: config.internal !== undefined ? !!config.internal : false,
          enable_ipv6:
            config.enable_ipv6 !== undefined ? !!config.enable_ipv6 : false,
          ipam: {
            driver: config.ipam?.driver || "",
            config: config.ipam?.config || [],
            options: config.ipam?.options
              ? Object.entries(config.ipam.options).map(
                  ([key, value]: [string, any]) => ({
                    key,
                    value: String(value),
                  })
                )
              : [],
          },
        })
      );
      setNetworks((prev) => {
        const existingNames = new Set(prev.map((n) => n.name));
        const newNetworks = networkConfigs.filter(
          (n) => !existingNames.has(n.name)
        );
        return [...prev, ...newNetworks];
      });
    }
    if (allVolumes && Object.keys(allVolumes).length > 0) {
      const volumeConfigs: VolumeConfig[] = Object.entries(allVolumes).map(
        ([name, config]: [string, any]) => {
          let driverOptsType = "";
          let driverOptsDevice = "";
          let driverOptsO = "";

          if (config && config.driver_opts) {
            driverOptsType = config.driver_opts.type || "";
            driverOptsDevice = config.driver_opts.device || "";
            driverOptsO = config.driver_opts.o || "";
          }

          return {
            name,
            driver: config && config.driver ? config.driver : "",
            driver_opts:
              config && config.driver_opts
                ? Object.entries(config.driver_opts).map(
                    ([key, value]: [string, any]) => ({
                      key,
                      value: String(value),
                    })
                  )
                : [],
            labels:
              config && config.labels
                ? Array.isArray(config.labels)
                  ? config.labels.map((l: string) => {
                      const [key, ...rest] = l.split("=");
                      return { key, value: rest.join("=") };
                    })
                  : Object.entries(config.labels).map(
                      ([key, value]: [string, any]) => ({
                        key,
                        value: String(value),
                      })
                    )
                : [],
            external: !!config?.external,
            name_external:
              config?.external && typeof config.external === "object"
                ? config.external.name || ""
                : "",
            driver_opts_type: driverOptsType,
            driver_opts_device: driverOptsDevice,
            driver_opts_o: driverOptsO,
          };
        }
      );
      setVolumes((prev) => {
        const existingNames = new Set(prev.map((v) => v.name));
        const newVolumes = volumeConfigs.filter(
          (v) => !existingNames.has(v.name)
        );
        return [...prev, ...newVolumes];
      });
    }
    setSelectedType("service");
    setSelectedIdx(newServiceIndex);
  }

  async function importTemplate(template: any) {
    try {
      // Parse docker-compose.yml
      const doc = jsyaml.load(template.composeContent) as any;

      if (!doc || !doc.services) {
        throw new Error("Invalid docker-compose.yml in template");
      }

      // Add all services from compose file
      const servicesArray = Object.entries(doc.services).map(
        ([svcName, svcObj]: [string, any]) => ({
          name: svcName,
          image: svcObj.image || "",
          rawService: svcObj,
        })
      );

      // Add services one by one
      for (const service of servicesArray) {
        handleAddComposeServiceFull(
          service,
          doc.networks || {},
          doc.volumes || {}
        );
      }

      // Apply template.toml configuration if available
      if (template.parsedTemplate) {
        const parsed = template.parsedTemplate;

        // Apply environment variables from template.toml
        if (parsed.env && parsed.env.length > 0) {
          setServices((prev) => {
            return prev.map((svc) => {
              // Find matching service by name from domains config
              const domainConfig = parsed.domains?.find(
                (d: any) => d.serviceName === svc.name
              );

              if (domainConfig && domainConfig.env) {
                // Merge domain-specific env vars
                const domainEnv = domainConfig.env.map((e: string) => {
                  const [key, ...rest] = e.split("=");
                  return { key: key.trim(), value: rest.join("=").trim() };
                });

                // Merge with existing env vars, avoiding duplicates
                const existingKeys = new Set(svc.environment.map((e) => e.key));
                const newEnv = domainEnv.filter(
                  (e: { key: string; value: string }) =>
                    !existingKeys.has(e.key)
                );
                return {
                  ...svc,
                  environment: [...svc.environment, ...newEnv],
                };
              }

              // Apply general env vars if no domain-specific config
              const existingKeys = new Set(svc.environment.map((e) => e.key));
              const newEnv = parsed.env.filter(
                (e: any) => !existingKeys.has(e.key)
              );
              return {
                ...svc,
                environment: [...svc.environment, ...newEnv],
              };
            });
          });
        }

        // Apply domains configuration (ports, etc.)
        if (parsed.domains && parsed.domains.length > 0) {
          setServices((prev) => {
            return prev.map((svc) => {
              const domainConfig = parsed.domains?.find(
                (d: any) => d.serviceName === svc.name
              );

              if (domainConfig) {
                // Add port if not already present
                const hasPort = svc.ports.some(
                  (p) => p.container === String(domainConfig.port)
                );

                if (!hasPort && domainConfig.port) {
                  return {
                    ...svc,
                    ports: [
                      ...svc.ports,
                      {
                        host: "",
                        container: String(domainConfig.port),
                        protocol: "none",
                      },
                    ],
                  };
                }
              }

              return svc;
            });
          });
        }
      }

      // Close dialogs
      setTemplateDetailOpen(false);
      setTemplateStoreOpen(false);
    } catch (error: any) {
      console.error("Error importing template:", error);
      throw new Error(`Failed to import template: ${error.message}`);
    }
  }

  if (!yaml) setYaml(generateYaml(services, networks, volumes));

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
        className="h-[calc(100vh-4rem)]"
        style={{
          height: "calc(100vh - 4rem)",
          minHeight: 0,
          maxHeight: "calc(100vh - 4rem)",
        }}
      >
        <Sidebar>
          <SidebarUI />
        </Sidebar>
        <SidebarInset className="relative h-full min-h-0 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 h-full min-h-0 w-full gap-2 md:gap-4 overflow-hidden">
            <SidebarTrigger className="absolute top-2 left-2 z-10" />
            {/* Service List Sidebar */}
            <aside className="h-full min-h-0 max-h-full md:h-[400px] lg:h-full bg-card border-r flex flex-col p-2 md:p-4 gap-2 md:gap-4 overflow-y-auto box-border">
              <div className="flex justify-end mb-2 w-full box-border">
                {/* <span className="font-bold text-lg">Services</span> */}
                {/* <div className="flex items-center gap-2"> */}
                <div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedType("service");
                      setSelectedIdx(services.length);
                      addService();
                    }}
                  >
                    + Add Services
                  </Button>
                </div>
                {/* </div> */}
              </div>
              <Button
                variant="outline"
                className="mb-2"
                onClick={() => setTemplateStoreOpen(true)}
              >
                Browse Templates
              </Button>
              {/* Template Store Overlay */}
              {templateStoreOpen && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
                  onClick={() => setTemplateStoreOpen(false)}
                >
                  <div
                    className="relative max-w-screen-3xl w-[98vw] h-[90vh] rounded-2xl border bg-background p-8 pt-4 shadow-xl flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={refreshTemplateStore}
                        disabled={templateLoading}
                        className="flex items-center gap-1"
                      >
                        <svg
                          width="14"
                          height="14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                          <path d="M21 3v5h-5" />
                          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                          <path d="M3 21v-5h5" />
                        </svg>
                        Refresh
                      </Button>
                      <button
                        className="text-xl text-muted-foreground hover:text-foreground"
                        onClick={() => setTemplateStoreOpen(false)}
                        aria-label="Close Templates"
                      >
                        ×
                      </button>
                    </div>
                    <div className="mb-1 text-2xl font-bold">Templates</div>
                    <div className="mb-2 mt-0 text-base text-muted-foreground">
                      Browse and import templates with pre-configured Docker
                      Compose files.
                      {templateCacheTimestamp && (
                        <span className="ml-2 text-xs">
                          (Cached{" "}
                          {Math.round(
                            (Date.now() - templateCacheTimestamp) / 1000 / 60
                          )}
                          m ago)
                        </span>
                      )}
                    </div>
                    <div className="mb-4 text-xs text-muted-foreground">
                      Templates from{" "}
                      <a
                        href="https://github.com/hhftechnology/Marketplace"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        hhftechnology/Marketplace
                      </a>{" "}
                      repository.
                    </div>
                    <div className="flex-1 overflow-hidden">
                      {templateLoading ? (
                        <div className="h-32 flex items-center justify-center text-muted-foreground text-lg">
                          {templateCache.length > 0
                            ? "Refreshing..."
                            : "Loading templates..."}
                        </div>
                      ) : templateError ? (
                        <div className="h-32 flex items-center justify-center text-destructive text-lg">
                          {templateError}
                        </div>
                      ) : templates.length === 0 ? (
                        <div className="h-32 flex items-center justify-center text-muted-foreground text-lg">
                          No templates found.
                        </div>
                      ) : (
                        <div className="w-full h-full overflow-y-auto">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 mt-4 pb-4">
                            {templates
                              .filter(
                                (template: any) =>
                                  template.name
                                    ?.toLowerCase()
                                    .includes(templateSearch.toLowerCase()) ||
                                  template.description
                                    ?.toLowerCase()
                                    .includes(templateSearch.toLowerCase()) ||
                                  template.tags?.some((tag: string) =>
                                    tag
                                      .toLowerCase()
                                      .includes(templateSearch.toLowerCase())
                                  )
                              )
                              .map((template: any) => (
                                <div
                                  key={template.id}
                                  className="bg-card rounded-lg shadow p-4 flex flex-col gap-2 items-start justify-between border border-border min-h-0 cursor-pointer hover:border-primary transition-colors"
                                  onClick={async () => {
                                    try {
                                      const details =
                                        await fetchTemplateDetails(template.id);
                                      setSelectedTemplate(details);
                                      setTemplateDetailOpen(true);
                                    } catch (error: any) {
                                      setTemplateError(
                                        `Failed to load template: ${error.message}`
                                      );
                                    }
                                  }}
                                >
                                  <div className="w-full flex items-start gap-3">
                                    {template.logo ? (
                                      <img
                                        src={`https://raw.githubusercontent.com/Dokploy/templates/main/blueprints/${template.id}/${template.logo}`}
                                        alt={template.name}
                                        className="w-12 h-12 object-contain flex-shrink-0"
                                        onError={(
                                          e: React.SyntheticEvent<
                                            HTMLImageElement,
                                            Event
                                          >
                                        ) => {
                                          (
                                            e.target as HTMLImageElement
                                          ).style.display = "none";
                                        }}
                                      />
                                    ) : (
                                      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center flex-shrink-0">
                                        <Settings className="w-6 h-6 text-muted-foreground" />
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <div className="font-bold text-lg break-words">
                                        {template.name}
                                      </div>
                                      {template.version && (
                                        <div className="text-xs text-muted-foreground">
                                          v{template.version}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-sm text-muted-foreground line-clamp-2 w-full">
                                    {template.description}
                                  </p>
                                  {template.tags &&
                                    template.tags.length > 0 && (
                                      <div className="flex flex-wrap gap-1 w-full">
                                        {template.tags
                                          .slice(0, 3)
                                          .map((tag: string) => (
                                            <span
                                              key={tag}
                                              className="px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded border border-primary/20"
                                            >
                                              {tag}
                                            </span>
                                          ))}
                                        {template.tags.length > 3 && (
                                          <span className="px-1.5 py-0.5 text-xs text-muted-foreground">
                                            +{template.tags.length - 3}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  <Button
                                    size="sm"
                                    className="mt-2 w-full"
                                    variant="outline"
                                  >
                                    View Details
                                  </Button>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-2 w-full box-border">
                {services.map((svc, idx) => (
                  <Card
                    key={`${svc.name}-${idx}`}
                    className={`relative p-2 pr-8 cursor-pointer flex flex-col justify-center ${selectedType === "service" && selectedIdx === idx ? "border-primary border-2" : ""}`}
                    onClick={() => {
                      setSelectedType("service");
                      setSelectedIdx(idx);
                      setSelectedNetworkIdx(null);
                      setSelectedVolumeIdx(null);
                    }}
                  >
                    <div className="flex flex-col items-start">
                      <div className="font-semibold text-left">
                        {svc.name || (
                          <span className="text-muted-foreground">
                            (unnamed)
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground text-left">
                        {svc.image || <span>no image</span>}
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        removeService(idx);
                      }}
                      className="absolute top-1 right-1 z-10 pointer-events-auto"
                      type="button"
                      aria-label={`Remove service ${svc.name || "unnamed"}`}
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
              <Separator className="my-2" />
              {/* VPN Configuration */}
              <Collapsible open={vpnConfigOpen} onOpenChange={setVpnConfigOpen}>
                <div className="flex items-center justify-between mb-2 w-full box-border">
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="outline"
                      className="font-bold text-md w-full justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <span>VPN Configuration</span>
                      </div>
                      {vpnConfigOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent>
                  <div className="flex flex-col gap-3 w-full box-border">
                    <div>
                      <Label className="mb-1 block text-sm">VPN Type</Label>
                      <Select
                        value={vpnConfig?.type || "none"}
                        onValueChange={(value) => {
                          const currentConfig = vpnConfig || defaultVPNConfig();
                          const newType =
                            value === "none"
                              ? null
                              : (value as VPNConfig["type"]);
                          setVpnConfig({
                            ...currentConfig,
                            enabled: newType !== null,
                            type: newType,
                            tailscale:
                              newType === "tailscale"
                                ? currentConfig.tailscale ||
                                  defaultTailscaleConfig()
                                : undefined,
                            newt:
                              newType === "newt"
                                ? currentConfig.newt || defaultNewtConfig()
                                : undefined,
                            cloudflared:
                              newType === "cloudflared"
                                ? currentConfig.cloudflared ||
                                  defaultCloudflaredConfig()
                                : undefined,
                            wireguard:
                              newType === "wireguard"
                                ? currentConfig.wireguard ||
                                  defaultWireguardConfig()
                                : undefined,
                            zerotier:
                              newType === "zerotier"
                                ? currentConfig.zerotier ||
                                  defaultZerotierConfig()
                                : undefined,
                            netbird:
                              newType === "netbird"
                                ? currentConfig.netbird ||
                                  defaultNetbirdConfig()
                                : undefined,
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select VPN type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="tailscale">Tailscale</SelectItem>
                          <SelectItem value="newt">Newt</SelectItem>
                          <SelectItem value="cloudflared">
                            Cloudflared
                          </SelectItem>
                          <SelectItem value="wireguard">Wireguard</SelectItem>
                          <SelectItem value="zerotier">ZeroTier</SelectItem>
                          <SelectItem value="netbird">Netbird</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {vpnConfig &&
                      vpnConfig.enabled &&
                      vpnConfig.type === "tailscale" &&
                      vpnConfig.tailscale && (
                        <div className="flex flex-col gap-3">
                          <div>
                            <Label className="mb-1 block text-sm">
                              Auth Key
                            </Label>
                            <Input
                              value={vpnConfig.tailscale.authKey}
                              onChange={(e) =>
                                setVpnConfig({
                                  ...vpnConfig,
                                  tailscale: {
                                    ...vpnConfig.tailscale!,
                                    authKey: e.target.value,
                                  },
                                })
                              }
                              placeholder="${TS_AUTHKEY}"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Get from Tailscale admin console
                            </p>
                          </div>
                          <div>
                            <Label className="mb-1 block text-sm">
                              Hostname
                            </Label>
                            <Input
                              value={vpnConfig.tailscale.hostname}
                              onChange={(e) =>
                                setVpnConfig({
                                  ...vpnConfig,
                                  tailscale: {
                                    ...vpnConfig.tailscale!,
                                    hostname: e.target.value,
                                  },
                                })
                              }
                              placeholder="my-service"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={vpnConfig.tailscale.acceptDns}
                              onCheckedChange={(checked) =>
                                setVpnConfig({
                                  ...vpnConfig,
                                  tailscale: {
                                    ...vpnConfig.tailscale!,
                                    acceptDns: checked === true,
                                  },
                                })
                              }
                            />
                            <Label
                              className="text-sm cursor-pointer"
                              onClick={() => {
                                if (!vpnConfig.tailscale) return;
                                setVpnConfig({
                                  ...vpnConfig,
                                  tailscale: {
                                    ...vpnConfig.tailscale,
                                    acceptDns: !vpnConfig.tailscale.acceptDns,
                                  },
                                });
                              }}
                            >
                              Accept DNS
                            </Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={vpnConfig.tailscale.authOnce}
                              onCheckedChange={(checked) =>
                                setVpnConfig({
                                  ...vpnConfig,
                                  tailscale: {
                                    ...vpnConfig.tailscale!,
                                    authOnce: checked === true,
                                  },
                                })
                              }
                            />
                            <Label
                              className="text-sm cursor-pointer"
                              onClick={() => {
                                if (!vpnConfig.tailscale) return;
                                setVpnConfig({
                                  ...vpnConfig,
                                  tailscale: {
                                    ...vpnConfig.tailscale,
                                    authOnce: !vpnConfig.tailscale.authOnce,
                                  },
                                });
                              }}
                            >
                              Auth Once
                            </Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={vpnConfig.tailscale.userspace}
                              onCheckedChange={(checked) =>
                                setVpnConfig({
                                  ...vpnConfig,
                                  tailscale: {
                                    ...vpnConfig.tailscale!,
                                    userspace: checked === true,
                                  },
                                })
                              }
                            />
                            <Label
                              className="text-sm cursor-pointer"
                              onClick={() => {
                                if (!vpnConfig.tailscale) return;
                                setVpnConfig({
                                  ...vpnConfig,
                                  tailscale: {
                                    ...vpnConfig.tailscale,
                                    userspace: !vpnConfig.tailscale.userspace,
                                  },
                                });
                              }}
                            >
                              Userspace
                            </Label>
                          </div>
                          <div>
                            <Label className="mb-1 block text-sm">
                              Exit Node (optional)
                            </Label>
                            <Input
                              value={vpnConfig.tailscale.exitNode}
                              onChange={(e) =>
                                setVpnConfig({
                                  ...vpnConfig,
                                  tailscale: {
                                    ...vpnConfig.tailscale!,
                                    exitNode: e.target.value,
                                  },
                                })
                              }
                              placeholder="Exit node IP or hostname"
                            />
                          </div>
                          {vpnConfig.tailscale.exitNode && (
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={vpnConfig.tailscale.exitNodeAllowLan}
                                onCheckedChange={(checked) =>
                                  setVpnConfig({
                                    ...vpnConfig,
                                    tailscale: {
                                      ...vpnConfig.tailscale!,
                                      exitNodeAllowLan: checked === true,
                                    },
                                  })
                                }
                              />
                              <Label
                                className="text-sm cursor-pointer"
                                onClick={() => {
                                  if (!vpnConfig.tailscale) return;
                                  setVpnConfig({
                                    ...vpnConfig,
                                    tailscale: {
                                      ...vpnConfig.tailscale,
                                      exitNodeAllowLan:
                                        !vpnConfig.tailscale.exitNodeAllowLan,
                                    },
                                  });
                                }}
                              >
                                Allow LAN Access
                              </Label>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={vpnConfig.tailscale.enableServe}
                              onCheckedChange={(checked) =>
                                setVpnConfig({
                                  ...vpnConfig,
                                  tailscale: {
                                    ...vpnConfig.tailscale!,
                                    enableServe: checked === true,
                                  },
                                })
                              }
                            />
                            <Label
                              className="text-sm cursor-pointer"
                              onClick={() => {
                                if (!vpnConfig.tailscale) return;
                                setVpnConfig({
                                  ...vpnConfig,
                                  tailscale: {
                                    ...vpnConfig.tailscale,
                                    enableServe:
                                      !vpnConfig.tailscale.enableServe,
                                  },
                                });
                              }}
                            >
                              Enable Serve (TCP/HTTPS)
                            </Label>
                          </div>
                          {vpnConfig.tailscale.enableServe && (
                            <div className="flex flex-col gap-3 pl-4 border-l-2">
                              <div>
                                <Label className="mb-1 block text-sm">
                                  Target Service
                                </Label>
                                <Select
                                  value={vpnConfig.tailscale.serveTargetService}
                                  onValueChange={(value) =>
                                    setVpnConfig({
                                      ...vpnConfig,
                                      tailscale: {
                                        ...vpnConfig.tailscale!,
                                        serveTargetService: value,
                                      },
                                    })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select service..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {services
                                      .filter((s) => s.name)
                                      .map((s) => (
                                        <SelectItem key={s.name} value={s.name}>
                                          {s.name}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="mb-1 block text-sm">
                                  External Port
                                </Label>
                                <Input
                                  value={vpnConfig.tailscale.serveExternalPort}
                                  onChange={(e) =>
                                    setVpnConfig({
                                      ...vpnConfig,
                                      tailscale: {
                                        ...vpnConfig.tailscale!,
                                        serveExternalPort: e.target.value,
                                      },
                                    })
                                  }
                                  placeholder="443"
                                />
                              </div>
                              <div>
                                <Label className="mb-1 block text-sm">
                                  Internal Port
                                </Label>
                                <Input
                                  value={vpnConfig.tailscale.serveInternalPort}
                                  onChange={(e) =>
                                    setVpnConfig({
                                      ...vpnConfig,
                                      tailscale: {
                                        ...vpnConfig.tailscale!,
                                        serveInternalPort: e.target.value,
                                      },
                                    })
                                  }
                                  placeholder="8080"
                                />
                              </div>
                              <div>
                                <Label className="mb-1 block text-sm">
                                  Path
                                </Label>
                                <Input
                                  value={vpnConfig.tailscale.servePath}
                                  onChange={(e) =>
                                    setVpnConfig({
                                      ...vpnConfig,
                                      tailscale: {
                                        ...vpnConfig.tailscale!,
                                        servePath: e.target.value,
                                      },
                                    })
                                  }
                                  placeholder="/"
                                />
                              </div>
                              <div>
                                <Label className="mb-1 block text-sm">
                                  Protocol
                                </Label>
                                <Select
                                  value={vpnConfig.tailscale.serveProtocol}
                                  onValueChange={(value) =>
                                    setVpnConfig({
                                      ...vpnConfig,
                                      tailscale: {
                                        ...vpnConfig.tailscale!,
                                        serveProtocol: value as
                                          | "HTTPS"
                                          | "HTTP",
                                      },
                                    })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="HTTPS">HTTPS</SelectItem>
                                    <SelectItem value="HTTP">HTTP</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="mb-1 block text-sm">
                                  Cert Domain (optional)
                                </Label>
                                <Input
                                  value={vpnConfig.tailscale.certDomain}
                                  onChange={(e) =>
                                    setVpnConfig({
                                      ...vpnConfig,
                                      tailscale: {
                                        ...vpnConfig.tailscale!,
                                        certDomain: e.target.value,
                                      },
                                    })
                                  }
                                  placeholder="${TS_CERT_DOMAIN}"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                    {vpnConfig &&
                      vpnConfig.enabled &&
                      vpnConfig.type === "newt" &&
                      vpnConfig.newt && (
                        <div className="flex flex-col gap-3">
                          <div>
                            <Label className="mb-1 block text-sm">
                              Endpoint
                            </Label>
                            <Input
                              value={vpnConfig.newt.endpoint}
                              onChange={(e) =>
                                setVpnConfig({
                                  ...vpnConfig,
                                  newt: {
                                    ...vpnConfig.newt!,
                                    endpoint: e.target.value,
                                  },
                                })
                              }
                              placeholder="https://app.pangolin.net"
                            />
                          </div>
                          <div>
                            <Label className="mb-1 block text-sm">
                              Newt ID
                            </Label>
                            <Input
                              value={vpnConfig.newt.newtId}
                              onChange={(e) =>
                                setVpnConfig({
                                  ...vpnConfig,
                                  newt: {
                                    ...vpnConfig.newt!,
                                    newtId: e.target.value,
                                  },
                                })
                              }
                              placeholder="${NEWT_ID}"
                            />
                          </div>
                          <div>
                            <Label className="mb-1 block text-sm">
                              Newt Secret
                            </Label>
                            <Input
                              value={vpnConfig.newt.newtSecret}
                              onChange={(e) =>
                                setVpnConfig({
                                  ...vpnConfig,
                                  newt: {
                                    ...vpnConfig.newt!,
                                    newtSecret: e.target.value,
                                  },
                                })
                              }
                              placeholder="${NEWT_SECRET}"
                              type="password"
                            />
                          </div>
                          <div>
                            <Label className="mb-1 block text-sm">
                              Network Name
                            </Label>
                            <Input
                              value={vpnConfig.newt.networkName}
                              onChange={(e) =>
                                setVpnConfig({
                                  ...vpnConfig,
                                  newt: {
                                    ...vpnConfig.newt!,
                                    networkName: e.target.value,
                                  },
                                })
                              }
                              placeholder="newt"
                            />
                          </div>
                        </div>
                      )}

                    {vpnConfig &&
                      vpnConfig.enabled &&
                      vpnConfig.type === "cloudflared" &&
                      vpnConfig.cloudflared && (
                        <div className="flex flex-col gap-3">
                          <div>
                            <Label className="mb-1 block text-sm">
                              Tunnel Token
                            </Label>
                            <Input
                              value={vpnConfig.cloudflared.tunnelToken}
                              onChange={(e) =>
                                setVpnConfig({
                                  ...vpnConfig,
                                  cloudflared: {
                                    ...vpnConfig.cloudflared!,
                                    tunnelToken: e.target.value,
                                  },
                                })
                              }
                              placeholder="${TUNNEL_TOKEN}"
                              type="password"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Get from Cloudflare dashboard
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={vpnConfig.cloudflared.noAutoupdate}
                              onCheckedChange={(checked) =>
                                setVpnConfig({
                                  ...vpnConfig,
                                  cloudflared: {
                                    ...vpnConfig.cloudflared!,
                                    noAutoupdate: checked === true,
                                  },
                                })
                              }
                            />
                            <Label
                              className="text-sm cursor-pointer"
                              onClick={() => {
                                if (!vpnConfig.cloudflared) return;
                                setVpnConfig({
                                  ...vpnConfig,
                                  cloudflared: {
                                    ...vpnConfig.cloudflared,
                                    noAutoupdate:
                                      !vpnConfig.cloudflared.noAutoupdate,
                                  },
                                });
                              }}
                            >
                              No Auto-update
                            </Label>
                          </div>
                        </div>
                      )}

                    {vpnConfig &&
                      vpnConfig.enabled &&
                      vpnConfig.type === "wireguard" &&
                      vpnConfig.wireguard && (
                        <div className="flex flex-col gap-3">
                          <div>
                            <Label className="mb-1 block text-sm">
                              Config Path
                            </Label>
                            <Input
                              value={vpnConfig.wireguard.configPath}
                              onChange={(e) =>
                                setVpnConfig({
                                  ...vpnConfig,
                                  wireguard: {
                                    ...vpnConfig.wireguard!,
                                    configPath: e.target.value,
                                  },
                                })
                              }
                              placeholder="/etc/wireguard/wg0.conf"
                            />
                          </div>
                          <div>
                            <Label className="mb-1 block text-sm">
                              Interface Name
                            </Label>
                            <Input
                              value={vpnConfig.wireguard.interfaceName}
                              onChange={(e) =>
                                setVpnConfig({
                                  ...vpnConfig,
                                  wireguard: {
                                    ...vpnConfig.wireguard!,
                                    interfaceName: e.target.value,
                                  },
                                })
                              }
                              placeholder="wg0"
                            />
                          </div>
                        </div>
                      )}

                    {vpnConfig &&
                      vpnConfig.enabled &&
                      vpnConfig.type === "zerotier" &&
                      vpnConfig.zerotier && (
                        <div className="flex flex-col gap-3">
                          <div>
                            <Label className="mb-1 block text-sm">
                              Network ID
                            </Label>
                            <Input
                              value={vpnConfig.zerotier.networkId}
                              onChange={(e) =>
                                setVpnConfig({
                                  ...vpnConfig,
                                  zerotier: {
                                    ...vpnConfig.zerotier!,
                                    networkId: e.target.value,
                                  },
                                })
                              }
                              placeholder="${ZT_NETWORK_ID}"
                            />
                          </div>
                          <div>
                            <Label className="mb-1 block text-sm">
                              Identity Path
                            </Label>
                            <Input
                              value={vpnConfig.zerotier.identityPath}
                              onChange={(e) =>
                                setVpnConfig({
                                  ...vpnConfig,
                                  zerotier: {
                                    ...vpnConfig.zerotier!,
                                    identityPath: e.target.value,
                                  },
                                })
                              }
                              placeholder="/var/lib/zerotier-one"
                            />
                          </div>
                        </div>
                      )}

                    {vpnConfig &&
                      vpnConfig.enabled &&
                      vpnConfig.type === "netbird" &&
                      vpnConfig.netbird && (
                        <div className="flex flex-col gap-3">
                          <div>
                            <Label className="mb-1 block text-sm">
                              Setup Key
                            </Label>
                            <Input
                              value={vpnConfig.netbird.setupKey}
                              onChange={(e) =>
                                setVpnConfig({
                                  ...vpnConfig,
                                  netbird: {
                                    ...vpnConfig.netbird!,
                                    setupKey: e.target.value,
                                  },
                                })
                              }
                              placeholder="${NETBIRD_SETUP_KEY}"
                              type="password"
                            />
                          </div>
                          <div>
                            <Label className="mb-1 block text-sm">
                              Management URL (optional)
                            </Label>
                            <Input
                              value={vpnConfig.netbird.managementUrl}
                              onChange={(e) =>
                                setVpnConfig({
                                  ...vpnConfig,
                                  netbird: {
                                    ...vpnConfig.netbird!,
                                    managementUrl: e.target.value,
                                  },
                                })
                              }
                              placeholder="https://api.netbird.io"
                            />
                          </div>
                        </div>
                      )}

                    {vpnConfig && vpnConfig.enabled && (
                      <>
                        {(() => {
                          let hasErrors = false;
                          let errorMessage = "";

                          if (!vpnConfig) return null;

                          if (
                            vpnConfig.type === "tailscale" &&
                            vpnConfig.tailscale
                          ) {
                            if (!vpnConfig.tailscale.authKey) {
                              hasErrors = true;
                              errorMessage = "Tailscale Auth Key is required";
                            }
                            if (
                              vpnConfig.tailscale.enableServe &&
                              !vpnConfig.tailscale.serveTargetService
                            ) {
                              hasErrors = true;
                              errorMessage =
                                "Target service is required when Serve is enabled";
                            }
                          } else if (
                            vpnConfig.type === "newt" &&
                            vpnConfig.newt
                          ) {
                            if (
                              !vpnConfig.newt.newtId ||
                              !vpnConfig.newt.newtSecret
                            ) {
                              hasErrors = true;
                              errorMessage = "Newt ID and Secret are required";
                            }
                          } else if (
                            vpnConfig.type === "cloudflared" &&
                            vpnConfig.cloudflared
                          ) {
                            if (!vpnConfig.cloudflared.tunnelToken) {
                              hasErrors = true;
                              errorMessage =
                                "Cloudflared Tunnel Token is required";
                            }
                          } else if (
                            vpnConfig.type === "zerotier" &&
                            vpnConfig.zerotier
                          ) {
                            if (!vpnConfig.zerotier.networkId) {
                              hasErrors = true;
                              errorMessage = "ZeroTier Network ID is required";
                            }
                          } else if (
                            vpnConfig.type === "netbird" &&
                            vpnConfig.netbird
                          ) {
                            if (!vpnConfig.netbird.setupKey) {
                              hasErrors = true;
                              errorMessage = "Netbird Setup Key is required";
                            }
                          }

                          if (vpnConfig.servicesUsingVpn.length === 0) {
                            hasErrors = true;
                            errorMessage =
                              "At least one service must be selected to use VPN";
                          }

                          return hasErrors ? (
                            <Alert className="mb-2">
                              <AlertCircle className="h-4 w-4" />
                              <AlertTitle>Configuration Warning</AlertTitle>
                              <AlertDescription className="text-xs">
                                {errorMessage}
                              </AlertDescription>
                            </Alert>
                          ) : null;
                        })()}
                        <div className="flex flex-col gap-2">
                          <Label className="text-sm font-semibold">
                            Services Using VPN
                          </Label>
                          {services.filter((s) => s.name).length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                              Add services first
                            </p>
                          ) : (
                            <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                              {services
                                .filter((s) => s.name)
                                .map((svc) => (
                                  <div
                                    key={svc.name}
                                    className="flex items-center gap-2"
                                  >
                                    <Checkbox
                                      checked={vpnConfig.servicesUsingVpn.includes(
                                        svc.name
                                      )}
                                      onCheckedChange={(checked) => {
                                        const newServices = checked
                                          ? [
                                              ...vpnConfig.servicesUsingVpn,
                                              svc.name,
                                            ]
                                          : vpnConfig.servicesUsingVpn.filter(
                                              (n) => n !== svc.name
                                            );
                                        setVpnConfig({
                                          ...vpnConfig,
                                          servicesUsingVpn: newServices,
                                        });
                                      }}
                                    />
                                    <Label
                                      htmlFor={`vpn-service-${svc.name}`}
                                      className="text-sm cursor-pointer flex-1"
                                      onClick={() => {
                                        const isChecked =
                                          vpnConfig.servicesUsingVpn.includes(
                                            svc.name
                                          );
                                        const newServices = !isChecked
                                          ? [
                                              ...vpnConfig.servicesUsingVpn,
                                              svc.name,
                                            ]
                                          : vpnConfig.servicesUsingVpn.filter(
                                              (n) => n !== svc.name
                                            );
                                        setVpnConfig({
                                          ...vpnConfig,
                                          servicesUsingVpn: newServices,
                                        });
                                      }}
                                    >
                                      {svc.name}
                                    </Label>
                                    {vpnConfig.type &&
                                      ["tailscale", "cloudflared"].includes(
                                        vpnConfig.type
                                      ) &&
                                      vpnConfig.servicesUsingVpn.includes(
                                        svc.name
                                      ) && (
                                        <span className="text-xs text-muted-foreground ml-auto">
                                          (network_mode)
                                        </span>
                                      )}
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
              <Separator className="my-2" />
              {/* Networks Management */}
              <div>
                <div className="flex items-center justify-between mb-2 w-full box-border">
                  <span className="font-bold text-md">Networks</span>
                  <Button size="sm" onClick={addNetwork}>
                    + Add
                  </Button>
                </div>
                <div className="flex flex-col gap-2 w-full box-border">
                  {networks.map((n, idx) => (
                    <Card
                      key={idx}
                      className={`relative p-2 pr-8 cursor-pointer flex flex-col justify-center ${selectedType === "network" && selectedNetworkIdx === idx ? "border-primary border-2" : ""}`}
                      onClick={() => {
                        setSelectedType("network");
                        setSelectedNetworkIdx(idx);
                        setSelectedIdx(null);
                        setSelectedVolumeIdx(null);
                      }}
                    >
                      <div className="flex flex-col items-start">
                        <div className="font-semibold text-left">
                          {n.name || (
                            <span className="text-muted-foreground">
                              (unnamed)
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground text-left">
                          {n.driver || <span>no driver</span>}
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNetwork(idx);
                        }}
                        className="absolute top-1 right-1"
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
              <Separator className="my-2" />
              {/* Volumes Management */}
              <div>
                <div className="flex items-center justify-between mb-2 w-full box-border">
                  <span className="font-bold text-md">Volumes</span>
                  <Button size="sm" onClick={addVolume}>
                    + Add
                  </Button>
                </div>
                <div className="flex flex-col gap-2 w-full box-border">
                  {volumes.map((v, idx) => (
                    <Card
                      key={idx}
                      className={`relative p-2 pr-8 cursor-pointer flex flex-col justify-center ${selectedType === "volume" && selectedVolumeIdx === idx ? "border-primary border-2" : ""}`}
                      onClick={() => {
                        setSelectedType("volume");
                        setSelectedVolumeIdx(idx);
                        setSelectedIdx(null);
                        setSelectedNetworkIdx(null);
                      }}
                    >
                      <div className="flex flex-col items-start">
                        <div className="font-semibold text-left">
                          {v.name || (
                            <span className="text-muted-foreground">
                              (unnamed)
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground text-left">
                          {v.driver || <span>no driver</span>}
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeVolume(idx);
                        }}
                        className="absolute top-1 right-1"
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
            </aside>
            {/* Configuration Panel */}
            <section className="h-full min-h-0 max-h-full md:h-[400px] lg:h-full p-2 md:p-4 flex flex-col gap-2 md:gap-4 bg-background border-r overflow-y-auto box-border">
              {selectedType === "service" && (
                <>
                  <div className="mb-2 w-full box-border flex items-center justify-between">
                    <span className="font-bold text-lg">
                      Service Configuration
                    </span>
                  </div>
                  <div className="flex flex-col gap-4 w-full box-border">
                    <div>
                      <Label className="mb-1 block">Name</Label>
                      <Input
                        value={svc.name}
                        onChange={(e) =>
                          updateServiceField("name", e.target.value)
                        }
                        placeholder="e.g. proxy"
                      />
                    </div>
                    <div>
                      <Label className="mb-1 block">Container Name</Label>
                      <Input
                        value={svc.container_name || ""}
                        onChange={(e) =>
                          updateServiceField("container_name", e.target.value)
                        }
                        placeholder="e.g. my-traefik"
                      />
                    </div>
                    <div>
                      <Label className="mb-1 block">Image</Label>
                      <Input
                        value={svc.image}
                        onChange={(e) =>
                          updateServiceField("image", e.target.value)
                        }
                        placeholder="e.g. traefik:latest"
                      />
                    </div>
                    <div>
                      <Label className="mb-1 block">Command</Label>
                      <Input
                        value={svc.command}
                        onChange={(e) =>
                          updateServiceField("command", e.target.value)
                        }
                        placeholder="e.g. npm start"
                      />
                    </div>
                    <div>
                      <Label className="mb-1 block">Restart Policy</Label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-between"
                          >
                            {restartOptions.find(
                              (opt) => opt.value === svc.restart
                            )?.label || "None"}
                            <svg
                              className="ml-2"
                              width="16"
                              height="16"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                            >
                              <path d="M6 9l6 6 6-6" />
                            </svg>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-full">
                          {restartOptions.map((opt) => (
                            <DropdownMenuItem
                              key={opt.value}
                              onClick={() =>
                                updateServiceField("restart", opt.value)
                              }
                            >
                              {opt.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {/* Ports */}
                    <div>
                      <Label className="mb-1 block">Ports</Label>
                      <div className="flex flex-col gap-2">
                        {svc.ports.map((port, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <Input
                              type="number"
                              min="1"
                              max="65535"
                              value={port.host}
                              onChange={(e) =>
                                updatePortField(idx, "host", e.target.value)
                              }
                              placeholder="Host"
                              className="w-1/3"
                            />
                            <span>→</span>
                            <Input
                              type="number"
                              min="1"
                              max="65535"
                              value={port.container}
                              onChange={(e) =>
                                updatePortField(
                                  idx,
                                  "container",
                                  e.target.value
                                )
                              }
                              placeholder="Container"
                              className="w-1/3"
                            />
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-16 justify-between"
                                >
                                  {port.protocol === "none" || !port.protocol
                                    ? "none"
                                    : port.protocol.toUpperCase()}
                                  <svg
                                    className="ml-1"
                                    width="12"
                                    height="12"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M6 9l6 6 6-6" />
                                  </svg>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem
                                  onClick={() =>
                                    updatePortField(idx, "protocol", "none")
                                  }
                                >
                                  None
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    updatePortField(idx, "protocol", "tcp")
                                  }
                                >
                                  TCP
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    updatePortField(idx, "protocol", "udp")
                                  }
                                >
                                  UDP
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => removePortField(idx)}
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
                          </div>
                        ))}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={addPortField}
                        >
                          + Add Port
                        </Button>
                      </div>
                    </div>
                    {/* Expose */}
                    <div>
                      <Label className="mb-1 block">Expose</Label>
                      <div className="flex flex-col gap-2">
                        {svc.expose.map((port, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <Input
                              type="number"
                              min="1"
                              max="65535"
                              value={port}
                              onChange={(e) =>
                                updateListField(
                                  "expose",
                                  idx,
                                  e.target.value.replace(/[^0-9]/g, "")
                                )
                              }
                              placeholder="Port number"
                              className="flex-1"
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => removeListField("expose", idx)}
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
                          </div>
                        ))}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addListField("expose")}
                        >
                          + Add Expose Port
                        </Button>
                      </div>
                    </div>
                    {/* Volumes */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="block">Volumes</Label>
                        <div className="flex gap-2 items-center">
                          <span className="text-xs text-muted-foreground">
                            Syntax:
                          </span>
                          <Toggle
                            pressed={svc.volumes_syntax === "array"}
                            onPressedChange={(pressed) =>
                              updateServiceField(
                                "volumes_syntax",
                                pressed ? "array" : "dict"
                              )
                            }
                            aria-label="Array syntax"
                            className="border rounded px-2 py-1 text-xs"
                          >
                            Array
                          </Toggle>
                          <Toggle
                            pressed={svc.volumes_syntax === "dict"}
                            onPressedChange={(pressed) =>
                              updateServiceField(
                                "volumes_syntax",
                                pressed ? "dict" : "array"
                              )
                            }
                            aria-label="Dictionary syntax"
                            className="border rounded px-2 py-1 text-xs"
                          >
                            Dict
                          </Toggle>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {svc.volumes.map((vol, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <Input
                              value={vol.host}
                              onChange={(e) =>
                                updateVolumeField(idx, "host", e.target.value)
                              }
                              placeholder="Host path/volume"
                              className="w-1/2"
                            />
                            <span>→</span>
                            <Input
                              value={vol.container}
                              onChange={(e) =>
                                updateVolumeField(
                                  idx,
                                  "container",
                                  e.target.value
                                )
                              }
                              placeholder="Container path"
                              className="w-1/2"
                            />
                            <div className="flex items-center gap-1">
                              <Toggle
                                pressed={vol.read_only || false}
                                onPressedChange={(v) =>
                                  updateVolumeField(idx, "read_only", v)
                                }
                                aria-label="Read Only"
                                className="border rounded px-2 py-1"
                              >
                                <span className="select-none text-xs">RO</span>
                              </Toggle>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => removeVolumeField(idx)}
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
                          </div>
                        ))}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={addVolumeField}
                        >
                          + Add Volume
                        </Button>
                      </div>
                    </div>
                    {/* Environment Variables */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Label className="block">Environment Variables</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <AlertCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="font-semibold mb-1">
                                Privacy Notice
                              </p>
                              <p>
                                All information you add here stays in your
                                browser and is never sent to any server. Click
                                the × button on each line to remove variables,
                                or use "Clear All" to remove them all at once.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="flex gap-2 items-center">
                          <span className="text-xs text-muted-foreground">
                            Syntax:
                          </span>
                          <Toggle
                            pressed={svc.environment_syntax === "array"}
                            onPressedChange={(pressed) =>
                              updateServiceField(
                                "environment_syntax",
                                pressed ? "array" : "dict"
                              )
                            }
                            aria-label="Array syntax"
                            className="border rounded px-2 py-1 text-xs"
                          >
                            Array
                          </Toggle>
                          <Toggle
                            pressed={svc.environment_syntax === "dict"}
                            onPressedChange={(pressed) =>
                              updateServiceField(
                                "environment_syntax",
                                pressed ? "dict" : "array"
                              )
                            }
                            aria-label="Dictionary syntax"
                            className="border rounded px-2 py-1 text-xs"
                          >
                            Dict
                          </Toggle>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {svc.environment.map((env, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <Input
                              value={env.key}
                              onChange={(e) =>
                                updateListField("environment", idx, {
                                  ...env,
                                  key: e.target.value,
                                })
                              }
                              placeholder="KEY"
                              className="w-1/2"
                            />
                            <Input
                              value={env.value}
                              onChange={(e) =>
                                updateListField("environment", idx, {
                                  ...env,
                                  value: e.target.value,
                                })
                              }
                              placeholder="value"
                              className="w-1/2"
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() =>
                                removeListField("environment", idx)
                              }
                              title="Remove this environment variable"
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
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addListField("environment")}
                          >
                            + Add Variable
                          </Button>
                          {svc.environment.length > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (typeof selectedIdx !== "number") return;
                                const newServices = [...services];
                                newServices[selectedIdx].environment = [];
                                setServices(newServices);
                              }}
                            >
                              Clear All
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Advanced Section */}
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <Button variant="outline" className="mt-4 w-full">
                          Advanced Options
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-4 flex flex-col gap-4">
                        {/* Healthcheck */}
                        <div>
                          <Label className="mb-1 block">Healthcheck</Label>
                          <Input
                            value={svc.healthcheck?.test || ""}
                            onChange={(e) =>
                              updateHealthcheckField("test", e.target.value)
                            }
                            placeholder="Test command (e.g. CMD curl -f http://localhost)"
                          />
                          <div className="flex gap-2 mt-2">
                            <Input
                              value={svc.healthcheck?.interval || ""}
                              onChange={(e) =>
                                updateHealthcheckField(
                                  "interval",
                                  e.target.value
                                )
                              }
                              placeholder="Interval (e.g. 1m30s)"
                              className="w-1/2"
                            />
                            <Input
                              value={svc.healthcheck?.timeout || ""}
                              onChange={(e) =>
                                updateHealthcheckField(
                                  "timeout",
                                  e.target.value
                                )
                              }
                              placeholder="Timeout (e.g. 10s)"
                              className="w-1/2"
                            />
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Input
                              value={svc.healthcheck?.retries || ""}
                              onChange={(e) =>
                                updateHealthcheckField(
                                  "retries",
                                  e.target.value
                                )
                              }
                              placeholder="Retries (e.g. 3)"
                              className="w-1/2"
                            />
                            <Input
                              value={svc.healthcheck?.start_period || ""}
                              onChange={(e) =>
                                updateHealthcheckField(
                                  "start_period",
                                  e.target.value
                                )
                              }
                              placeholder="Start period (e.g. 40s)"
                              className="w-1/2"
                            />
                          </div>
                          <Input
                            value={svc.healthcheck?.start_interval || ""}
                            onChange={(e) =>
                              updateHealthcheckField(
                                "start_interval",
                                e.target.value
                              )
                            }
                            placeholder="Start interval (e.g. 5s)"
                            className="mt-2"
                          />
                        </div>
                        {/* Depends On */}
                        <div>
                          <Label className="mb-1 block">Depends On</Label>
                          <div className="flex flex-col gap-2">
                            {svc.depends_on?.map((dep, idx) => (
                              <div
                                key={idx}
                                className="flex gap-2 items-center"
                              >
                                <Input
                                  value={dep}
                                  onChange={(e) =>
                                    updateDependsOn(idx, e.target.value)
                                  }
                                  placeholder="Service name"
                                />
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => removeDependsOn(idx)}
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
                              </div>
                            ))}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={addDependsOn}
                            >
                              + Add Dependency
                            </Button>
                          </div>
                        </div>
                        {/* Resource Allocation */}
                        <div>
                          <Label className="mb-1 block">
                            Resource Allocation
                          </Label>
                          <div className="space-y-4">
                            <div>
                              <Label className="mb-1 block text-sm font-medium">
                                Limits
                              </Label>
                              <div className="flex gap-2">
                                <div className="flex-1">
                                  <Label className="mb-1 block text-xs text-muted-foreground">
                                    CPUs
                                  </Label>
                                  <Input
                                    value={
                                      svc.deploy?.resources?.limits?.cpus || ""
                                    }
                                    onChange={(e) =>
                                      updateResourceField(
                                        "limits",
                                        "cpus",
                                        e.target.value
                                      )
                                    }
                                    placeholder="e.g. 0.5 or 2"
                                  />
                                </div>
                                <div className="flex-1">
                                  <Label className="mb-1 block text-xs text-muted-foreground">
                                    Memory
                                  </Label>
                                  <Input
                                    value={
                                      svc.deploy?.resources?.limits?.memory ||
                                      ""
                                    }
                                    onChange={(e) =>
                                      updateResourceField(
                                        "limits",
                                        "memory",
                                        e.target.value
                                      )
                                    }
                                    placeholder="e.g. 512m or 2g"
                                  />
                                </div>
                              </div>
                            </div>
                            <div>
                              <Label className="mb-1 block text-sm font-medium">
                                Reservations
                              </Label>
                              <div className="flex gap-2">
                                <div className="flex-1">
                                  <Label className="mb-1 block text-xs text-muted-foreground">
                                    CPUs
                                  </Label>
                                  <Input
                                    value={
                                      svc.deploy?.resources?.reservations
                                        ?.cpus || ""
                                    }
                                    onChange={(e) =>
                                      updateResourceField(
                                        "reservations",
                                        "cpus",
                                        e.target.value
                                      )
                                    }
                                    placeholder="e.g. 0.25 or 1"
                                  />
                                </div>
                                <div className="flex-1">
                                  <Label className="mb-1 block text-xs text-muted-foreground">
                                    Memory
                                  </Label>
                                  <Input
                                    value={
                                      svc.deploy?.resources?.reservations
                                        ?.memory || ""
                                    }
                                    onChange={(e) =>
                                      updateResourceField(
                                        "reservations",
                                        "memory",
                                        e.target.value
                                      )
                                    }
                                    placeholder="e.g. 256m or 1g"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Entrypoint */}
                        <div>
                          <Label className="mb-1 block">Entrypoint</Label>
                          <Input
                            value={svc.entrypoint || ""}
                            onChange={(e) =>
                              updateServiceField("entrypoint", e.target.value)
                            }
                            placeholder="Entrypoint"
                          />
                        </div>
                        {/* Env File */}
                        <div>
                          <Label className="mb-1 block">Env File</Label>
                          <Input
                            value={svc.env_file || ""}
                            onChange={(e) =>
                              updateServiceField("env_file", e.target.value)
                            }
                            placeholder=".env file path"
                          />
                        </div>
                        {/* Extra Hosts */}
                        <div>
                          <Label className="mb-1 block">Extra Hosts</Label>
                          <Input
                            value={svc.extra_hosts?.join(",") || ""}
                            onChange={(e) =>
                              updateServiceField(
                                "extra_hosts",
                                e.target.value.split(",")
                              )
                            }
                            placeholder="host1:ip1,host2:ip2"
                          />
                        </div>
                        {/* DNS */}
                        <div>
                          <Label className="mb-1 block">DNS</Label>
                          <Input
                            value={svc.dns?.join(",") || ""}
                            onChange={(e) =>
                              updateServiceField(
                                "dns",
                                e.target.value.split(",")
                              )
                            }
                            placeholder="8.8.8.8,8.8.4.4"
                          />
                        </div>
                        {/* Networks */}
                        <div>
                          <Label className="mb-1 block">Networks</Label>
                          <Input
                            value={svc.networks?.join(",") || ""}
                            onChange={(e) =>
                              updateServiceField(
                                "networks",
                                e.target.value.split(",")
                              )
                            }
                            placeholder="network1,network2"
                          />
                        </div>
                        {/* User */}
                        <div>
                          <Label className="mb-1 block">User</Label>
                          <Input
                            value={svc.user || ""}
                            onChange={(e) =>
                              updateServiceField("user", e.target.value)
                            }
                            placeholder="user"
                          />
                        </div>
                        {/* Working Dir */}
                        <div>
                          <Label className="mb-1 block">Working Dir</Label>
                          <Input
                            value={svc.working_dir || ""}
                            onChange={(e) =>
                              updateServiceField("working_dir", e.target.value)
                            }
                            placeholder="/app"
                          />
                        </div>
                        {/* Labels */}
                        <div>
                          <Label className="mb-1 block">Labels</Label>
                          <div className="flex flex-col gap-2">
                            {svc.labels?.map((label, idx) => (
                              <div
                                key={idx}
                                className="flex gap-2 items-center"
                              >
                                <Input
                                  value={label.key}
                                  onChange={(e) => {
                                    const newLabels = [...(svc.labels || [])];
                                    newLabels[idx] = {
                                      ...newLabels[idx],
                                      key: e.target.value,
                                    };
                                    updateServiceField("labels", newLabels);
                                  }}
                                  placeholder="Key"
                                  className="w-1/2"
                                />
                                <Input
                                  value={label.value}
                                  onChange={(e) => {
                                    const newLabels = [...(svc.labels || [])];
                                    newLabels[idx] = {
                                      ...newLabels[idx],
                                      value: e.target.value,
                                    };
                                    updateServiceField("labels", newLabels);
                                  }}
                                  placeholder="Value"
                                  className="w-1/2"
                                />
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => {
                                    const newLabels = [...(svc.labels || [])];
                                    newLabels.splice(idx, 1);
                                    updateServiceField("labels", newLabels);
                                  }}
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
                              </div>
                            ))}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateServiceField("labels", [
                                  ...(svc.labels || []),
                                  { key: "", value: "" },
                                ])
                              }
                            >
                              + Add Label
                            </Button>
                          </div>
                        </div>
                        {/* Privileged */}
                        <div className="flex items-center gap-2">
                          <Toggle
                            pressed={!!svc.privileged}
                            onPressedChange={(v) =>
                              updateServiceField("privileged", v)
                            }
                            aria-label="Privileged"
                            className="border rounded px-2 py-1"
                          >
                            <span className="select-none">Privileged</span>
                          </Toggle>
                        </div>
                        {/* Read Only */}
                        <div className="flex items-center gap-2">
                          <Toggle
                            pressed={!!svc.read_only}
                            onPressedChange={(v) =>
                              updateServiceField("read_only", v)
                            }
                            aria-label="Read Only"
                            className="border rounded px-2 py-1"
                          >
                            <span className="select-none">Read Only</span>
                          </Toggle>
                        </div>
                        {/* Shared Memory Size */}
                        <div>
                          <Label className="mb-1 block">
                            Shared Memory Size
                          </Label>
                          <Input
                            value={svc.shm_size || ""}
                            onChange={(e) =>
                              updateServiceField("shm_size", e.target.value)
                            }
                            placeholder="e.g. 1gb, 512m"
                          />
                        </div>
                        {/* Security Options */}
                        <div>
                          <Label className="mb-1 block">Security Options</Label>
                          <div className="flex flex-col gap-2">
                            {svc.security_opt?.map((opt, idx) => (
                              <div
                                key={idx}
                                className="flex gap-2 items-center"
                              >
                                <Input
                                  value={opt}
                                  onChange={(e) =>
                                    updateSecurityOpt(idx, e.target.value)
                                  }
                                  placeholder="e.g. seccomp:unconfined"
                                />
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => removeSecurityOpt(idx)}
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
                              </div>
                            ))}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={addSecurityOpt}
                            >
                              + Add Security Option
                            </Button>
                          </div>
                        </div>
                        {/* Network Mode */}
                        <div>
                          <Label className="mb-1 block">Network Mode</Label>
                          <Input
                            value={svc.network_mode || ""}
                            onChange={(e) =>
                              updateServiceField("network_mode", e.target.value)
                            }
                            placeholder="e.g. host, bridge, none, service:name"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Options: host, bridge, none, service:service_name
                          </p>
                        </div>
                        {/* Cap Add */}
                        <div>
                          <Label className="mb-1 block">Add Capabilities</Label>
                          <div className="flex flex-col gap-2">
                            {svc.cap_add?.map((cap, idx) => (
                              <div
                                key={idx}
                                className="flex gap-2 items-center"
                              >
                                <Input
                                  value={cap}
                                  onChange={(e) =>
                                    updateCapAdd(idx, e.target.value)
                                  }
                                  placeholder="e.g. NET_ADMIN, SYS_MODULE"
                                />
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => removeCapAdd(idx)}
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
                              </div>
                            ))}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={addCapAdd}
                            >
                              + Add Capability
                            </Button>
                          </div>
                        </div>
                        {/* Cap Drop */}
                        <div>
                          <Label className="mb-1 block">
                            Drop Capabilities
                          </Label>
                          <div className="flex flex-col gap-2">
                            {svc.cap_drop?.map((cap, idx) => (
                              <div
                                key={idx}
                                className="flex gap-2 items-center"
                              >
                                <Input
                                  value={cap}
                                  onChange={(e) =>
                                    updateCapDrop(idx, e.target.value)
                                  }
                                  placeholder="e.g. ALL, CHOWN"
                                />
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => removeCapDrop(idx)}
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
                              </div>
                            ))}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={addCapDrop}
                            >
                              + Drop Capability
                            </Button>
                          </div>
                        </div>
                        {/* Sysctls */}
                        <div>
                          <Label className="mb-1 block">Sysctls</Label>
                          <div className="flex flex-col gap-2">
                            {svc.sysctls?.map((sysctl, idx) => (
                              <div
                                key={idx}
                                className="flex gap-2 items-center"
                              >
                                <Input
                                  value={sysctl.key}
                                  onChange={(e) =>
                                    updateSysctl(idx, "key", e.target.value)
                                  }
                                  placeholder="Key (e.g. net.ipv4.ip_forward)"
                                  className="w-1/2"
                                />
                                <Input
                                  value={sysctl.value}
                                  onChange={(e) =>
                                    updateSysctl(idx, "value", e.target.value)
                                  }
                                  placeholder="Value (e.g. 1)"
                                  className="w-1/2"
                                />
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => removeSysctl(idx)}
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
                              </div>
                            ))}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={addSysctl}
                            >
                              + Add Sysctl
                            </Button>
                          </div>
                        </div>
                        {/* Devices */}
                        <div>
                          <Label className="mb-1 block">Devices</Label>
                          <div className="flex flex-col gap-2">
                            {svc.devices?.map((device, idx) => (
                              <div
                                key={idx}
                                className="flex gap-2 items-center"
                              >
                                <Input
                                  value={device}
                                  onChange={(e) =>
                                    updateDevice(idx, e.target.value)
                                  }
                                  placeholder="e.g. /dev/ttyUSB0:/dev/ttyUSB0"
                                />
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => removeDevice(idx)}
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
                              </div>
                            ))}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={addDevice}
                            >
                              + Add Device
                            </Button>
                          </div>
                        </div>
                        {/* Tmpfs */}
                        <div>
                          <Label className="mb-1 block">Tmpfs</Label>
                          <div className="flex flex-col gap-2">
                            {svc.tmpfs?.map((tmpfs, idx) => (
                              <div
                                key={idx}
                                className="flex gap-2 items-center"
                              >
                                <Input
                                  value={tmpfs}
                                  onChange={(e) =>
                                    updateTmpfs(idx, e.target.value)
                                  }
                                  placeholder="e.g. /tmp:rw,noexec,nosuid,size=100m"
                                />
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => removeTmpfs(idx)}
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
                              </div>
                            ))}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={addTmpfs}
                            >
                              + Add Tmpfs
                            </Button>
                          </div>
                        </div>
                        {/* Ulimits */}
                        <div>
                          <Label className="mb-1 block">Ulimits</Label>
                          <div className="flex flex-col gap-2">
                            {svc.ulimits?.map((ulimit, idx) => (
                              <div
                                key={idx}
                                className="flex gap-2 items-center"
                              >
                                <Input
                                  value={ulimit.name}
                                  onChange={(e) =>
                                    updateUlimit(idx, "name", e.target.value)
                                  }
                                  placeholder="Name (e.g. nofile)"
                                  className="w-1/3"
                                />
                                <Input
                                  value={ulimit.soft || ""}
                                  onChange={(e) =>
                                    updateUlimit(idx, "soft", e.target.value)
                                  }
                                  placeholder="Soft limit"
                                  className="w-1/3"
                                />
                                <Input
                                  value={ulimit.hard || ""}
                                  onChange={(e) =>
                                    updateUlimit(idx, "hard", e.target.value)
                                  }
                                  placeholder="Hard limit"
                                  className="w-1/3"
                                />
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => removeUlimit(idx)}
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
                              </div>
                            ))}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={addUlimit}
                            >
                              + Add Ulimit
                            </Button>
                          </div>
                        </div>
                        {/* Init */}
                        <div className="flex items-center gap-2">
                          <Toggle
                            pressed={!!svc.init}
                            onPressedChange={(v) =>
                              updateServiceField("init", v)
                            }
                            aria-label="Init"
                            className="border rounded px-2 py-1"
                          >
                            <span className="select-none">Init (PID 1)</span>
                          </Toggle>
                        </div>
                        {/* Stop Grace Period */}
                        <div>
                          <Label className="mb-1 block">
                            Stop Grace Period
                          </Label>
                          <Input
                            value={svc.stop_grace_period || ""}
                            onChange={(e) =>
                              updateServiceField(
                                "stop_grace_period",
                                e.target.value
                              )
                            }
                            placeholder="e.g. 10s, 1m30s"
                          />
                        </div>
                        {/* Stop Signal */}
                        <div>
                          <Label className="mb-1 block">Stop Signal</Label>
                          <Input
                            value={svc.stop_signal || ""}
                            onChange={(e) =>
                              updateServiceField("stop_signal", e.target.value)
                            }
                            placeholder="e.g. SIGTERM, SIGKILL"
                          />
                        </div>
                        {/* TTY */}
                        <div className="flex items-center gap-2">
                          <Toggle
                            pressed={!!svc.tty}
                            onPressedChange={(v) =>
                              updateServiceField("tty", v)
                            }
                            aria-label="TTY"
                            className="border rounded px-2 py-1"
                          >
                            <span className="select-none">TTY</span>
                          </Toggle>
                        </div>
                        {/* Stdin Open */}
                        <div className="flex items-center gap-2">
                          <Toggle
                            pressed={!!svc.stdin_open}
                            onPressedChange={(v) =>
                              updateServiceField("stdin_open", v)
                            }
                            aria-label="Stdin Open"
                            className="border rounded px-2 py-1"
                          >
                            <span className="select-none">Stdin Open</span>
                          </Toggle>
                        </div>
                        {/* Hostname */}
                        <div>
                          <Label className="mb-1 block">Hostname</Label>
                          <Input
                            value={svc.hostname || ""}
                            onChange={(e) =>
                              updateServiceField("hostname", e.target.value)
                            }
                            placeholder="Container hostname"
                          />
                        </div>
                        {/* Domainname */}
                        <div>
                          <Label className="mb-1 block">Domainname</Label>
                          <Input
                            value={svc.domainname || ""}
                            onChange={(e) =>
                              updateServiceField("domainname", e.target.value)
                            }
                            placeholder="Container domainname"
                          />
                        </div>
                        {/* MAC Address */}
                        <div>
                          <Label className="mb-1 block">MAC Address</Label>
                          <Input
                            value={svc.mac_address || ""}
                            onChange={(e) =>
                              updateServiceField("mac_address", e.target.value)
                            }
                            placeholder="e.g. 02:42:ac:11:65:43"
                          />
                        </div>
                        {/* IPC Mode */}
                        <div>
                          <Label className="mb-1 block">IPC Mode</Label>
                          <Input
                            value={svc.ipc_mode || ""}
                            onChange={(e) =>
                              updateServiceField("ipc_mode", e.target.value)
                            }
                            placeholder="e.g. host, container:name, shareable"
                          />
                        </div>
                        {/* PID */}
                        <div>
                          <Label className="mb-1 block">PID</Label>
                          <Input
                            value={svc.pid || ""}
                            onChange={(e) =>
                              updateServiceField("pid", e.target.value)
                            }
                            placeholder="e.g. host, container:name"
                          />
                        </div>
                        {/* UTS */}
                        <div>
                          <Label className="mb-1 block">UTS</Label>
                          <Input
                            value={svc.uts || ""}
                            onChange={(e) =>
                              updateServiceField("uts", e.target.value)
                            }
                            placeholder="e.g. host, container:name"
                          />
                        </div>
                        {/* Cgroup Parent */}
                        <div>
                          <Label className="mb-1 block">Cgroup Parent</Label>
                          <Input
                            value={svc.cgroup_parent || ""}
                            onChange={(e) =>
                              updateServiceField(
                                "cgroup_parent",
                                e.target.value
                              )
                            }
                            placeholder="e.g. /system.slice"
                          />
                        </div>
                        {/* Isolation */}
                        <div>
                          <Label className="mb-1 block">Isolation</Label>
                          <Input
                            value={svc.isolation || ""}
                            onChange={(e) =>
                              updateServiceField("isolation", e.target.value)
                            }
                            placeholder="e.g. default, process, hyperv"
                          />
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </>
              )}

              {selectedType === "network" && selectedNetworkIdx !== null && (
                <>
                  <div className="mb-2 w-full box-border flex items-center justify-between">
                    <span className="font-bold text-lg">
                      Network Configuration
                    </span>
                  </div>
                  <div className="flex flex-col gap-4 w-full box-border">
                    <div>
                      <Label className="mb-1 block">Name</Label>
                      <Input
                        value={networks[selectedNetworkIdx]?.name || ""}
                        onChange={(e) =>
                          updateNetwork(
                            selectedNetworkIdx,
                            "name",
                            e.target.value
                          )
                        }
                        placeholder="e.g. frontend"
                      />
                    </div>
                    <div>
                      <Label className="mb-1 block">Driver</Label>
                      <Input
                        value={networks[selectedNetworkIdx]?.driver || ""}
                        onChange={(e) =>
                          updateNetwork(
                            selectedNetworkIdx,
                            "driver",
                            e.target.value
                          )
                        }
                        placeholder="e.g. bridge"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Toggle
                        pressed={!!networks[selectedNetworkIdx]?.attachable}
                        onPressedChange={(v) =>
                          updateNetwork(selectedNetworkIdx, "attachable", v)
                        }
                        aria-label="Attachable"
                        className="border rounded px-2 py-1"
                      >
                        <span className="select-none">Attachable</span>
                      </Toggle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Toggle
                        pressed={!!networks[selectedNetworkIdx]?.external}
                        onPressedChange={(v) =>
                          updateNetwork(selectedNetworkIdx, "external", v)
                        }
                        aria-label="External"
                        className="border rounded px-2 py-1"
                      >
                        <span className="select-none">External</span>
                      </Toggle>
                    </div>
                    {networks[selectedNetworkIdx]?.external && (
                      <div>
                        <Label className="mb-1 block">External Name</Label>
                        <Input
                          value={
                            networks[selectedNetworkIdx]?.name_external || ""
                          }
                          onChange={(e) =>
                            updateNetwork(
                              selectedNetworkIdx,
                              "name_external",
                              e.target.value
                            )
                          }
                          placeholder="External network name"
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Toggle
                        pressed={!!networks[selectedNetworkIdx]?.internal}
                        onPressedChange={(v) =>
                          updateNetwork(selectedNetworkIdx, "internal", v)
                        }
                        aria-label="Internal"
                        className="border rounded px-2 py-1"
                      >
                        <span className="select-none">Internal</span>
                      </Toggle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Toggle
                        pressed={!!networks[selectedNetworkIdx]?.enable_ipv6}
                        onPressedChange={(v) =>
                          updateNetwork(selectedNetworkIdx, "enable_ipv6", v)
                        }
                        aria-label="Enable IPv6"
                        className="border rounded px-2 py-1"
                      >
                        <span className="select-none">Enable IPv6</span>
                      </Toggle>
                    </div>
                  </div>
                </>
              )}

              {selectedType === "volume" && selectedVolumeIdx !== null && (
                <>
                  <div className="mb-2 w-full box-border flex items-center justify-between">
                    <span className="font-bold text-lg">
                      Volume Configuration
                    </span>
                  </div>
                  <div className="flex flex-col gap-4 w-full box-border">
                    <div>
                      <Label className="mb-1 block">Name</Label>
                      <Input
                        value={volumes[selectedVolumeIdx]?.name || ""}
                        onChange={(e) =>
                          updateVolume(
                            selectedVolumeIdx,
                            "name",
                            e.target.value
                          )
                        }
                        placeholder="e.g. webdata"
                      />
                    </div>
                    <div>
                      <Label className="mb-1 block">Driver</Label>
                      <Input
                        value={volumes[selectedVolumeIdx]?.driver || ""}
                        onChange={(e) =>
                          updateVolume(
                            selectedVolumeIdx,
                            "driver",
                            e.target.value
                          )
                        }
                        placeholder="e.g. local"
                      />
                    </div>
                    {/* Driver Options */}
                    <div>
                      <Label className="mb-1 block">Driver Options</Label>
                      <div className="flex flex-col gap-2">
                        <Input
                          value={
                            volumes[selectedVolumeIdx]?.driver_opts_type || ""
                          }
                          onChange={(e) =>
                            updateVolume(
                              selectedVolumeIdx,
                              "driver_opts_type",
                              e.target.value
                            )
                          }
                          placeholder="Type (e.g. none)"
                        />
                        <Input
                          value={
                            volumes[selectedVolumeIdx]?.driver_opts_device || ""
                          }
                          onChange={(e) =>
                            updateVolume(
                              selectedVolumeIdx,
                              "driver_opts_device",
                              e.target.value
                            )
                          }
                          placeholder="Device (e.g. /path/to/device)"
                        />
                        <Input
                          value={
                            volumes[selectedVolumeIdx]?.driver_opts_o || ""
                          }
                          onChange={(e) =>
                            updateVolume(
                              selectedVolumeIdx,
                              "driver_opts_o",
                              e.target.value
                            )
                          }
                          placeholder="Options (e.g. bind)"
                        />
                      </div>
                    </div>
                    {/* Labels */}
                    <div>
                      <Label className="mb-1 block">Labels</Label>
                      <div className="flex flex-col gap-2">
                        {volumes[selectedVolumeIdx]?.labels?.map(
                          (label, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                              <Input
                                value={label.key}
                                onChange={(e) => {
                                  const newLabels = [
                                    ...(volumes[selectedVolumeIdx]?.labels ||
                                      []),
                                  ];
                                  newLabels[idx] = {
                                    ...newLabels[idx],
                                    key: e.target.value,
                                  };
                                  updateVolume(
                                    selectedVolumeIdx,
                                    "labels",
                                    newLabels
                                  );
                                }}
                                placeholder="Key"
                                className="w-1/2"
                              />
                              <Input
                                value={label.value}
                                onChange={(e) => {
                                  const newLabels = [
                                    ...(volumes[selectedVolumeIdx]?.labels ||
                                      []),
                                  ];
                                  newLabels[idx] = {
                                    ...newLabels[idx],
                                    value: e.target.value,
                                  };
                                  updateVolume(
                                    selectedVolumeIdx,
                                    "labels",
                                    newLabels
                                  );
                                }}
                                placeholder="Value"
                                className="w-1/2"
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  const newLabels = [
                                    ...(volumes[selectedVolumeIdx]?.labels ||
                                      []),
                                  ];
                                  newLabels.splice(idx, 1);
                                  updateVolume(
                                    selectedVolumeIdx,
                                    "labels",
                                    newLabels
                                  );
                                }}
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
                            </div>
                          )
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateVolume(selectedVolumeIdx, "labels", [
                              ...(volumes[selectedVolumeIdx]?.labels || []),
                              { key: "", value: "" },
                            ])
                          }
                        >
                          + Add Label
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Toggle
                        pressed={!!volumes[selectedVolumeIdx]?.external}
                        onPressedChange={(v) =>
                          updateVolume(selectedVolumeIdx, "external", v)
                        }
                        aria-label="External"
                        className="border rounded px-2 py-1"
                      >
                        <span className="select-none">External</span>
                      </Toggle>
                    </div>
                    {volumes[selectedVolumeIdx]?.external && (
                      <div>
                        <Label className="mb-1 block">External Name</Label>
                        <Input
                          value={
                            volumes[selectedVolumeIdx]?.name_external || ""
                          }
                          onChange={(e) =>
                            updateVolume(
                              selectedVolumeIdx,
                              "name_external",
                              e.target.value
                            )
                          }
                          placeholder="External volume name"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
            </section>
            {/* Docker Compose File Panel */}
            <section className="h-full min-h-0 max-h-full md:h-[600px] lg:h-full pl-2 md:pl-4 pr-2 md:pr-3 pb-4 pt-2 flex flex-col bg-background box-border overflow-hidden md:col-span-2 lg:col-span-2">
              <div className="mb-2 w-full box-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span className="font-bold text-base sm:text-lg">
                  Docker Compose File
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {validationError && (
                    <Alert variant="destructive" className="py-1 px-2 text-xs">
                      <AlertCircle className="h-3 w-3" />
                      <AlertTitle className="text-xs">
                        {validationError}
                      </AlertTitle>
                    </Alert>
                  )}
                  {validationSuccess && (
                    <Alert className="py-1 px-2 text-xs bg-green-500/20">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      <AlertTitle className="text-xs text-green-500">
                        Valid YAML
                      </AlertTitle>
                    </Alert>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={validateAndReformat}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Validate & Reformat
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline">
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
                className="flex-1 w-full h-full min-h-[300px] md:min-h-[400px] min-w-0 overflow-hidden"
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
        open={templateDetailOpen}
        onOpenChange={(open) => {
          setTemplateDetailOpen(open);
          if (!open) {
            setSelectedTemplate(null);
            setTemplateDetailTab("overview");
          }
        }}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-2xl md:max-w-4xl lg:max-w-5xl max-h-[95vh] sm:max-h-[90vh] flex flex-col p-4 sm:p-6">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>
              {selectedTemplate?.name || "Template Details"}
            </DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-hidden">
              {/* Tab Buttons */}
              <div className="flex gap-2 sm:gap-3 border-b pb-2 flex-shrink-0">
                <Button
                  variant={
                    templateDetailTab === "overview" ? "default" : "ghost"
                  }
                  size="sm"
                  className="text-xs sm:text-sm"
                  onClick={() => setTemplateDetailTab("overview")}
                >
                  Overview
                </Button>
                <Button
                  variant={
                    templateDetailTab === "compose" ? "default" : "ghost"
                  }
                  size="sm"
                  className="text-xs sm:text-sm"
                  onClick={() => setTemplateDetailTab("compose")}
                >
                  Docker Compose
                </Button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 min-h-0 overflow-auto">
                {templateDetailTab === "overview" && (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                      {selectedTemplate.logoUrl && (
                        <img
                          src={selectedTemplate.logoUrl}
                          alt={selectedTemplate.name}
                          className="w-12 h-12 sm:w-16 sm:h-16 object-contain flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg sm:text-xl font-bold break-words">
                          {selectedTemplate.name}
                        </h3>
                        {selectedTemplate.version && (
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Version {selectedTemplate.version}
                          </p>
                        )}
                        <p className="text-xs sm:text-sm text-muted-foreground mt-2 break-words">
                          {selectedTemplate.description}
                        </p>
                        {selectedTemplate.tags &&
                          selectedTemplate.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {selectedTemplate.tags.map((tag: string) => (
                                <span
                                  key={tag}
                                  className="px-2 py-1 text-xs bg-primary/10 text-primary rounded border border-primary/20"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        {selectedTemplate.links && (
                          <div className="flex flex-wrap gap-3 sm:gap-4 mt-4">
                            {selectedTemplate.links.github && (
                              <a
                                href={selectedTemplate.links.github}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs sm:text-sm text-primary hover:underline"
                              >
                                GitHub
                              </a>
                            )}
                            {selectedTemplate.links.website && (
                              <a
                                href={selectedTemplate.links.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs sm:text-sm text-primary hover:underline"
                              >
                                Website
                              </a>
                            )}
                            {selectedTemplate.links.docs && (
                              <a
                                href={selectedTemplate.links.docs}
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

                {templateDetailTab === "compose" && (
                  <div className="flex flex-col gap-3 sm:gap-4 h-full min-h-0">
                    {selectedTemplate.composeContent ? (
                      <>
                        <div className="border rounded-lg overflow-hidden flex-1 min-h-[300px] sm:min-h-[400px] flex flex-col">
                          <CodeEditor
                            content={selectedTemplate.composeContent}
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
                              copyToClipboard(selectedTemplate.composeContent);
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
                                selectedTemplate.composeContent,
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
                    setTemplateDetailOpen(false);
                    setTemplateStoreOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={async () => {
                    try {
                      await importTemplate(selectedTemplate);
                      setTemplateDetailOpen(false);
                      setTemplateStoreOpen(false);
                    } catch (error: any) {
                      setTemplateError(
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
