import { describe, expect, it } from "vitest";
import {
  validateTemplateDetails,
  validateTemplateMetaList,
} from "../templates";

describe("template validation", () => {
  it("accepts valid marketplace metadata", () => {
    const result = validateTemplateMetaList([
      {
        id: "nginx",
        name: "Nginx",
        description: "Reverse proxy",
        tags: ["proxy"],
      },
    ]);

    expect(result.ok).toBe(true);
    expect(result.data?.[0]?.id).toBe("nginx");
  });

  it("rejects invalid cached marketplace metadata", () => {
    const result = validateTemplateMetaList([
      { id: "../escape", name: "Bad" },
      { id: "missing-name" },
    ]);

    expect(result.ok).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it("requires compose content for template details", () => {
    const result = validateTemplateDetails({
      id: "nginx",
      name: "Nginx",
      composeContent: "",
    });

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.path === "composeContent")).toBe(
      true,
    );
  });

  it("allows template details to report sanitized obsolete compose version", () => {
    const result = validateTemplateDetails({
      id: "nginx",
      name: "Nginx",
      composeContent: "services:\n  web:\n    image: nginx\n",
      composeVersionRemoved: true,
    });

    expect(result.ok).toBe(true);
    expect(result.data?.composeVersionRemoved).toBe(true);
  });

});
