import { describe, expect, it } from "vitest";
import {
  validateBaseDomain,
  validateBlueprint,
  validateBlueprintName,
  validatePangolinNetwork,
  validateProtocol,
  validateResourceName,
  validateServicePort,
  validateSubdomain,
} from "../validator";
import { defaultBlueprint, defaultPrivateResource, fromCompose } from "../generator";

describe("blueprint field validators", () => {
  it("blueprint name must be kebab-case slug", () => {
    expect(validateBlueprintName("my-app")).toBeNull();
    expect(validateBlueprintName("My App")).toBeTruthy();
    expect(validateBlueprintName("")).toBeTruthy();
  });

  it("resource name only requires non-empty", () => {
    expect(validateResourceName("My App")).toBeNull();
    expect(validateResourceName("")).toBeTruthy();
  });

  it("subdomain RFC 1123", () => {
    expect(validateSubdomain("app")).toBeNull();
    expect(validateSubdomain("-bad")).toBeTruthy();
    expect(validateSubdomain("")).toBeTruthy();
  });

  it("service port within 1-65535", () => {
    expect(validateServicePort(80)).toBeNull();
    expect(validateServicePort(0)).toBeTruthy();
    expect(validateServicePort(70000)).toBeTruthy();
  });

  it("base domain (optional until HTTP resources are present)", () => {
    expect(validateBaseDomain("")).toBeNull();
    expect(validateBaseDomain("example.com")).toBeNull();
    expect(validateBaseDomain("not-a-domain")).toBeTruthy();
  });

  it("pangolin network is a docker network name", () => {
    expect(validatePangolinNetwork("pangolin_default")).toBeNull();
    expect(validatePangolinNetwork("")).toBeTruthy();
    expect(validatePangolinNetwork("bad name")).toBeTruthy();
  });

  it("protocol enum", () => {
    expect(validateProtocol("http")).toBeNull();
    expect(validateProtocol("tcp")).toBeNull();
    expect(validateProtocol("udp")).toBeNull();
    expect(validateProtocol("https")).toBeTruthy();
    expect(validateProtocol("ftp")).toBeTruthy();
  });
});

describe("validateBlueprint", () => {
  it("empty blueprint with no resources is valid", () => {
    expect(validateBlueprint(defaultBlueprint())).toEqual([]);
  });

  it("imported nginx-like compose passes when base domain is set", () => {
    const bp = fromCompose(
      `services:
  web:
    image: nginx:latest
    ports:
      - "8080:80"
`,
      "example.com",
    );
    expect(validateBlueprint(bp)).toEqual([]);
  });

  it("requires an HTTP full-domain", () => {
    const bp = fromCompose(`services:
  web:
    image: nginx:latest
    ports:
      - "8080:80"
`);
    const errs = validateBlueprint(bp);
    expect(errs.some((e) => /full-domain/i.test(e))).toBe(true);
  });

  it("validates a marketplace service without ports using defaults", () => {
    const bp = fromCompose(`services:
  worker:
    image: busybox
`, "example.com");
    expect(bp.resources).toHaveLength(1);
    expect(bp.resources[0].servicePort).toBe(80);
    expect(validateBlueprint(bp)).toEqual([]);
  });

  it("flags duplicate blueprintNames", () => {
    const bp = fromCompose(`services:
  a:
    image: x
    ports:
      - "80"
  b:
    image: y
    ports:
      - "81"
`, "example.com");
    bp.resources[1].blueprintName = bp.resources[0].blueprintName;
    const errs = validateBlueprint(bp);
    expect(errs.some((e) => /Duplicate blueprintName/i.test(e))).toBe(true);
  });

  it("flags duplicate full domains", () => {
    const bp = fromCompose(`services:
  a:
    image: x
    ports:
      - "80"
  b:
    image: y
    ports:
      - "81"
`, "example.com");
    bp.resources[1].subdomain = bp.resources[0].subdomain;
    const errs = validateBlueprint(bp);
    expect(errs.some((e) => /Duplicate full-domain/i.test(e))).toBe(true);
  });

  it("flags duplicate proxy ports per protocol", () => {
    const bp = fromCompose(`services:
  a:
    image: x
    ports:
      - "25565"
  b:
    image: y
    ports:
      - "25566"
`, "example.com");
    bp.resources[0].protocol = "tcp";
    bp.resources[0].proxyPort = 25565;
    bp.resources[1].protocol = "tcp";
    bp.resources[1].proxyPort = 25565;
    const errs = validateBlueprint(bp);
    expect(errs.some((e) => /Duplicate tcp proxy-port/i.test(e))).toBe(true);
  });

  it("requires TCP/UDP proxy-port and rejects auth", () => {
    const bp = fromCompose(`services:
  a:
    image: x
    ports:
      - "25565"
`, "example.com");
    bp.resources[0].protocol = "tcp";
    bp.resources[0].auth.pincode = "1234";
    const errs = validateBlueprint(bp);
    expect(errs.some((e) => /proxy-port/i.test(e))).toBe(true);
    expect(errs.some((e) => /must not define auth/i.test(e))).toBe(true);
  });

  it("rejects Admin as an SSO role", () => {
    const bp = fromCompose(`services:
  web:
    image: nginx
    ports:
      - "80"
`, "example.com");
    bp.resources[0].auth.ssoRoles = ["Admin"];
    const errs = validateBlueprint(bp);
    expect(errs.some((e) => /Admin role is reserved/i.test(e))).toBe(true);
  });

  it("flags a resource whose service is missing from the compose", () => {
    const bp = fromCompose(`services:
  web:
    image: nginx
    ports:
      - "80"
`, "example.com");
    bp.resources[0].serviceContainerName = "missing";
    const errs = validateBlueprint(bp);
    expect(errs.some((e) => /not found in the imported compose/i.test(e))).toBe(true);
  });

  it("flags invalid blueprint name", () => {
    const bp = fromCompose(`services:
  web:
    image: nginx
    ports:
      - "80"
`, "example.com");
    bp.resources[0].blueprintName = "Bad Name";
    const errs = validateBlueprint(bp);
    expect(errs.some((e) => /kebab-case/i.test(e))).toBe(true);
  });

  it("validates private resources and duplicate aliases", () => {
    const bp = fromCompose(`services:
  labeler:
    image: x
    ports:
      - "80"
`, "example.com");
    bp.privateResources = [
      {
        ...defaultPrivateResource("labeler"),
        key: "first",
        name: "First",
        mode: "cidr",
        destination: "not-a-cidr",
        alias: "internal",
        roles: ["Admin"],
      },
      {
        ...defaultPrivateResource("labeler"),
        key: "second",
        name: "Second",
        mode: "host",
        destination: "host.local",
        destinationPort: 80,
        alias: "internal",
      },
    ];
    const errs = validateBlueprint(bp);
    expect(errs.some((e) => /destination/i.test(e))).toBe(true);
    expect(errs.some((e) => /Admin role is reserved/i.test(e))).toBe(true);
    expect(errs.some((e) => /Duplicate private resource alias/i.test(e))).toBe(true);
  });

  it("validates private http domain and port requirements", () => {
    const bp = fromCompose(`services:
  labeler:
    image: x
    ports:
      - "80"
`, "example.com");
    bp.privateResources = [
      {
        ...defaultPrivateResource("labeler"),
        key: "http-private",
        name: "HTTP Private",
        mode: "http",
        destination: "internal.local",
        fullDomain: "not-a-domain",
        alias: "http-private",
      },
    ];
    const errs = validateBlueprint(bp);
    expect(errs.some((e) => /full-domain/i.test(e))).toBe(true);
    expect(errs.some((e) => /destination-port/i.test(e))).toBe(true);
  });
});
