import {
  validateCpuValue,
  validateDuration,
  validateMemoryValue,
  validateStopSignal,
} from "../../../utils/validation";
import { useServiceFormApi } from "../service-form-api";
import { Field, SectionHead, ValidatedInput } from "./Field";

function validateRetries(value: string): string | null {
  if (!value) return null;
  if (!/^\d+$/.test(value)) return "Retries must be a non-negative integer";
  return null;
}

export function HealthTab() {
  const {
    service,
    updateServiceField,
    updateHealthcheckField,
    updateResourceField,
  } = useServiceFormApi();

  const hc = service.healthcheck || {
    test: "",
    interval: "",
    timeout: "",
    retries: "",
    start_period: "",
    start_interval: "",
  };

  const limits = service.deploy?.resources?.limits || {};
  const reservations = service.deploy?.resources?.reservations || {};

  return (
    <div className="svc-tab">
      {/* Healthcheck */}
      <div>
        <SectionHead
          title="Healthcheck"
          sub="Tells Docker how to verify the service is alive."
        />

        <Field label="Test command" hint='e.g. CMD curl -f http://localhost:8080/health || exit 1'>
          <input
            className="input"
            value={hc.test}
            onChange={(e) => updateHealthcheckField("test", e.target.value)}
            placeholder='CMD curl -f http://localhost:8080/health'
          />
        </Field>

        <div className="svc-grid-2">
          <ValidatedInput
            label="Interval"
            value={hc.interval}
            onChange={(v) => updateHealthcheckField("interval", v)}
            validate={validateDuration}
            placeholder="30s"
          />
          <ValidatedInput
            label="Timeout"
            value={hc.timeout}
            onChange={(v) => updateHealthcheckField("timeout", v)}
            validate={validateDuration}
            placeholder="5s"
          />
        </div>
        <div className="svc-grid-3">
          <ValidatedInput
            label="Retries"
            value={hc.retries}
            onChange={(v) => updateHealthcheckField("retries", v)}
            validate={validateRetries}
            placeholder="3"
          />
          <ValidatedInput
            label="Start period"
            value={hc.start_period}
            onChange={(v) => updateHealthcheckField("start_period", v)}
            validate={validateDuration}
            placeholder="10s"
          />
          <ValidatedInput
            label="Start interval"
            value={hc.start_interval}
            onChange={(v) => updateHealthcheckField("start_interval", v)}
            validate={validateDuration}
            placeholder="5s"
          />
        </div>
      </div>

      {/* Resources */}
      <div>
        <SectionHead
          title="Resources"
          sub="deploy.resources — CPU and memory limits / reservations."
        />
        <div className="svc-grid-2">
          <ValidatedInput
            label="CPU limit"
            value={limits.cpus || ""}
            onChange={(v) => updateResourceField("limits", "cpus", v)}
            validate={validateCpuValue}
            placeholder="1.0"
          />
          <ValidatedInput
            label="Memory limit"
            value={limits.memory || ""}
            onChange={(v) => updateResourceField("limits", "memory", v)}
            validate={validateMemoryValue}
            placeholder="512m"
          />
        </div>
        <div className="svc-grid-2">
          <ValidatedInput
            label="CPU reservation"
            value={reservations.cpus || ""}
            onChange={(v) => updateResourceField("reservations", "cpus", v)}
            validate={validateCpuValue}
            placeholder="0.25"
          />
          <ValidatedInput
            label="Memory reservation"
            value={reservations.memory || ""}
            onChange={(v) => updateResourceField("reservations", "memory", v)}
            validate={validateMemoryValue}
            placeholder="128m"
          />
        </div>
      </div>

      {/* Lifecycle */}
      <div>
        <SectionHead
          title="Lifecycle"
          sub="How the container starts, stops, and behaves under load."
        />
        <div className="svc-grid-2">
          <ValidatedInput
            label="Stop grace period"
            value={service.stop_grace_period || ""}
            onChange={(v) => updateServiceField("stop_grace_period", v)}
            validate={validateDuration}
            placeholder="10s"
          />
          <ValidatedInput
            label="Stop signal"
            value={service.stop_signal || ""}
            onChange={(v) => updateServiceField("stop_signal", v)}
            validate={validateStopSignal}
            placeholder="SIGTERM"
          />
        </div>
        <div className="svc-grid-3">
          <Field label="Privileged">
            <ToggleBoolean
              value={service.privileged}
              onChange={(v) => updateServiceField("privileged", v)}
              label="Run privileged"
            />
          </Field>
          <Field label="Read-only">
            <ToggleBoolean
              value={service.read_only}
              onChange={(v) => updateServiceField("read_only", v)}
              label="Read-only filesystem"
            />
          </Field>
          <Field label="Init">
            <ToggleBoolean
              value={service.init}
              onChange={(v) => updateServiceField("init", v)}
              label="Run init"
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

function ToggleBoolean({
  value,
  onChange,
  label,
}: {
  value: boolean | undefined;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="switch" title={label}>
      <input
        type="checkbox"
        checked={!!value}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={label}
      />
      <span className="switch-track">
        <span className="switch-thumb" />
      </span>
    </label>
  );
}
