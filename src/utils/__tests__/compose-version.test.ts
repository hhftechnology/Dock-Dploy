import { describe, expect, it } from "vitest";
import {
  hasObsoleteComposeVersion,
  sanitizeComposeVersion,
} from "../compose-version";

describe("sanitizeComposeVersion", () => {
  it("removes top-level quoted version lines", () => {
    const result = sanitizeComposeVersion(`version: "3.8"
services:
  web:
    image: nginx
`);

    expect(result.removed).toBe(true);
    expect(result.content).toBe(`services:
  web:
    image: nginx
`);
  });

  it("removes top-level unquoted version lines with comments", () => {
    const result = sanitizeComposeVersion(`version: 3.9 # obsolete
services:
  web:
    image: nginx
`);

    expect(result.removed).toBe(true);
    expect(result.content).not.toMatch(/^version:/m);
  });

  it("does not remove nested service fields named version", () => {
    const input = `services:
  app:
    image: example/app
    environment:
      version: "3.8"
`;

    expect(hasObsoleteComposeVersion(input)).toBe(false);
    expect(sanitizeComposeVersion(input)).toEqual({
      content: input,
      removed: false,
    });
  });
});
