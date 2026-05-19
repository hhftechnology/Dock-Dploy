// Pangolin Blueprint generator — fosrl/blueprints compatible.
//
// `fromCompose(yaml, baseDomain?)` parses a compose YAML and produces a
// Blueprint with one resource per service. The raw compose document is kept
// so we can re-emit it verbatim with labels injected.
//
// `toComposeYaml(bp)` returns the augmented docker-compose.yml.
// `toEnvExample(bp)` returns the matching .env.example.

import jsyaml from "js-yaml";
import { sanitizeComposeVersion } from "../compose-version";
import type {
  Blueprint,
  BlueprintAuth,
  BlueprintHealthcheck,
  BlueprintMaintenance,
  BlueprintPrivateResource,
  BlueprintProtocol,
  BlueprintResource,
  BlueprintSite,
  BlueprintTarget,
  BlueprintTargetMethod,
} from "../../types/blueprint";

const DEFAULT_NETWORK = "pangolin_default";
const DEFAULT_SERVICE_PORT = 80;

export function defaultAuth(): BlueprintAuth {
  return {
    pincode: "",
    password: "",
    basicUser: "",
    basicPassword: "",
    ssoEnabled: false,
    ssoRoles: [],
    ssoUsers: [],
    whitelistUsers: [],
  };
}

export function defaultHealthcheck(): BlueprintHealthcheck {
  return {
    enabled: undefined,
    hostname: "",
    port: undefined,
    path: "",
    scheme: "http",
    mode: "",
    interval: undefined,
    unhealthyInterval: undefined,
    timeout: undefined,
    headers: [],
    followRedirects: undefined,
    method: "",
    status: undefined,
  };
}

export function defaultMaintenance(): BlueprintMaintenance {
  return {
    enabled: false,
    type: "forced",
    title: "",
    message: "",
    estimatedTime: "",
  };
}

export function defaultResource(): BlueprintResource {
  return {
    serviceContainerName: "",
    blueprintName: "",
    resourceName: "",
    subdomain: "",
    servicePort: DEFAULT_SERVICE_PORT,
    proxyPort: undefined,
    image: "",
    protocol: "http",
    enabled: true,
    ssl: false,
    hostHeader: "",
    tlsServerName: "",
    headers: [],
    rules: [],
    maintenance: defaultMaintenance(),
    targetSite: undefined,
    targetMethod: "http",
    targetHostname: undefined,
    targetPort: undefined,
    targetEnabled: undefined,
    targetInternalPort: undefined,
    targetPath: undefined,
    targetPathMatch: undefined,
    targetRewritePath: undefined,
    targetRewriteMatch: undefined,
    targetPriority: undefined,
    targetHealthcheck: undefined,
    extraTargets: [],
    auth: defaultAuth(),
  };
}

export function defaultPrivateResource(
  serviceContainerName = "",
): BlueprintPrivateResource {
  return {
    serviceContainerName,
    key: "",
    name: "",
    mode: "host",
    sites: [],
    destination: "",
    destinationPort: undefined,
    fullDomain: "",
    ssl: false,
    scheme: "http",
    tcpPorts: "",
    udpPorts: "",
    disableIcmp: false,
    alias: "",
    roles: [],
    users: [],
    machines: [],
  };
}

export function defaultSite(serviceContainerName = ""): BlueprintSite {
  return {
    serviceContainerName,
    key: "",
    name: "",
    dockerSocketEnabled: false,
  };
}

export function defaultBlueprint(): Blueprint {
  return {
    version: 1,
    baseDomain: "",
    pangolinNetwork: DEFAULT_NETWORK,
    resources: [],
    privateResources: [],
    sites: [],
    composeDocument: null,
  };
}

// ---------- compose -> blueprint ----------

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleCase(s: string): string {
  return s
    .replace(/[-_]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

function asNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n =
    typeof v === "number" ? v : Number(String(v).replace(/[^\d]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

interface ComposePort {
  host?: string | number;
  container?: string | number;
  published?: string | number;
  target?: string | number;
  protocol?: string;
}

function firstServicePort(svc: Record<string, unknown>): number | null {
  // Prefer published host, then container, then expose[0].
  const ports = Array.isArray(svc.ports) ? (svc.ports as unknown[]) : [];
  for (const p of ports) {
    if (typeof p === "string" || typeof p === "number") {
      const s = String(p);
      if (s.includes(":")) {
        const [h, rest] = s.split(":");
        const host = asNumber(h);
        if (host !== null) return host;
        const c = asNumber((rest || "").split("/")[0]);
        if (c !== null) return c;
      } else {
        const c = asNumber(s.split("/")[0]);
        if (c !== null) return c;
      }
    } else if (p && typeof p === "object") {
      const o = p as ComposePort;
      const host = asNumber(o.host ?? o.published);
      if (host !== null) return host;
      const c = asNumber(o.container ?? o.target);
      if (c !== null) return c;
    }
  }
  const expose = Array.isArray(svc.expose) ? (svc.expose as unknown[]) : [];
  for (const e of expose) {
    const n = asNumber(e);
    if (n !== null) return n;
  }
  return null;
}

function targetMethodFor(port: number): BlueprintTargetMethod {
  if (port === 443 || port === 8443) return "https";
  return "http";
}

export function resourceFromComposeService(
  serviceKey: string,
  rawService: unknown,
): BlueprintResource {
  const svc =
    rawService && typeof rawService === "object"
      ? (rawService as Record<string, unknown>)
      : {};
  const port = firstServicePort(svc) ?? DEFAULT_SERVICE_PORT;
  const blueprintName = slug(serviceKey) || serviceKey.toLowerCase() || "service";

  return {
    ...defaultResource(),
    serviceContainerName: serviceKey,
    blueprintName,
    resourceName: titleCase(serviceKey) || serviceKey,
    subdomain: blueprintName,
    servicePort: port,
    image: typeof svc.image === "string" ? svc.image : "",
    protocol: "http",
    targetMethod: targetMethodFor(port),
  };
}

function uniqueBlueprintName(base: string, seen: Set<string>): string {
  if (!seen.has(base)) {
    seen.add(base);
    return base;
  }
  let i = 2;
  while (seen.has(`${base}-${i}`)) i += 1;
  const next = `${base}-${i}`;
  seen.add(next);
  return next;
}

export function fromCompose(yamlContent: string, baseDomain = ""): Blueprint {
  let doc: unknown;
  try {
    doc = jsyaml.load(sanitizeComposeVersion(yamlContent).content);
  } catch {
    return defaultBlueprint();
  }
  if (!doc || typeof doc !== "object") return defaultBlueprint();
  const root = doc as Record<string, unknown>;
  const services =
    root.services && typeof root.services === "object"
      ? (root.services as Record<string, unknown>)
      : null;
  if (!services) return defaultBlueprint();

  const bp = defaultBlueprint();
  bp.baseDomain = baseDomain;
  bp.composeDocument = root;

  const seenBlueprintNames = new Set<string>();
  for (const [svcKey, raw] of Object.entries(services)) {
    if (!raw || typeof raw !== "object") continue;
    const resource = resourceFromComposeService(svcKey, raw);
    resource.blueprintName = uniqueBlueprintName(
      resource.blueprintName,
      seenBlueprintNames,
    );
    resource.subdomain = resource.blueprintName;
    bp.resources.push(resource);
  }
  return bp;
}

// ---------- blueprint -> compose YAML ----------

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

function dedupePreserveOrder<T>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const key = typeof item === "string" ? item : JSON.stringify(item);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function labelsToArray(labels: unknown): string[] {
  if (Array.isArray(labels)) {
    return labels.map((v) => String(v));
  }
  if (isPlainObject(labels)) {
    return Object.entries(labels).map(([key, value]) => `${key}=${String(value)}`);
  }
  return [];
}

function removePangolinLabels(labels: string[], prefixes: string[]): string[] {
  return labels.filter((label) => !prefixes.some((prefix) => label.startsWith(prefix)));
}

function pushLabel(labels: string[], key: string, value: unknown) {
  if (value === undefined || value === null || value === "") return;
  labels.push(`${key}=${String(value)}`);
}

function pushBoolLabel(
  labels: string[],
  key: string,
  value: boolean | undefined,
  defaultValue: boolean,
) {
  if (value === undefined || value === defaultValue) return;
  labels.push(`${key}=${value ? "true" : "false"}`);
}

function pushArrayLabels(labels: string[], prefix: string, values: string[]) {
  values.filter(Boolean).forEach((value, i) => pushLabel(labels, `${prefix}[${i}]`, value));
}

function pushHeaderLabels(labels: string[], prefix: string, headers: Blueprint["resources"][number]["headers"]) {
  headers.filter((h) => h.name && h.value).forEach((h, i) => {
    pushLabel(labels, `${prefix}[${i}].name`, h.name);
    pushLabel(labels, `${prefix}[${i}].value`, h.value);
  });
}

function pushHealthcheckLabels(
  labels: string[],
  prefix: string,
  hc: BlueprintHealthcheck | undefined,
) {
  if (!hc) return;
  pushBoolLabel(labels, `${prefix}.enabled`, hc.enabled, true);
  pushLabel(labels, `${prefix}.hostname`, hc.hostname);
  pushLabel(labels, `${prefix}.port`, hc.port);
  pushLabel(labels, `${prefix}.path`, hc.path);
  pushLabel(labels, `${prefix}.scheme`, hc.scheme);
  pushLabel(labels, `${prefix}.mode`, hc.mode);
  pushLabel(labels, `${prefix}.interval`, hc.interval);
  pushLabel(labels, `${prefix}.unhealthy-interval`, hc.unhealthyInterval);
  pushLabel(labels, `${prefix}.timeout`, hc.timeout);
  pushHeaderLabels(labels, `${prefix}.headers`, hc.headers);
  pushBoolLabel(labels, `${prefix}.follow-redirects`, hc.followRedirects, true);
  pushLabel(labels, `${prefix}.method`, hc.method);
  pushLabel(labels, `${prefix}.status`, hc.status);
}

function pushTargetLabels(
  labels: string[],
  prefix: string,
  protocol: BlueprintProtocol,
  target: BlueprintTarget,
) {
  if (protocol === "http") pushLabel(labels, `${prefix}.method`, target.method ?? "http");
  pushLabel(labels, `${prefix}.site`, target.site);
  pushLabel(labels, `${prefix}.hostname`, target.hostname);
  pushLabel(labels, `${prefix}.port`, target.port);
  pushBoolLabel(labels, `${prefix}.enabled`, target.enabled, true);
  pushLabel(labels, `${prefix}.internal-port`, target.internalPort);
  pushLabel(labels, `${prefix}.path`, target.path);
  pushLabel(labels, `${prefix}.path-match`, target.pathMatch);
  pushLabel(labels, `${prefix}.rewrite-path`, target.rewritePath);
  pushLabel(labels, `${prefix}.rewrite-match`, target.rewriteMatch);
  pushLabel(labels, `${prefix}.priority`, target.priority);
  pushHealthcheckLabels(labels, `${prefix}.healthcheck`, target.healthcheck);
}

function labelsForPublicResource(bp: Blueprint, r: BlueprintResource): string[] {
  const ns = `pangolin.public-resources.${r.blueprintName}`;
  const fullDomain = bp.baseDomain
    ? `${r.subdomain}.${bp.baseDomain}`
    : r.subdomain;
  const labels: string[] = [
    `${ns}.name=${r.resourceName}`,
    `${ns}.protocol=${r.protocol}`,
  ];

  pushBoolLabel(labels, `${ns}.enabled`, r.enabled, true);
  if (r.protocol === "http") {
    pushLabel(labels, `${ns}.full-domain`, fullDomain);
    pushBoolLabel(labels, `${ns}.ssl`, r.ssl, false);
    pushLabel(labels, `${ns}.host-header`, r.hostHeader);
    pushLabel(labels, `${ns}.tls-server-name`, r.tlsServerName);
    pushTargetLabels(labels, `${ns}.targets[0]`, r.protocol, {
      site: r.targetSite,
      method: r.targetMethod,
      hostname: r.targetHostname,
      port: r.targetPort,
      enabled: r.targetEnabled,
      internalPort: r.targetInternalPort,
      path: r.targetPath,
      pathMatch: r.targetPathMatch,
      rewritePath: r.targetRewritePath,
      rewriteMatch: r.targetRewriteMatch,
      priority: r.targetPriority,
      healthcheck: r.targetHealthcheck,
    });
    r.extraTargets.forEach((t, i) => {
      pushTargetLabels(labels, `${ns}.targets[${i + 1}]`, r.protocol, t);
    });

    pushHeaderLabels(labels, `${ns}.headers`, r.headers);
    r.rules.filter((rule) => rule.action && rule.match && rule.value).forEach((rule, i) => {
      pushLabel(labels, `${ns}.rules[${i}].action`, rule.action);
      pushLabel(labels, `${ns}.rules[${i}].match`, rule.match);
      pushLabel(labels, `${ns}.rules[${i}].value`, rule.value);
      pushLabel(labels, `${ns}.rules[${i}].priority`, rule.priority);
    });
    if (r.maintenance.enabled) {
      pushLabel(labels, `${ns}.maintenance.enabled`, true);
      pushLabel(labels, `${ns}.maintenance.type`, r.maintenance.type);
      pushLabel(labels, `${ns}.maintenance.title`, r.maintenance.title);
      pushLabel(labels, `${ns}.maintenance.message`, r.maintenance.message);
      pushLabel(labels, `${ns}.maintenance.estimated-time`, r.maintenance.estimatedTime);
    }

    const a = r.auth;
    pushLabel(labels, `${ns}.auth.pincode`, a.pincode);
    pushLabel(labels, `${ns}.auth.password`, a.password);
    pushLabel(labels, `${ns}.auth.basic-auth.user`, a.basicUser);
    pushLabel(labels, `${ns}.auth.basic-auth.password`, a.basicPassword);
    if (a.ssoEnabled) pushLabel(labels, `${ns}.auth.sso-enabled`, true);
    pushArrayLabels(labels, `${ns}.auth.sso-roles`, a.ssoRoles);
    pushArrayLabels(labels, `${ns}.auth.sso-users`, a.ssoUsers);
    pushArrayLabels(labels, `${ns}.auth.whitelist-users`, a.whitelistUsers);
  } else {
    pushLabel(labels, `${ns}.proxy-port`, r.proxyPort ?? r.servicePort);
  }

  return labels;
}

function labelsForPrivateResource(r: BlueprintPrivateResource): string[] {
  const ns = `pangolin.private-resources.${r.key}`;
  const labels: string[] = [];
  pushLabel(labels, `${ns}.name`, r.name);
  pushLabel(labels, `${ns}.mode`, r.mode);
  pushArrayLabels(labels, `${ns}.sites`, r.sites);
  pushLabel(labels, `${ns}.destination`, r.destination);
  pushLabel(labels, `${ns}.destination-port`, r.destinationPort);
  pushLabel(labels, `${ns}.full-domain`, r.fullDomain);
  pushBoolLabel(labels, `${ns}.ssl`, r.ssl, false);
  pushLabel(labels, `${ns}.scheme`, r.scheme);
  pushLabel(labels, `${ns}.tcp-ports`, r.tcpPorts);
  pushLabel(labels, `${ns}.udp-ports`, r.udpPorts);
  pushBoolLabel(labels, `${ns}.disable-icmp`, r.disableIcmp, false);
  pushLabel(labels, `${ns}.alias`, r.alias);
  pushArrayLabels(labels, `${ns}.roles`, r.roles);
  pushArrayLabels(labels, `${ns}.users`, r.users);
  pushArrayLabels(labels, `${ns}.machines`, r.machines);
  return labels;
}

function labelsForSite(site: BlueprintSite): string[] {
  const ns = `pangolin.sites.${site.key}`;
  const labels: string[] = [];
  pushLabel(labels, `${ns}.name`, site.name);
  pushBoolLabel(labels, `${ns}.docker-socket-enabled`, site.dockerSocketEnabled, false);
  return labels;
}

function ensureService(
  services: Record<string, unknown>,
  serviceName: string,
): Record<string, unknown> {
  const svc = isPlainObject(services[serviceName])
    ? (services[serviceName] as Record<string, unknown>)
    : {};
  services[serviceName] = svc;
  return svc;
}

function removeLabelsFromService(
  services: Record<string, unknown>,
  serviceName: string,
  removePrefixes: string[],
) {
  if (!serviceName || !isPlainObject(services[serviceName])) return;
  const svc = services[serviceName] as Record<string, unknown>;
  const existing = removePangolinLabels(labelsToArray(svc.labels), removePrefixes);
  if (existing.length > 0) {
    svc.labels = existing;
  } else {
    delete svc.labels;
  }
}

function applyLabelsToService(
  services: Record<string, unknown>,
  serviceName: string,
  labels: string[],
  removePrefixes: string[],
  addNetwork: boolean,
) {
  if (!serviceName || labels.length === 0) return;
  const svc = ensureService(services, serviceName);
  const existing = removePangolinLabels(labelsToArray(svc.labels), removePrefixes);
  svc.labels = dedupePreserveOrder([...existing, ...labels]);

  if (!addNetwork) return;
  if (Array.isArray(svc.networks)) {
    const nets = svc.networks as unknown[];
    svc.networks = nets.includes("pangolin") ? nets : [...nets, "pangolin"];
  } else if (isPlainObject(svc.networks)) {
    svc.networks = { ...svc.networks, pangolin: {} };
  } else {
    svc.networks = ["pangolin"];
  }
}

export function toComposeYaml(bp: Blueprint): string {
  const baseDoc: Record<string, unknown> = bp.composeDocument
    ? deepClone(bp.composeDocument)
    : {};

  const services = isPlainObject(baseDoc.services)
    ? (baseDoc.services as Record<string, unknown>)
    : ({} as Record<string, unknown>);

  Object.keys(services).forEach((serviceName) => {
    removeLabelsFromService(services, serviceName, ["pangolin.public-resources."]);
  });

  for (const r of bp.resources) {
    applyLabelsToService(
      services,
      r.serviceContainerName,
      labelsForPublicResource(bp, r),
      [`pangolin.public-resources.${r.blueprintName}.`],
      true,
    );
  }

  for (const privateResource of bp.privateResources ?? []) {
    applyLabelsToService(
      services,
      privateResource.serviceContainerName,
      labelsForPrivateResource(privateResource),
      [`pangolin.private-resources.${privateResource.key}.`],
      false,
    );
  }

  for (const site of bp.sites ?? []) {
    applyLabelsToService(
      services,
      site.serviceContainerName,
      labelsForSite(site),
      [`pangolin.sites.${site.key}.`],
      false,
    );
  }

  baseDoc.services = services;

  const networksTop = isPlainObject(baseDoc.networks)
    ? (baseDoc.networks as Record<string, unknown>)
    : {};
  networksTop.pangolin = {
    external: true,
    name: bp.pangolinNetwork,
  };
  baseDoc.networks = networksTop;

  delete baseDoc.version;

  return jsyaml.dump(baseDoc, {
    indent: 2,
    lineWidth: 200,
    noRefs: true,
    quotingType: '"',
  });
}

// ---------- blueprint -> .env.example ----------

function envRootBlock(bp: Blueprint): string {
  return `# Shared DNS root used by all blueprints.
BASE_DOMAIN=${bp.baseDomain || "CHANGE_ME"}

# Shared Docker network that Newt and public-facing blueprint containers join.
PANGOLIN_DOCKER_NETWORK=${bp.pangolinNetwork}

# Optional global auth defaults applied to all blueprint resources.
GLOBAL_AUTH_PINCODE=
GLOBAL_AUTH_PASSWORD=
GLOBAL_AUTH_BASIC_USER=
GLOBAL_AUTH_BASIC_PASSWORD=
GLOBAL_AUTH_SSO_ENABLED=true
GLOBAL_AUTH_SSO_ROLE_0=
GLOBAL_AUTH_SSO_ROLE_1=
GLOBAL_AUTH_SSO_USER_0=
GLOBAL_AUTH_SSO_USER_1=
GLOBAL_AUTH_WHITELIST_USER_0=
GLOBAL_AUTH_WHITELIST_USER_1=`;
}

function envResourceBlock(r: BlueprintResource, includeHeader: boolean): string {
  const header = includeHeader ? `# --- ${r.serviceContainerName} ---\n` : "";
  return `${header}BLUEPRINT_NAME=${r.blueprintName}
RESOURCE_NAME=${r.resourceName}
SERVICE_SUBDOMAIN=${r.subdomain}
SERVICE_CONTAINER_NAME=${r.serviceContainerName}
SERVICE_PORT=${r.servicePort}
APP_IMAGE=${r.image}

# Optional resource-specific auth overrides and additions.
# Scalars override GLOBAL_AUTH_* values from the root .env.
# Indexed arrays are appended after the GLOBAL_AUTH_* arrays.
# RESOURCE_AUTH_PINCODE=
# RESOURCE_AUTH_PASSWORD=
# RESOURCE_AUTH_BASIC_USER=
# RESOURCE_AUTH_BASIC_PASSWORD=
# RESOURCE_AUTH_SSO_ENABLED=
# RESOURCE_AUTH_SSO_ROLE_0=
# RESOURCE_AUTH_SSO_USER_0=
# RESOURCE_AUTH_WHITELIST_USER_0=`;
}

export function toEnvExample(bp: Blueprint): string {
  const blocks: string[] = [envRootBlock(bp)];
  if (bp.resources.length === 0) {
    blocks.push("# Import a docker-compose template to populate resource inputs.");
    return `${blocks.join("\n\n")}\n`;
  }

  bp.resources.forEach((r) => {
    blocks.push(envResourceBlock(r, bp.resources.length > 1));
  });
  return `${blocks.join("\n\n")}\n`;
}

// Re-exported sentinel so callers don't accidentally shadow with their own.
export const PANGOLIN_NETWORK_DEFAULT = DEFAULT_NETWORK;
