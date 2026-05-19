import { describe, expect, it } from "vitest";
import jsyaml from "js-yaml";
import {
  defaultBlueprint,
  defaultPrivateResource,
  defaultResource,
  defaultSite,
  fromCompose,
  toComposeYaml,
  toEnvExample,
} from "../generator";

describe("fromCompose", () => {
  it("creates one resource per compose service", () => {
    const compose = `version: "3.8"
services:
  web:
    image: nginx:latest
    ports:
      - "8080:80"
  db:
    image: postgres:16
`;
    const bp = fromCompose(compose, "example.com");
    expect(bp.resources.length).toBe(2);
    expect(bp.resources[0].serviceContainerName).toBe("web");
    expect(bp.resources[0].blueprintName).toBe("web");
    expect(bp.resources[0].subdomain).toBe("web");
    expect(bp.resources[0].servicePort).toBe(8080);
    expect(bp.resources[0].protocol).toBe("http");
    expect(bp.resources[0].targetMethod).toBe("http");
    expect(bp.resources[0].image).toBe("nginx:latest");
    expect(bp.resources[1].serviceContainerName).toBe("db");
    expect(bp.resources[1].servicePort).toBe(80);
    expect(bp.resources[1].image).toBe("postgres:16");
  });

  it("keeps uniquified blueprint names and subdomains aligned", () => {
    const bp = fromCompose(`services:
  app:
    image: nginx
  app_:
    image: nginx
`);
    expect(bp.resources[0].blueprintName).toBe("app");
    expect(bp.resources[0].subdomain).toBe("app");
    expect(bp.resources[1].blueprintName).toBe("app-2");
    expect(bp.resources[1].subdomain).toBe("app-2");
  });

  it("uses an https target method for port 443 / 8443", () => {
    const bp = fromCompose(`services:
  s:
    image: x
    ports:
      - "443:443"
`);
    expect(bp.resources[0].protocol).toBe("http");
    expect(bp.resources[0].targetMethod).toBe("https");
  });

  it("keeps the raw compose document for round-trip", () => {
    const compose = `services:
  app:
    image: foo
    ports:
      - "80"
    volumes:
      - data:/var
`;
    const bp = fromCompose(compose);
    expect(bp.composeDocument).toBeTruthy();
    const doc = bp.composeDocument as Record<string, unknown>;
    expect(doc.services).toBeTruthy();
  });

  it("returns a default blueprint on invalid YAML", () => {
    const bp = fromCompose(":::not yaml");
    expect(bp.resources).toEqual([]);
    expect(bp.composeDocument).toBeNull();
  });
});

describe("toComposeYaml", () => {
  it("injects pangolin labels on the matching service", () => {
    const bp = fromCompose(
      `services:
  web:
    image: nginx:latest
    ports:
      - "8080:80"
`,
      "example.com",
    );
    const yaml = toComposeYaml(bp);
    expect(yaml).toContain("pangolin.public-resources.web.name=Web");
    expect(yaml).toContain("pangolin.public-resources.web.full-domain=web.example.com");
    expect(yaml).toContain("pangolin.public-resources.web.protocol=http");
    expect(yaml).toContain("pangolin.public-resources.web.targets[0].method=http");
  });

  it("leaves disabled compose services unlabelled", () => {
    const bp = fromCompose(`services:
  web:
    image: nginx
    ports:
      - "80"
  worker:
    image: busybox
`);
    bp.resources = bp.resources.filter((r) => r.serviceContainerName !== "worker");
    const yaml = toComposeYaml(bp);
    const parsed = jsyaml.load(yaml) as Record<string, unknown>;
    const services = parsed.services as Record<string, Record<string, unknown>>;
    expect(services.worker).toBeTruthy();
    expect(services.worker.labels).toBeUndefined();
    expect(String(yaml)).not.toContain("pangolin.public-resources.worker");
  });

  it("removes Pangolin labels from resources disabled after re-import", () => {
    const bp = fromCompose(
      `services:
  web:
    image: nginx
    ports:
      - "80"
  worker:
    image: busybox
    ports:
      - "8080"
`,
      "example.com",
    );
    const yaml = toComposeYaml(bp);
    expect(yaml).toContain("pangolin.public-resources.web");
    expect(yaml).toContain("pangolin.public-resources.worker");

    const bp2 = fromCompose(yaml, "example.com");
    bp2.resources = bp2.resources.filter(
      (resource) => resource.serviceContainerName !== "worker",
    );
    const finalYaml = toComposeYaml(bp2);

    expect(finalYaml).toContain("pangolin.public-resources.web");
    expect(finalYaml).not.toContain("pangolin.public-resources.worker");
  });

  it("adds the external pangolin network block with a literal name", () => {
    const bp = fromCompose(
      `services:
  web:
    image: nginx
    ports:
      - "80"
`,
      "example.com",
    );
    bp.pangolinNetwork = "custom_pangolin";
    const yaml = toComposeYaml(bp);
    const parsed = jsyaml.load(yaml) as Record<string, unknown>;
    const networks = parsed.networks as Record<string, unknown>;
    const pangolin = networks.pangolin as Record<string, unknown>;
    expect(pangolin.external).toBe(true);
    expect(pangolin.name).toBe("custom_pangolin");
    expect(String(pangolin.name)).not.toContain("PANGOLIN_DOCKER_NETWORK");
  });

  it("adds the pangolin network to the service's networks list", () => {
    const bp = fromCompose(`services:
  app:
    image: foo
    ports:
      - "80"
`);
    const yaml = toComposeYaml(bp);
    const parsed = jsyaml.load(yaml) as Record<string, unknown>;
    const services = parsed.services as Record<string, Record<string, unknown>>;
    const app = services.app;
    expect(Array.isArray(app.networks)).toBe(true);
    expect((app.networks as string[]).includes("pangolin")).toBe(true);
  });

  it("emits optional target overrides only when set", () => {
    const bp = fromCompose(`services:
  s:
    image: x
    ports:
      - "8080"
`);
    let yaml = toComposeYaml(bp);
    expect(yaml).not.toContain("targets[0].hostname");
    expect(yaml).not.toContain("targets[0].port");

    bp.resources[0].targetHostname = "my-container";
    bp.resources[0].targetPort = 9000;
    yaml = toComposeYaml(bp);
    expect(yaml).toContain("pangolin.public-resources.s.targets[0].hostname=my-container");
    expect(yaml).toContain("pangolin.public-resources.s.targets[0].port=9000");
  });

  it("emits auth labels only when fields are set", () => {
    const bp = fromCompose(`services:
  s:
    image: x
    ports:
      - "80"
`);
    let yaml = toComposeYaml(bp);
    expect(yaml).not.toContain("auth.sso-enabled");
    expect(yaml).not.toContain("auth.pincode");

    bp.resources[0].auth.ssoEnabled = true;
    bp.resources[0].auth.ssoRoles = ["admin"];
    bp.resources[0].auth.basicUser = "${RESOURCE_AUTH_BASIC_USER}";
    bp.resources[0].auth.basicPassword = "${RESOURCE_AUTH_BASIC_PASSWORD}";
    bp.resources[0].auth.pincode = "${RESOURCE_AUTH_PINCODE}";
    yaml = toComposeYaml(bp);
    expect(yaml).toContain("auth.sso-enabled=true");
    expect(yaml).toContain("auth.sso-roles[0]=admin");
    expect(yaml).toContain("auth.basic-auth.user=${RESOURCE_AUTH_BASIC_USER}");
    expect(yaml).toContain("auth.basic-auth.password=${RESOURCE_AUTH_BASIC_PASSWORD}");
    expect(yaml).toContain("auth.pincode=${RESOURCE_AUTH_PINCODE}");
  });

  it("emits extra HTTP targets", () => {
    const bp = fromCompose(`services:
  s:
    image: x
    ports:
      - "80"
`);
    bp.resources[0].extraTargets.push({ method: "https", port: 5432 });
    const yaml = toComposeYaml(bp);
    expect(yaml).toContain("pangolin.public-resources.s.targets[1].method=https");
    expect(yaml).toContain("pangolin.public-resources.s.targets[1].port=5432");
  });

  it("emits TCP/UDP proxy-port without target method or auth", () => {
    const bp = fromCompose(`services:
  s:
    image: x
    ports:
      - "25565"
`);
    bp.resources[0].protocol = "tcp";
    bp.resources[0].proxyPort = 25565;
    bp.resources[0].auth.pincode = "1234";
    const yaml = toComposeYaml(bp);
    expect(yaml).toContain("pangolin.public-resources.s.protocol=tcp");
    expect(yaml).toContain("pangolin.public-resources.s.proxy-port=25565");
    expect(yaml).not.toContain("pangolin.public-resources.s.targets[0].method");
    expect(yaml).not.toContain("auth.pincode");
  });

  it("emits private resource and site label namespaces", () => {
    const bp = fromCompose(`services:
  s:
    image: x
    ports:
      - "80"
`);
    bp.sites.push({ ...defaultSite("s"), key: "main", name: "Main", dockerSocketEnabled: true });
    bp.privateResources.push({
      ...defaultPrivateResource("s"),
      key: "internal",
      name: "Internal",
      mode: "http",
      destination: "internal.local",
      destinationPort: 80,
      fullDomain: "internal.example.com",
      alias: "internal",
      sites: ["main"],
    });
    const yaml = toComposeYaml(bp);
    expect(yaml).toContain("pangolin.sites.main.name=Main");
    expect(yaml).toContain("pangolin.sites.main.docker-socket-enabled=true");
    expect(yaml).toContain("pangolin.private-resources.internal.name=Internal");
    expect(yaml).toContain("pangolin.private-resources.internal.sites[0]=main");
  });

  it("preserves existing labels on the service", () => {
    const bp = fromCompose(`services:
  s:
    image: x
    ports:
      - "80"
    labels:
      - "com.example.tier=frontend"
`);
    const yaml = toComposeYaml(bp);
    expect(yaml).toContain("com.example.tier=frontend");
    expect(yaml).toContain("pangolin.public-resources.s.name");
  });
});

describe("toEnvExample", () => {
  it("includes shared and resource keys", () => {
    const bp = fromCompose(`services:
  web:
    image: nginx:latest
    ports:
      - "8080:80"
`);
    const env = toEnvExample(bp);
    expect(env).toContain("BASE_DOMAIN=CHANGE_ME");
    expect(env).toContain("PANGOLIN_DOCKER_NETWORK=pangolin_default");
    expect(env).toContain("GLOBAL_AUTH_SSO_ENABLED=true");
    expect(env).toContain("BLUEPRINT_NAME=web");
    expect(env).toContain("RESOURCE_NAME=Web");
    expect(env).toContain("SERVICE_SUBDOMAIN=web");
    expect(env).toContain("SERVICE_CONTAINER_NAME=web");
    expect(env).toContain("SERVICE_PORT=8080");
    expect(env).toContain("APP_IMAGE=nginx:latest");
    expect(env).toContain("# RESOURCE_AUTH_BASIC_PASSWORD=");
  });

  it("emits per-resource blocks for multi-service compose", () => {
    const bp = fromCompose(`services:
  web:
    image: nginx
    ports:
      - "80"
  api:
    image: api:latest
    ports:
      - "3000"
`);
    const env = toEnvExample(bp);
    expect(env).toMatch(/--- web ---/);
    expect(env).toMatch(/--- api ---/);
  });

  it("returns a placeholder when no resources are present", () => {
    const env = toEnvExample(defaultBlueprint());
    expect(env).toMatch(/Import a docker-compose template/);
  });
});

describe("defaults", () => {
  it("defaultResource sensible values", () => {
    const r = defaultResource();
    expect(r.protocol).toBe("http");
    expect(r.targetMethod).toBe("http");
    expect(r.servicePort).toBe(80);
    expect(r.auth.ssoEnabled).toBe(false);
  });
});
