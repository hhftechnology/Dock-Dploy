import { describe, expect, it } from "vitest";
import { validateComposeYaml } from "../compose";

describe("validateComposeYaml", () => {
  it("rejects empty input", () => {
    const r = validateComposeYaml("");
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/empty/i);
  });

  it("rejects invalid YAML", () => {
    const r = validateComposeYaml(":::not yaml:::");
    expect(r.ok).toBe(false);
  });

  it("rejects compose without services", () => {
    const r = validateComposeYaml(`version: "3.8"\n`);
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => /at least one service/i.test(e))).toBe(true);
  });

  it("passes a clean compose", () => {
    const r = validateComposeYaml(`version: "3.8"
services:
  web:
    image: nginx:latest
    ports:
      - "8080:80"
`);
    expect(r.ok).toBe(true);
  });

  it("flags an invalid image", () => {
    const r = validateComposeYaml(`services:
  web:
    image: "Bad Image:latest"
`);
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => /image/i.test(e) || /reference/i.test(e))).toBe(true);
  });
});
