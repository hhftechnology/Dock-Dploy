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
import { defaultBlueprint, fromCompose } from "../generator";

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

  it("base domain (optional FQDN)", () => {
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
    expect(validateProtocol("https")).toBeNull();
    expect(validateProtocol("tcp")).toBeNull();
    expect(validateProtocol("udp")).toBeNull();
    expect(validateProtocol("ftp")).toBeTruthy();
  });
});

describe("validateBlueprint", () => {
  it("empty blueprint with no resources is valid", () => {
    expect(validateBlueprint(defaultBlueprint())).toEqual([]);
  });

  it("imported nginx-like compose passes", () => {
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
`);
    // Force the duplicate
    bp.resources[1].blueprintName = bp.resources[0].blueprintName;
    const errs = validateBlueprint(bp);
    expect(errs.some((e) => /Duplicate blueprintName/i.test(e))).toBe(true);
  });

  it("flags a resource whose service is missing from the compose", () => {
    const bp = fromCompose(`services:
  web:
    image: nginx
    ports:
      - "80"
`);
    bp.resources[0].serviceContainerName = "missing";
    const errs = validateBlueprint(bp);
    expect(errs.some((e) => /not found in the imported compose/i.test(e))).toBe(
      true,
    );
  });

  it("flags invalid blueprint name", () => {
    const bp = fromCompose(`services:
  web:
    image: nginx
    ports:
      - "80"
`);
    bp.resources[0].blueprintName = "Bad Name";
    const errs = validateBlueprint(bp);
    expect(errs.some((e) => /kebab-case/i.test(e))).toBe(true);
  });
});
