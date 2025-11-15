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

export const Route = createFileRoute("/docker/compose-builder")({
  component: App,
});

interface PortMapping {
  host: string;
  container: string;
  protocol: string;
}
interface VolumeMapping {
  host: string;
  container: string;
  read_only?: boolean;
}
interface Healthcheck {
  test: string;
  interval: string;
  timeout: string;
  retries: string;
  start_period: string;
  start_interval: string;
}

interface ResourceLimits {
  cpus?: string;
  memory?: string;
}

interface ResourceReservations {
  cpus?: string;
  memory?: string;
}

interface DeployResources {
  limits?: ResourceLimits;
  reservations?: ResourceReservations;
}

interface ServiceConfig {
  name: string;
  image: string;
  container_name?: string;
  ports: PortMapping[];
  volumes: VolumeMapping[];
  environment: { key: string; value: string }[];
  environment_syntax: "array" | "dict";
  volumes_syntax: "array" | "dict";
  command: string;
  restart: string;
  healthcheck?: Healthcheck;
  depends_on?: string[];
  entrypoint?: string;
  env_file?: string;
  extra_hosts?: string[];
  dns?: string[];
  networks?: string[];
  user?: string;
  working_dir?: string;
  labels?: { key: string; value: string }[];
  privileged?: boolean;
  read_only?: boolean;
  shm_size?: string;
  security_opt?: string[];
  deploy?: {
    resources?: DeployResources;
  };
}

interface NetworkConfig {
  name: string;
  driver: string;
  driver_opts: { key: string; value: string }[];
  attachable: boolean;
  labels: { key: string; value: string }[];
  external: boolean;
  name_external: string;
  internal: boolean;
  enable_ipv6: boolean;
  ipam: {
    driver: string;
    config: { subnet: string; gateway: string }[];
    options: { key: string; value: string }[];
  };
}
interface VolumeConfig {
  name: string;
  driver: string;
  driver_opts: { key: string; value: string }[];
  labels: { key: string; value: string }[];
  external: boolean;
  name_external: string;
  driver_opts_type: string;
  driver_opts_device: string;
  driver_opts_o: string;
}

// VPN Configuration Interfaces
interface TailscaleConfig {
  authKey: string;
  hostname: string;
  acceptDns: boolean;
  authOnce: boolean;
  userspace: boolean;
  exitNode: string;
  exitNodeAllowLan: boolean;
  enableServe: boolean;
  serveConfig: string; // JSON string
  certDomain: string;
  serveTargetService: string;
  serveExternalPort: string;
  serveInternalPort: string;
  servePath: string;
  serveProtocol: "HTTPS" | "HTTP";
}

interface NewtConfig {
  endpoint: string;
  newtId: string;
  newtSecret: string;
  networkName: string;
}

interface CloudflaredConfig {
  tunnelToken: string;
  noAutoupdate: boolean;
}

interface WireguardConfig {
  configPath: string;
  interfaceName: string;
}

interface ZerotierConfig {
  networkId: string;
  identityPath: string;
}

interface NetbirdConfig {
  setupKey: string;
  managementUrl: string;
}

interface VPNConfig {
  enabled: boolean;
  type: "tailscale" | "newt" | "cloudflared" | "wireguard" | "zerotier" | "netbird" | null;
  tailscale?: TailscaleConfig;
  newt?: NewtConfig;
  cloudflared?: CloudflaredConfig;
  wireguard?: WireguardConfig;
  zerotier?: ZerotierConfig;
  netbird?: NetbirdConfig;
  servicesUsingVpn: string[]; // Service names that should use VPN
}

function defaultTailscaleConfig(): TailscaleConfig {
  return {
    authKey: "",
    hostname: "",
    acceptDns: false,
    authOnce: true,
    userspace: false,
    exitNode: "",
    exitNodeAllowLan: false,
    enableServe: false,
    serveConfig: "",
    certDomain: "",
    serveTargetService: "",
    serveExternalPort: "443",
    serveInternalPort: "8080",
    servePath: "/",
    serveProtocol: "HTTPS",
  };
}

function defaultNewtConfig(): NewtConfig {
  return {
    endpoint: "https://app.pangolin.net",
    newtId: "",
    newtSecret: "",
    networkName: "newt",
  };
}

function defaultCloudflaredConfig(): CloudflaredConfig {
  return {
    tunnelToken: "",
    noAutoupdate: true,
  };
}

function defaultWireguardConfig(): WireguardConfig {
  return {
    configPath: "/etc/wireguard/wg0.conf",
    interfaceName: "wg0",
  };
}

function defaultZerotierConfig(): ZerotierConfig {
  return {
    networkId: "",
    identityPath: "/var/lib/zerotier-one",
  };
}

function defaultNetbirdConfig(): NetbirdConfig {
  return {
    setupKey: "",
    managementUrl: "",
  };
}

function defaultVPNConfig(): VPNConfig {
  return {
    enabled: false,
    type: null,
    servicesUsingVpn: [],
  };
}

function defaultService(): ServiceConfig {
  return {
    name: "",
    image: "",
    container_name: "",
    ports: [],
    volumes: [],
    environment: [],
    environment_syntax: "array",
    volumes_syntax: "array",
    command: "",
    restart: "",
    healthcheck: undefined,
    depends_on: [],
    entrypoint: "",
    env_file: "",
    extra_hosts: [],
    dns: [],
    networks: [],
    user: "",
    working_dir: "",
    labels: [],
    privileged: undefined,
    read_only: undefined,
    shm_size: "",
    security_opt: [],
    deploy: undefined,
  };
}

function defaultNetwork(): NetworkConfig {
  return {
    name: "",
    driver: "",
    driver_opts: [],
    attachable: false,
    labels: [],
    external: false,
    name_external: "",
    internal: false,
    enable_ipv6: false,
    ipam: {
      driver: "",
      config: [],
      options: [],
    },
  };
}
function defaultVolume(): VolumeConfig {
  return {
    name: "",
    driver: "",
    driver_opts: [],
    labels: [],
    external: false,
    name_external: "",
    driver_opts_type: "",
    driver_opts_device: "",
    driver_opts_o: "",
  };
}

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
  const [composeStoreOpen, setComposeStoreOpen] = useState(false);
  const [composeFiles, setComposeFiles] = useState<any[]>([]);
  const [composeLoading, setComposeLoading] = useState(false);
  const [composeError, setComposeError] = useState<string | null>(null);
  const [composeSearch, setComposeSearch] = useState("");
  const [composeCache, setComposeCache] = useState<any[]>(() => {
    const cached = localStorage.getItem("composeStoreCache");
    return cached ? JSON.parse(cached) : [];
  });
  const [composeCacheTimestamp, setComposeCacheTimestamp] = useState<
    number | null
  >(() => {
    const cached = localStorage.getItem("composeStoreCacheTimestamp");
    return cached ? parseInt(cached) : null;
  });
  const codeFileRef = useRef<HTMLDivElement>(null);
  const [editorSize, setEditorSize] = useState({ width: 0, height: 0 });
  const [conversionDialogOpen, setConversionDialogOpen] = useState(false);
  const [conversionType, setConversionType] = useState<string>("");
  const [conversionOutput, setConversionOutput] = useState<string>("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationSuccess, setValidationSuccess] = useState(false);

  useLayoutEffect(() => {
    if (!codeFileRef.current) return;
    const handleResize = () => {
      const rect = codeFileRef.current?.getBoundingClientRect();
      if (rect) setEditorSize({ width: rect.width, height: rect.height });
    };
    handleResize();
    const ro = new window.ResizeObserver(handleResize);
    ro.observe(codeFileRef.current);
    return () => ro.disconnect();
  }, [codeFileRef]);

  // VPN Helper Functions
  function generateTailscaleServeConfig(
    _targetService: string,
    externalPort: string,
    internalPort: string,
    path: string,
    protocol: "HTTPS" | "HTTP",
    certDomain: string
  ): string {
    const config: any = {
      TCP: {
        [externalPort]: {
          HTTPS: protocol === "HTTPS",
        },
      },
    };

    if (protocol === "HTTPS") {
      config.Web = {
        [`${certDomain || "${TS_CERT_DOMAIN}"}:${externalPort}`]: {
          Handlers: {
            [path]: {
              Proxy: `http://127.0.0.1:${internalPort}`,
            },
          },
        },
      };
    } else {
      config.TCP[externalPort] = {
        HTTP: true,
        Handlers: {
          [path]: {
            Proxy: `http://127.0.0.1:${internalPort}`,
          },
        },
      };
    }

    return JSON.stringify(config, null, 2);
  }

  function getVpnServiceName(vpnType: string): string {
    return vpnType;
  }

  function generateVpnService(vpnConfig: VPNConfig | undefined): any {
    if (!vpnConfig || !vpnConfig.enabled || !vpnConfig.type) return null;

    const serviceName = getVpnServiceName(vpnConfig.type);
    let service: any = {
      restart: "always",
    };

    switch (vpnConfig.type) {
      case "tailscale": {
        const ts = vpnConfig.tailscale!;
        service.image = "tailscale/tailscale:latest";
        service.privileged = true;
        service.volumes = [
          "tailscale:/var/lib/tailscale",
          "/dev/net/tun:/dev/net/tun",
        ];
        service.environment = {
          TS_STATE_DIR: "/var/lib/tailscale",
          TS_ACCEPT_DNS: ts.acceptDns ? "true" : "false",
          TS_AUTH_ONCE: ts.authOnce ? "true" : "false",
          TS_USERSPACE: ts.userspace ? "true" : "false",
          TS_AUTHKEY: ts.authKey ? "${TS_AUTHKEY}" : undefined,
          TS_HOSTNAME: ts.hostname || undefined,
        };

        if (ts.exitNode) {
          service.environment.TS_EXTRA_ARGS = `--exit-node=${ts.exitNode}${ts.exitNodeAllowLan ? " --exit-node-allow-lan-access" : ""}`;
        }

        if (ts.enableServe && ts.serveTargetService) {
          service.environment.TS_SERVE_CONFIG = "/etc/tailscale/serve.json";
          service.configs = [
            {
              source: "serve-config",
              target: "/etc/tailscale/serve.json",
            },
          ];
        }

        // Remove undefined environment variables
        Object.keys(service.environment).forEach(
          (key) =>
            service.environment[key] === undefined &&
            delete service.environment[key]
        );
        break;
      }
      case "newt": {
        const newt = vpnConfig.newt!;
        service.image = "fosrl/newt";
        service.container_name = "newt";
        service.environment = {
          PANGOLIN_ENDPOINT: newt.endpoint,
          NEWT_ID: newt.newtId ? "${NEWT_ID}" : undefined,
          NEWT_SECRET: newt.newtSecret ? "${NEWT_SECRET}" : undefined,
        };
        service.networks = [newt.networkName];
        Object.keys(service.environment).forEach(
          (key) =>
            service.environment[key] === undefined &&
            delete service.environment[key]
        );
        break;
      }
      case "cloudflared": {
        const cf = vpnConfig.cloudflared!;
        service.image = "cloudflare/cloudflared";
        service.command = cf.noAutoupdate
          ? "--no-autoupdate tunnel run"
          : "tunnel run";
        service.environment = {
          TUNNEL_TOKEN: cf.tunnelToken ? "${TUNNEL_TOKEN}" : undefined,
        };
        Object.keys(service.environment).forEach(
          (key) =>
            service.environment[key] === undefined &&
            delete service.environment[key]
        );
        break;
      }
      case "wireguard": {
        const wg = vpnConfig.wireguard!;
        service.image = "linuxserver/wireguard:latest";
        service.cap_add = ["NET_ADMIN", "SYS_MODULE"];
        service.environment = {
          PUID: "1000",
          PGID: "1000",
          TZ: "Etc/UTC",
        };
        service.sysctls = ["net.ipv4.conf.all.src_valid_mark=1"];
        service.volumes = [wg.configPath + ":/config"];
        break;
      }
      case "zerotier": {
        const zt = vpnConfig.zerotier!;
        service.image = "zerotier/zerotier:latest";
        service.privileged = true;
        service.networks = ["host"];
        service.volumes = [zt.identityPath + ":/var/lib/zerotier-one"];
        service.environment = {
          ZT_NC_NETWORK: zt.networkId ? "${ZT_NETWORK_ID}" : undefined,
        };
        Object.keys(service.environment).forEach(
          (key) =>
            service.environment[key] === undefined &&
            delete service.environment[key]
        );
        break;
      }
      case "netbird": {
        const nb = vpnConfig.netbird!;
        service.image = "netbirdio/netbird:latest";
        service.privileged = true;
        service.cap_add = ["NET_ADMIN", "SYS_MODULE"];
        service.sysctls = ["net.ipv4.ip_forward=1", "net.ipv6.conf.all.forwarding=1"];
        service.environment = {
          NETBIRD_SETUP_KEY: nb.setupKey ? "${NETBIRD_SETUP_KEY}" : undefined,
          NETBIRD_MANAGEMENT_URL: nb.managementUrl || undefined,
        };
        Object.keys(service.environment).forEach(
          (key) =>
            service.environment[key] === undefined &&
            delete service.environment[key]
        );
        break;
      }
    }

    return { [serviceName]: service };
  }

  function getVpnVolumes(vpnConfig: VPNConfig | undefined): VolumeConfig[] {
    if (!vpnConfig || !vpnConfig.enabled || !vpnConfig.type) return [];

    const volumes: VolumeConfig[] = [];

    switch (vpnConfig.type) {
      case "tailscale": {
        volumes.push({
          name: "tailscale",
          driver: "",
          driver_opts: [],
          labels: [],
          external: false,
          name_external: "",
          driver_opts_type: "",
          driver_opts_device: "",
          driver_opts_o: "",
        });
        break;
      }
    }

    return volumes;
  }

  function getVpnNetworks(vpnConfig: VPNConfig | undefined): NetworkConfig[] {
    if (!vpnConfig || !vpnConfig.enabled || !vpnConfig.type) return [];

    const networks: NetworkConfig[] = [];

    switch (vpnConfig.type) {
      case "newt": {
        const newt = vpnConfig.newt!;
        networks.push({
          name: newt.networkName,
          driver: "",
          driver_opts: [],
          attachable: false,
          labels: [],
          external: true,
          name_external: newt.networkName,
          internal: false,
          enable_ipv6: false,
          ipam: {
            driver: "",
            config: [],
            options: [],
          },
        });
        break;
      }
    }

    return networks;
  }

  function generateYaml(
    services: ServiceConfig[],
    networks: NetworkConfig[],
    volumes: VolumeConfig[],
    vpnConfig?: VPNConfig
  ): string {
    // Ensure vpnConfig has a default value
    const vpn = vpnConfig || defaultVPNConfig();
    
    const compose: any = { services: {} };
    services.forEach((svc) => {
      if (!svc.name) return;

      const parseCommandString = (cmd: string): string[] => {
        if (!cmd) return [];
        if (Array.isArray(cmd)) {
          return cmd;
        }

        try {
          const parsed = JSON.parse(cmd);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        } catch (e) {}
        const parts = cmd.match(/(?:"[^"]*"|'[^']*'|\S+)/g) || [];
        return parts.map((part) => {
          const trimmed = part.replace(/^["']|["']$/g, "");
          return trimmed;
        });
      };

      // Check if service should use VPN
      const shouldUseVpn = vpn.enabled && 
        vpnConfig?.type && 
        vpn.servicesUsingVpn.includes(svc.name);
      
      const vpnServiceName = vpn.enabled && vpn.type 
        ? getVpnServiceName(vpn.type) 
        : null;
      
      // VPN types that use network_mode
      const usesNetworkMode = vpn.enabled && 
        vpn.type && 
        ["tailscale", "cloudflared"].includes(vpn.type) &&
        shouldUseVpn;

      compose.services[svc.name] = {
        image: svc.image || undefined,
        container_name: svc.container_name || undefined,
        command: svc.command ? parseCommandString(svc.command) : undefined,
        restart: svc.restart || undefined,
        // If using VPN with network_mode, don't expose ports (they go through VPN)
        ports: usesNetworkMode ? undefined : (svc.ports.length
          ? svc.ports
              .map((p) =>
                p.host && p.container
                  ? `${p.host}:${p.container}/${p.protocol || "tcp"}`
                  : p.container
                    ? p.container
                    : undefined
              )
              .filter(Boolean)
          : undefined),
        // If using VPN with network_mode, set network_mode instead of networks
        network_mode: usesNetworkMode && vpnServiceName 
          ? `service:${vpnServiceName}` 
          : undefined,
        volumes: svc.volumes.length
          ? svc.volumes_syntax === "dict"
            ? svc.volumes
                .map((v) => {
                  if (v.host && v.container) {
                    const vol: any = {
                      type: "bind",
                      source: v.host,
                      target: v.container,
                    };
                    if (v.read_only) {
                      vol.read_only = true;
                    }
                    return vol;
                  } else if (v.container) {
                    // Anonymous volume - just target path
                    return {
                      type: "volume",
                      target: v.container,
                    };
                  }
                  return undefined;
                })
                .filter(Boolean)
            : svc.volumes
                .map((v) => {
                  if (v.host && v.container) {
                    return v.read_only
                      ? `${v.host}:${v.container}:ro`
                      : `${v.host}:${v.container}`;
                  }
                  return v.container ? v.container : undefined;
                })
                .filter(Boolean)
          : undefined,
        environment: svc.environment.length
          ? svc.environment_syntax === "dict"
            ? svc.environment
                .filter(({ key }) => key)
                .reduce(
                  (acc, { key, value }) => {
                    acc[key] = value;
                    return acc;
                  },
                  {} as Record<string, string>
                )
            : svc.environment
                .filter(({ key }) => key)
                .map(({ key, value }) => `${key}=${value}`)
          : undefined,
        healthcheck:
          svc.healthcheck && svc.healthcheck.test
            ? {
                test: parseCommandString(svc.healthcheck.test),
                interval: svc.healthcheck.interval || undefined,
                timeout: svc.healthcheck.timeout || undefined,
                retries: svc.healthcheck.retries || undefined,
                start_period: svc.healthcheck.start_period || undefined,
                start_interval: svc.healthcheck.start_interval || undefined,
              }
            : undefined,
        depends_on:
          svc.depends_on && svc.depends_on.filter(Boolean).length
            ? svc.depends_on.filter(Boolean)
            : undefined,
        entrypoint: svc.entrypoint
          ? parseCommandString(svc.entrypoint)
          : undefined,
        env_file:
          svc.env_file && svc.env_file.trim()
            ? svc.env_file.split(",").map((f) => f.trim())
            : undefined,
        extra_hosts:
          svc.extra_hosts && svc.extra_hosts.filter(Boolean).length
            ? svc.extra_hosts.filter(Boolean)
            : undefined,
        dns:
          svc.dns && svc.dns.filter(Boolean).length
            ? svc.dns.filter(Boolean)
            : undefined,
        networks: usesNetworkMode 
          ? undefined 
          : (shouldUseVpn && vpn.type === "newt" && vpn.newt
              ? [vpn.newt.networkName]
              : (svc.networks && svc.networks.filter(Boolean).length
                  ? svc.networks.filter(Boolean)
                  : undefined)),
        user: svc.user ? `"${svc.user}"` : undefined,
        working_dir: svc.working_dir || undefined,
        labels:
          svc.labels && svc.labels.filter((l) => l.key).length
            ? svc.labels
                .filter((l) => l.key)
                .map(({ key, value }) => `"${key}=${value}"`)
            : undefined,
        privileged: svc.privileged !== undefined ? svc.privileged : undefined,
        read_only: svc.read_only !== undefined ? svc.read_only : undefined,
        shm_size: svc.shm_size || undefined,
        security_opt:
          svc.security_opt && svc.security_opt.filter(Boolean).length
            ? svc.security_opt.filter(Boolean)
            : undefined,
        deploy:
          svc.deploy && svc.deploy.resources
            ? (() => {
                const limits: any = {};
                if (svc.deploy.resources.limits?.cpus)
                  limits.cpus = svc.deploy.resources.limits.cpus;
                if (svc.deploy.resources.limits?.memory)
                  limits.memory = svc.deploy.resources.limits.memory;

                const reservations: any = {};
                if (svc.deploy.resources.reservations?.cpus)
                  reservations.cpus = svc.deploy.resources.reservations.cpus;
                if (svc.deploy.resources.reservations?.memory)
                  reservations.memory =
                    svc.deploy.resources.reservations.memory;

                const resources: any = {};
                if (Object.keys(limits).length > 0) resources.limits = limits;
                if (Object.keys(reservations).length > 0)
                  resources.reservations = reservations;

                return Object.keys(resources).length > 0
                  ? { resources }
                  : undefined;
              })()
            : undefined,
      };
    });
    for (const name in compose.services) {
      Object.keys(compose.services[name]).forEach(
        (k) =>
          compose.services[name][k] === undefined &&
          delete compose.services[name][k]
      );
    }
    
    // Add VPN service if enabled
    if (vpn.enabled && vpn.type) {
      const vpnService = generateVpnService(vpn);
      if (vpnService) {
        Object.assign(compose.services, vpnService);
      }
    }
    
    // Add VPN volumes
    const vpnVolumes = getVpnVolumes(vpn);
    if (vpnVolumes.length > 0) {
      volumes = [...volumes, ...vpnVolumes];
    }
    
    // Add VPN networks
    const vpnNetworks = getVpnNetworks(vpn);
    if (vpnNetworks.length > 0) {
      networks = [...networks, ...vpnNetworks];
    }
    
    // Add Tailscale serve configs if enabled
    if (vpn.enabled && 
        vpn.type === "tailscale" && 
        vpn.tailscale?.enableServe && 
        vpn.tailscale?.serveTargetService) {
      const ts = vpn.tailscale;
      const serveConfig = generateTailscaleServeConfig(
        ts.serveTargetService,
        ts.serveExternalPort,
        ts.serveInternalPort,
        ts.servePath,
        ts.serveProtocol,
        ts.certDomain
      );
      
      if (!compose.configs) {
        compose.configs = {};
      }
      compose.configs["serve-config"] = {
        content: serveConfig,
      };
    }
    
    if (networks.length) {
      compose.networks = {};
      networks.forEach((n) => {
        if (!n.name) return;
        if (n.external) {
          compose.networks[n.name] = {
            external: n.name_external ? { name: n.name_external } : true,
          };
        } else {
          compose.networks[n.name] = {
            driver: n.driver || undefined,
            attachable: n.attachable !== undefined ? n.attachable : undefined,
            internal: n.internal !== undefined ? n.internal : undefined,
            enable_ipv6:
              n.enable_ipv6 !== undefined ? n.enable_ipv6 : undefined,
            driver_opts:
              n.driver_opts && n.driver_opts.length
                ? n.driver_opts
                    .filter((opt) => opt.key)
                    .reduce(
                      (acc, { key, value }) => {
                        acc[key] = value;
                        return acc;
                      },
                      {} as Record<string, string>
                    )
                : undefined,
            labels:
              n.labels && n.labels.length
                ? n.labels
                    .filter((l) => l.key)
                    .map(({ key, value }) => `"${key}=${value}"`)
                : undefined,
            ipam:
              n.ipam.driver || n.ipam.config.length || n.ipam.options.length
                ? {
                    driver: n.ipam.driver || undefined,
                    config: n.ipam.config.length ? n.ipam.config : undefined,
                    options: n.ipam.options.length
                      ? n.ipam.options
                          .filter((opt) => opt.key)
                          .reduce(
                            (acc, { key, value }) => {
                              acc[key] = value;
                              return acc;
                            },
                            {} as Record<string, string>
                          )
                      : undefined,
                  }
                : undefined,
          };
        }
        Object.keys(compose.networks[n.name]).forEach(
          (k) =>
            compose.networks[n.name][k] === undefined &&
            delete compose.networks[n.name][k]
        );
      });
    }
    if (volumes.length) {
      compose.volumes = {};
      volumes.forEach((v) => {
        if (!v.name) return;
        if (v.external) {
          const externalVolume: any = {
            external: v.name_external ? { name: v.name_external } : true,
          };

          if (v.driver) {
            externalVolume.driver = v.driver;
          }

          const driverOpts: Record<string, string> = {};

          if (v.driver_opts && v.driver_opts.length) {
            v.driver_opts
              .filter((opt) => opt.key)
              .forEach(({ key, value }) => {
                driverOpts[key] = value;
              });
          }

          if (v.driver_opts_type) driverOpts.type = v.driver_opts_type;
          if (v.driver_opts_device) driverOpts.device = v.driver_opts_device;
          if (v.driver_opts_o) driverOpts.o = v.driver_opts_o;

          if (Object.keys(driverOpts).length > 0) {
            externalVolume.driver_opts = driverOpts;
          }

          if (v.labels && v.labels.length) {
            externalVolume.labels = v.labels
              .filter((l) => l.key)
              .map(({ key, value }) => `"${key}=${value}"`);
          }

          compose.volumes[v.name] = externalVolume;
        } else {
          const driverOpts: Record<string, string> = {};

          if (v.driver_opts && v.driver_opts.length) {
            v.driver_opts
              .filter((opt) => opt.key)
              .forEach(({ key, value }) => {
                driverOpts[key] = value;
              });
          }

          if (v.driver_opts_type) driverOpts.type = v.driver_opts_type;
          if (v.driver_opts_device) driverOpts.device = v.driver_opts_device;
          if (v.driver_opts_o) driverOpts.o = v.driver_opts_o;

          compose.volumes[v.name] = {
            driver: v.driver || undefined,
            driver_opts:
              Object.keys(driverOpts).length > 0 ? driverOpts : undefined,
            labels:
              v.labels && v.labels.length
                ? v.labels
                    .filter((l) => l.key)
                    .map(({ key, value }) => `"${key}=${value}"`)
                : undefined,
          };
        }
        Object.keys(compose.volumes[v.name]).forEach(
          (k) =>
            compose.volumes[v.name][k] === undefined &&
            delete compose.volumes[v.name][k]
        );
      });
    }
    return yamlStringify(compose);
  }

  function yamlStringify(obj: any, indent = 0, parentKey = ""): string {
    const pad = (n: number) => "  ".repeat(n);
    if (typeof obj !== "object" || obj === null) return String(obj);
    if (Array.isArray(obj)) {
      const shouldBeSingleLine =
        ["command", "entrypoint"].includes(parentKey) ||
        (parentKey === "test" && indent > 0);
      if (shouldBeSingleLine && obj.length > 0 && typeof obj[0] === "string") {
        return `[${obj.map((v) => `"${v}"`).join(", ")}]`;
      }
      return obj
        .map(
          (v) =>
            `\n${pad(indent)}- ${yamlStringify(v, indent + 1, parentKey).trimStart()}`
        )
        .join("");
    }
    const entries = Object.entries(obj)
      .map(([k, v]) => {
        if (v === undefined) return "";
        if (typeof v === "object" && v !== null && !Array.isArray(v)) {
          return `\n${pad(indent)}${k}:` + yamlStringify(v, indent + 1, k);
        }
        if (Array.isArray(v)) {
          if (
            ["command", "entrypoint"].includes(k) ||
            (k === "test" && indent > 0)
          ) {
            return `\n${pad(indent)}${k}: [${v.map((item) => `"${item}"`).join(", ")}]`;
          }
          return `\n${pad(indent)}${k}: ` + yamlStringify(v, indent + 1, k);
        }
        return `\n${pad(indent)}${k}: ${v}`;
      })
      .join("");
    return indent === 0 && entries.startsWith("\n")
      ? entries.slice(1)
      : entries;
  }

  // Validation functions
  function validateServiceName(name: string): string | null {
    if (!name) return "Service name is required";
    if (!/^[a-z0-9_-]+$/i.test(name)) {
      return "Service name must contain only alphanumeric characters, hyphens, and underscores";
    }
    return null;
  }

  function validatePort(port: string): string | null {
    if (!port) return null;
    const num = parseInt(port, 10);
    if (isNaN(num) || num < 1 || num > 65535) {
      return "Port must be between 1 and 65535";
    }
    return null;
  }

  function validateEnvVarKey(key: string): string | null {
    if (!key) return null;
    if (!/^[A-Z_][A-Z0-9_]*$/i.test(key)) {
      return "Environment variable key should start with a letter or underscore and contain only alphanumeric characters and underscores";
    }
    return null;
  }

  function validateCpuValue(cpu: string): string | null {
    if (!cpu) return null;
    if (!/^\d+(\.\d+)?$/.test(cpu)) {
      return "CPU value must be a number (e.g., 0.5, 1, 2)";
    }
    const num = parseFloat(cpu);
    if (num < 0) {
      return "CPU value must be positive";
    }
    return null;
  }

  function validateMemoryValue(memory: string): string | null {
    if (!memory) return null;
    if (!/^\d+[kmgKMG]?[bB]?$/.test(memory) && !/^\d+$/.test(memory)) {
      return "Memory value must be a number with optional unit (e.g., 512m, 2g, 1024)";
    }
    return null;
  }

  // Validation and reformatting
  function validateAndReformat() {
    try {
      setValidationError(null);
      setValidationSuccess(false);

      // Validate services
      const errors: string[] = [];
      services.forEach((svc, idx) => {
        if (!svc.name) {
          errors.push(`Service ${idx + 1}: Name is required`);
        } else {
          const nameError = validateServiceName(svc.name);
          if (nameError) errors.push(`Service "${svc.name}": ${nameError}`);
        }

        if (!svc.image) {
          errors.push(`Service "${svc.name || idx + 1}": Image is required`);
        }

        svc.ports.forEach((port, pIdx) => {
          if (port.host) {
            const portError = validatePort(port.host);
            if (portError)
              errors.push(
                `Service "${svc.name || idx + 1}" port ${pIdx + 1} host: ${portError}`
              );
          }
          if (port.container) {
            const portError = validatePort(port.container);
            if (portError)
              errors.push(
                `Service "${svc.name || idx + 1}" port ${pIdx + 1} container: ${portError}`
              );
          }
        });

        svc.environment.forEach((env, eIdx) => {
          if (env.key) {
            const keyError = validateEnvVarKey(env.key);
            if (keyError)
              errors.push(
                `Service "${svc.name || idx + 1}" env var ${eIdx + 1}: ${keyError}`
              );
          }
        });

        if (svc.deploy?.resources?.limits?.cpus) {
          const cpuError = validateCpuValue(svc.deploy.resources.limits.cpus);
          if (cpuError)
            errors.push(
              `Service "${svc.name || idx + 1}" CPU limit: ${cpuError}`
            );
        }
        if (svc.deploy?.resources?.limits?.memory) {
          const memError = validateMemoryValue(
            svc.deploy.resources.limits.memory
          );
          if (memError)
            errors.push(
              `Service "${svc.name || idx + 1}" memory limit: ${memError}`
            );
        }
        if (svc.deploy?.resources?.reservations?.cpus) {
          const cpuError = validateCpuValue(
            svc.deploy.resources.reservations.cpus
          );
          if (cpuError)
            errors.push(
              `Service "${svc.name || idx + 1}" CPU reservation: ${cpuError}`
            );
        }
        if (svc.deploy?.resources?.reservations?.memory) {
          const memError = validateMemoryValue(
            svc.deploy.resources.reservations.memory
          );
          if (memError)
            errors.push(
              `Service "${svc.name || idx + 1}" memory reservation: ${memError}`
            );
        }
      });

      if (errors.length > 0) {
        setValidationError(errors.join("; "));
        return;
      }

      const parsed = jsyaml.load(yaml);
      if (!parsed) {
        setValidationError("Invalid YAML: Empty file");
        return;
      }
      const reformatted = jsyaml.dump(parsed, { indent: 2, lineWidth: -1 });
      setYaml(reformatted);
      setValidationSuccess(true);
      setTimeout(() => setValidationSuccess(false), 3000);
    } catch (error: any) {
      setValidationError(error.message || "Invalid YAML format");
      setValidationSuccess(false);
    }
  }

  // Convert to docker run command
  function convertToDockerRun(service: ServiceConfig): string {
    let cmd = "docker run";

    if (service.container_name) {
      cmd += ` --name ${service.container_name}`;
    }

    if (service.restart) {
      cmd += ` --restart ${service.restart}`;
    }

    service.ports.forEach((p) => {
      if (p.host && p.container) {
        cmd += ` -p ${p.host}:${p.container}`;
      }
    });

    service.volumes.forEach((v) => {
      if (v.host && v.container) {
        cmd += ` -v ${v.host}:${v.container}`;
        if (v.read_only) cmd += ":ro";
      }
    });

    service.environment.forEach((e) => {
      if (e.key) {
        cmd += ` -e ${e.key}=${e.value || ""}`;
      }
    });

    if (service.user) {
      cmd += ` --user ${service.user}`;
    }

    if (service.working_dir) {
      cmd += ` -w ${service.working_dir}`;
    }

    if (service.privileged) {
      cmd += " --privileged";
    }

    if (service.read_only) {
      cmd += " --read-only";
    }

    if (service.shm_size) {
      cmd += ` --shm-size ${service.shm_size}`;
    }

    service.security_opt?.forEach((opt) => {
      if (opt) cmd += ` --security-opt ${opt}`;
    });

    service.extra_hosts?.forEach((host) => {
      if (host) cmd += ` --add-host ${host}`;
    });

    service.dns?.forEach((dns) => {
      if (dns) cmd += ` --dns ${dns}`;
    });

    if (service.networks && service.networks.length > 0) {
      cmd += ` --network ${service.networks[0]}`;
    }

    cmd += ` ${service.image || ""}`;

    if (service.command) {
      try {
        const parsed = JSON.parse(service.command);
        if (Array.isArray(parsed)) {
          cmd += ` ${parsed.join(" ")}`;
        } else {
          cmd += ` ${service.command}`;
        }
      } catch {
        cmd += ` ${service.command}`;
      }
    }

    return cmd;
  }

  // Convert to systemd service
  function convertToSystemd(service: ServiceConfig): string {
    const containerName = service.container_name || service.name;

    let unit = `[Unit]
Description=Docker Container ${containerName}
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/usr/bin/docker start ${containerName}
ExecStop=/usr/bin/docker stop ${containerName}
Restart=${service.restart === "always" ? "always" : service.restart === "unless-stopped" ? "on-failure" : "no"}

[Install]
WantedBy=multi-user.target
`;

    return unit;
  }

  // Generate .env file
  function generateEnvFile(): string {
    const envVars: string[] = [];
    services.forEach((svc) => {
      svc.environment.forEach((e) => {
        if (e.key && !envVars.some((v) => v.startsWith(e.key + "="))) {
          envVars.push(`${e.key}=${e.value || ""}`);
        }
      });
    });
    return envVars.join("\n");
  }

  // Redact sensitive data
  function redactSensitiveData(yamlText: string): string {
    const sensitivePatterns = [
      /password\s*[:=]\s*["']?([^"'\n]+)["']?/gi,
      /secret\s*[:=]\s*["']?([^"'\n]+)["']?/gi,
      /api[_-]?key\s*[:=]\s*["']?([^"'\n]+)["']?/gi,
      /token\s*[:=]\s*["']?([^"'\n]+)["']?/gi,
      /auth[_-]?token\s*[:=]\s*["']?([^"'\n]+)["']?/gi,
      /access[_-]?key\s*[:=]\s*["']?([^"'\n]+)["']?/gi,
      /private[_-]?key\s*[:=]\s*["']?([^"'\n]+)["']?/gi,
    ];

    let redacted = yamlText;
    sensitivePatterns.forEach((pattern) => {
      redacted = redacted.replace(pattern, (match, value) => {
        return match.replace(value, "***REDACTED***");
      });
    });

    return redacted;
  }

  // Generate Komodo .toml from Portainer stack
  function generateKomodoToml(_portainerStack: any): string {
    try {
      // Extract services from compose file if available
      const composeData = jsyaml.load(yaml) as any;
      const services = composeData?.services || {};

      let toml = `# Komodo configuration generated from Portainer stack
# Generated from Docker Compose configuration

`;

      Object.entries(services).forEach(([name, service]: [string, any]) => {
        toml += `[${name}]\n`;
        if (service.image) {
          toml += `image = "${service.image}"\n`;
        }
        if (service.container_name) {
          toml += `container_name = "${service.container_name}"\n`;
        }
        if (service.restart) {
          toml += `restart = "${service.restart}"\n`;
        }
        if (service.ports && Array.isArray(service.ports)) {
          toml += `ports = [\n`;
          service.ports.forEach((port: string) => {
            toml += `  "${port}",\n`;
          });
          toml += `]\n`;
        }
        if (service.volumes && Array.isArray(service.volumes)) {
          toml += `volumes = [\n`;
          service.volumes.forEach((vol: string) => {
            toml += `  "${vol}",\n`;
          });
          toml += `]\n`;
        }
        if (service.environment) {
          if (Array.isArray(service.environment)) {
            toml += `environment = [\n`;
            service.environment.forEach((env: string) => {
              toml += `  "${env}",\n`;
            });
            toml += `]\n`;
          } else {
            toml += `environment = {}\n`;
            Object.entries(service.environment).forEach(
              ([key, value]: [string, any]) => {
                toml += `environment.${key} = "${value}"\n`;
              }
            );
          }
        }
        toml += `\n`;
      });

      return toml;
    } catch (error: any) {
      return `# Komodo configuration generated from Docker Compose
# Note: Error parsing configuration: ${error.message}
# Please adjust manually

[service]
name = "service"
image = ""

# Add configuration as needed
`;
    }
  }

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
          output = generateEnvFile();
          break;
        case "redact":
          output = redactSensitiveData(yaml);
          break;
        case "komodo":
          output = generateKomodoToml({});
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
    setYaml(generateYaml(services, networks, volumes, vpnConfig || defaultVPNConfig()));
  }, [services, networks, volumes, vpnConfig]);

  function updateServiceField(field: keyof ServiceConfig, value: any) {
    if (typeof selectedIdx !== "number") return;
    const newServices = [...services];
    (newServices[selectedIdx] as any)[field] = value;
    setServices(newServices);
  }

  function updateListField(
    field: keyof ServiceConfig,
    idx: number,
    value: any
  ) {
    if (typeof selectedIdx !== "number") return;
    const newServices = [...services];
    (newServices[selectedIdx][field] as any[])[idx] = value;
    setServices(newServices);
  }

  function addListField(field: keyof ServiceConfig) {
    if (typeof selectedIdx !== "number") return;
    const newServices = [...services];
    if (field === "environment") {
      newServices[selectedIdx].environment.push({ key: "", value: "" });
    } else {
      (newServices[selectedIdx][field] as any[]).push("");
    }
    setServices(newServices);
  }

  function removeListField(field: keyof ServiceConfig, idx: number) {
    if (typeof selectedIdx !== "number") return;
    const newServices = [...services];
    (newServices[selectedIdx][field] as any[]).splice(idx, 1);
    setServices(newServices);
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
    if (services.length === 1) return;
    const newServices = services.filter((_, i) => i !== idx);
    setServices(newServices);
    setSelectedIdx(
      typeof selectedIdx === "number"
        ? Math.max(0, selectedIdx - (idx < selectedIdx ? 1 : 0))
        : 0
    );
  }

  function updatePortField(
    idx: number,
    field: "host" | "container" | "protocol",
    value: string
  ) {
    if (typeof selectedIdx !== "number") return;
    const newServices = [...services];
    if (field === "protocol") {
      newServices[selectedIdx].ports[idx][field] = value;
    } else {
      newServices[selectedIdx].ports[idx][field] = value.replace(/[^0-9]/g, "");
    }
    setServices(newServices);
  }
  function addPortField() {
    if (typeof selectedIdx !== "number") return;
    const newServices = [...services];
    newServices[selectedIdx].ports.push({
      host: "",
      container: "",
      protocol: "tcp",
    });
    setServices(newServices);
  }
  function removePortField(idx: number) {
    if (typeof selectedIdx !== "number") return;
    const newServices = [...services];
    newServices[selectedIdx].ports.splice(idx, 1);
    setServices(newServices);
  }

  function updateVolumeField(
    idx: number,
    field: "host" | "container" | "read_only",
    value: string | boolean
  ) {
    if (typeof selectedIdx !== "number") return;
    const newServices = [...services];
    (newServices[selectedIdx].volumes[idx] as any)[field] = value;
    setServices(newServices);
  }
  function addVolumeField() {
    if (typeof selectedIdx !== "number") return;
    const newServices = [...services];
    newServices[selectedIdx].volumes.push({
      host: "",
      container: "",
      read_only: false,
    });
    setServices(newServices);
  }
  function removeVolumeField(idx: number) {
    if (typeof selectedIdx !== "number") return;
    const newServices = [...services];
    newServices[selectedIdx].volumes.splice(idx, 1);
    setServices(newServices);
  }

  function updateHealthcheckField(field: keyof Healthcheck, value: string) {
    if (typeof selectedIdx !== "number") return;
    const newServices = [...services];
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

  function updateDependsOn(idx: number, value: string) {
    if (typeof selectedIdx !== "number") return;
    const newServices = [...services];
    newServices[selectedIdx].depends_on![idx] = value;
    setServices(newServices);
  }
  function addDependsOn() {
    if (typeof selectedIdx !== "number") return;
    const newServices = [...services];
    if (!newServices[selectedIdx].depends_on)
      newServices[selectedIdx].depends_on = [];
    newServices[selectedIdx].depends_on!.push("");
    setServices(newServices);
  }
  function removeDependsOn(idx: number) {
    if (typeof selectedIdx !== "number") return;
    const newServices = [...services];
    newServices[selectedIdx].depends_on!.splice(idx, 1);
    setServices(newServices);
  }

  function updateSecurityOpt(idx: number, value: string) {
    if (typeof selectedIdx !== "number") return;
    const newServices = [...services];
    newServices[selectedIdx].security_opt![idx] = value;
    setServices(newServices);
  }
  function addSecurityOpt() {
    if (typeof selectedIdx !== "number") return;
    const newServices = [...services];
    if (!newServices[selectedIdx].security_opt)
      newServices[selectedIdx].security_opt = [];
    newServices[selectedIdx].security_opt!.push("");
    setServices(newServices);
  }
  function removeSecurityOpt(idx: number) {
    if (typeof selectedIdx !== "number") return;
    const newServices = [...services];
    newServices[selectedIdx].security_opt!.splice(idx, 1);
    setServices(newServices);
  }

  function updateResourceField(
    type: "limits" | "reservations",
    field: "cpus" | "memory",
    value: string
  ) {
    if (typeof selectedIdx !== "number") return;
    const newServices = [...services];
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

  useEffect(() => {
    if (!composeStoreOpen) return;

    const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
    const now = Date.now();

    // Check if we have valid cached data
    if (
      composeCache.length > 0 &&
      composeCacheTimestamp &&
      now - composeCacheTimestamp < CACHE_DURATION
    ) {
      setComposeFiles(composeCache);
      setComposeLoading(false);
      setComposeError(null);

      // Still check for updates in the background
      fetchComposeFilesFromGitHub(true);
      return;
    }

    fetchComposeFilesFromGitHub(false);
  }, [composeStoreOpen, composeCache, composeCacheTimestamp]);

  async function fetchComposeFilesFromGitHub(
    backgroundUpdate: boolean = false
  ) {
    if (!backgroundUpdate) {
      setComposeLoading(true);
      setComposeError(null);
    }

    const GITHUB_OWNER = "hhftechnology";
    const GITHUB_REPO = "Marketplace";
    const GITHUB_PATH = "compose-files";
    const GITHUB_BRANCH = "main";

    const GITHUB_API_BASE = "https://api.github.com";
    const GITHUB_RAW_BASE = "https://raw.githubusercontent.com";

    try {
      // Fetch directory contents from GitHub API
      const dirResponse = await fetch(
        `${GITHUB_API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_PATH}?ref=${GITHUB_BRANCH}`
      );

      if (!dirResponse.ok) {
        throw new Error(`GitHub API error: ${dirResponse.statusText}`);
      }

      const directoryContents: any[] = await dirResponse.json();

      // Filter only YAML files
      const yamlFiles = directoryContents.filter(
        (file: any) =>
          file.type === "file" &&
          (file.name.endsWith(".yml") || file.name.endsWith(".yaml"))
      );

      if (yamlFiles.length === 0) {
        setComposeFiles([]);
        setComposeCache([]);
        setComposeCacheTimestamp(null);
        localStorage.removeItem("composeStoreCache");
        localStorage.removeItem("composeStoreCacheTimestamp");
        if (!backgroundUpdate) setComposeLoading(false);
        return;
      }

      // Load cached files with SHA for comparison
      const cachedFiles: Record<string, { sha: string; data: any }> = {};
      if (composeCache.length > 0) {
        const cachedShaData = localStorage.getItem("composeStoreCacheSHA");
        if (cachedShaData) {
          try {
            const parsed = JSON.parse(cachedShaData);
            composeCache.forEach((file: any) => {
              if (parsed[file.name]) {
                cachedFiles[file.name] = {
                  sha: parsed[file.name].sha,
                  data: file,
                };
              }
            });
          } catch (e) {
            // Invalid cache SHA data, will refetch all
          }
        }
      }

      // Determine which files need to be fetched (new or changed)
      const filesToFetch = yamlFiles.filter((file: any) => {
        const cached = cachedFiles[file.name];
        return !cached || cached.sha !== file.sha;
      });

      // Fetch only new/changed files
      const fileDataPromises = yamlFiles.map(async (file: any) => {
        const cached = cachedFiles[file.name];

        // Use cached data if file hasn't changed
        if (cached && cached.sha === file.sha) {
          return cached.data;
        }

        // Fetch new/changed file
        try {
          const fileUrl = `${GITHUB_RAW_BASE}/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${GITHUB_PATH}/${file.name}`;
          const fileResponse = await fetch(fileUrl);

          if (!fileResponse.ok) {
            throw new Error(`Failed to fetch ${file.name}`);
          }

          const rawText = await fileResponse.text();
          const doc = jsyaml.load(rawText) as any;

          const servicesArray =
            doc && doc.services
              ? Object.entries(doc.services).map(
                  ([svcName, svcObj]: [string, any]) => {
                    return {
                      name: svcName,
                      image: svcObj.image || "",
                      rawService: svcObj,
                    };
                  }
                )
              : [];

          const servicesObject = servicesArray.reduce(
            (acc, service) => {
              acc[service.name] = service;
              return acc;
            },
            {} as Record<string, any>
          );

          return {
            name: file.name,
            url: fileUrl,
            services: servicesObject,
            networks: doc && doc.networks ? doc.networks : {},
            volumes: doc && doc.volumes ? doc.volumes : {},
            rawText: rawText,
            sha: file.sha,
          };
        } catch (e) {
          console.error(`Error processing ${file.name}:`, e);
          // Return cached data if available, otherwise null
          return cached ? cached.data : null;
        }
      });

      const fileData = await Promise.all(fileDataPromises);
      const filteredData = fileData.filter(Boolean);

      // Update cache with SHA information
      const shaMap: Record<string, { sha: string }> = {};
      filteredData.forEach((file: any) => {
        if (file.sha) {
          shaMap[file.name] = { sha: file.sha };
        }
      });

      const now = Date.now();
      setComposeFiles(filteredData);
      setComposeCache(filteredData);
      setComposeCacheTimestamp(now);

      localStorage.setItem("composeStoreCache", JSON.stringify(filteredData));
      localStorage.setItem("composeStoreCacheTimestamp", now.toString());
      localStorage.setItem("composeStoreCacheSHA", JSON.stringify(shaMap));

      if (!backgroundUpdate) setComposeLoading(false);

      if (filesToFetch.length > 0 && !backgroundUpdate) {
        console.log(
          `Fetched ${filesToFetch.length} new/updated files from GitHub`
        );
      }
    } catch (error: any) {
      console.error("Error fetching from GitHub:", error);

      // Fallback to cached data if available
      if (composeCache.length > 0) {
        setComposeFiles(composeCache);
        setComposeError(`Using cached data. Error: ${error.message}`);
      } else {
        setComposeFiles([]);
        setComposeError(
          error.message || "Failed to fetch compose files from GitHub."
        );
      }

      if (!backgroundUpdate) setComposeLoading(false);
    }
  }

  function refreshComposeStore() {
    setComposeCache([]);
    setComposeCacheTimestamp(null);
    localStorage.removeItem("composeStoreCache");
    localStorage.removeItem("composeStoreCacheTimestamp");
    localStorage.removeItem("composeStoreCacheSHA");
    // Trigger a fresh fetch
    fetchComposeFilesFromGitHub(false);
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
            const parts = p.split(":");
            const host = parts[0];
            const containerWithProtocol = parts[1] || "";
            const [container, protocol] = containerWithProtocol.split("/");
            const result = {
              host,
              container,
              protocol: protocol || "tcp",
            };
            return result;
          })
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
    const filteredServices = currentServices.filter((svc) => svc.name && svc.name.trim() !== "");
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
    setComposeStoreOpen(false);
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
      <SidebarProvider>
        <Sidebar>
          <SidebarUI />
        </Sidebar>
        <SidebarInset className="relative">
          <div className="grid grid-cols-1 lg:grid-cols-4 h-full w-full gap-4">
            <SidebarTrigger className="absolute top-2 left-2 z-10" />
            {/* Service List Sidebar */}
            <aside className="h-full bg-card border-r flex flex-col p-4 gap-4 overflow-y-auto box-border">
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
                onClick={() => setComposeStoreOpen(true)}
              >
                Browse Compose Marketplace
              </Button>
              {/* Compose Marketplace Overlay */}
              {composeStoreOpen && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
                  onClick={() => setComposeStoreOpen(false)}
                >
                  <div
                    className="relative max-w-screen-3xl w-[98vw] h-[90vh] rounded-2xl border bg-background p-8 pt-4 shadow-xl flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={refreshComposeStore}
                        disabled={composeLoading}
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
                        onClick={() => setComposeStoreOpen(false)}
                        aria-label="Close Compose Store"
                      >
                        ×
                      </button>
                    </div>
                    <div className="mb-1 text-2xl font-bold">Compose Store</div>
                    <div className="mb-2 mt-0 text-base text-muted-foreground">
                      Browse and import popular self-hosted Docker Compose
                      services.
                      {composeCacheTimestamp && (
                        <span className="ml-2 text-xs">
                          (Cached{" "}
                          {Math.round(
                            (Date.now() - composeCacheTimestamp) / 1000 / 60
                          )}
                          m ago)
                        </span>
                      )}
                    </div>
                    <div className="mb-4 text-xs text-muted-foreground">
                      Want to contribute?{" "}
                      <a
                        href="https://github.com/hhftechnology/Marketplace"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Add your compose files to the repository
                      </a>{" "}
                      - files are automatically synced from GitHub.
                    </div>
                    <Input
                      placeholder="Search by service name or image..."
                      value={composeSearch}
                      onChange={(e) => setComposeSearch(e.target.value)}
                      className="mb-4 mt-0 text-base"
                    />
                    <div className="flex-1 overflow-hidden">
                      {composeLoading ? (
                        <div className="h-32 flex items-center justify-center text-muted-foreground text-lg">
                          {composeCache.length > 0
                            ? "Refreshing..."
                            : "Loading..."}
                        </div>
                      ) : composeError ? (
                        <div className="h-32 flex items-center justify-center text-destructive text-lg">
                          {composeError}
                        </div>
                      ) : composeFiles.length === 0 ? (
                        <div className="h-32 flex items-center justify-center text-muted-foreground text-lg">
                          No .yml files found in the repo.
                        </div>
                      ) : (
                        <div className="w-full h-full overflow-y-auto">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 mt-4 pb-4">
                            {composeFiles
                              .filter(
                                (file: any) =>
                                  file.name
                                    .toLowerCase()
                                    .includes(composeSearch.toLowerCase()) ||
                                  Object.values(file.services || {}).some(
                                    (svc: any) =>
                                      svc.name
                                        .toLowerCase()
                                        .includes(composeSearch.toLowerCase())
                                  )
                              )
                              .map((file: any) => (
                                <div
                                  key={file.name}
                                  className="bg-card rounded-lg shadow p-4 flex flex-col gap-2 items-start justify-between border border-border min-h-0"
                                >
                                  <div className="font-bold text-lg break-words w-full min-h-0">
                                    {file.name.replace(".yml", "")}
                                  </div>
                                  <div className="text-sm text-muted-foreground break-words w-full min-h-0">
                                    {Object.keys(file.services || {}).length}{" "}
                                    service
                                    {Object.keys(file.services || {}).length !==
                                    1
                                      ? "s"
                                      : ""}
                                  </div>
                                  <Button
                                    size="sm"
                                    className="mt-2 w-full"
                                    onClick={() => {
                                      Object.entries(
                                        file.services || {}
                                      ).forEach(
                                        ([serviceName, serviceData]: [
                                          string,
                                          any,
                                        ]) => {
                                          handleAddComposeServiceFull(
                                            {
                                              name: serviceName,
                                              image: serviceData.image || "",
                                              rawService: serviceData,
                                            },
                                            file.networks,
                                            file.volumes
                                          );
                                        }
                                      );
                                    }}
                                  >
                                    Add All Services
                                  </Button>
                                </div>
                              ))}
                            {composeFiles.every(
                              (file) => file.services.length === 0
                            ) && (
                              <div className="col-span-full h-32 flex items-center justify-center text-muted-foreground text-lg">
                                No services found in .yml files.
                              </div>
                            )}
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
                    key={idx}
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
                        removeService(idx);
                      }}
                      disabled={services.length === 1}
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
              <Separator className="my-2" />
              {/* VPN Configuration */}
              <Collapsible>
                <div className="flex items-center justify-between mb-2 w-full box-border">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="font-bold text-md p-0 h-auto">
                      VPN Configuration
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
                          const newType = value === "none" ? null : value as VPNConfig["type"];
                          setVpnConfig({
                            ...currentConfig,
                            enabled: newType !== null,
                            type: newType,
                            tailscale: newType === "tailscale" ? (currentConfig.tailscale || defaultTailscaleConfig()) : undefined,
                            newt: newType === "newt" ? (currentConfig.newt || defaultNewtConfig()) : undefined,
                            cloudflared: newType === "cloudflared" ? (currentConfig.cloudflared || defaultCloudflaredConfig()) : undefined,
                            wireguard: newType === "wireguard" ? (currentConfig.wireguard || defaultWireguardConfig()) : undefined,
                            zerotier: newType === "zerotier" ? (currentConfig.zerotier || defaultZerotierConfig()) : undefined,
                            netbird: newType === "netbird" ? (currentConfig.netbird || defaultNetbirdConfig()) : undefined,
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
                          <SelectItem value="cloudflared">Cloudflared</SelectItem>
                          <SelectItem value="wireguard">Wireguard</SelectItem>
                          <SelectItem value="zerotier">ZeroTier</SelectItem>
                          <SelectItem value="netbird">Netbird</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {vpnConfig && vpnConfig.enabled && vpnConfig.type === "tailscale" && vpnConfig.tailscale && (
                      <div className="flex flex-col gap-3">
                        <div>
                          <Label className="mb-1 block text-sm">Auth Key</Label>
                          <Input
                            value={vpnConfig.tailscale.authKey}
                            onChange={(e) => setVpnConfig({
                              ...vpnConfig,
                              tailscale: { ...vpnConfig.tailscale!, authKey: e.target.value }
                            })}
                            placeholder="${TS_AUTHKEY}"
                          />
                          <p className="text-xs text-muted-foreground mt-1">Get from Tailscale admin console</p>
                        </div>
                        <div>
                          <Label className="mb-1 block text-sm">Hostname</Label>
                          <Input
                            value={vpnConfig.tailscale.hostname}
                            onChange={(e) => setVpnConfig({
                              ...vpnConfig,
                              tailscale: { ...vpnConfig.tailscale!, hostname: e.target.value }
                            })}
                            placeholder="my-service"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={vpnConfig.tailscale.acceptDns}
                            onCheckedChange={(checked) => setVpnConfig({
                              ...vpnConfig,
                              tailscale: { ...vpnConfig.tailscale!, acceptDns: checked === true }
                            })}
                          />
                          <Label 
                            className="text-sm cursor-pointer"
                            onClick={() => {
                              if (!vpnConfig.tailscale) return;
                              setVpnConfig({
                                ...vpnConfig,
                                tailscale: { ...vpnConfig.tailscale, acceptDns: !vpnConfig.tailscale.acceptDns }
                              });
                            }}
                          >
                            Accept DNS
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={vpnConfig.tailscale.authOnce}
                            onCheckedChange={(checked) => setVpnConfig({
                              ...vpnConfig,
                              tailscale: { ...vpnConfig.tailscale!, authOnce: checked === true }
                            })}
                          />
                          <Label 
                            className="text-sm cursor-pointer"
                            onClick={() => {
                              if (!vpnConfig.tailscale) return;
                              setVpnConfig({
                                ...vpnConfig,
                                tailscale: { ...vpnConfig.tailscale, authOnce: !vpnConfig.tailscale.authOnce }
                              });
                            }}
                          >
                            Auth Once
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={vpnConfig.tailscale.userspace}
                            onCheckedChange={(checked) => setVpnConfig({
                              ...vpnConfig,
                              tailscale: { ...vpnConfig.tailscale!, userspace: checked === true }
                            })}
                          />
                          <Label 
                            className="text-sm cursor-pointer"
                            onClick={() => {
                              if (!vpnConfig.tailscale) return;
                              setVpnConfig({
                                ...vpnConfig,
                                tailscale: { ...vpnConfig.tailscale, userspace: !vpnConfig.tailscale.userspace }
                              });
                            }}
                          >
                            Userspace
                          </Label>
                        </div>
                        <div>
                          <Label className="mb-1 block text-sm">Exit Node (optional)</Label>
                          <Input
                            value={vpnConfig.tailscale.exitNode}
                            onChange={(e) => setVpnConfig({
                              ...vpnConfig,
                              tailscale: { ...vpnConfig.tailscale!, exitNode: e.target.value }
                            })}
                            placeholder="Exit node IP or hostname"
                          />
                        </div>
                        {vpnConfig.tailscale.exitNode && (
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={vpnConfig.tailscale.exitNodeAllowLan}
                              onCheckedChange={(checked) => setVpnConfig({
                                ...vpnConfig,
                                tailscale: { ...vpnConfig.tailscale!, exitNodeAllowLan: checked === true }
                              })}
                            />
                            <Label 
                              className="text-sm cursor-pointer"
                              onClick={() => {
                                if (!vpnConfig.tailscale) return;
                                setVpnConfig({
                                  ...vpnConfig,
                                  tailscale: { ...vpnConfig.tailscale, exitNodeAllowLan: !vpnConfig.tailscale.exitNodeAllowLan }
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
                            onCheckedChange={(checked) => setVpnConfig({
                              ...vpnConfig,
                              tailscale: { ...vpnConfig.tailscale!, enableServe: checked === true }
                            })}
                          />
                          <Label 
                            className="text-sm cursor-pointer"
                            onClick={() => {
                              if (!vpnConfig.tailscale) return;
                              setVpnConfig({
                                ...vpnConfig,
                                tailscale: { ...vpnConfig.tailscale, enableServe: !vpnConfig.tailscale.enableServe }
                              });
                            }}
                          >
                            Enable Serve (TCP/HTTPS)
                          </Label>
                        </div>
                        {vpnConfig.tailscale.enableServe && (
                          <div className="flex flex-col gap-3 pl-4 border-l-2">
                            <div>
                              <Label className="mb-1 block text-sm">Target Service</Label>
                              <Select
                                value={vpnConfig.tailscale.serveTargetService}
                                onValueChange={(value) => setVpnConfig({
                                  ...vpnConfig,
                                  tailscale: { ...vpnConfig.tailscale!, serveTargetService: value }
                                })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select service..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {services.filter(s => s.name).map(s => (
                                    <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="mb-1 block text-sm">External Port</Label>
                              <Input
                                value={vpnConfig.tailscale.serveExternalPort}
                                onChange={(e) => setVpnConfig({
                                  ...vpnConfig,
                                  tailscale: { ...vpnConfig.tailscale!, serveExternalPort: e.target.value }
                                })}
                                placeholder="443"
                              />
                            </div>
                            <div>
                              <Label className="mb-1 block text-sm">Internal Port</Label>
                              <Input
                                value={vpnConfig.tailscale.serveInternalPort}
                                onChange={(e) => setVpnConfig({
                                  ...vpnConfig,
                                  tailscale: { ...vpnConfig.tailscale!, serveInternalPort: e.target.value }
                                })}
                                placeholder="8080"
                              />
                            </div>
                            <div>
                              <Label className="mb-1 block text-sm">Path</Label>
                              <Input
                                value={vpnConfig.tailscale.servePath}
                                onChange={(e) => setVpnConfig({
                                  ...vpnConfig,
                                  tailscale: { ...vpnConfig.tailscale!, servePath: e.target.value }
                                })}
                                placeholder="/"
                              />
                            </div>
                            <div>
                              <Label className="mb-1 block text-sm">Protocol</Label>
                              <Select
                                value={vpnConfig.tailscale.serveProtocol}
                                onValueChange={(value) => setVpnConfig({
                                  ...vpnConfig,
                                  tailscale: { ...vpnConfig.tailscale!, serveProtocol: value as "HTTPS" | "HTTP" }
                                })}
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
                              <Label className="mb-1 block text-sm">Cert Domain (optional)</Label>
                              <Input
                                value={vpnConfig.tailscale.certDomain}
                                onChange={(e) => setVpnConfig({
                                  ...vpnConfig,
                                  tailscale: { ...vpnConfig.tailscale!, certDomain: e.target.value }
                                })}
                                placeholder="${TS_CERT_DOMAIN}"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {vpnConfig && vpnConfig.enabled && vpnConfig.type === "newt" && vpnConfig.newt && (
                      <div className="flex flex-col gap-3">
                        <div>
                          <Label className="mb-1 block text-sm">Endpoint</Label>
                          <Input
                            value={vpnConfig.newt.endpoint}
                            onChange={(e) => setVpnConfig({
                              ...vpnConfig,
                              newt: { ...vpnConfig.newt!, endpoint: e.target.value }
                            })}
                            placeholder="https://app.pangolin.net"
                          />
                        </div>
                        <div>
                          <Label className="mb-1 block text-sm">Newt ID</Label>
                          <Input
                            value={vpnConfig.newt.newtId}
                            onChange={(e) => setVpnConfig({
                              ...vpnConfig,
                              newt: { ...vpnConfig.newt!, newtId: e.target.value }
                            })}
                            placeholder="${NEWT_ID}"
                          />
                        </div>
                        <div>
                          <Label className="mb-1 block text-sm">Newt Secret</Label>
                          <Input
                            value={vpnConfig.newt.newtSecret}
                            onChange={(e) => setVpnConfig({
                              ...vpnConfig,
                              newt: { ...vpnConfig.newt!, newtSecret: e.target.value }
                            })}
                            placeholder="${NEWT_SECRET}"
                            type="password"
                          />
                        </div>
                        <div>
                          <Label className="mb-1 block text-sm">Network Name</Label>
                          <Input
                            value={vpnConfig.newt.networkName}
                            onChange={(e) => setVpnConfig({
                              ...vpnConfig,
                              newt: { ...vpnConfig.newt!, networkName: e.target.value }
                            })}
                            placeholder="newt"
                          />
                        </div>
                      </div>
                    )}

                    {vpnConfig && vpnConfig.enabled && vpnConfig.type === "cloudflared" && vpnConfig.cloudflared && (
                      <div className="flex flex-col gap-3">
                        <div>
                          <Label className="mb-1 block text-sm">Tunnel Token</Label>
                          <Input
                            value={vpnConfig.cloudflared.tunnelToken}
                            onChange={(e) => setVpnConfig({
                              ...vpnConfig,
                              cloudflared: { ...vpnConfig.cloudflared!, tunnelToken: e.target.value }
                            })}
                            placeholder="${TUNNEL_TOKEN}"
                            type="password"
                          />
                          <p className="text-xs text-muted-foreground mt-1">Get from Cloudflare dashboard</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={vpnConfig.cloudflared.noAutoupdate}
                            onCheckedChange={(checked) => setVpnConfig({
                              ...vpnConfig,
                              cloudflared: { ...vpnConfig.cloudflared!, noAutoupdate: checked === true }
                            })}
                          />
                          <Label 
                            className="text-sm cursor-pointer"
                            onClick={() => {
                              if (!vpnConfig.cloudflared) return;
                              setVpnConfig({
                                ...vpnConfig,
                                cloudflared: { ...vpnConfig.cloudflared, noAutoupdate: !vpnConfig.cloudflared.noAutoupdate }
                              });
                            }}
                          >
                            No Auto-update
                          </Label>
                        </div>
                      </div>
                    )}

                    {vpnConfig && vpnConfig.enabled && vpnConfig.type === "wireguard" && vpnConfig.wireguard && (
                      <div className="flex flex-col gap-3">
                        <div>
                          <Label className="mb-1 block text-sm">Config Path</Label>
                          <Input
                            value={vpnConfig.wireguard.configPath}
                            onChange={(e) => setVpnConfig({
                              ...vpnConfig,
                              wireguard: { ...vpnConfig.wireguard!, configPath: e.target.value }
                            })}
                            placeholder="/etc/wireguard/wg0.conf"
                          />
                        </div>
                        <div>
                          <Label className="mb-1 block text-sm">Interface Name</Label>
                          <Input
                            value={vpnConfig.wireguard.interfaceName}
                            onChange={(e) => setVpnConfig({
                              ...vpnConfig,
                              wireguard: { ...vpnConfig.wireguard!, interfaceName: e.target.value }
                            })}
                            placeholder="wg0"
                          />
                        </div>
                      </div>
                    )}

                    {vpnConfig && vpnConfig.enabled && vpnConfig.type === "zerotier" && vpnConfig.zerotier && (
                      <div className="flex flex-col gap-3">
                        <div>
                          <Label className="mb-1 block text-sm">Network ID</Label>
                          <Input
                            value={vpnConfig.zerotier.networkId}
                            onChange={(e) => setVpnConfig({
                              ...vpnConfig,
                              zerotier: { ...vpnConfig.zerotier!, networkId: e.target.value }
                            })}
                            placeholder="${ZT_NETWORK_ID}"
                          />
                        </div>
                        <div>
                          <Label className="mb-1 block text-sm">Identity Path</Label>
                          <Input
                            value={vpnConfig.zerotier.identityPath}
                            onChange={(e) => setVpnConfig({
                              ...vpnConfig,
                              zerotier: { ...vpnConfig.zerotier!, identityPath: e.target.value }
                            })}
                            placeholder="/var/lib/zerotier-one"
                          />
                        </div>
                      </div>
                    )}

                    {vpnConfig && vpnConfig.enabled && vpnConfig.type === "netbird" && vpnConfig.netbird && (
                      <div className="flex flex-col gap-3">
                        <div>
                          <Label className="mb-1 block text-sm">Setup Key</Label>
                          <Input
                            value={vpnConfig.netbird.setupKey}
                            onChange={(e) => setVpnConfig({
                              ...vpnConfig,
                              netbird: { ...vpnConfig.netbird!, setupKey: e.target.value }
                            })}
                            placeholder="${NETBIRD_SETUP_KEY}"
                            type="password"
                          />
                        </div>
                        <div>
                          <Label className="mb-1 block text-sm">Management URL (optional)</Label>
                          <Input
                            value={vpnConfig.netbird.managementUrl}
                            onChange={(e) => setVpnConfig({
                              ...vpnConfig,
                              netbird: { ...vpnConfig.netbird!, managementUrl: e.target.value }
                            })}
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
                          
                          if (vpnConfig.type === "tailscale" && vpnConfig.tailscale) {
                            if (!vpnConfig.tailscale.authKey) {
                              hasErrors = true;
                              errorMessage = "Tailscale Auth Key is required";
                            }
                            if (vpnConfig.tailscale.enableServe && !vpnConfig.tailscale.serveTargetService) {
                              hasErrors = true;
                              errorMessage = "Target service is required when Serve is enabled";
                            }
                          } else if (vpnConfig.type === "newt" && vpnConfig.newt) {
                            if (!vpnConfig.newt.newtId || !vpnConfig.newt.newtSecret) {
                              hasErrors = true;
                              errorMessage = "Newt ID and Secret are required";
                            }
                          } else if (vpnConfig.type === "cloudflared" && vpnConfig.cloudflared) {
                            if (!vpnConfig.cloudflared.tunnelToken) {
                              hasErrors = true;
                              errorMessage = "Cloudflared Tunnel Token is required";
                            }
                          } else if (vpnConfig.type === "zerotier" && vpnConfig.zerotier) {
                            if (!vpnConfig.zerotier.networkId) {
                              hasErrors = true;
                              errorMessage = "ZeroTier Network ID is required";
                            }
                          } else if (vpnConfig.type === "netbird" && vpnConfig.netbird) {
                            if (!vpnConfig.netbird.setupKey) {
                              hasErrors = true;
                              errorMessage = "Netbird Setup Key is required";
                            }
                          }
                          
                          if (vpnConfig.servicesUsingVpn.length === 0) {
                            hasErrors = true;
                            errorMessage = "At least one service must be selected to use VPN";
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
                          <Label className="text-sm font-semibold">Services Using VPN</Label>
                          {services.filter(s => s.name).length === 0 ? (
                            <p className="text-xs text-muted-foreground">Add services first</p>
                          ) : (
                            <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                              {services.filter(s => s.name).map((svc) => (
                                <div key={svc.name} className="flex items-center gap-2">
                                  <Checkbox
                                    checked={vpnConfig.servicesUsingVpn.includes(svc.name)}
                                    onCheckedChange={(checked) => {
                                      const newServices = checked
                                        ? [...vpnConfig.servicesUsingVpn, svc.name]
                                        : vpnConfig.servicesUsingVpn.filter(n => n !== svc.name);
                                      setVpnConfig({
                                        ...vpnConfig,
                                        servicesUsingVpn: newServices
                                      });
                                    }}
                                  />
                                  <Label 
                                    htmlFor={`vpn-service-${svc.name}`}
                                    className="text-sm cursor-pointer flex-1"
                                    onClick={() => {
                                      const isChecked = vpnConfig.servicesUsingVpn.includes(svc.name);
                                      const newServices = !isChecked
                                        ? [...vpnConfig.servicesUsingVpn, svc.name]
                                        : vpnConfig.servicesUsingVpn.filter(n => n !== svc.name);
                                      setVpnConfig({
                                        ...vpnConfig,
                                        servicesUsingVpn: newServices
                                      });
                                    }}
                                  >
                                    {svc.name}
                                  </Label>
                                  {vpnConfig.type && ["tailscale", "cloudflared"].includes(vpnConfig.type) && 
                                   vpnConfig.servicesUsingVpn.includes(svc.name) && (
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
            <section className="h-full p-4 flex flex-col gap-4 bg-background border-r overflow-y-auto box-border">
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
                        placeholder="e.g. web"
                      />
                    </div>
                    <div>
                      <Label className="mb-1 block">Container Name</Label>
                      <Input
                        value={svc.container_name || ""}
                        onChange={(e) =>
                          updateServiceField("container_name", e.target.value)
                        }
                        placeholder="e.g. my-nginx"
                      />
                    </div>
                    <div>
                      <Label className="mb-1 block">Image</Label>
                      <Input
                        value={svc.image}
                        onChange={(e) =>
                          updateServiceField("image", e.target.value)
                        }
                        placeholder="e.g. nginx:latest"
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
                                  {port.protocol || "tcp"}
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
                        <Label className="block">Environment Variables</Label>
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
                          onClick={() => addListField("environment")}
                        >
                          + Add Variable
                        </Button>
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
            <section className="h-full pl-4 pr-3 pb-4 pt-2 flex flex-col bg-background box-border overflow-hidden lg:col-span-2">
              <div className="mb-2 w-full box-border flex items-center justify-between gap-2">
                <span className="font-bold text-lg">Docker Compose File</span>
                <div className="flex items-center gap-2">
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
                className="flex-1 w-full h-full min-h-0 min-w-0 overflow-hidden"
              >
                <CodeEditor
                  content={yaml}
                  onContentChange={() => {}}
                  width={editorSize.width}
                  height={editorSize.height}
                />
              </div>
            </section>
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* Conversion Dialog */}
      <Dialog
        open={conversionDialogOpen}
        onOpenChange={setConversionDialogOpen}
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
            <div className="relative">
              <Textarea
                value={conversionOutput}
                readOnly
                className="font-mono text-sm min-h-[300px]"
              />
            </div>
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
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
