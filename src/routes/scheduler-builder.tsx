import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CodeEditor } from "../components/CodeEditor";
import { SidebarUI } from "../components/SidebarUI";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarTrigger,
} from "../components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../components/ui/dropdown-menu";
import { Textarea } from "../components/ui/textarea";
import { Download, Copy, Settings } from "lucide-react";

export const Route = createFileRoute("/scheduler-builder")({
  component: App,
});

interface ScheduleConfig {
  type: "cron" | "github-actions" | "systemd-timer";
  name: string;
  schedule: string;
  command: string;
  description?: string;
  enabled?: boolean;
  user?: string;
  workingDir?: string;
}

function App() {
  const [scheduleType, setScheduleType] = useState<"cron" | "github-actions" | "systemd-timer">("cron");
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
  const [output, setOutput] = useState("");

  function generateCron(config: ScheduleConfig): string {
    const user = config.user || "root";
    const workingDir = config.workingDir ? `cd ${config.workingDir} && ` : "";
    const command = `${workingDir}${config.command}`;
    return `${config.schedule} ${user} ${command}`;
  }

  function generateGitHubActions(config: ScheduleConfig): string {
    const cronSchedule = config.schedule.split(" ").slice(0, 5).join(" ");
    return `name: ${config.name || "Scheduled Task"}

on:
  schedule:
    - cron: '${cronSchedule}'

jobs:
  scheduled:
    runs-on: ubuntu-latest
    steps:
      - name: Run scheduled task
        run: |
          ${config.command}
`;
  }

  function generateSystemdTimer(config: ScheduleConfig): string {
    const serviceName = config.name.replace(/[^a-zA-Z0-9]/g, "-");
    const timerName = `${serviceName}.timer`;
    const serviceFileName = `${serviceName}.service`;

    // Parse cron schedule to OnCalendar format
    const cronParts = config.schedule.split(" ");
    let onCalendar = "";
    if (cronParts.length >= 5) {
      const [minute, hour, day, month, weekday] = cronParts;
      onCalendar = `OnCalendar=`;
      if (weekday !== "*") {
        onCalendar += `*-*-* ${hour}:${minute}:00`;
      } else {
        onCalendar += `*-*-${day} ${hour}:${minute}:00`;
      }
    } else {
      onCalendar = `OnCalendar=${config.schedule}`;
    }

    const timerUnit = `[Unit]
Description=Timer for ${config.name}
Requires=${serviceFileName}

[Timer]
${onCalendar}
Persistent=true

[Install]
WantedBy=timers.target
`;

    const serviceUnit = `[Unit]
Description=${config.description || config.name}
After=network.target

[Service]
Type=oneshot
${config.user ? `User=${config.user}\n` : ""}${config.workingDir ? `WorkingDirectory=${config.workingDir}\n` : ""}ExecStart=/bin/bash -c '${config.command}'
`;

    return `# ${timerName}
${timerUnit}

# ${serviceFileName}
${serviceUnit}

# Installation:
# 1. Save ${timerName} to /etc/systemd/system/
# 2. Save ${serviceFileName} to /etc/systemd/system/
# 3. Run: sudo systemctl daemon-reload
# 4. Run: sudo systemctl enable --now ${timerName}
`;
  }

  function updateOutput() {
    let result = "";
    switch (scheduleType) {
      case "cron":
        result = generateCron(config);
        break;
      case "github-actions":
        result = generateGitHubActions(config);
        break;
      case "systemd-timer":
        result = generateSystemdTimer(config);
        break;
    }
    setOutput(result);
  }

  useEffect(() => {
    setConfig((prev) => ({ ...prev, type: scheduleType }));
    updateOutput();
  }, [scheduleType]);

  useEffect(() => {
    updateOutput();
  }, [config]);

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  function downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function getFilename(): string {
    switch (scheduleType) {
      case "cron":
        return "crontab.txt";
      case "github-actions":
        return ".github/workflows/schedule.yml";
      case "systemd-timer":
        return `${config.name.replace(/[^a-zA-Z0-9]/g, "-")}.timer`;
      default:
        return "schedule.txt";
    }
  }

  return (
    <SidebarProvider>
        <Sidebar>
          <SidebarUI />
        </Sidebar>
        <SidebarInset>
          <div className="flex items-center gap-2 p-2 border-b">
            <SidebarTrigger />
            <h1 className="text-xl font-bold">Scheduler Builder</h1>
          </div>
          <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="mb-4">
                <Label className="mb-2 block">Scheduler Type</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full">
                      {scheduleType === "cron" && "Cron"}
                      {scheduleType === "github-actions" && "GitHub Actions"}
                      {scheduleType === "systemd-timer" && "Systemd Timer"}
                      <Settings className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setScheduleType("cron")}>
                      Cron
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setScheduleType("github-actions")}>
                      GitHub Actions
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setScheduleType("systemd-timer")}>
                      Systemd Timer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Separator className="my-4" />

              <div className="space-y-4">
                <div>
                  <Label className="mb-1 block">Name</Label>
                  <Input
                    value={config.name}
                    onChange={(e) =>
                      setConfig({ ...config, name: e.target.value })
                    }
                    placeholder="Task name"
                  />
                </div>

                <div>
                  <Label className="mb-1 block">
                    Schedule {scheduleType === "cron" && "(Cron format: minute hour day month weekday)"}
                    {scheduleType === "github-actions" && "(Cron format: minute hour day month weekday)"}
                    {scheduleType === "systemd-timer" && "(Cron format or systemd OnCalendar)"}
                  </Label>
                  <Input
                    value={config.schedule}
                    onChange={(e) =>
                      setConfig({ ...config, schedule: e.target.value })
                    }
                    placeholder={
                      scheduleType === "cron" || scheduleType === "github-actions"
                        ? "0 0 * * * (daily at midnight)"
                        : "0 0 * * * or *-*-* 00:00:00"
                    }
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Examples: "0 0 * * *" (daily), "0 */6 * * *" (every 6 hours), "0 0 1 * *" (monthly)
                  </div>
                </div>

                <div>
                  <Label className="mb-1 block">Command</Label>
                  <Textarea
                    value={config.command}
                    onChange={(e) =>
                      setConfig({ ...config, command: e.target.value })
                    }
                    placeholder="Command to execute"
                    className="font-mono"
                    rows={4}
                  />
                </div>

                <div>
                  <Label className="mb-1 block">Description (optional)</Label>
                  <Input
                    value={config.description || ""}
                    onChange={(e) =>
                      setConfig({ ...config, description: e.target.value })
                    }
                    placeholder="Task description"
                  />
                </div>

                {scheduleType === "cron" && (
                  <>
                    <div>
                      <Label className="mb-1 block">User (optional)</Label>
                      <Input
                        value={config.user || ""}
                        onChange={(e) =>
                          setConfig({ ...config, user: e.target.value })
                        }
                        placeholder="root"
                      />
                    </div>
                    <div>
                      <Label className="mb-1 block">Working Directory (optional)</Label>
                      <Input
                        value={config.workingDir || ""}
                        onChange={(e) =>
                          setConfig({ ...config, workingDir: e.target.value })
                        }
                        placeholder="/path/to/directory"
                      />
                    </div>
                  </>
                )}

                {scheduleType === "systemd-timer" && (
                  <>
                    <div>
                      <Label className="mb-1 block">User (optional)</Label>
                      <Input
                        value={config.user || ""}
                        onChange={(e) =>
                          setConfig({ ...config, user: e.target.value })
                        }
                        placeholder="root"
                      />
                    </div>
                    <div>
                      <Label className="mb-1 block">Working Directory (optional)</Label>
                      <Input
                        value={config.workingDir || ""}
                        onChange={(e) =>
                          setConfig({ ...config, workingDir: e.target.value })
                        }
                        placeholder="/path/to/directory"
                      />
                    </div>
                  </>
                )}
              </div>
            </Card>

            <Card className="p-4">
              <div className="mb-4 flex items-center justify-between">
                <Label className="text-lg font-bold">Generated Schedule</Label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(output)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      downloadFile(
                        output,
                        getFilename(),
                        scheduleType === "github-actions" ? "text/yaml" : "text/plain"
                      )
                    }
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
              <CodeEditor
                content={output}
                onContentChange={(content) => setOutput(content)}
                width={600}
                height={600}
              />
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
  );
}

