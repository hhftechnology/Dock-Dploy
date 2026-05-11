import { describe, expect, it } from "vitest";
import jsyaml from "js-yaml";
import {
  defaultBlueprint,
  defaultResource,
  fromCompose,
  toComposeYaml,
  toEnvExample,
} from "../generator";

describe("fromCompose", () => {
  it("creates one resource per service with exposed ports", () => {
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
    expect(bp.resources.length).toBe(1);
    expect(bp.resources[0].serviceContainerName).toBe("web");
    expect(bp.resources[0].blueprintName).toBe("web");
    expect(bp.resources[0].subdomain).toBe("web");
    expect(bp.resources[0].servicePort).toBe(8080);
    expect(bp.resources[0].protocol).toBe("http");
    expect(bp.resources[0].image).toBe("nginx:latest");
  });

  it("uses https for port 443 / 8443", () => {
    const bp = fromCompose(`services:
  s:
    image: x
    ports:
      - "443:443"
`);
    expect(bp.resources[0].protocol).toBe("https");
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
    expect(yaml).toContain(
      "pangolin.public-resources.web.full-domain=web.example.com",
    );
    expect(yaml).toContain("pangolin.public-resources.web.protocol=http");
    expect(yaml).toContain(
      "pangolin.public-resources.web.targets[0].method=http",
    );
  });

  it("adds the external pangolin network block", () => {
    const bp = fromCompose(
      `services:
  web:
    image: nginx
    ports:
      - "80"
`,
      "example.com",
    );
    const yaml = toComposeYaml(bp);
    const parsed = jsyaml.load(yaml) as Record<string, unknown>;
    const networks = parsed.networks as Record<string, unknown>;
    expect(networks).toBeTruthy();
    expect(networks.pangolin).toBeTruthy();
    const pangolin = networks.pangolin as Record<string, unknown>;
    expect(pangolin.external).toBe(true);
    expect(String(pangolin.name)).toContain("PANGOLIN_DOCKER_NETWORK");
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
    expect(yaml).toContain(
      "pangolin.public-resources.s.targets[0].hostname=my-container",
    );
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
    bp.resources[0].auth.pincode = "${RESOURCE_AUTH_PINCODE}";
    yaml = toComposeYaml(bp);
    expect(yaml).toContain("auth.sso-enabled=true");
    expect(yaml).toContain("auth.sso-roles[0]=admin");
    expect(yaml).toContain(
      "auth.pincode=${RESOURCE_AUTH_PINCODE}",
    );
  });

  it("emits extra targets", () => {
    const bp = fromCompose(`services:
  s:
    image: x
    ports:
      - "80"
`);
    bp.resources[0].extraTargets.push({ method: "tcp", port: 5432 });
    const yaml = toComposeYaml(bp);
    expect(yaml).toContain(
      "pangolin.public-resources.s.targets[1].method=tcp",
    );
    expect(yaml).toContain("pangolin.public-resources.s.targets[1].port=5432");
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
  it("includes the six required keys", () => {
    const bp = fromCompose(`services:
  web:
    image: nginx:latest
    ports:
      - "8080:80"
`);
    const env = toEnvExample(bp);
    expect(env).toContain("BLUEPRINT_NAME=web");
    expect(env).toContain("RESOURCE_NAME=Web");
    expect(env).toContain("SERVICE_SUBDOMAIN=web");
    expect(env).toContain("SERVICE_CONTAINER_NAME=web");
    expect(env).toContain("SERVICE_PORT=8080");
    expect(env).toContain("APP_IMAGE=nginx:latest");
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
    expect(env).toMatch(/─── web ───/);
    expect(env).toMatch(/─── api ───/);
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
    expect(r.servicePort).toBe(80);
    expect(r.auth.ssoEnabled).toBe(false);
  });
});
