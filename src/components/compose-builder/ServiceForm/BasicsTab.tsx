import {
  validateContainerName,
  validateImage,
  validateServiceName,
  validateUser,
} from "../../../utils/validation";
import { useServiceFormApi } from "../service-form-api";
import { Field, ValidatedInput } from "./Field";

export function BasicsTab() {
  const { service, restartOptions, updateServiceField } = useServiceFormApi();

  return (
    <div className="svc-tab">
      <ValidatedInput
        label="Service Name"
        required
        value={service.name}
        onChange={(v) => updateServiceField("name", v)}
        validate={validateServiceName}
        placeholder="e.g. app, database, proxy"
      />

      <ValidatedInput
        label="Image"
        required
        value={service.image}
        onChange={(v) => updateServiceField("image", v)}
        validate={(v) => (v ? validateImage(v) : "Image is required")}
        placeholder="e.g. nginx:latest, mysql:8.0"
      />

      <ValidatedInput
        label="Container Name"
        hint="Optional — auto-generated if empty"
        value={service.container_name || ""}
        onChange={(v) => updateServiceField("container_name", v)}
        validate={validateContainerName}
        placeholder="my-app-container"
      />

      <div className="svc-grid-2">
        <Field label="Command">
          <input
            className="input"
            value={service.command}
            onChange={(e) => updateServiceField("command", e.target.value)}
            placeholder="npm start"
          />
        </Field>
        <Field label="Restart Policy">
          <div className="select">
            <select
              value={service.restart}
              onChange={(e) => updateServiceField("restart", e.target.value)}
            >
              {restartOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span className="select-chev" aria-hidden>
              ▾
            </span>
          </div>
        </Field>
      </div>

      <Field label="Entrypoint" hint="Overrides the image's default entrypoint">
        <input
          className="input"
          value={service.entrypoint || ""}
          onChange={(e) => updateServiceField("entrypoint", e.target.value)}
          placeholder='e.g. ["sh", "-c"]'
        />
      </Field>

      <div className="svc-grid-2">
        <Field label="Working Directory">
          <input
            className="input"
            value={service.working_dir || ""}
            onChange={(e) =>
              updateServiceField("working_dir", e.target.value)
            }
            placeholder="/app"
          />
        </Field>
        <ValidatedInput
          label="User"
          value={service.user || ""}
          onChange={(v) => updateServiceField("user", v)}
          validate={validateUser}
          placeholder="1000:1000"
        />
      </div>
    </div>
  );
}
