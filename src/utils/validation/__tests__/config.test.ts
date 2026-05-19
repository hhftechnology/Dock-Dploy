import { describe, expect, it } from "vitest";
import {
  validateConfigItem,
  validateCustomYaml,
  validateHomepageConfig,
  validateHomepageOutput,
} from "../config";

describe("config builder validation", () => {
  it("accepts a valid Homepage item and trims safe string input", () => {
    const result = validateConfigItem({
      name: " Plex ",
      description: "Media",
      icon: "plex.png",
      url: "https://plex.local",
      category: "Media",
      tags: [" streaming "],
    });

    expect(result.ok).toBe(true);
    expect(result.data?.name).toBe("Plex");
    expect(result.data?.tags).toEqual(["streaming"]);
  });

  it("rejects missing names and non-http URLs", () => {
    const result = validateConfigItem({
      name: "",
      url: "ftp://plex.local",
      tags: [],
    });

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.path === "name")).toBe(true);
    expect(result.issues.some((issue) => issue.path === "url")).toBe(true);
  });

  it("validates the Homepage aggregate and generated output shape", () => {
    expect(
      validateHomepageConfig({
        items: [{ name: "Plex", url: "https://plex.local", tags: [] }],
      }).ok,
    ).toBe(true);

    expect(
      validateHomepageOutput(`services:
  - Name: Plex
    URL: https://plex.local
`).ok,
    ).toBe(true);
  });

  it("rejects malformed custom YAML before output use", () => {
    const result = validateCustomYaml("name: [unterminated");
    expect(result.ok).toBe(false);
    expect(result.issues[0]?.code).toBe("invalid_yaml");
  });
});
