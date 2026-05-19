import { useCallback, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import yaml from "js-yaml";
import { Trash2 } from "lucide-react";

import { SetupSidebar, type BuilderView } from "../components/SetupSidebar";
import { Field } from "../components/compose-builder/ServiceForm/Field";
import {
  validateConfigItem,
  validateCustomYaml,
  validateHomepageConfig,
  validateHomepageOutput,
  type ConfigItem,
  type ConfigItemInput,
} from "../utils/validation/config";
import {
  formatValidationIssues,
  type ValidationIssue,
} from "../utils/validation/issues";

export const Route = createFileRoute("/config-builder")({
  component: ConfigBuilderRoute,
});

interface HomepageConfigState {
  items: ConfigItem[];
}

type ConfigType = "homepage" | "custom";

function ConfigBuilderRoute() {
  const navigate = useNavigate();
  const [configType, setConfigType] = useState<ConfigType>("homepage");
  const [config, setConfig] = useState<HomepageConfigState>({ items: [] });
  const [customOutput, setCustomOutput] = useState<string>("");
  const [currentItem, setCurrentItem] = useState<ConfigItemInput>(blankItem());
  const [itemSubmitted, setItemSubmitted] = useState(false);

  const generateHomepageConfig = useCallback(
    (items: ConfigItem[]): string => {
      const obj = {
        services: items.map((item) => ({
          Name: item.name,
          ...(item.description && { Description: item.description }),
          ...(item.icon && { Icon: item.icon }),
          URL: item.url,
          ...(item.category && { Category: item.category }),
          ...(item.tags && item.tags.length > 0 && { Tags: item.tags }),
        })),
      };
      return yaml.dump(obj, { indent: 2 });
    },
    [],
  );

  const currentItemValidation = useMemo(
    () => validateConfigItem(currentItem),
    [currentItem],
  );

  const outputValidation = useMemo(() => {
    if (configType === "custom") return validateCustomYaml(customOutput);
    const configResult = validateHomepageConfig(config);
    if (!configResult.ok) return configResult;
    return validateHomepageOutput(generateHomepageConfig(config.items));
  }, [configType, customOutput, config, generateHomepageConfig]);

  const output = useMemo(() => {
    if (!outputValidation.ok) {
      return invalidBuilderOutput(outputValidation.issues);
    }
    if (configType === "homepage") return generateHomepageConfig(config.items);
    return customOutput;
  }, [configType, config.items, customOutput, generateHomepageConfig, outputValidation]);

  const addItem = useCallback(() => {
    setItemSubmitted(true);
    const validation = validateConfigItem(currentItem);
    if (!validation.ok || !validation.data) return;
    setConfig({ items: [...config.items, validation.data] });
    setCurrentItem(blankItem());
    setItemSubmitted(false);
  }, [currentItem, config.items]);

  const removeItem = useCallback(
    (index: number) => {
      setConfig({ items: config.items.filter((_, i) => i !== index) });
    },
    [config.items],
  );

  const handleNav = (view: BuilderView) => {
    if (view === "compose") navigate({ to: "/docker/compose-builder" });
    else if (view === "scheduler") navigate({ to: "/scheduler-builder" });
    else if (view === "blueprint") navigate({ to: "/blueprint-builder" });
  };

  const fieldError = (path: string) =>
    itemSubmitted
      ? currentItemValidation.issues.find((issue) => issue.path === path)
          ?.message ?? null
      : null;

  const customYamlError =
    configType === "custom" && !outputValidation.ok
      ? formatValidationIssues(outputValidation.issues)
      : null;

  return (
    <div className="builder-shell builder-shell--three">
      <SetupSidebar view="config" onNav={handleNav} />

      <section className="config-col">
        <div className="col-head">
          <h2 className="col-head-title">
            <span className="col-bar" aria-hidden />
            Configuration
          </h2>
        </div>

        <div className="config-tabs">
          <button
            type="button"
            className={"config-tab" + (configType === "homepage" ? " active" : "")}
            onClick={() => setConfigType("homepage")}
          >
            Homepage
            <span className="tab-count">{config.items.length}</span>
          </button>
          <button
            type="button"
            className={"config-tab" + (configType === "custom" ? " active" : "")}
            onClick={() => setConfigType("custom")}
          >
            Custom
          </button>
        </div>

        <div className="config-tab-body">
          {configType === "homepage" ? (
            <div className="tab-content">
              <p className="tab-hint">
                Build a{" "}
                <a
                  href="https://gethomepage.dev"
                  target="_blank"
                  rel="noreferrer"
                  className="link-coral"
                >
                  Homepage dashboard
                </a>{" "}
                config visually. Each item becomes a tile.
              </p>

              {config.items.length > 0 && (
                <div className="service-list">
                  {config.items.map((item, idx) => (
                    <div className="service-row" key={`${item.name}-${idx}`}>
                      <span className="status-dot ok" aria-hidden />
                      <span className="service-row-text">
                        <span className="service-row-name">{item.name}</span>
                        <span className="service-row-meta">{item.url}</span>
                      </span>
                      <button
                        type="button"
                        className="icon-trash"
                        onClick={() => removeItem(idx)}
                        aria-label={`Remove ${item.name}`}
                        title="Remove"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="tab-content">
              <p className="tab-hint">
                Paste YAML or text-based config. YAML syntax is validated before
                the output can be copied.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="service-col">
        <div className="col-head">
          <h2 className="col-head-title">
            <span className="col-bar" aria-hidden />
            {configType === "homepage" ? "Item Editor" : "Custom YAML"}
          </h2>
        </div>

        {configType === "homepage" ? (
          <div className="svc-tab">
            <Field label="Name" required error={fieldError("name")}>
              <input
                className="input"
                value={currentItem.name}
                onChange={(e) =>
                  setCurrentItem({ ...currentItem, name: e.target.value })
                }
                aria-invalid={fieldError("name") ? true : undefined}
                placeholder="Plex"
              />
            </Field>
            <Field label="Description" error={fieldError("description")}>
              <input
                className="input"
                value={currentItem.description || ""}
                onChange={(e) =>
                  setCurrentItem({
                    ...currentItem,
                    description: e.target.value,
                  })
                }
                aria-invalid={fieldError("description") ? true : undefined}
                placeholder="Media server"
              />
            </Field>
            <div className="svc-grid-2">
              <Field label="Icon" error={fieldError("icon")}>
                <input
                  className="input"
                  value={currentItem.icon || ""}
                  onChange={(e) =>
                    setCurrentItem({ ...currentItem, icon: e.target.value })
                  }
                  aria-invalid={fieldError("icon") ? true : undefined}
                  placeholder="plex.png"
                />
              </Field>
              <Field label="URL" required error={fieldError("url")}>
                <input
                  className="input"
                  value={currentItem.url}
                  onChange={(e) =>
                    setCurrentItem({ ...currentItem, url: e.target.value })
                  }
                  aria-invalid={fieldError("url") ? true : undefined}
                  placeholder="https://plex.local"
                />
              </Field>
            </div>
            <Field label="Category" error={fieldError("category")}>
              <input
                className="input"
                value={currentItem.category || ""}
                onChange={(e) =>
                  setCurrentItem({ ...currentItem, category: e.target.value })
                }
                aria-invalid={fieldError("category") ? true : undefined}
                placeholder="Media"
              />
            </Field>
            <Field label="Tags" hint="Comma-separated" error={fieldError("tags")}>
              <input
                className="input"
                value={currentItem.tags?.join(", ") || ""}
                onChange={(e) =>
                  setCurrentItem({
                    ...currentItem,
                    tags: e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  })
                }
                aria-invalid={fieldError("tags") ? true : undefined}
                placeholder="streaming, video"
              />
            </Field>
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={addItem}
              disabled={!currentItemValidation.ok}
            >
              + Add Item
            </button>
          </div>
        ) : (
          <div className="svc-tab">
            <Field
              label="Custom YAML"
              hint="The preview mirrors valid YAML exactly."
              error={customYamlError}
            >
              <textarea
                className="input"
                rows={20}
                value={customOutput}
                onChange={(e) => setCustomOutput(e.target.value)}
                aria-invalid={customYamlError ? true : undefined}
                placeholder="key: value"
              />
            </Field>
          </div>
        )}
      </section>

      <section className="code-col">
        <div className="code-head">
          <h2 className="code-title">
            <span className="col-bar" aria-hidden />
            Output
          </h2>
        </div>
        <div className="code-tabs">
          <button type="button" className="code-tab active">
            {configType === "homepage" ? "homepage.yml" : "config.yml"}
          </button>
        </div>
        <div className="code-window">
          <pre className="code-pre">
            <code>{output || "# Output will appear here..."}</code>
          </pre>
          <div className="code-statusbar">
            <span
              className={"status-tag" + (!outputValidation.ok ? " err" : "")}
            >
              <span
                className={"status-dot " + (outputValidation.ok ? "ok" : "err")}
                aria-hidden
              />
              {outputValidation.ok ? "Valid" : "Blocked"}
            </span>
            <span className="status-mono">
              {output.split("\n").length} lines · UTF-8 · LF
            </span>
            <span className="status-mono right">
              {configType === "homepage" ? "homepage.yml" : "config.yml"}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

function invalidBuilderOutput(issues: ValidationIssue[]): string {
  return [
    "# Output blocked by validation",
    ...issues.map((issue) => {
      const label = issue.path ? `${issue.path}: ` : "";
      return `# ${label}${issue.message}`;
    }),
  ].join("\n");
}

function blankItem(): ConfigItemInput {
  return {
    name: "",
    description: "",
    icon: "",
    url: "",
    category: "",
    tags: [],
  };
}
