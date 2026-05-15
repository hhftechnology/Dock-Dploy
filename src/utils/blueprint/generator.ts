// Pangolin Blueprint generator — fosrl/blueprints compatible.
//
// `fromCompose(yaml, baseDomain?)` parses a compose YAML and produces a
// Blueprint with one resource per service. The raw compose document is kept
// so we can re-emit it verbatim with labels injected.
//
// `toComposeYaml(bp)` returns the augmented docker-compose.yml.
// `toEnvExample(bp)` returns the matching .env.example.

import jsyaml from "js-yaml";
import type {
  Blueprint,
  BlueprintAuth,
  BlueprintProtocol,
  BlueprintResource,
} from "../../types/blueprint";

const ENV_REF = (k: string) => `\${${k}}`;
const ENV_REQUIRED = (k: string, msg: string) => `\${${k}:?${msg}}`;
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

export function defaultResource(): BlueprintResource {
  return {
    serviceContainerName: "",
    blueprintName: "",
    resourceName: "",
    subdomain: "",
    servicePort: 80,
    image: "",
    protocol: "http",
    targetHostname: undefined,
    targetPort: undefined,
    extraTargets: [],
    auth: defaultAuth(),
  };
}

export function defaultBlueprint(): Blueprint {
  return {
    version: 1,
    baseDomain: "",
    pangolinNetwork: DEFAULT_NETWORK,
    resources: [],
    composeDocument: null,
  };
}

// ---------- compose → blueprint ----------

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

function protocolFor(port: number): BlueprintProtocol {
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
  const sluggedKey = slug(serviceKey) || serviceKey.toLowerCase() || "service";

  return {
    ...defaultResource(),
    serviceContainerName: serviceKey,
    blueprintName: sluggedKey,
    resourceName: titleCase(serviceKey) || serviceKey,
    subdomain: sluggedKey,
    servicePort: port,
    image: typeof svc.image === "string" ? svc.image : "",
    protocol: protocolFor(port),
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
    doc = jsyaml.load(yamlContent);
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
    bp.resources.push(resource);
  }
  return bp;
}

// ---------- blueprint → compose YAML ----------

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

function removePangolinResourceLabels(
  labels: string[],
  blueprintName: string,
): string[] {
  const prefix = `pangolin.public-resources.${blueprintName}.`;
  return labels.filter((label) => !label.startsWith(prefix));
}

function labelsFor(bp: Blueprint, r: BlueprintResource): string[] {
  const ns = `pangolin.public-resources.${r.blueprintName}`;
  const fullDomain = bp.baseDomain
    ? `${r.subdomain}.${bp.baseDomain}`
    : r.subdomain;
  const labels: string[] = [
    `${ns}.name=${r.resourceName}`,
    `${ns}.full-domain=${fullDomain}`,
    `${ns}.protocol=${r.protocol}`,
    `${ns}.targets[0].method=${r.protocol}`,
  ];
  if (r.targetHostname) labels.push(`${ns}.targets[0].hostname=${r.targetHostname}`);
  if (r.targetPort !== undefined) labels.push(`${ns}.targets[0].port=${r.targetPort}`);

  r.extraTargets.forEach((t, i) => {
    const idx = i + 1;
    labels.push(`${ns}.targets[${idx}].method=${t.method}`);
    if (t.hostname) labels.push(`${ns}.targets[${idx}].hostname=${t.hostname}`);
    if (t.port !== undefined) labels.push(`${ns}.targets[${idx}].port=${t.port}`);
  });

  const a = r.auth;
  if (a.pincode) labels.push(`${ns}.auth.pincode=${a.pincode}`);
  if (a.password) labels.push(`${ns}.auth.password=${a.password}`);
  if (a.basicUser) labels.push(`${ns}.auth.basic-user=${a.basicUser}`);
  if (a.basicPassword) labels.push(`${ns}.auth.basic-password=${a.basicPassword}`);
  if (a.ssoEnabled) labels.push(`${ns}.auth.sso-enabled=true`);
  a.ssoRoles.filter(Boolean).forEach((role, i) =>
    labels.push(`${ns}.auth.sso-roles[${i}]=${role}`),
  );
  a.ssoUsers.filter(Boolean).forEach((user, i) =>
    labels.push(`${ns}.auth.sso-users[${i}]=${user}`),
  );
  a.whitelistUsers.filter(Boolean).forEach((user, i) =>
    labels.push(`${ns}.auth.whitelist-users[${i}]=${user}`),
  );

  return labels;
}

export function toComposeYaml(bp: Blueprint): string {
  const baseDoc: Record<string, unknown> = bp.composeDocument
    ? deepClone(bp.composeDocument)
    : {};

  // Ensure services map.
  const services = isPlainObject(baseDoc.services)
    ? (baseDoc.services as Record<string, unknown>)
    : ({} as Record<string, unknown>);

  for (const r of bp.resources) {
    const svc = isPlainObject(services[r.serviceContainerName])
      ? (services[r.serviceContainerName] as Record<string, unknown>)
      : {};
    // Inject labels — merge with anything already there, de-dupe.
    const existing = removePangolinResourceLabels(
      labelsToArray(svc.labels),
      r.blueprintName,
    );
    svc.labels = dedupePreserveOrder([...existing, ...labelsFor(bp, r)]);

    // Ensure pangolin network membership without discarding existing syntax.
    if (Array.isArray(svc.networks)) {
      const nets = svc.networks as unknown[];
      svc.networks = nets.includes("pangolin") ? nets : [...nets, "pangolin"];
    } else if (isPlainObject(svc.networks)) {
      svc.networks = { ...svc.networks, pangolin: {} };
    } else {
      svc.networks = ["pangolin"];
    }

    services[r.serviceContainerName] = svc;
  }
  baseDoc.services = services;

  // Ensure top-level pangolin network block.
  const networksTop = isPlainObject(baseDoc.networks)
    ? (baseDoc.networks as Record<string, unknown>)
    : {};
  networksTop.pangolin = {
    external: true,
    name: ENV_REF("PANGOLIN_DOCKER_NETWORK") + ":-" + bp.pangolinNetwork,
  };
  // The dump trick above creates `${PANGOLIN_DOCKER_NETWORK}:-...` which is
  // wrong; compose-style default syntax is `${VAR:-default}`. Fix in place:
  networksTop.pangolin = {
    external: true,
    name: `\${PANGOLIN_DOCKER_NETWORK:-${bp.pangolinNetwork}}`,
  };
  baseDoc.networks = networksTop;

  // Always emit at least version key for clarity.
  if (!baseDoc.version) baseDoc.version = "3.8";

  return jsyaml.dump(baseDoc, {
    indent: 2,
    lineWidth: 200,
    noRefs: true,
    quotingType: '"',
  });
}

// ---------- blueprint → .env.example ----------

export function toEnvExample(bp: Blueprint): string {
  const blocks: string[] = [];
  bp.resources.forEach((r, i) => {
    const header =
      bp.resources.length > 1 ? `# --- ${r.serviceContainerName} ---\n` : "";
    const auth = `
# Optional resource auth overrides — uncomment and set as needed.
# RESOURCE_AUTH_PINCODE=
# RESOURCE_AUTH_PASSWORD=
# RESOURCE_AUTH_BASIC_USER=
# RESOURCE_AUTH_BASIC_PASSWORD=
# RESOURCE_AUTH_SSO_ENABLED=
# RESOURCE_AUTH_SSO_ROLE_0=
# RESOURCE_AUTH_SSO_USER_0=
# RESOURCE_AUTH_WHITELIST_USER_0=`;
    const body = `BLUEPRINT_NAME=${r.blueprintName}
RESOURCE_NAME=${r.resourceName}
SERVICE_SUBDOMAIN=${r.subdomain}
SERVICE_CONTAINER_NAME=${r.serviceContainerName}
SERVICE_PORT=${r.servicePort}
APP_IMAGE=${r.image}`;
    blocks.push(header + body + auth);
    if (i < bp.resources.length - 1) blocks.push("");
  });
  if (blocks.length === 0) {
    return `# Import a docker-compose template to populate this file.\n`;
  }
  return blocks.join("\n") + "\n";
}

// Re-exported sentinel so callers don't accidentally shadow with their own.
export const PANGOLIN_NETWORK_DEFAULT = DEFAULT_NETWORK;
// silence unused-var hint for the helper above
void ENV_REQUIRED;
