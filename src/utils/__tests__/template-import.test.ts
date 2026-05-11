import { describe, expect, it } from "vitest";
import { parseComposeService, parseComposeTemplate } from "../template-import";

describe("parseComposeTemplate", () => {
  it("parses a single-service compose", () => {
    const yaml = `
services:
  web:
    image: nginx:1.27-alpine
    restart: unless-stopped
    ports:
      - "80:80"
`;
    const result = parseComposeTemplate(yaml);
    expect(result.services.length).toBe(1);
    expect(result.services[0].name).toBe("web");
    expect(result.services[0].image).toBe("nginx:1.27-alpine");
  });

  it("parses multi-service compose with networks and volumes", () => {
    const yaml = `
services:
  web:
    image: nginx:latest
    networks: [frontend]
  api:
    image: node:22-alpine
    depends_on:
      - db
    networks: [frontend, backend]
  db:
    image: postgres:16
    volumes:
      - pg-data:/var/lib/postgresql/data
    networks: [backend]
networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true
volumes:
  pg-data:
    driver: local
`;
    const result = parseComposeTemplate(yaml);
    expect(result.services.map((s) => s.name).sort()).toEqual(["api", "db", "web"]);
    expect(Object.keys(result.networks || {})).toEqual(
      expect.arrayContaining(["frontend", "backend"]),
    );
    expect(Object.keys(result.volumes || {})).toContain("pg-data");
  });

  it("tolerates env vars in both array and dict syntax", () => {
    const yamlArray = `
services:
  app:
    image: example/app
    environment:
      - NODE_ENV=production
      - PORT=3000
`;
    const yamlDict = `
services:
  app:
    image: example/app
    environment:
      NODE_ENV: production
      PORT: "3000"
`;
    const a = parseComposeTemplate(yamlArray);
    const b = parseComposeTemplate(yamlDict);
    const aParsed = parseComposeService(a.services[0]).service;
    const bParsed = parseComposeService(b.services[0]).service;
    expect(aParsed.environment.length).toBe(2);
    expect(bParsed.environment.length).toBe(2);
    const aKeys = aParsed.environment.map((e) => e.key).sort();
    const bKeys = bParsed.environment.map((e) => e.key).sort();
    expect(aKeys).toEqual(bKeys);
  });
});
