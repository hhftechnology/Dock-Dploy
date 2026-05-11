// Pangolin Blueprint schema — mirrors fosrl/blueprints.
// A Blueprint is a docker-compose.yml augmented with `pangolin.*` Docker
// labels + a sibling .env.example. Each Resource targets a service key in the
// underlying compose document and emits labels under a `blueprintName` slug.

export type BlueprintProtocol = "http" | "https" | "tcp" | "udp";

export interface BlueprintTarget {
  method: BlueprintProtocol;
  // Optional override — Pangolin defaults to the container_name.
  hostname?: string;
  // Optional override — Pangolin defaults to the expose port.
  port?: number;
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
  // Image kept verbatim from the imported compose, used in the .env.example.
  image: string;
  // Protocol used by the auto-derived target[0] (and the resource label).
  protocol: BlueprintProtocol;
  // Optional explicit target[0] hostname/port overrides.
  targetHostname?: string;
  targetPort?: number;
  // Additional targets beyond targets[0].
  extraTargets: BlueprintTarget[];
  // Resource-level auth additions/overrides.
  auth: BlueprintAuth;
}

export interface Blueprint {
  version: 1;
  baseDomain: string;
  pangolinNetwork: string; // default "pangolin_default"
  resources: BlueprintResource[];
  // Raw compose document parsed from the imported template — preserved so
  // we re-emit it verbatim with labels injected. null = empty / no import.
  composeDocument: Record<string, unknown> | null;
}
