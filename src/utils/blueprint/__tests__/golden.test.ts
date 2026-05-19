// Golden tests for a realistic compose -> blueprint conversion.
// Pins the label structure so changes to the generator can't silently break
// fosrl/blueprints compatibility.

import { describe, expect, it } from "vitest";
import { fromCompose, toComposeYaml, toEnvExample } from "../generator";

const NGINX_COMPOSE = `version: "3.8"
services:
  nginx:
    image: nginx:1.27-alpine
    container_name: nginx
    restart: unless-stopped
    ports:
      - "8080:80"
    volumes:
      - ./html:/usr/share/nginx/html:ro
`;

describe("golden — nginx → pangolin blueprint", () => {
  it("compose output snapshot", () => {
    const bp = fromCompose(NGINX_COMPOSE, "example.com");
    expect(toComposeYaml(bp)).toMatchInlineSnapshot(`
      "services:
        nginx:
          image: nginx:1.27-alpine
          container_name: nginx
          restart: unless-stopped
          ports:
            - "8080:80"
          volumes:
            - ./html:/usr/share/nginx/html:ro
          labels:
            - pangolin.public-resources.nginx.name=Nginx
            - pangolin.public-resources.nginx.protocol=http
            - pangolin.public-resources.nginx.full-domain=nginx.example.com
            - pangolin.public-resources.nginx.targets[0].method=http
          networks:
            - pangolin
      networks:
        pangolin:
          external: true
          name: pangolin_default
      "
    `);
  });

  it(".env.example snapshot", () => {
    const bp = fromCompose(NGINX_COMPOSE, "example.com");
    expect(toEnvExample(bp)).toMatchInlineSnapshot(`
      "# Shared DNS root used by all blueprints.
      BASE_DOMAIN=example.com

      # Shared Docker network that Newt and public-facing blueprint containers join.
      PANGOLIN_DOCKER_NETWORK=pangolin_default

      # Optional global auth defaults applied to all blueprint resources.
      GLOBAL_AUTH_PINCODE=
      GLOBAL_AUTH_PASSWORD=
      GLOBAL_AUTH_BASIC_USER=
      GLOBAL_AUTH_BASIC_PASSWORD=
      GLOBAL_AUTH_SSO_ENABLED=true
      GLOBAL_AUTH_SSO_ROLE_0=
      GLOBAL_AUTH_SSO_ROLE_1=
      GLOBAL_AUTH_SSO_USER_0=
      GLOBAL_AUTH_SSO_USER_1=
      GLOBAL_AUTH_WHITELIST_USER_0=
      GLOBAL_AUTH_WHITELIST_USER_1=

      BLUEPRINT_NAME=nginx
      RESOURCE_NAME=Nginx
      SERVICE_SUBDOMAIN=nginx
      SERVICE_CONTAINER_NAME=nginx
      SERVICE_PORT=8080
      APP_IMAGE=nginx:1.27-alpine

      # Optional resource-specific auth overrides and additions.
      # Scalars override GLOBAL_AUTH_* values from the root .env.
      # Indexed arrays are appended after the GLOBAL_AUTH_* arrays.
      # RESOURCE_AUTH_PINCODE=
      # RESOURCE_AUTH_PASSWORD=
      # RESOURCE_AUTH_BASIC_USER=
      # RESOURCE_AUTH_BASIC_PASSWORD=
      # RESOURCE_AUTH_SSO_ENABLED=
      # RESOURCE_AUTH_SSO_ROLE_0=
      # RESOURCE_AUTH_SSO_USER_0=
      # RESOURCE_AUTH_WHITELIST_USER_0=
      "
    `);
  });
});
