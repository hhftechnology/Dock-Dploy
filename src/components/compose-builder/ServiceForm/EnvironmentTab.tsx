import { validateEnvVarKey } from "../../../utils/validation";
import { useServiceFormApi } from "../service-form-api";
import { Field, SectionHead } from "./Field";

export function EnvironmentTab() {
  const {
    service,
    updateServiceField,
    updateListField,
    addListField,
    removeListField,
    updateVolumeField,
    addVolumeField,
    removeVolumeField,
  } = useServiceFormApi();

  return (
    <div className="svc-tab">
      {/* Environment variables */}
      <div>
        <SectionHead
          title="Environment variables"
          sub="Key=value pairs injected at runtime. Use ${VAR} to reference env-file values."
          action={
            <button
              type="button"
              className="add-pill"
              onClick={() => addListField("environment")}
            >
              + Add var
            </button>
          }
        />
        {service.environment.length === 0 ? (
          <div className="empty-row">No environment variables</div>
        ) : (
          <div className="env-list">
            {service.environment.map((env, idx) => {
              const keyErr = validateEnvVarKey(env.key);
              return (
              <div className="env-row" key={idx}>
                <input
                  className="input"
                  value={env.key}
                  onChange={(e) =>
                    updateListField("environment", idx, {
                      ...env,
                      key: e.target.value,
                    })
                  }
                  placeholder="KEY"
                  aria-label={`Env key ${idx + 1}`}
                  aria-invalid={keyErr ? true : undefined}
                  title={keyErr ?? undefined}
                />
                <span className="eq" aria-hidden>
                  =
                </span>
                <input
                  className="input"
                  value={env.value}
                  onChange={(e) =>
                    updateListField("environment", idx, {
                      ...env,
                      value: e.target.value,
                    })
                  }
                  placeholder="value or ${VAR}"
                  aria-label={`Env value ${idx + 1}`}
                />
                <button
                  type="button"
                  className="icon-trash"
                  onClick={() => removeListField("environment", idx)}
                  aria-label={`Remove env var ${idx + 1}`}
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

      <Field label="env_file" hint="Comma-separated list of .env files">
        <input
          className="input"
          value={service.env_file || ""}
          onChange={(e) => updateServiceField("env_file", e.target.value)}
          placeholder=".env, .env.production"
        />
      </Field>

      {/* Volumes */}
      <div>
        <SectionHead
          title="Volumes"
          sub="Bind paths and named volumes mounted into the container."
          action={
            <button
              type="button"
              className="add-pill"
              onClick={addVolumeField}
            >
              + Add volume
            </button>
          }
        />
        {service.volumes.length === 0 ? (
          <div className="empty-row">No volumes — click "Add volume"</div>
        ) : (
          <div className="port-list">
            <div className="port-head">
              <span>Source / host</span>
              <span aria-hidden />
              <span>Target / container</span>
              <span>RO</span>
              <span aria-hidden />
            </div>
            {service.volumes.map((v, idx) => (
              <div className="port-row" key={idx}>
                <input
                  className="input"
                  value={v.host}
                  onChange={(e) =>
                    updateVolumeField(idx, "host", e.target.value)
                  }
                  placeholder="./data or named-volume"
                />
                <span className="port-arrow" aria-hidden>
                  →
                </span>
                <input
                  className="input"
                  value={v.container}
                  onChange={(e) =>
                    updateVolumeField(idx, "container", e.target.value)
                  }
                  placeholder="/var/data"
                />
                <label className="check-row" title="Read-only">
                  <input
                    type="checkbox"
                    checked={!!v.read_only}
                    onChange={(e) =>
                      updateVolumeField(idx, "read_only", e.target.checked)
                    }
                  />
                </label>
                <button
                  type="button"
                  className="icon-trash"
                  onClick={() => removeVolumeField(idx)}
                  aria-label={`Remove volume ${idx + 1}`}
                  title="Remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Labels */}
      <div>
        <SectionHead
          title="Labels"
          sub="Compose / orchestrator metadata. Common: traefik.*, com.docker.*"
          action={
            <button
              type="button"
              className="add-pill"
              onClick={() => addListField("labels")}
            >
              + Add label
            </button>
          }
        />
        {(service.labels || []).length === 0 ? (
          <div className="empty-row">No labels</div>
        ) : (
          <div className="env-list">
            {(service.labels || []).map((label, idx) => (
              <div className="env-row" key={idx}>
                <input
                  className="input"
                  value={label.key}
                  onChange={(e) =>
                    updateListField("labels", idx, {
                      ...label,
                      key: e.target.value,
                    })
                  }
                  placeholder="traefik.enable"
                />
                <span className="eq" aria-hidden>
                  =
                </span>
                <input
                  className="input"
                  value={label.value}
                  onChange={(e) =>
                    updateListField("labels", idx, {
                      ...label,
                      value: e.target.value,
                    })
                  }
                  placeholder="true"
                />
                <button
                  type="button"
                  className="icon-trash"
                  onClick={() => removeListField("labels", idx)}
                  aria-label={`Remove label ${idx + 1}`}
                  title="Remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
