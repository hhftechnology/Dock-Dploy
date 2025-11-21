// Template metadata types based on Dokploy/templates format

export interface TemplateVariable {
  name: string;
  value: string;
  helper?: string; // Helper type like "domain", "password:32", "uuid", etc.
  description?: string;
}

export interface TemplateDomain {
  serviceName: string;
  port: number;
  host: string;
  path?: string;
  env?: string[]; // Environment variables for this domain
}

export interface TemplateMount {
  filePath: string;
  content: string;
  description?: string;
}

export interface TemplateConfig {
  domains: TemplateDomain[];
  env: { key: string; value: string; description?: string }[];
  mounts: TemplateMount[];
}

export interface TemplateMetadata {
  id?: string;
  name?: string;
  version?: string;
  description?: string;
  logo?: string;
  links?: {
    github?: string;
    website?: string;
    docs?: string;
  };
  tags?: string[];
}

export interface TemplateFormat {
  variables: TemplateVariable[];
  config: TemplateConfig;
  metadata?: TemplateMetadata;
}

export type TemplateHelper =
  | "domain"
  | "password"
  | "password:32"
  | "base64"
  | "base64:32"
  | "hash"
  | "uuid"
  | "randomPort"
  | "email"
  | "username"
  | "timestamp"
  | "jwt"
  | "custom";

export const TEMPLATE_HELPERS: { value: TemplateHelper; label: string; description: string }[] = [
  { value: "domain", label: "Domain", description: "Generate a random domain" },
  { value: "password", label: "Password (default length)", description: "Generate a random password" },
  { value: "password:32", label: "Password (32 chars)", description: "Generate a 32-character password" },
  { value: "base64", label: "Base64", description: "Encode to base64" },
  { value: "base64:32", label: "Base64 (32 bytes)", description: "Encode 32 bytes to base64" },
  { value: "hash", label: "Hash", description: "Generate a hash" },
  { value: "uuid", label: "UUID", description: "Generate a UUID" },
  { value: "randomPort", label: "Random Port", description: "Generate a random port" },
  { value: "email", label: "Email", description: "Generate a random email" },
  { value: "username", label: "Username", description: "Generate a random username" },
  { value: "timestamp", label: "Timestamp", description: "Generate current timestamp" },
  { value: "jwt", label: "JWT", description: "Generate a JWT token" },
  { value: "custom", label: "Custom", description: "Custom value" },
];

