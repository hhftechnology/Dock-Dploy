// Recursive YAML serializer for Docker Compose.
// PRESERVED VERBATIM from the original yaml-generator.ts. The byte-for-byte
// output of generateYaml() depends on every detail here — golden tests guard.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function yamlStringify(obj: any, indent = 0, parentKey = ""): string {
  const pad = (n: number) => "  ".repeat(n);
  if (typeof obj !== "object" || obj === null) return String(obj);

  if (Array.isArray(obj)) {
    const shouldBeSingleLine =
      ["command", "entrypoint"].includes(parentKey) ||
      (parentKey === "test" && indent > 0);
    if (shouldBeSingleLine && obj.length > 0 && typeof obj[0] === "string") {
      return `[${obj.map((v) => `"${v}"`).join(", ")}]`;
    }
    return obj
      .map(
        (v) =>
          `\n${pad(indent)}- ${yamlStringify(v, indent + 1, parentKey).trimStart()}`,
      )
      .join("");
  }

  const entries = Object.entries(obj)
    .map(([k, v]) => {
      if (v === undefined) return "";
      if (typeof v === "object" && v !== null && !Array.isArray(v)) {
        return `\n${pad(indent)}${k}:` + yamlStringify(v, indent + 1, k);
      }
      if (Array.isArray(v)) {
        if (
          ["command", "entrypoint"].includes(k) ||
          (k === "test" && indent > 0)
        ) {
          return `\n${pad(indent)}${k}: [${v.map((item) => `"${item}"`).join(", ")}]`;
        }
        return `\n${pad(indent)}${k}: ` + yamlStringify(v, indent + 1, k);
      }
      // Multi-line strings (like JSON content) use literal block scalar |.
      if (
        typeof v === "string" &&
        k === "content" &&
        parentKey &&
        v.includes("\n")
      ) {
        const lines = v.split("\n");
        const escapedLines = lines.map((line, idx) => {
          if (line.trim() === "" && idx === lines.length - 1) return "";
          return line;
        });
        return `\n${pad(indent)}${k}: |\n${escapedLines
          .map((line) => `${pad(indent + 1)}${line}`)
          .join("\n")}`;
      }
      if (typeof v === "string") {
        const isPortMapping = /^\d+(:\d+)?(\/\w+)?$/.test(v);
        if (isPortMapping || /^\d+$/.test(v)) {
          return `\n${pad(indent)}${k}: ${v}`;
        }
        const needsQuotes =
          // eslint-disable-next-line no-useless-escape
          /^[\d-]|[:{}\[\],&*#?|>'"%@`]/.test(v) || v.trim() !== v;
        return `\n${pad(indent)}${k}: ${needsQuotes ? `"${v.replace(/"/g, '\\"')}"` : v}`;
      }
      return `\n${pad(indent)}${k}: ${v}`;
    })
    .join("");

  return indent === 0 && entries.startsWith("\n") ? entries.slice(1) : entries;
}
