export interface ComposeVersionSanitization {
  content: string;
  removed: boolean;
}

const TOP_LEVEL_VERSION_RE = /^(?:\uFEFF)?version\s*:\s*(?:"[^"]*"|'[^']*'|[^\r\n#]*)?(?:\s+#.*)?(?:\r?\n|$)/m;

export function sanitizeComposeVersion(content: string): ComposeVersionSanitization {
  const sanitized = content.replace(TOP_LEVEL_VERSION_RE, "");
  return {
    content: sanitized,
    removed: sanitized !== content,
  };
}

export function hasObsoleteComposeVersion(content: string): boolean {
  return TOP_LEVEL_VERSION_RE.test(content);
}
