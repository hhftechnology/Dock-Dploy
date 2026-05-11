import { useCallback, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import yaml from "js-yaml";
import { Trash2 } from "lucide-react";

import { SetupSidebar, type BuilderView } from "../components/SetupSidebar";
import { Field } from "../components/compose-builder/ServiceForm/Field";

export const Route = createFileRoute("/config-builder")({
  component: ConfigBuilderRoute,
});

interface ConfigItem {
  name: string;
  description: string;
  icon: string;
  url: string;
  category?: string;
  tags?: string[];
}

interface HomepageConfig {
  items: ConfigItem[];
}

type ConfigType = "homepage" | "custom";

function ConfigBuilderRoute() {
  const navigate = useNavigate();
  const [configType, setConfigType] = useState<ConfigType>("homepage");
  const [config, setConfig] = useState<HomepageConfig>({ items: [] });
  const [customOutput, setCustomOutput] = useState<string>("");
  const [currentItem, setCurrentItem] = useState<ConfigItem>(blankItem());

  const generateHomepageConfig = useCallback(
    (items: ConfigItem[]): string => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = {
        services: items.map((item) => ({
          Name: item.name,
          Description: item.description,
          Icon: item.icon,
          URL: item.url,
          ...(item.category && { Category: item.category }),
          ...(item.tags && item.tags.length > 0 && { Tags: item.tags }),
        })),
      };
      return yaml.dump(obj, { indent: 2 });
    },
    [],
  );

  const output = useMemo(() => {
    if (configType === "homepage") return generateHomepageConfig(config.items);
    return customOutput;
  }, [configType, config.items, customOutput, generateHomepageConfig]);

  const addItem = useCallback(() => {
    if (!currentItem.name || !currentItem.url) return;
    setConfig({ items: [...config.items, { ...currentItem }] });
    setCurrentItem(blankItem());
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
  };

  return (
    <div className="builder-shell builder-shell--three">
      <SetupSidebar view="config" onNav={handleNav} />

      {/* Configuration column — type picker + item form */}
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
                    <div className="service-row" key={idx}>
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
                Paste any YAML or text-based config and the preview will mirror
                it exactly.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Item / textarea editor */}
      <section className="service-col">
        <div className="col-head">
          <h2 className="col-head-title">
            <span className="col-bar" aria-hidden />
            {configType === "homepage" ? "Item Editor" : "Custom YAML"}
          </h2>
        </div>

        {configType === "homepage" ? (
          <div className="svc-tab">
            <Field label="Name" required>
              <input
                className="input"
                value={currentItem.name}
                onChange={(e) =>
                  setCurrentItem({ ...currentItem, name: e.target.value })
                }
                placeholder="Plex"
              />
            </Field>
            <Field label="Description">
              <input
                className="input"
                value={currentItem.description}
                onChange={(e) =>
                  setCurrentItem({
                    ...currentItem,
                    description: e.target.value,
                  })
                }
                placeholder="Media server"
              />
            </Field>
            <div className="svc-grid-2">
              <Field label="Icon">
                <input
                  className="input"
                  value={currentItem.icon}
                  onChange={(e) =>
                    setCurrentItem({ ...currentItem, icon: e.target.value })
                  }
                  placeholder="plex.png"
                />
              </Field>
              <Field label="URL" required>
                <input
                  className="input"
                  value={currentItem.url}
                  onChange={(e) =>
                    setCurrentItem({ ...currentItem, url: e.target.value })
                  }
                  placeholder="https://plex.local"
                />
              </Field>
            </div>
            <Field label="Category">
              <input
                className="input"
                value={currentItem.category || ""}
                onChange={(e) =>
                  setCurrentItem({ ...currentItem, category: e.target.value })
                }
                placeholder="Media"
              />
            </Field>
            <Field label="Tags" hint="Comma-separated">
              <input
                className="input"
                value={currentItem.tags?.join(", ") || ""}
                onChange={(e) =>
                  setCurrentItem({
                    ...currentItem,
                    tags: e.target.value.split(",").map((t) => t.trim()),
                  })
                }
                placeholder="streaming, video"
              />
            </Field>
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={addItem}
              disabled={!currentItem.name || !currentItem.url}
            >
              + Add Item
            </button>
          </div>
        ) : (
          <div className="svc-tab">
            <Field
              label="Custom YAML"
              hint="Anything goes — the preview shows it verbatim."
            >
              <textarea
                className="input"
                rows={20}
                value={customOutput}
                onChange={(e) => setCustomOutput(e.target.value)}
                placeholder="key: value"
              />
            </Field>
          </div>
        )}
      </section>

      {/* Output column */}
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
            <code>{output || "# Output will appear here…"}</code>
          </pre>
          <div className="code-statusbar">
            <span className="status-tag">
              <span className="status-dot ok" aria-hidden />
              {output ? "OK" : "Empty"}
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

function blankItem(): ConfigItem {
  return {
    name: "",
    description: "",
    icon: "",
    url: "",
    category: "",
    tags: [],
  };
}
