// YAML comment generation utilities

import type { ServiceConfig } from "../types/compose";

export interface YAMLComment {
  key: string;
  comment: string;
  position: "before" | "after";
}

/**
 * Generate comments for a service based on its configuration
 */
export function generateServiceComments(service: ServiceConfig): string[] {
  const comments: string[] = [];
  
  if (service.name) {
    comments.push(`# ${service.name} service`);
  }
  
  if (service.image) {
    comments.push(`# Image: ${service.image}`);
  }
  
  if (service.ports && service.ports.length > 0) {
    const portComments = service.ports.map((p) => {
      if (p.host && p.container) {
        return `# Port ${p.host}:${p.container}${p.protocol && p.protocol !== "none" ? `/${p.protocol}` : ""}`;
      } else if (p.container) {
        return `# Exposed port ${p.container}${p.protocol && p.protocol !== "none" ? `/${p.protocol}` : ""}`;
      }
      return "";
    }).filter(Boolean);
    if (portComments.length > 0) {
      comments.push(...portComments);
    }
  }
  
  if (service.volumes && service.volumes.length > 0) {
    const volumeComments = service.volumes.map((v) => {
      if (v.host && v.container) {
        return `# Volume: ${v.host} -> ${v.container}${v.read_only ? " (read-only)" : ""}`;
      } else if (v.container) {
        return `# Anonymous volume: ${v.container}`;
      }
      return "";
    }).filter(Boolean);
    if (volumeComments.length > 0) {
      comments.push(...volumeComments);
    }
  }
  
  if (service.environment && service.environment.length > 0) {
    const envCount = service.environment.filter((e) => e.key).length;
    if (envCount > 0) {
      comments.push(`# Environment variables: ${envCount} defined`);
    }
  }
  
  if (service.healthcheck) {
    comments.push("# Health check configured");
  }
  
  if (service.depends_on && service.depends_on.length > 0) {
    comments.push(`# Depends on: ${service.depends_on.join(", ")}`);
  }
  
  return comments;
}

/**
 * Generate comments for VPN service
 */
export function generateVpnServiceComments(vpnType: string, config: any): string[] {
  const comments: string[] = [];
  
  switch (vpnType) {
    case "tailscale":
      comments.push("# Tailscale Sidecar Configuration");
      comments.push("# Routes traffic through Tailscale VPN");
      if (config?.hostname) {
        comments.push(`# Hostname: ${config.hostname}`);
      }
      if (config?.enableServe) {
        comments.push("# Tailscale Serve enabled - exposes service on Tailnet");
      }
      if (config?.exitNode) {
        comments.push(`# Using exit node: ${config.exitNode}`);
      }
      break;
    case "newt":
      comments.push("# Newt VPN Configuration");
      comments.push("# Lightweight VPN with Pangolin integration");
      break;
    case "cloudflared":
      comments.push("# Cloudflared Tunnel Configuration");
      comments.push("# Routes traffic through Cloudflare Tunnel");
      break;
    case "wireguard":
      comments.push("# WireGuard VPN Configuration");
      break;
    case "zerotier":
      comments.push("# ZeroTier VPN Configuration");
      break;
    case "netbird":
      comments.push("# Netbird VPN Configuration");
      break;
  }
  
  return comments;
}

/**
 * Generate comments for network configuration
 */
export function generateNetworkComments(network: any): string[] {
  const comments: string[] = [];
  
  if (network.name) {
    comments.push(`# Network: ${network.name}`);
  }
  
  if (network.driver) {
    comments.push(`# Driver: ${network.driver}`);
  }
  
  if (network.external) {
    comments.push("# External network");
  }
  
  if (network.internal) {
    comments.push("# Internal network (no external access)");
  }
  
  return comments;
}

/**
 * Generate comments for volume configuration
 */
export function generateVolumeComments(volume: any): string[] {
  const comments: string[] = [];
  
  if (volume.name) {
    comments.push(`# Volume: ${volume.name}`);
  }
  
  if (volume.driver) {
    comments.push(`# Driver: ${volume.driver}`);
  }
  
  if (volume.external) {
    comments.push("# External volume");
  }
  
  return comments;
}

/**
 * Add comments to YAML string
 */
export function addCommentsToYAML(
  yaml: string,
  services: ServiceConfig[],
  vpnConfig?: any
): string {
  const lines = yaml.split("\n");
  const commentedLines: string[] = [];
  
  let inServices = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Detect sections
    if (trimmed === "services:" || trimmed.startsWith("services:")) {
      inServices = true;
      commentedLines.push(line);
      continue;
    }
    
    if (trimmed === "networks:" || trimmed.startsWith("networks:")) {
      inServices = false;
      commentedLines.push(line);
      continue;
    }
    
    if (trimmed === "volumes:" || trimmed.startsWith("volumes:")) {
      inServices = false;
      commentedLines.push(line);
      continue;
    }
    
    // Add comments before service definitions
    if (inServices && trimmed && !trimmed.startsWith("#") && !trimmed.startsWith("-") && trimmed.endsWith(":")) {
      const serviceName = trimmed.replace(":", "").trim();
      const currentService = services.find((s) => s.name === serviceName) || null;
      
      if (currentService) {
        const serviceComments = generateServiceComments(currentService);
        if (serviceComments.length > 0) {
          commentedLines.push("");
          serviceComments.forEach((comment) => {
            commentedLines.push(comment);
          });
        }
      }
    }
    
    // Add VPN service comments
    if (inServices && trimmed && vpnConfig?.enabled && vpnConfig?.type) {
      const vpnServiceName = vpnConfig.type;
      if (trimmed.startsWith(vpnServiceName + ":") || trimmed === `${vpnServiceName}:`) {
        const vpnComments = generateVpnServiceComments(vpnConfig.type, vpnConfig[vpnConfig.type]);
        if (vpnComments.length > 0) {
          commentedLines.push("");
          vpnComments.forEach((comment) => {
            commentedLines.push(comment);
          });
        }
      }
    }
    
    commentedLines.push(line);
  }
  
  return commentedLines.join("\n");
}

