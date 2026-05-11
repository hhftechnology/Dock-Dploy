// Shared helper: parse a command-line string into argv form.
// Used by services (command/entrypoint) and healthcheck.test.

export function parseCommandString(cmd: string): string[] {
  if (!cmd) return [];
  if (Array.isArray(cmd)) return cmd as unknown as string[];

  try {
    const parsed = JSON.parse(cmd);
    if (Array.isArray(parsed)) return parsed as string[];
  } catch {
    // Not JSON — fall through to whitespace tokenization.
  }

  const parts = cmd.match(/(?:"[^"]*"|'[^']*'|\S+)/g) || [];
  return parts.map((part) => part.replace(/^["']|["']$/g, ""));
}
