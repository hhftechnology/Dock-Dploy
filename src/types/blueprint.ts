// Pangolin Blueprint schema — mirrors fosrl/blueprints.
// A Blueprint is a docker-compose.yml augmented with `pangolin.*` Docker
// labels + a sibling .env.example. Each Resource targets a service key in the
// underlying compose document and emits labels under a `blueprintName` slug.

export type BlueprintProtocol = "http" | "tcp" | "udp";
export type BlueprintTargetMethod = "http" | "https" | "h2c";
export type BlueprintPathMatch = "exact" | "prefix" | "regex";
export type BlueprintRewriteMatch = BlueprintPathMatch | "stripPrefix";
export type BlueprintRuleAction = "allow" | "deny" | "pass";
export type BlueprintRuleMatch =
  | "cidr"
  | "path"
  | "ip"
  | "country"
  | "asn"
  | "region";
export type BlueprintPrivateMode = "host" | "cidr" | "http";
export type BlueprintPrivateScheme = "http" | "https";
export type BlueprintMaintenanceType = "forced" | "automatic";

export interface BlueprintHeader {
  name: string;
  value: string;
}

export interface BlueprintRule {
  action: BlueprintRuleAction;
  match: BlueprintRuleMatch;
  value: string;
  priority?: number;
}

export interface BlueprintHealthcheck {
  enabled?: boolean;
  hostname: string;
  port?: number;
  path: string;
  scheme?: BlueprintPrivateScheme;
  mode?: string;
  interval?: number;
  unhealthyInterval?: number;
  timeout?: number;
  headers: BlueprintHeader[];
  followRedirects?: boolean;
  method?: string;
  status?: number;
}

export interface BlueprintMaintenance {
  enabled: boolean;
  type: BlueprintMaintenanceType;
  title: string;
  message: string;
  estimatedTime: string;
}

export interface BlueprintTarget {
  site?: string;
  method?: BlueprintTargetMethod;
  hostname?: string;
  port?: number;
  enabled?: boolean;
  internalPort?: number;
  path?: string;
  pathMatch?: BlueprintPathMatch;
  rewritePath?: string;
  rewriteMatch?: BlueprintRewriteMatch;
  priority?: number;
  healthcheck?: BlueprintHealthcheck;
}

export interface BlueprintAuth {
  pincode: string;
  password: string;
  basicUser: string;
  basicPassword: string;
  ssoEnabled: boolean;
  ssoRoles: string[];
  ssoUsers: string[];
  whitelistUsers: string[];
}

export interface BlueprintResource {
  // The compose service key — labels are injected on this service.
  serviceContainerName: string;
  // Pangolin label namespace (URL-safe slug).
  blueprintName: string;
  // Human-readable Pangolin resource name.
  resourceName: string;
  // Subdomain prefix; full domain = `${subdomain}.${baseDomain}`.
  subdomain: string;
  // Internal port Pangolin should reach.
  servicePort: number;
  // Public proxy port for raw TCP/UDP public resources.
  proxyPort?: number;
  // Image kept verbatim from the imported compose, used in the .env.example.
  image: string;
  // Pangolin public resource protocol.
  protocol: BlueprintProtocol;
  enabled: boolean;
  ssl: boolean;
  hostHeader: string;
  tlsServerName: string;
  headers: BlueprintHeader[];
  rules: BlueprintRule[];
  maintenance: BlueprintMaintenance;
  targetSite?: string;
  targetMethod: BlueprintTargetMethod;
  targetHostname?: string;
  targetPort?: number;
  targetEnabled?: boolean;
  targetInternalPort?: number;
  targetPath?: string;
  targetPathMatch?: BlueprintPathMatch;
  targetRewritePath?: string;
  targetRewriteMatch?: BlueprintRewriteMatch;
  targetPriority?: number;
  targetHealthcheck?: BlueprintHealthcheck;
  // Additional targets beyond targets[0].
  extraTargets: BlueprintTarget[];
  // Resource-level auth additions/overrides.
  auth: BlueprintAuth;
}

export interface BlueprintPrivateResource {
  serviceContainerName: string;
  key: string;
  name: string;
  mode: BlueprintPrivateMode;
  sites: string[];
  destination: string;
  destinationPort?: number;
  fullDomain: string;
  ssl: boolean;
  scheme: BlueprintPrivateScheme;
  tcpPorts: string;
  udpPorts: string;
  disableIcmp: boolean;
  alias: string;
  roles: string[];
  users: string[];
  machines: string[];
}

export interface BlueprintSite {
  serviceContainerName: string;
  key: string;
  name: string;
  dockerSocketEnabled: boolean;
}

export interface Blueprint {
  version: 1;
  baseDomain: string;
  pangolinNetwork: string; // default "pangolin_default"
  resources: BlueprintResource[];
  privateResources: BlueprintPrivateResource[];
  sites: BlueprintSite[];
  // Raw compose document parsed from the imported template — preserved so
  // we re-emit it verbatim with labels injected. null = empty / no import.
  composeDocument: Record<string, unknown> | null;
}
