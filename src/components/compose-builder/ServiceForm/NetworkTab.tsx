import {
  validateExtraHost,
  validateHostname,
  validateIpAddress,
  validateNetworkMode,
  validatePort,
} from "../../../utils/validation";
import { useServiceFormApi } from "../service-form-api";
import { Field, SectionHead, ValidatedInput } from "./Field";

const PROTOCOLS = [
  { value: "none", label: "—" },
  { value: "tcp", label: "tcp" },
  { value: "udp", label: "udp" },
];

function validateCsvList(
  validator: (item: string) => string | null,
): (value: string) => string | null {
  return (value: string) => {
    if (!value) return null;
    const items = value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const item of items) {
      const err = validator(item);
      if (err) return `"${item}": ${err}`;
    }
    return null;
  };
}

export function NetworkTab() {
  const {
    service,
    updateServiceField,
    updatePortField,
    addPortField,
    removePortField,
  } = useServiceFormApi();

  return (
    <div className="svc-tab">
      {/* Port mappings */}
      <div>
        <SectionHead
          title="Port mappings"
          sub="Expose container ports to the host. Empty rows are ignored."
          action={
            <button
              type="button"
              className="add-pill"
              onClick={addPortField}
            >
              + Add port
            </button>
          }
        />
        {service.ports.length === 0 ? (
          <div className="empty-row">No port mappings — click "Add port"</div>
        ) : (
          <div className="port-list">
            <div className="port-head">
              <span>Host</span>
              <span aria-hidden />
              <span>Container</span>
              <span>Protocol</span>
              <span aria-hidden />
            </div>
            {service.ports.map((p, idx) => {
              const hostErr = validatePort(p.host);
              const containerErr = validatePort(p.container);
              return (
              <div className="port-row" key={idx}>
                <input
                  className="input"
                  value={p.host}
                  onChange={(e) =>
                    updatePortField(idx, "host", e.target.value)
                  }
                  placeholder="8080"
                  aria-label={`Host port ${idx + 1}`}
                  aria-invalid={hostErr ? true : undefined}
                  title={hostErr ?? undefined}
                />
                <span className="port-arrow" aria-hidden>
                  →
                </span>
                <input
                  className="input"
                  value={p.container}
                  onChange={(e) =>
                    updatePortField(idx, "container", e.target.value)
                  }
                  placeholder="80"
                  aria-label={`Container port ${idx + 1}`}
                  aria-invalid={containerErr ? true : undefined}
                  title={containerErr ?? undefined}
                />
                <div className="select">
                  <select
                    value={p.protocol}
                    onChange={(e) =>
                      updatePortField(idx, "protocol", e.target.value)
                    }
                  >
                    {PROTOCOLS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <span className="select-chev" aria-hidden>
                    ▾
                  </span>
                </div>
                <button
                  type="button"
                  className="icon-trash"
                  onClick={() => removePortField(idx)}
                  aria-label={`Remove port ${idx + 1}`}
                  title="Remove"
                >
                  ×
                </button>
              </div>
              );
            })}
          </div>
        )}
      </div>

      <ValidatedInput
        label="Network mode"
        hint="Leave empty for the default bridge"
        value={service.network_mode || ""}
        onChange={(v) => updateServiceField("network_mode", v)}
        validate={validateNetworkMode}
        placeholder="host, none, service:other"
      />

      <Field
        label="Networks"
        hint="Comma-separated list of network names this service joins"
      >
        <input
          className="input"
          value={(service.networks || []).join(", ")}
          onChange={(e) =>
            updateServiceField(
              "networks",
              e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            )
          }
          placeholder="frontend, backend"
        />
      </Field>

      <div className="svc-grid-2">
        <ValidatedInput
          label="Hostname"
          value={service.hostname || ""}
          onChange={(v) => updateServiceField("hostname", v)}
          validate={validateHostname}
          placeholder="my-app"
        />
        <ValidatedInput
          label="DNS servers"
          hint="Comma-separated"
          value={(service.dns || []).join(", ")}
          onChange={(v) =>
            updateServiceField(
              "dns",
              v
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            )
          }
          validate={validateCsvList(validateIpAddress)}
          placeholder="1.1.1.1, 8.8.8.8"
        />
      </div>

      <ValidatedInput
        label="Expose"
        hint="Internal-only ports (visible to linked services). Comma-separated."
        value={(service.expose || []).join(", ")}
        onChange={(v) =>
          updateServiceField(
            "expose",
            v
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          )
        }
        validate={validateCsvList(validatePort)}
        placeholder="3000, 8080"
      />

      <ValidatedInput
        label="Extra hosts"
        hint="host:ip pairs, comma-separated"
        value={(service.extra_hosts || []).join(", ")}
        onChange={(v) =>
          updateServiceField(
            "extra_hosts",
            v
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          )
        }
        validate={validateCsvList(validateExtraHost)}
        placeholder="api.local:192.168.1.10"
      />
    </div>
  );
}
