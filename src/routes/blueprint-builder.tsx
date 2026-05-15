import { useCallback, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Plus,
  Trash2,
} from "lucide-react";

import { SetupSidebar, type BuilderView } from "../components/SetupSidebar";
import { TemplateStoreModal } from "../components/templates/TemplateStoreModal";
import { TemplateDetailModal } from "../components/templates/TemplateDetailModal";
import { Field, ValidatedInput } from "../components/compose-builder/ServiceForm/Field";
import { useTemplateStore } from "../hooks/useTemplateStore";
import {
  defaultBlueprint,
  fromCompose,
  resourceFromComposeService,
  toComposeYaml,
  toEnvExample,
} from "../utils/blueprint/generator";
import {
  validateBaseDomain,
  validateBlueprint,
  validateBlueprintName,
  validateResourceName,
  validateSubdomain,
} from "../utils/blueprint/validator";
import { validatePort } from "../utils/validation";
import type {
  Blueprint,
  BlueprintProtocol,
  BlueprintResource,
  BlueprintTarget,
} from "../types/blueprint";
import { copyToClipboard, downloadFile } from "../utils/clipboard";
import { useToast } from "../components/ui/toast";

export const Route = createFileRoute("/blueprint-builder")({
  component: BlueprintBuilderRoute,
});

type OutputTab = "compose" | "env";

function BlueprintBuilderRoute() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [blueprint, setBlueprint] = useState<Blueprint>(defaultBlueprint());
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [outputTab, setOutputTab] = useState<OutputTab>("compose");
  const [copied, setCopied] = useState(false);

  const templateStore = useTemplateStore();

  const composeYaml = useMemo(() => toComposeYaml(blueprint), [blueprint]);
  const envExample = useMemo(() => toEnvExample(blueprint), [blueprint]);
  const errors = useMemo(() => validateBlueprint(blueprint), [blueprint]);
  const composeServiceEntries = useMemo(() => {
    const services = blueprint.composeDocument?.services;
    if (!services || typeof services !== "object" || Array.isArray(services)) {
      return [] as Array<[string, unknown]>;
    }
    return Object.entries(services as Record<string, unknown>);
  }, [blueprint.composeDocument]);
  const enabledServiceNames = useMemo(
    () => new Set(blueprint.resources.map((r) => r.serviceContainerName)),
    [blueprint.resources],
  );
  const availableComposeServices = useMemo(
    () => composeServiceEntries.filter(([name]) => !enabledServiceNames.has(name)),
    [composeServiceEntries, enabledServiceNames],
  );

  const handleNavView = useCallback(
    (next: BuilderView) => {
      if (next === "compose") navigate({ to: "/docker/compose-builder" });
      else if (next === "config") navigate({ to: "/config-builder" });
      else if (next === "scheduler") navigate({ to: "/scheduler-builder" });
    },
    [navigate],
  );

  const updateResource = useCallback(
    (idx: number, patch: Partial<BlueprintResource>) => {
      setBlueprint((bp) => {
        const resources = [...bp.resources];
        resources[idx] = { ...resources[idx], ...patch };
        return { ...bp, resources };
      });
    },
    [],
  );

  const removeResource = useCallback(
    (idx: number) => {
      const nextLength = Math.max(blueprint.resources.length - 1, 0);
      setBlueprint((bp) => ({
        ...bp,
        resources: bp.resources.filter((_, i) => i !== idx),
      }));
      setSelectedIdx((cur) => {
        if (cur === null) return nextLength > 0 ? 0 : null;
        if (cur === idx) return nextLength > 0 ? Math.min(idx, nextLength - 1) : null;
        if (cur > idx) return cur - 1;
        return cur;
      });
    },
    [blueprint.resources.length],
  );

  const addResourceForComposeService = useCallback(
    (serviceName: string, rawService: unknown) => {
      setBlueprint((bp) => {
        const existingNames = new Set(bp.resources.map((r) => r.blueprintName));
        const resource = resourceFromComposeService(serviceName, rawService);
        const baseName = resource.blueprintName;
        let nextName = baseName;
        let suffix = 2;
        while (existingNames.has(nextName)) {
          nextName = `${baseName}-${suffix}`;
          suffix += 1;
        }
        resource.blueprintName = nextName;
        return { ...bp, resources: [...bp.resources, resource] };
      });
      setSelectedIdx(blueprint.resources.length);
    },
    [blueprint.resources.length],
  );

  const importTemplate = useCallback(
    async (template: { composeContent?: string }) => {
      if (!template.composeContent) {
        throw new Error("Template has no compose content");
      }
      const next = fromCompose(template.composeContent, blueprint.baseDomain);
      setBlueprint(next);
      setSelectedIdx(next.resources.length > 0 ? 0 : null);
      templateStore.setTemplateDetailOpen(false);
      templateStore.setTemplateStoreOpen(false);
      templateStore.setSelectedTemplate(null);
      templateStore.setTemplateDetailTab("overview");
      toast({
        title: "Template imported",
        description: `${next.resources.length} resource${next.resources.length === 1 ? "" : "s"} ready to label`,
        variant: "success",
      });
    },
    [blueprint.baseDomain, templateStore, toast],
  );

  const output = outputTab === "compose" ? composeYaml : envExample;
  const filename = outputTab === "compose" ? "docker-compose.yml" : ".env.example";

  const handleCopy = async () => {
    try {
      await copyToClipboard(output);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Copy failed", variant: "error" });
    }
  };

  const handleDownload = () => {
    downloadFile(output, filename, outputTab === "compose" ? "text/yaml" : "text/plain");
  };

  const selected =
    selectedIdx !== null ? blueprint.resources[selectedIdx] ?? null : null;

  return (
    <div className="builder-shell builder-shell--three">
      <SetupSidebar view="blueprint" onNav={handleNavView} />

      {/* Column 2: Configuration */}
      <section className="config-col">
        <div className="col-head">
          <h2 className="col-head-title">
            <span className="col-bar" aria-hidden />
            Blueprint
          </h2>
        </div>

        <div className="config-tab-body">
          <div className="tab-content">
            <div className="tab-actions">
              <button
                type="button"
                className="btn btn-primary btn-block"
                onClick={() => templateStore.setTemplateStoreOpen(true)}
              >
                <Plus size={14} />
                Import from template
              </button>
            </div>

            {blueprint.resources.length === 0 ? (
              <div className="tab-empty">
                <h3 className="tab-empty-title">No resources yet</h3>
                <p className="tab-empty-sub">
                  Click "Import from template" to pull a Docker Compose file
                  from the marketplace. Each service with an exposed port
                  becomes a Pangolin resource.
                </p>
              </div>
            ) : (
              <div className="service-list">
                {blueprint.resources.map((r, idx) => {
                  const isActive = selectedIdx === idx;
                  const ok = Boolean(
                    r.blueprintName && r.subdomain && r.servicePort,
                  );
                  return (
                    <div
                      key={idx}
                      className={"service-row" + (isActive ? " active" : "")}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedIdx(idx)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ")
                          setSelectedIdx(idx);
                      }}
                    >
                      <span
                        className={"status-dot " + (ok ? "ok" : "warn")}
                        aria-hidden
                      />
                      <span className="service-row-text">
                        <span className="service-row-name">
                          {r.serviceContainerName || <em>(unnamed)</em>}
                        </span>
                        <span className="service-row-meta">
                          {r.image || "no image"}
                        </span>
                      </span>
                      <button
                        type="button"
                        className="icon-trash"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeResource(idx);
                        }}
                        aria-label={`Remove resource ${r.serviceContainerName || idx + 1}`}
                        title="Remove resource"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {availableComposeServices.length > 0 && (
              <>
                <div className="svc-section-head">
                  <h3 className="svc-section-title">Available compose services</h3>
                  <p className="svc-section-sub">
                    Add Pangolin labels back to services preserved in the imported compose file.
                  </p>
                </div>
                <div className="service-list">
                  {availableComposeServices.map(([serviceName, rawService]) => (
                    <div className="service-row" key={serviceName}>
                      <span className="status-dot warn" aria-hidden />
                      <span className="service-row-text">
                        <span className="service-row-name">{serviceName}</span>
                        <span className="service-row-meta">Pangolin disabled</span>
                      </span>
                      <button
                        type="button"
                        className="add-pill"
                        onClick={() => addResourceForComposeService(serviceName, rawService)}
                      >
                        <Plus size={12} /> Add
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Column 3: Form */}
      <section className="service-col">
        <div className="col-head">
          <h2 className="col-head-title">
            <span className="col-bar" aria-hidden />
            {selected
              ? `Resource: ${selected.serviceContainerName}`
              : "Blueprint settings"}
          </h2>
        </div>

        <div className="svc-tab">
          <ValidatedInput
            label="Base domain"
            hint="Used to compose full-domain labels (e.g. example.com → app.example.com)"
            value={blueprint.baseDomain}
            onChange={(v) => setBlueprint((bp) => ({ ...bp, baseDomain: v }))}
            validate={validateBaseDomain}
            placeholder="example.com"
          />
          <ValidatedInput
            label="Pangolin docker network"
            hint="Top-level external network used by Pangolin"
            value={blueprint.pangolinNetwork}
            onChange={(v) =>
              setBlueprint((bp) => ({ ...bp, pangolinNetwork: v }))
            }
            placeholder="pangolin_default"
          />

          {selected && selectedIdx !== null ? (
            <ResourceForm
              resource={selected}
              onChange={(patch) => updateResource(selectedIdx, patch)}
            />
          ) : (
            <Field label="Selected resource">
              <p className="field-hint">
                Import a template or click an existing resource to edit its
                Pangolin labels.
              </p>
            </Field>
          )}
        </div>
      </section>

      {/* Column 4: Output */}
      <section className="code-col">
        <div className="code-head">
          <h2 className="code-title">
            <span className="col-bar" aria-hidden />
            Output
          </h2>
          <button
            type="button"
            className="btn btn-secondary code-validate"
            title={
              errors.length === 0
                ? "Blueprint is valid"
                : `${errors.length} validation issue${errors.length === 1 ? "" : "s"}`
            }
          >
            {errors.length === 0 ? (
              <>
                <CheckCircle2 size={14} />
                Valid
              </>
            ) : (
              <>
                <AlertCircle size={14} />
                {errors.length} issue{errors.length === 1 ? "" : "s"}
              </>
            )}
          </button>
        </div>

        <div className="code-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={outputTab === "compose"}
            className={"code-tab" + (outputTab === "compose" ? " active" : "")}
            onClick={() => setOutputTab("compose")}
          >
            docker-compose.yml
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={outputTab === "env"}
            className={"code-tab" + (outputTab === "env" ? " active" : "")}
            onClick={() => setOutputTab("env")}
          >
            .env.example
          </button>
        </div>

        {errors.length > 0 && (
          <div className="bp-errors">
            <strong>Validation</strong>
            <ul>
              {errors.slice(0, 10).map((e, i) => (
                <li key={i}>{e}</li>
              ))}
              {errors.length > 10 && <li>…and {errors.length - 10} more</li>}
            </ul>
          </div>
        )}

        <div className="code-window">
          <button
            type="button"
            className="code-copy"
            onClick={handleCopy}
            aria-label="Copy to clipboard"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy"}
          </button>
          <pre className="code-pre">
            <code className="bp-code">{output}</code>
          </pre>
          <div className="code-statusbar">
            <span
              className={
                "status-tag" + (errors.length === 0 ? "" : " err")
              }
            >
              <span
                className={
                  "status-dot " + (errors.length === 0 ? "ok" : "err")
                }
                aria-hidden
              />
              {errors.length === 0 ? "Valid" : `${errors.length} issue${errors.length === 1 ? "" : "s"}`}
            </span>
            <span className="status-mono right">{filename}</span>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleDownload}
            >
              <Download size={12} /> Download
            </button>
          </div>
        </div>
      </section>

      {templateStore.templateStoreOpen && (
        <TemplateStoreModal
          open={templateStore.templateStoreOpen}
          onOpenChange={templateStore.setTemplateStoreOpen}
          templates={templateStore.templates}
          loading={templateStore.templateLoading}
          error={templateStore.templateError}
          cacheTimestamp={templateStore.templateCacheTimestamp}
          onRefresh={templateStore.refreshTemplateStore}
          onTemplateSelect={async (template) => {
            try {
              const details = await templateStore.fetchTemplateDetails(
                template.id,
              );
              templateStore.setSelectedTemplate(details);
              templateStore.setTemplateDetailOpen(true);
            } catch (e) {
              // eslint-disable-next-line no-console
              console.error(e);
            }
          }}
        />
      )}

      {templateStore.selectedTemplate && (
        <TemplateDetailModal
          open={templateStore.templateDetailOpen}
          onOpenChange={(open) => {
            templateStore.setTemplateDetailOpen(open);
            if (!open) {
              templateStore.setSelectedTemplate(null);
              templateStore.setTemplateDetailTab("overview");
            }
          }}
          template={templateStore.selectedTemplate}
          onImport={importTemplate}
        />
      )}
    </div>
  );
}

function ResourceForm({
  resource,
  onChange,
}: {
  resource: BlueprintResource;
  onChange: (patch: Partial<BlueprintResource>) => void;
}) {
  const protocolOpts: BlueprintProtocol[] = ["http", "https", "tcp", "udp"];
  return (
    <>
      <div className="svc-section-head">
        <h3 className="svc-section-title">Pangolin metadata</h3>
      </div>
      <ValidatedInput
        label="Blueprint name"
        required
        hint="Slug used in label keys: pangolin.public-resources.<this>.*"
        value={resource.blueprintName}
        onChange={(v) => onChange({ blueprintName: v })}
        validate={validateBlueprintName}
        placeholder="my-app"
      />
      <ValidatedInput
        label="Resource name"
        required
        hint="Human-readable label shown in Pangolin"
        value={resource.resourceName}
        onChange={(v) => onChange({ resourceName: v })}
        validate={validateResourceName}
        placeholder="My App"
      />
      <div className="svc-grid-2">
        <ValidatedInput
          label="Subdomain"
          required
          value={resource.subdomain}
          onChange={(v) => onChange({ subdomain: v })}
          validate={validateSubdomain}
          placeholder="my-app"
        />
        <ValidatedInput
          label="Service port"
          required
          value={String(resource.servicePort)}
          onChange={(v) => onChange({ servicePort: Number(v) || 0 })}
          validate={(v) => validatePort(v) ?? null}
          placeholder="8080"
        />
      </div>
      <Field label="Protocol">
        <div className="select">
          <select
            value={resource.protocol}
            onChange={(e) =>
              onChange({ protocol: e.target.value as BlueprintProtocol })
            }
          >
            {protocolOpts.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <span className="select-chev" aria-hidden>
            ▾
          </span>
        </div>
      </Field>

      <div className="svc-section-head">
        <h3 className="svc-section-title">targets[0] overrides</h3>
        <p className="svc-section-sub">
          Optional — Pangolin auto-detects from container_name + expose. Set
          these only if auto-detection won't work.
        </p>
      </div>
      <div className="svc-grid-2">
        <ValidatedInput
          label="Target hostname"
          value={resource.targetHostname ?? ""}
          onChange={(v) =>
            onChange({ targetHostname: v ? v : undefined })
          }
          placeholder={resource.serviceContainerName}
        />
        <ValidatedInput
          label="Target port"
          value={resource.targetPort !== undefined ? String(resource.targetPort) : ""}
          onChange={(v) =>
            onChange({ targetPort: v ? Number(v) : undefined })
          }
          placeholder={String(resource.servicePort)}
        />
      </div>

      <div className="svc-section-head">
        <h3 className="svc-section-title">Additional targets</h3>
        <button
          type="button"
          className="add-pill"
          onClick={() => {
            const next: BlueprintTarget = { method: resource.protocol };
            onChange({ extraTargets: [...resource.extraTargets, next] });
          }}
        >
          <Plus size={12} /> Add target
        </button>
      </div>
      {resource.extraTargets.length === 0 ? (
        <div className="empty-row">No extra targets</div>
      ) : (
        resource.extraTargets.map((t, idx) => (
          <div className="svc-grid-3" key={idx}>
            <Field label={`targets[${idx + 1}] method`}>
              <div className="select">
                <select
                  value={t.method}
                  onChange={(e) => {
                    const next = [...resource.extraTargets];
                    next[idx] = {
                      ...t,
                      method: e.target.value as BlueprintProtocol,
                    };
                    onChange({ extraTargets: next });
                  }}
                >
                  {protocolOpts.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <span className="select-chev" aria-hidden>
                  ▾
                </span>
              </div>
            </Field>
            <ValidatedInput
              label="hostname"
              value={t.hostname ?? ""}
              onChange={(v) => {
                const next = [...resource.extraTargets];
                next[idx] = { ...t, hostname: v || undefined };
                onChange({ extraTargets: next });
              }}
              placeholder="optional"
            />
            <ValidatedInput
              label="port"
              value={t.port !== undefined ? String(t.port) : ""}
              onChange={(v) => {
                const next = [...resource.extraTargets];
                next[idx] = { ...t, port: v ? Number(v) : undefined };
                onChange({ extraTargets: next });
              }}
              placeholder="optional"
            />
          </div>
        ))
      )}

      <div className="svc-section-head">
        <h3 className="svc-section-title">Resource auth (optional)</h3>
        <p className="svc-section-sub">
          Set any non-empty value here — labels are emitted only for filled
          fields and `.env.example` shows the matching `RESOURCE_AUTH_*` keys.
        </p>
      </div>
      <div className="svc-grid-2">
        <ValidatedInput
          label="Pincode"
          value={resource.auth.pincode}
          onChange={(v) => onChange({ auth: { ...resource.auth, pincode: v } })}
          placeholder="${RESOURCE_AUTH_PINCODE}"
          className="input input-secret"
        />
        <ValidatedInput
          label="Password"
          value={resource.auth.password}
          onChange={(v) =>
            onChange({ auth: { ...resource.auth, password: v } })
          }
          placeholder="${RESOURCE_AUTH_PASSWORD}"
          className="input input-secret"
        />
      </div>
      <div className="svc-grid-2">
        <ValidatedInput
          label="Basic user"
          value={resource.auth.basicUser}
          onChange={(v) =>
            onChange({ auth: { ...resource.auth, basicUser: v } })
          }
          placeholder="${RESOURCE_AUTH_BASIC_USER}"
        />
        <ValidatedInput
          label="Basic password"
          value={resource.auth.basicPassword}
          onChange={(v) =>
            onChange({ auth: { ...resource.auth, basicPassword: v } })
          }
          placeholder="${RESOURCE_AUTH_BASIC_PASSWORD}"
          className="input input-secret"
        />
      </div>
      <Field label="SSO enabled">
        <label className="switch">
          <input
            type="checkbox"
            checked={resource.auth.ssoEnabled}
            onChange={(e) =>
              onChange({ auth: { ...resource.auth, ssoEnabled: e.target.checked } })
            }
          />
          <span className="switch-track">
            <span className="switch-thumb" />
          </span>
        </label>
      </Field>
      <Field
        label="SSO roles"
        hint="Comma-separated — each entry becomes auth.sso-roles[N]"
      >
        <input
          className="input"
          value={resource.auth.ssoRoles.join(", ")}
          onChange={(e) =>
            onChange({
              auth: {
                ...resource.auth,
                ssoRoles: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              },
            })
          }
          placeholder="admin, editor"
        />
      </Field>
      <Field
        label="SSO users"
        hint="Comma-separated — auth.sso-users[N]"
      >
        <input
          className="input"
          value={resource.auth.ssoUsers.join(", ")}
          onChange={(e) =>
            onChange({
              auth: {
                ...resource.auth,
                ssoUsers: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              },
            })
          }
          placeholder="alice@example.com, bob@example.com"
        />
      </Field>
      <Field
        label="Whitelist users"
        hint="Comma-separated — auth.whitelist-users[N]"
      >
        <input
          className="input"
          value={resource.auth.whitelistUsers.join(", ")}
          onChange={(e) =>
            onChange({
              auth: {
                ...resource.auth,
                whitelistUsers: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              },
            })
          }
          placeholder="alice@example.com"
        />
      </Field>
    </>
  );
}

