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
  defaultAuth,
  defaultBlueprint,
  defaultHealthcheck,
  defaultPrivateResource,
  defaultSite,
  fromCompose,
  resourceFromComposeService,
  toComposeYaml,
  toEnvExample,
} from "../utils/blueprint/generator";
import {
  validateBaseDomain,
  validateBlueprint,
  validateBlueprintName,
  validateFullDomain,
  validateResourceName,
  validateSubdomain,
} from "../utils/blueprint/validator";
import { validatePort } from "../utils/validation";
import type {
  Blueprint,
  BlueprintHealthcheck,
  BlueprintHeader,
  BlueprintPrivateResource,
  BlueprintProtocol,
  BlueprintResource,
  BlueprintRule,
  BlueprintSite,
  BlueprintTarget,
  BlueprintTargetMethod,
} from "../types/blueprint";
import { copyToClipboard, downloadFile } from "../utils/clipboard";
import { useToast } from "../components/ui/toast";

export const Route = createFileRoute("/blueprint-builder")({
  component: BlueprintBuilderRoute,
});

type OutputTab = "compose" | "env";

function nextUnusedSuffix(prefix: string, keys: string[]): number {
  const used = new Set<number>();
  const re = new RegExp(`^${prefix}-(\\d+)$`);
  keys.forEach((key) => {
    const match = re.exec(key);
    if (!match) return;
    const suffix = Number(match[1]);
    if (Number.isInteger(suffix) && suffix > 0) used.add(suffix);
  });

  let suffix = 1;
  while (used.has(suffix)) suffix += 1;
  return suffix;
}

function stripTargetMethod(target: BlueprintTarget): BlueprintTarget {
  return { ...target, method: undefined };
}

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
  const composeServiceNames = useMemo(
    () => composeServiceEntries.map(([name]) => name),
    [composeServiceEntries],
  );
  const defaultLabelService =
    blueprint.resources[0]?.serviceContainerName ?? composeServiceNames[0] ?? "";

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

  const updatePrivateResource = useCallback(
    (idx: number, patch: Partial<BlueprintPrivateResource>) => {
      setBlueprint((bp) => {
        const privateResources = [...(bp.privateResources ?? [])];
        privateResources[idx] = { ...privateResources[idx], ...patch };
        return { ...bp, privateResources };
      });
    },
    [],
  );

  const addPrivateResource = useCallback(() => {
    setBlueprint((bp) => {
      const privateResources = bp.privateResources ?? [];
      const suffix = nextUnusedSuffix(
        "private",
        privateResources.map((resource) => resource.key),
      );
      const key = `private-${suffix}`;
      return {
        ...bp,
        privateResources: [
          ...privateResources,
          {
            ...defaultPrivateResource(defaultLabelService),
            key,
            name: `Private ${suffix}`,
            alias: key,
          },
        ],
      };
    });
  }, [defaultLabelService]);

  const removePrivateResource = useCallback((idx: number) => {
    setBlueprint((bp) => ({
      ...bp,
      privateResources: (bp.privateResources ?? []).filter((_, i) => i !== idx),
    }));
  }, []);

  const updateSite = useCallback((idx: number, patch: Partial<BlueprintSite>) => {
    setBlueprint((bp) => {
      const sites = [...(bp.sites ?? [])];
      sites[idx] = { ...sites[idx], ...patch };
      return { ...bp, sites };
    });
  }, []);

  const addSite = useCallback(() => {
    setBlueprint((bp) => {
      const sites = bp.sites ?? [];
      const suffix = nextUnusedSuffix(
        "site",
        sites.map((site) => site.key),
      );
      return {
        ...bp,
        sites: [
          ...sites,
          {
            ...defaultSite(defaultLabelService),
            key: `site-${suffix}`,
            name: `Site ${suffix}`,
          },
        ],
      };
    });
  }, [defaultLabelService]);

  const removeSite = useCallback((idx: number) => {
    setBlueprint((bp) => ({
      ...bp,
      sites: (bp.sites ?? []).filter((_, i) => i !== idx),
    }));
  }, []);

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
        resource.subdomain = nextName;
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

          <BlueprintGlobalForm
            privateResources={blueprint.privateResources ?? []}
            sites={blueprint.sites ?? []}
            serviceNames={composeServiceNames}
            onPrivateChange={updatePrivateResource}
            onPrivateAdd={addPrivateResource}
            onPrivateRemove={removePrivateResource}
            onSiteChange={updateSite}
            onSiteAdd={addSite}
            onSiteRemove={removeSite}
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
              if (details.composeVersionRemoved) {
                toast({
                  title: "Obsolete Compose version removed",
                  description: "The top-level version field is obsolete in Docker Compose V2 and was removed from this template.",
                  variant: "warning",
                  duration: 4500,
                });
              }
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

function csv(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function optionalNumber(value: string): number | undefined {
  return value ? Number(value) : undefined;
}

function ServiceSelect({
  label,
  value,
  serviceNames,
  onChange,
}: {
  label: string;
  value: string;
  serviceNames: string[];
  onChange: (next: string) => void;
}) {
  return (
    <Field label={label} required>
      <div className="select">
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select service</option>
          {serviceNames.map((service) => (
            <option key={service} value={service}>
              {service}
            </option>
          ))}
        </select>
        <span className="select-chev" aria-hidden>
          ▾
        </span>
      </div>
    </Field>
  );
}

function HeaderFields({
  headers,
  onChange,
}: {
  headers: BlueprintHeader[];
  onChange: (next: BlueprintHeader[]) => void;
}) {
  return (
    <>
      <div className="svc-section-head">
        <h3 className="svc-section-title">Headers</h3>
        <button
          type="button"
          className="add-pill"
          onClick={() => onChange([...headers, { name: "", value: "" }])}
        >
          <Plus size={12} /> Add header
        </button>
      </div>
      {headers.length === 0 ? (
        <div className="empty-row">No headers</div>
      ) : (
        headers.map((header, idx) => (
          <div className="svc-grid-3" key={idx}>
            <ValidatedInput
              label="name"
              value={header.name}
              onChange={(v) => {
                const next = [...headers];
                next[idx] = { ...header, name: v };
                onChange(next);
              }}
              placeholder="X-Forwarded-Proto"
            />
            <ValidatedInput
              label="value"
              value={header.value}
              onChange={(v) => {
                const next = [...headers];
                next[idx] = { ...header, value: v };
                onChange(next);
              }}
              placeholder="https"
            />
            <Field label="Remove">
              <button
                type="button"
                className="icon-trash"
                onClick={() => onChange(headers.filter((_, i) => i !== idx))}
                aria-label={`Remove header ${idx + 1}`}
                title="Remove header"
              >
                <Trash2 size={14} />
              </button>
            </Field>
          </div>
        ))
      )}
    </>
  );
}

function RuleFields({
  rules,
  onChange,
}: {
  rules: BlueprintRule[];
  onChange: (next: BlueprintRule[]) => void;
}) {
  const actions: BlueprintRule["action"][] = ["allow", "deny", "pass"];
  const matches: BlueprintRule["match"][] = ["cidr", "path", "ip", "country", "asn", "region"];
  return (
    <>
      <div className="svc-section-head">
        <h3 className="svc-section-title">Rules</h3>
        <button
          type="button"
          className="add-pill"
          onClick={() => onChange([...rules, { action: "allow", match: "cidr", value: "" }])}
        >
          <Plus size={12} /> Add rule
        </button>
      </div>
      {rules.length === 0 ? (
        <div className="empty-row">No rules</div>
      ) : (
        rules.map((rule, idx) => (
          <div className="svc-grid-3" key={idx}>
            <Field label="action">
              <div className="select">
                <select
                  value={rule.action}
                  onChange={(e) => {
                    const next = [...rules];
                    next[idx] = { ...rule, action: e.target.value as BlueprintRule["action"] };
                    onChange(next);
                  }}
                >
                  {actions.map((action) => <option key={action} value={action}>{action}</option>)}
                </select>
                <span className="select-chev" aria-hidden>▾</span>
              </div>
            </Field>
            <Field label="match">
              <div className="select">
                <select
                  value={rule.match}
                  onChange={(e) => {
                    const next = [...rules];
                    next[idx] = { ...rule, match: e.target.value as BlueprintRule["match"] };
                    onChange(next);
                  }}
                >
                  {matches.map((match) => <option key={match} value={match}>{match}</option>)}
                </select>
                <span className="select-chev" aria-hidden>▾</span>
              </div>
            </Field>
            <ValidatedInput
              label="value"
              value={rule.value}
              onChange={(v) => {
                const next = [...rules];
                next[idx] = { ...rule, value: v };
                onChange(next);
              }}
              placeholder="10.0.0.0/8"
            />
            <ValidatedInput
              label="priority"
              value={rule.priority !== undefined ? String(rule.priority) : ""}
              onChange={(v) => {
                const next = [...rules];
                next[idx] = { ...rule, priority: optionalNumber(v) };
                onChange(next);
              }}
              placeholder="optional"
            />
            <Field label="Remove">
              <button
                type="button"
                className="icon-trash"
                onClick={() => onChange(rules.filter((_, i) => i !== idx))}
                aria-label={`Remove rule ${idx + 1}`}
                title="Remove rule"
              >
                <Trash2 size={14} />
              </button>
            </Field>
          </div>
        ))
      )}
    </>
  );
}

function HealthcheckFields({
  healthcheck,
  onChange,
}: {
  healthcheck?: BlueprintHealthcheck;
  onChange: (next: BlueprintHealthcheck | undefined) => void;
}) {
  const hc = healthcheck ?? defaultHealthcheck();
  return (
    <>
      <Field label="Target healthcheck">
        <label className="switch">
          <input
            type="checkbox"
            checked={Boolean(healthcheck)}
            onChange={(e) => onChange(e.target.checked ? defaultHealthcheck() : undefined)}
          />
          <span className="switch-track"><span className="switch-thumb" /></span>
        </label>
      </Field>
      {healthcheck && (
        <>
          <div className="svc-grid-3">
            <ValidatedInput label="hostname" value={hc.hostname} onChange={(v) => onChange({ ...hc, hostname: v })} placeholder="app" />
            <ValidatedInput label="port" value={hc.port !== undefined ? String(hc.port) : ""} onChange={(v) => onChange({ ...hc, port: optionalNumber(v) })} placeholder="80" validate={(v) => (v ? validatePort(v) : null)} />
            <ValidatedInput label="path" value={hc.path} onChange={(v) => onChange({ ...hc, path: v })} placeholder="/health" />
          </div>
          <div className="svc-grid-3">
            <Field label="scheme">
              <div className="select">
                <select value={hc.scheme ?? "http"} onChange={(e) => onChange({ ...hc, scheme: e.target.value as "http" | "https" })}>
                  <option value="http">http</option>
                  <option value="https">https</option>
                </select>
                <span className="select-chev" aria-hidden>▾</span>
              </div>
            </Field>
            <ValidatedInput label="method" value={hc.method ?? ""} onChange={(v) => onChange({ ...hc, method: v })} placeholder="GET" />
            <ValidatedInput label="status" value={hc.status !== undefined ? String(hc.status) : ""} onChange={(v) => onChange({ ...hc, status: optionalNumber(v) })} placeholder="200" />
          </div>
          <div className="svc-grid-3">
            <ValidatedInput label="interval" value={hc.interval !== undefined ? String(hc.interval) : ""} onChange={(v) => onChange({ ...hc, interval: optionalNumber(v) })} placeholder="30" />
            <ValidatedInput label="unhealthy interval" value={hc.unhealthyInterval !== undefined ? String(hc.unhealthyInterval) : ""} onChange={(v) => onChange({ ...hc, unhealthyInterval: optionalNumber(v) })} placeholder="10" />
            <ValidatedInput label="timeout" value={hc.timeout !== undefined ? String(hc.timeout) : ""} onChange={(v) => onChange({ ...hc, timeout: optionalNumber(v) })} placeholder="5" />
          </div>
          <HeaderFields headers={hc.headers} onChange={(headers) => onChange({ ...hc, headers })} />
        </>
      )}
    </>
  );
}

function ResourceForm({
  resource,
  onChange,
}: {
  resource: BlueprintResource;
  onChange: (patch: Partial<BlueprintResource>) => void;
}) {
  const protocolOpts: BlueprintProtocol[] = ["http", "tcp", "udp"];
  const targetMethodOpts: BlueprintTargetMethod[] = ["http", "https", "h2c"];
  const isHttp = resource.protocol === "http";
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
        <Field label="Protocol">
          <div className="select">
            <select
              value={resource.protocol}
              onChange={(e) => {
                const protocol = e.target.value as BlueprintProtocol;
                onChange({
                  protocol,
                  proxyPort: protocol === "http" ? undefined : (resource.proxyPort ?? resource.servicePort),
                  ...(protocol !== "http"
                    ? {
                        auth: defaultAuth(),
                        extraTargets: resource.extraTargets.map(stripTargetMethod),
                      }
                    : {}),
                });
              }}
            >
              {protocolOpts.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <span className="select-chev" aria-hidden>▾</span>
          </div>
        </Field>
        <ValidatedInput
          label="Service port"
          required
          value={String(resource.servicePort)}
          onChange={(v) => onChange({ servicePort: Number(v) || 0 })}
          validate={(v) => validatePort(v) ?? null}
          placeholder="8080"
        />
      </div>
      <Field label="Enabled">
        <label className="switch">
          <input checked={resource.enabled} type="checkbox" onChange={(e) => onChange({ enabled: e.target.checked })} />
          <span className="switch-track"><span className="switch-thumb" /></span>
        </label>
      </Field>

      {isHttp ? (
        <>
          <div className="svc-grid-2">
            <ValidatedInput label="Subdomain" required value={resource.subdomain} onChange={(v) => onChange({ subdomain: v })} validate={validateSubdomain} placeholder="my-app" />
            <Field label="SSL">
              <label className="switch">
                <input checked={resource.ssl} type="checkbox" onChange={(e) => onChange({ ssl: e.target.checked })} />
                <span className="switch-track"><span className="switch-thumb" /></span>
              </label>
            </Field>
          </div>
          <div className="svc-grid-2">
            <ValidatedInput label="Host header" value={resource.hostHeader} onChange={(v) => onChange({ hostHeader: v })} placeholder="optional" />
            <ValidatedInput label="TLS server name" value={resource.tlsServerName} onChange={(v) => onChange({ tlsServerName: v })} placeholder="optional" />
          </div>

          <div className="svc-section-head">
            <h3 className="svc-section-title">targets[0]</h3>
            <p className="svc-section-sub">Pangolin requires method for HTTP targets; other fields are optional overrides.</p>
          </div>
          <div className="svc-grid-3">
            <Field label="method" required>
              <div className="select">
                <select value={resource.targetMethod} onChange={(e) => onChange({ targetMethod: e.target.value as BlueprintTargetMethod })}>
                  {targetMethodOpts.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <span className="select-chev" aria-hidden>▾</span>
              </div>
            </Field>
            <ValidatedInput label="hostname" value={resource.targetHostname ?? ""} onChange={(v) => onChange({ targetHostname: v || undefined })} placeholder={resource.serviceContainerName} />
            <ValidatedInput label="port" value={resource.targetPort !== undefined ? String(resource.targetPort) : ""} onChange={(v) => onChange({ targetPort: optionalNumber(v) })} validate={(v) => (v ? validatePort(v) : null)} placeholder={String(resource.servicePort)} />
          </div>
          <div className="svc-grid-3">
            <ValidatedInput label="site" value={resource.targetSite ?? ""} onChange={(v) => onChange({ targetSite: v || undefined })} placeholder="optional" />
            <ValidatedInput label="internal port" value={resource.targetInternalPort !== undefined ? String(resource.targetInternalPort) : ""} onChange={(v) => onChange({ targetInternalPort: optionalNumber(v) })} validate={(v) => (v ? validatePort(v) : null)} placeholder="optional" />
            <ValidatedInput label="priority" value={resource.targetPriority !== undefined ? String(resource.targetPriority) : ""} onChange={(v) => onChange({ targetPriority: optionalNumber(v) })} placeholder="optional" />
          </div>
          <div className="svc-grid-3">
            <ValidatedInput label="path" value={resource.targetPath ?? ""} onChange={(v) => onChange({ targetPath: v || undefined })} placeholder="/" />
            <Field label="path match">
              <div className="select">
                <select value={resource.targetPathMatch ?? ""} onChange={(e) => onChange({ targetPathMatch: e.target.value ? e.target.value as BlueprintResource["targetPathMatch"] : undefined })}>
                  <option value="">unset</option><option value="exact">exact</option><option value="prefix">prefix</option><option value="regex">regex</option>
                </select>
                <span className="select-chev" aria-hidden>▾</span>
              </div>
            </Field>
            <Field label="enabled">
              <label className="switch"><input type="checkbox" checked={resource.targetEnabled ?? true} onChange={(e) => onChange({ targetEnabled: e.target.checked })} /><span className="switch-track"><span className="switch-thumb" /></span></label>
            </Field>
          </div>
          <div className="svc-grid-2">
            <ValidatedInput label="rewrite path" value={resource.targetRewritePath ?? ""} onChange={(v) => onChange({ targetRewritePath: v || undefined })} placeholder="optional" />
            <Field label="rewrite match">
              <div className="select">
                <select value={resource.targetRewriteMatch ?? ""} onChange={(e) => onChange({ targetRewriteMatch: e.target.value ? e.target.value as BlueprintResource["targetRewriteMatch"] : undefined })}>
                  <option value="">unset</option><option value="exact">exact</option><option value="prefix">prefix</option><option value="regex">regex</option><option value="stripPrefix">stripPrefix</option>
                </select>
                <span className="select-chev" aria-hidden>▾</span>
              </div>
            </Field>
          </div>
          <HealthcheckFields healthcheck={resource.targetHealthcheck} onChange={(targetHealthcheck) => onChange({ targetHealthcheck })} />

          <div className="svc-section-head">
            <h3 className="svc-section-title">Additional targets</h3>
            <button
              type="button"
              className="add-pill"
              onClick={() => {
                const next: BlueprintTarget = { method: resource.targetMethod };
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
                      value={t.method ?? "http"}
                      onChange={(e) => {
                        const next = [...resource.extraTargets];
                        next[idx] = { ...t, method: e.target.value as BlueprintTargetMethod };
                        onChange({ extraTargets: next });
                      }}
                    >
                      {targetMethodOpts.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <span className="select-chev" aria-hidden>▾</span>
                  </div>
                </Field>
                <ValidatedInput label="hostname" value={t.hostname ?? ""} onChange={(v) => { const next = [...resource.extraTargets]; next[idx] = { ...t, hostname: v || undefined }; onChange({ extraTargets: next }); }} placeholder="optional" />
                <ValidatedInput label="port" value={t.port !== undefined ? String(t.port) : ""} onChange={(v) => { const next = [...resource.extraTargets]; next[idx] = { ...t, port: optionalNumber(v) }; onChange({ extraTargets: next }); }} placeholder="optional" />
                <ValidatedInput label="site" value={t.site ?? ""} onChange={(v) => { const next = [...resource.extraTargets]; next[idx] = { ...t, site: v || undefined }; onChange({ extraTargets: next }); }} placeholder="optional" />
                <ValidatedInput label="path" value={t.path ?? ""} onChange={(v) => { const next = [...resource.extraTargets]; next[idx] = { ...t, path: v || undefined }; onChange({ extraTargets: next }); }} placeholder="optional" />
                <Field label="Remove"><button type="button" className="icon-trash" onClick={() => onChange({ extraTargets: resource.extraTargets.filter((_, i) => i !== idx) })} aria-label={`Remove target ${idx + 1}`} title="Remove target"><Trash2 size={14} /></button></Field>
              </div>
            ))
          )}

          <HeaderFields headers={resource.headers} onChange={(headers) => onChange({ headers })} />
          <RuleFields rules={resource.rules} onChange={(rules) => onChange({ rules })} />

          <div className="svc-section-head"><h3 className="svc-section-title">Maintenance</h3></div>
          <Field label="Maintenance enabled">
            <label className="switch"><input type="checkbox" checked={resource.maintenance.enabled} onChange={(e) => onChange({ maintenance: { ...resource.maintenance, enabled: e.target.checked } })} /><span className="switch-track"><span className="switch-thumb" /></span></label>
          </Field>
          {resource.maintenance.enabled && (
            <>
              <div className="svc-grid-2">
                <Field label="type"><div className="select"><select value={resource.maintenance.type} onChange={(e) => onChange({ maintenance: { ...resource.maintenance, type: e.target.value as BlueprintResource["maintenance"]["type"] } })}><option value="forced">forced</option><option value="automatic">automatic</option></select><span className="select-chev" aria-hidden>▾</span></div></Field>
                <ValidatedInput label="title" value={resource.maintenance.title} onChange={(v) => onChange({ maintenance: { ...resource.maintenance, title: v } })} placeholder="Maintenance" />
              </div>
              <ValidatedInput label="message" value={resource.maintenance.message} onChange={(v) => onChange({ maintenance: { ...resource.maintenance, message: v } })} placeholder="Service is unavailable" />
              <ValidatedInput label="estimated time" value={resource.maintenance.estimatedTime} onChange={(v) => onChange({ maintenance: { ...resource.maintenance, estimatedTime: v } })} placeholder="15 minutes" />
            </>
          )}

          <div className="svc-section-head"><h3 className="svc-section-title">Resource auth (optional)</h3><p className="svc-section-sub">Auth labels are valid for HTTP public resources only.</p></div>
          <div className="svc-grid-2">
            <ValidatedInput label="Pincode" value={resource.auth.pincode} onChange={(v) => onChange({ auth: { ...resource.auth, pincode: v } })} placeholder="${RESOURCE_AUTH_PINCODE}" className="input input-secret" />
            <ValidatedInput label="Password" value={resource.auth.password} onChange={(v) => onChange({ auth: { ...resource.auth, password: v } })} placeholder="${RESOURCE_AUTH_PASSWORD}" className="input input-secret" />
          </div>
          <div className="svc-grid-2">
            <ValidatedInput label="Basic user" value={resource.auth.basicUser} onChange={(v) => onChange({ auth: { ...resource.auth, basicUser: v } })} placeholder="${RESOURCE_AUTH_BASIC_USER}" />
            <ValidatedInput label="Basic password" value={resource.auth.basicPassword} onChange={(v) => onChange({ auth: { ...resource.auth, basicPassword: v } })} placeholder="${RESOURCE_AUTH_BASIC_PASSWORD}" className="input input-secret" />
          </div>
          <Field label="SSO enabled"><label className="switch"><input type="checkbox" checked={resource.auth.ssoEnabled} onChange={(e) => onChange({ auth: { ...resource.auth, ssoEnabled: e.target.checked } })} /><span className="switch-track"><span className="switch-thumb" /></span></label></Field>
          <ValidatedInput label="SSO roles" hint="Comma-separated; Admin is reserved" value={resource.auth.ssoRoles.join(", ")} onChange={(v) => onChange({ auth: { ...resource.auth, ssoRoles: csv(v) } })} placeholder="support, editor" />
          <ValidatedInput label="SSO users" hint="Comma-separated" value={resource.auth.ssoUsers.join(", ")} onChange={(v) => onChange({ auth: { ...resource.auth, ssoUsers: csv(v) } })} placeholder="alice@example.com" />
          <ValidatedInput label="Whitelist users" hint="Comma-separated" value={resource.auth.whitelistUsers.join(", ")} onChange={(v) => onChange({ auth: { ...resource.auth, whitelistUsers: csv(v) } })} placeholder="alice@example.com" />
        </>
      ) : (
        <>
          <ValidatedInput
            label="Proxy port"
            required
            hint="TCP/UDP resources expose proxy-port instead of full-domain and auth labels."
            value={resource.proxyPort !== undefined ? String(resource.proxyPort) : ""}
            onChange={(v) => onChange({ proxyPort: optionalNumber(v) })}
            validate={(v) => validatePort(v) ?? null}
            placeholder={String(resource.servicePort)}
          />
          <p className="field-hint">TCP/UDP public resources do not emit target method or auth labels.</p>
        </>
      )}
    </>
  );
}

function BlueprintGlobalForm({
  privateResources,
  sites,
  serviceNames,
  onPrivateChange,
  onPrivateAdd,
  onPrivateRemove,
  onSiteChange,
  onSiteAdd,
  onSiteRemove,
}: {
  privateResources: BlueprintPrivateResource[];
  sites: BlueprintSite[];
  serviceNames: string[];
  onPrivateChange: (idx: number, patch: Partial<BlueprintPrivateResource>) => void;
  onPrivateAdd: () => void;
  onPrivateRemove: (idx: number) => void;
  onSiteChange: (idx: number, patch: Partial<BlueprintSite>) => void;
  onSiteAdd: () => void;
  onSiteRemove: (idx: number) => void;
}) {
  return (
    <>
      <div className="svc-section-head">
        <h3 className="svc-section-title">Sites</h3>
        <button type="button" className="add-pill" onClick={onSiteAdd}><Plus size={12} /> Add site</button>
      </div>
      {sites.length === 0 ? <div className="empty-row">No site labels</div> : sites.map((site, idx) => (
        <div key={idx} className="svc-section-card">
          <div className="svc-grid-2">
            <ValidatedInput label="Site key" required value={site.key} onChange={(v) => onSiteChange(idx, { key: v })} validate={validateBlueprintName} placeholder="main-site" />
            <ValidatedInput label="Site name" required value={site.name} onChange={(v) => onSiteChange(idx, { name: v })} validate={validateResourceName} placeholder="Main Site" />
          </div>
          <div className="svc-grid-2">
            <ServiceSelect label="Label service" value={site.serviceContainerName} serviceNames={serviceNames} onChange={(serviceContainerName) => onSiteChange(idx, { serviceContainerName })} />
            <Field label="Docker socket enabled"><label className="switch"><input type="checkbox" checked={site.dockerSocketEnabled} onChange={(e) => onSiteChange(idx, { dockerSocketEnabled: e.target.checked })} /><span className="switch-track"><span className="switch-thumb" /></span></label></Field>
          </div>
          <button type="button" className="icon-trash" onClick={() => onSiteRemove(idx)} aria-label={`Remove site ${idx + 1}`} title="Remove site"><Trash2 size={14} /></button>
        </div>
      ))}

      <div className="svc-section-head">
        <h3 className="svc-section-title">Private resources</h3>
        <button type="button" className="add-pill" onClick={onPrivateAdd}><Plus size={12} /> Add private</button>
      </div>
      {privateResources.length === 0 ? <div className="empty-row">No private resource labels</div> : privateResources.map((resource, idx) => (
        <div key={idx} className="svc-section-card">
          <div className="svc-grid-2">
            <ValidatedInput label="Key" required value={resource.key} onChange={(v) => onPrivateChange(idx, { key: v })} validate={validateBlueprintName} placeholder="internal-app" />
            <ValidatedInput label="Name" required value={resource.name} onChange={(v) => onPrivateChange(idx, { name: v })} validate={validateResourceName} placeholder="Internal App" />
          </div>
          <div className="svc-grid-3">
            <ServiceSelect label="Label service" value={resource.serviceContainerName} serviceNames={serviceNames} onChange={(serviceContainerName) => onPrivateChange(idx, { serviceContainerName })} />
            <Field label="mode"><div className="select"><select value={resource.mode} onChange={(e) => onPrivateChange(idx, { mode: e.target.value as BlueprintPrivateResource["mode"] })}><option value="host">host</option><option value="cidr">cidr</option><option value="http">http</option></select><span className="select-chev" aria-hidden>▾</span></div></Field>
            <ValidatedInput label="alias" required value={resource.alias} onChange={(v) => onPrivateChange(idx, { alias: v })} placeholder="internal-app" />
          </div>
          <div className="svc-grid-3">
            <ValidatedInput label="destination" required value={resource.destination} onChange={(v) => onPrivateChange(idx, { destination: v })} placeholder={resource.mode === "cidr" ? "10.0.0.0/24" : "app.internal"} />
            <ValidatedInput label="destination port" value={resource.destinationPort !== undefined ? String(resource.destinationPort) : ""} onChange={(v) => onPrivateChange(idx, { destinationPort: optionalNumber(v) })} validate={(v) => (v ? validatePort(v) : null)} placeholder="80" />
            <ValidatedInput label="sites" hint="Comma-separated site keys" value={resource.sites.join(", ")} onChange={(v) => onPrivateChange(idx, { sites: csv(v) })} placeholder="main-site" />
          </div>
          {resource.mode === "http" && (
            <div className="svc-grid-3">
              <ValidatedInput label="full domain" required value={resource.fullDomain} onChange={(v) => onPrivateChange(idx, { fullDomain: v })} validate={validateFullDomain} placeholder="internal.example.com" />
              <Field label="scheme"><div className="select"><select value={resource.scheme} onChange={(e) => onPrivateChange(idx, { scheme: e.target.value as BlueprintPrivateResource["scheme"] })}><option value="http">http</option><option value="https">https</option></select><span className="select-chev" aria-hidden>▾</span></div></Field>
              <Field label="SSL"><label className="switch"><input type="checkbox" checked={resource.ssl} onChange={(e) => onPrivateChange(idx, { ssl: e.target.checked })} /><span className="switch-track"><span className="switch-thumb" /></span></label></Field>
            </div>
          )}
          <div className="svc-grid-3">
            <ValidatedInput label="TCP ports" value={resource.tcpPorts} onChange={(v) => onPrivateChange(idx, { tcpPorts: v })} placeholder="22, 5432" />
            <ValidatedInput label="UDP ports" value={resource.udpPorts} onChange={(v) => onPrivateChange(idx, { udpPorts: v })} placeholder="53" />
            <Field label="Disable ICMP"><label className="switch"><input type="checkbox" checked={resource.disableIcmp} onChange={(e) => onPrivateChange(idx, { disableIcmp: e.target.checked })} /><span className="switch-track"><span className="switch-thumb" /></span></label></Field>
          </div>
          <ValidatedInput label="Roles" hint="Comma-separated; Admin is reserved" value={resource.roles.join(", ")} onChange={(v) => onPrivateChange(idx, { roles: csv(v) })} placeholder="support" />
          <ValidatedInput label="Users" hint="Comma-separated" value={resource.users.join(", ")} onChange={(v) => onPrivateChange(idx, { users: csv(v) })} placeholder="alice@example.com" />
          <ValidatedInput label="Machines" hint="Comma-separated" value={resource.machines.join(", ")} onChange={(v) => onPrivateChange(idx, { machines: csv(v) })} placeholder="laptop-01" />
          <button type="button" className="icon-trash" onClick={() => onPrivateRemove(idx)} aria-label={`Remove private resource ${idx + 1}`} title="Remove private resource"><Trash2 size={14} /></button>
        </div>
      ))}
    </>
  );
}
