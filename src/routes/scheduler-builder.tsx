import { useCallback, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { SetupSidebar, type BuilderView } from "../components/SetupSidebar";
import { Field } from "../components/compose-builder/ServiceForm/Field";

export const Route = createFileRoute("/scheduler-builder")({
  component: SchedulerBuilderRoute,
});

type ScheduleType = "cron" | "github-actions" | "systemd-timer";

interface ScheduleConfig {
  type: ScheduleType;
  name: string;
  schedule: string;
  command: string;
  description?: string;
  enabled?: boolean;
  user?: string;
  workingDir?: string;
}

function SchedulerBuilderRoute() {
  const navigate = useNavigate();
  const [scheduleType, setScheduleType] = useState<ScheduleType>("cron");
  const [config, setConfig] = useState<ScheduleConfig>({
    type: "cron",
    name: "",
    schedule: "",
    command: "",
    description: "",
    enabled: true,
    user: "",
    workingDir: "",
  });
  const effectiveConfig: ScheduleConfig = { ...config, type: scheduleType };

  const generateCron = useCallback((cfg: ScheduleConfig): string => {
    const user = cfg.user || "root";
    const workingDir = cfg.workingDir ? `cd ${cfg.workingDir} && ` : "";
    const command = `${workingDir}${cfg.command}`;
    return `${cfg.schedule} ${user} ${command}`;
  }, []);

  const generateGitHubActions = useCallback((cfg: ScheduleConfig): string => {
    const cronSchedule = cfg.schedule.split(" ").slice(0, 5).join(" ");
    return `name: ${cfg.name || "Scheduled Task"}

on:
  schedule:
    - cron: '${cronSchedule}'

jobs:
  scheduled:
    runs-on: ubuntu-latest
    steps:
      - name: ${cfg.description || "Run command"}
        run: ${cfg.command}
`;
  }, []);

  const generateSystemdTimer = useCallback((cfg: ScheduleConfig): string => {
    const serviceName = (cfg.name || "task").replace(/[^a-zA-Z0-9]/g, "-");
    const timerName = `${serviceName}.timer`;
    const serviceFileName = `${serviceName}.service`;
    const cronParts = cfg.schedule.split(" ");
    let onCalendar: string;
    if (cronParts.length >= 5) {
      const [minute, hour, day, _month, weekday] = cronParts;
      if (weekday !== "*") {
        onCalendar = `OnCalendar=*-*-* ${hour}:${minute}:00`;
      } else {
        onCalendar = `OnCalendar=*-*-${day} ${hour}:${minute}:00`;
      }
    } else {
      onCalendar = `OnCalendar=${cfg.schedule}`;
    }

    const timerUnit = `[Unit]
Description=Timer for ${cfg.name}
Requires=${serviceFileName}

[Timer]
${onCalendar}
Persistent=true

[Install]
WantedBy=timers.target
`;

    const serviceUnit = `[Unit]
Description=${cfg.description || cfg.name}
After=network.target

[Service]
Type=oneshot
${cfg.user ? `User=${cfg.user}\n` : ""}${cfg.workingDir ? `WorkingDirectory=${cfg.workingDir}\n` : ""}ExecStart=/bin/bash -c '${cfg.command}'
`;

    return `# ${timerName}
${timerUnit}

# ${serviceFileName}
${serviceUnit}
`;
  }, []);

  const output = useMemo(() => {
    switch (scheduleType) {
      case "cron":
        return generateCron(effectiveConfig);
      case "github-actions":
        return generateGitHubActions(effectiveConfig);
      case "systemd-timer":
        return generateSystemdTimer(effectiveConfig);
      default:
        return "";
    }
  }, [
    scheduleType,
    effectiveConfig,
    generateCron,
    generateGitHubActions,
    generateSystemdTimer,
  ]);

  const filename = useMemo(() => {
    switch (scheduleType) {
      case "cron":
        return "crontab";
      case "github-actions":
        return ".github/workflows/schedule.yml";
      case "systemd-timer":
        return `${(config.name || "task").replace(/[^a-zA-Z0-9]/g, "-")}.timer`;
      default:
        return "schedule.txt";
    }
  }, [scheduleType, config.name]);

  const handleNav = (view: BuilderView) => {
    if (view === "compose") navigate({ to: "/docker/compose-builder" });
    else if (view === "config") navigate({ to: "/config-builder" });
    else if (view === "blueprint") navigate({ to: "/blueprint-builder" });
  };

  return (
    <div className="builder-shell builder-shell--three">
      <SetupSidebar view="scheduler" onNav={handleNav} />

      <section className="config-col">
        <div className="col-head">
          <h2 className="col-head-title">
            <span className="col-bar" aria-hidden />
            Schedule Type
          </h2>
        </div>

        <div className="config-tabs">
          <button
            type="button"
            className={
              "config-tab" + (scheduleType === "cron" ? " active" : "")
            }
            onClick={() => setScheduleType("cron")}
          >
            Cron
          </button>
          <button
            type="button"
            className={
              "config-tab" +
              (scheduleType === "github-actions" ? " active" : "")
            }
            onClick={() => setScheduleType("github-actions")}
          >
            GitHub Actions
          </button>
          <button
            type="button"
            className={
              "config-tab" +
              (scheduleType === "systemd-timer" ? " active" : "")
            }
            onClick={() => setScheduleType("systemd-timer")}
          >
            systemd
          </button>
        </div>

        <div className="config-tab-body">
          <div className="tab-content">
            <p className="tab-hint">
              {scheduleType === "cron" &&
                "Generate a /etc/cron.d-friendly line with optional user and working dir."}
              {scheduleType === "github-actions" &&
                "Emit a workflow file with a cron schedule trigger."}
              {scheduleType === "systemd-timer" &&
                "Produce a paired .timer + .service systemd unit."}
            </p>
            <div className="tab-empty">
              <h3 className="tab-empty-title">Schedule preview</h3>
              <p className="tab-empty-sub">
                {effectiveConfig.schedule || "(no cron set)"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Form column */}
      <section className="service-col">
        <div className="col-head">
          <h2 className="col-head-title">
            <span className="col-bar" aria-hidden />
            Task Configuration
          </h2>
        </div>
        <div className="svc-tab">
          <Field label="Name" required>
            <input
              className="input"
              value={config.name}
              onChange={(e) => setConfig({ ...config, name: e.target.value })}
              placeholder="nightly-backup"
            />
          </Field>

          <Field
            label="Schedule"
            hint='Cron format: "minute hour day month weekday" — e.g. "0 0 * * *"'
            required
          >
            <input
              className="input"
              value={config.schedule}
              onChange={(e) =>
                setConfig({ ...config, schedule: e.target.value })
              }
              placeholder="0 0 * * *"
            />
          </Field>

          <Field label="Command" required>
            <textarea
              className="input"
              rows={4}
              value={config.command}
              onChange={(e) =>
                setConfig({ ...config, command: e.target.value })
              }
              placeholder="/usr/local/bin/backup.sh"
            />
          </Field>

          <Field label="Description">
            <input
              className="input"
              value={config.description || ""}
              onChange={(e) =>
                setConfig({ ...config, description: e.target.value })
              }
              placeholder="What does this task do?"
            />
          </Field>

          {(scheduleType === "cron" || scheduleType === "systemd-timer") && (
            <div className="svc-grid-2">
              <Field label="User">
                <input
                  className="input"
                  value={config.user || ""}
                  onChange={(e) =>
                    setConfig({ ...config, user: e.target.value })
                  }
                  placeholder="root"
                />
              </Field>
              <Field label="Working directory">
                <input
                  className="input"
                  value={config.workingDir || ""}
                  onChange={(e) =>
                    setConfig({ ...config, workingDir: e.target.value })
                  }
                  placeholder="/srv/app"
                />
              </Field>
            </div>
          )}
        </div>
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
            {filename}
          </button>
        </div>
        <div className="code-window">
          <pre className="code-pre">
            <code>{output || "# Fill the form to generate output."}</code>
          </pre>
          <div className="code-statusbar">
            <span className="status-tag">
              <span className="status-dot ok" aria-hidden />
              Ready
            </span>
            <span className="status-mono">
              {output.split("\n").length} lines · UTF-8 · LF
            </span>
            <span className="status-mono right">{filename}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
