import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Toggle } from "../../components/ui/toggle";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "../../components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../../components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "../../components/ui/tooltip";
import { AlertCircle } from "lucide-react";
import type { ServiceConfig, Healthcheck } from "../../types/compose";

interface ServiceFormProps {
  service: ServiceConfig;
  restartOptions: Array<{ value: string; label: string }>;
  selectedIdx: number | null;
  services: ServiceConfig[];
  setServices: React.Dispatch<React.SetStateAction<ServiceConfig[]>>;
  updateServiceField: (field: keyof ServiceConfig, value: any) => void;
  updatePortField: (
    idx: number,
    field: "host" | "container" | "protocol",
    value: string
  ) => void;
  addPortField: () => void;
  removePortField: (idx: number) => void;
  updateListField: (
    field: keyof ServiceConfig,
    idx: number,
    value: any
  ) => void;
  addListField: (field: keyof ServiceConfig) => void;
  removeListField: (field: keyof ServiceConfig, idx: number) => void;
  updateVolumeField: (
    idx: number,
    field: "host" | "container" | "read_only",
    value: string | boolean
  ) => void;
  addVolumeField: () => void;
  removeVolumeField: (idx: number) => void;
  updateHealthcheckField: (field: keyof Healthcheck, value: string) => void;
  updateDependsOn: (idx: number, value: string) => void;
  addDependsOn: () => void;
  removeDependsOn: (idx: number) => void;
  updateResourceField: (
    type: "limits" | "reservations",
    field: "cpus" | "memory",
    value: string
  ) => void;
  updateSecurityOpt: (idx: number, value: string) => void;
  addSecurityOpt: () => void;
  removeSecurityOpt: (idx: number) => void;
  updateCapAdd: (idx: number, value: string) => void;
  addCapAdd: () => void;
  removeCapAdd: (idx: number) => void;
  updateCapDrop: (idx: number, value: string) => void;
  addCapDrop: () => void;
  removeCapDrop: (idx: number) => void;
  updateSysctl: (idx: number, field: "key" | "value", value: string) => void;
  addSysctl: () => void;
  removeSysctl: (idx: number) => void;
  updateDevice: (idx: number, value: string) => void;
  addDevice: () => void;
  removeDevice: (idx: number) => void;
  updateTmpfs: (idx: number, value: string) => void;
  addTmpfs: () => void;
  removeTmpfs: (idx: number) => void;
  updateUlimit: (
    idx: number,
    field: "name" | "soft" | "hard",
    value: string
  ) => void;
  addUlimit: () => void;
  removeUlimit: (idx: number) => void;
}

export function ServiceForm({
  service: svc,
  restartOptions,
  selectedIdx,
  services,
  setServices,
  updateServiceField,
  updatePortField,
  addPortField,
  removePortField,
  updateListField,
  addListField,
  removeListField,
  updateVolumeField,
  addVolumeField,
  removeVolumeField,
  updateHealthcheckField,
  updateDependsOn,
  addDependsOn,
  removeDependsOn,
  updateResourceField,
  updateSecurityOpt,
  addSecurityOpt,
  removeSecurityOpt,
  updateCapAdd,
  addCapAdd,
  removeCapAdd,
  updateCapDrop,
  addCapDrop,
  removeCapDrop,
  updateSysctl,
  addSysctl,
  removeSysctl,
  updateDevice,
  addDevice,
  removeDevice,
  updateTmpfs,
  addTmpfs,
  removeTmpfs,
  updateUlimit,
  addUlimit,
  removeUlimit,
}: ServiceFormProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-border/50">
        <div className="h-8 w-1 bg-primary rounded-full"></div>
        <h2 className="font-bold text-lg text-foreground">Service Configuration</h2>
      </div>

      {/* Basic Info Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground/90 flex items-center gap-2">
          <div className="h-4 w-0.5 bg-primary/50 rounded-full"></div>
          Basic Information
        </h3>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Service Name</Label>
          <Input
            value={svc.name}
            onChange={(e) => updateServiceField("name", e.target.value)}
            placeholder="e.g. app, database, proxy"
            className="shadow-sm"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Container Name</Label>
          <Input
            value={svc.container_name || ""}
            onChange={(e) =>
              updateServiceField("container_name", e.target.value)
            }
            placeholder="e.g. my-app-container"
            className="shadow-sm"
          />
          <p className="text-xs text-muted-foreground">Optional: Custom container name</p>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Image</Label>
          <Input
            value={svc.image}
            onChange={(e) => updateServiceField("image", e.target.value)}
            placeholder="e.g. nginx:latest, mysql:8.0"
            className="shadow-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Command</Label>
            <Input
              value={svc.command}
              onChange={(e) => updateServiceField("command", e.target.value)}
              placeholder="e.g. npm start"
              className="shadow-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Restart Policy</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between shadow-sm">
                  {restartOptions.find((opt) => opt.value === svc.restart)?.label ||
                    "None"}
                  <svg
                    className="ml-2"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full">
                {restartOptions.map((opt) => (
                  <DropdownMenuItem
                    key={opt.value}
                    onClick={() => updateServiceField("restart", opt.value)}
                  >
                    {opt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Networking Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground/90 flex items-center gap-2">
          <div className="h-4 w-0.5 bg-primary/50 rounded-full"></div>
          Networking
        </h3>
        {/* Ports */}
        <div>
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Port Mappings</Label>
            <Button size="sm" variant="outline" onClick={addPortField} className="h-7 text-xs">
              + Add Port
            </Button>
          </div>
          <div className="space-y-2">
            {svc.ports.length > 0 ? (
              svc.ports.map((port, idx) => (
                <div key={idx} className="flex gap-2 items-center p-2 bg-muted/30 rounded-md">
                <Input
                  type="number"
                  min="1"
                  max="65535"
                  value={port.host}
                  onChange={(e) => updatePortField(idx, "host", e.target.value)}
                  placeholder="Host"
                  className="flex-1 shadow-sm"
                />
                <span className="text-muted-foreground">→</span>
                <Input
                  type="number"
                  min="1"
                  max="65535"
                  value={port.container}
                  onChange={(e) =>
                    updatePortField(idx, "container", e.target.value)
                  }
                  placeholder="Container"
                  className="flex-1 shadow-sm"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-16 justify-between">
                      {port.protocol === "none" || !port.protocol
                        ? "none"
                        : port.protocol.toUpperCase()}
                      <svg
                        className="ml-1"
                        width="12"
                        height="12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={() => updatePortField(idx, "protocol", "none")}
                    >
                      None
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => updatePortField(idx, "protocol", "tcp")}
                    >
                      TCP
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => updatePortField(idx, "protocol", "udp")}
                    >
                      UDP
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removePortField(idx)}
                  className="h-8 w-8 hover:bg-destructive/20 hover:text-destructive"
                >
                  <svg
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </Button>
              </div>
              ))
            ) : (
              <div className="text-xs text-muted-foreground text-center py-4">
                No port mappings added
              </div>
            )}
          </div>
        </div>

        {/* Expose */}
        <div>
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Expose Ports</Label>
            <Button
              size="sm"
              variant="outline"
              onClick={() => addListField("expose")}
              className="h-7 text-xs"
            >
              + Add
            </Button>
          </div>
          <div className="space-y-2">
            {svc.expose && svc.expose.length > 0 ? (
              svc.expose.map((port, idx) => (
                <div key={idx} className="flex gap-2 items-center p-2 bg-muted/30 rounded-md">
                  <Input
                    type="number"
                    min="1"
                    max="65535"
                    value={port}
                    onChange={(e) =>
                      updateListField(
                        "expose",
                        idx,
                        e.target.value.replace(/[^0-9]/g, "")
                      )
                    }
                    placeholder="Port number"
                    className="flex-1 shadow-sm"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeListField("expose", idx)}
                    className="h-8 w-8 hover:bg-destructive/20 hover:text-destructive"
                  >
                    <svg
                      width="14"
                      height="14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-xs text-muted-foreground text-center py-4">
                No exposed ports
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Storage Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground/90 flex items-center gap-2">
          <div className="h-4 w-0.5 bg-primary/50 rounded-full"></div>
          Storage
        </h3>
        {/* Volumes */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label className="block">Volumes</Label>
            <div className="flex gap-2 items-center">
              <span className="text-xs text-muted-foreground">Syntax:</span>
              <Toggle
                pressed={svc.volumes_syntax === "array"}
                onPressedChange={(pressed) =>
                  updateServiceField(
                    "volumes_syntax",
                    pressed ? "array" : "dict"
                  )
                }
                aria-label="Array syntax"
                className="border rounded px-2 py-1 text-xs"
              >
                Array
              </Toggle>
              <Toggle
                pressed={svc.volumes_syntax === "dict"}
                onPressedChange={(pressed) =>
                  updateServiceField(
                    "volumes_syntax",
                    pressed ? "dict" : "array"
                  )
                }
                aria-label="Dictionary syntax"
                className="border rounded px-2 py-1 text-xs"
              >
                Dict
              </Toggle>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {svc.volumes.map((vol, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <Input
                  value={vol.host}
                  onChange={(e) =>
                    updateVolumeField(idx, "host", e.target.value)
                  }
                  placeholder="Host path/volume"
                  className="w-1/2"
                />
                <span>→</span>
                <Input
                  value={vol.container}
                  onChange={(e) =>
                    updateVolumeField(idx, "container", e.target.value)
                  }
                  placeholder="Container path"
                  className="w-1/2"
                />
                <div className="flex items-center gap-1">
                  <Toggle
                    pressed={vol.read_only || false}
                    onPressedChange={(v) =>
                      updateVolumeField(idx, "read_only", v)
                    }
                    aria-label="Read Only"
                    className="border rounded px-2 py-1"
                  >
                    <span className="select-none text-xs">RO</span>
                  </Toggle>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removeVolumeField(idx)}
                >
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </Button>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={addVolumeField}>
              + Add Volume
            </Button>
          </div>
        </div>
      </div>

      {/* Environment Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground/90 flex items-center gap-2">
          <div className="h-4 w-0.5 bg-primary/50 rounded-full"></div>
          Environment
        </h3>
        {/* Environment Variables */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Label className="block">Environment Variables</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-semibold mb-1">Privacy Notice</p>
                  <p>
                    All information you add here stays in your browser and is
                    never sent to any server. Click the × button on each line to
                    remove variables, or use "Clear All" to remove them all at
                    once.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-xs text-muted-foreground">Syntax:</span>
              <Toggle
                pressed={svc.environment_syntax === "array"}
                onPressedChange={(pressed) =>
                  updateServiceField(
                    "environment_syntax",
                    pressed ? "array" : "dict"
                  )
                }
                aria-label="Array syntax"
                className="border rounded px-2 py-1 text-xs"
              >
                Array
              </Toggle>
              <Toggle
                pressed={svc.environment_syntax === "dict"}
                onPressedChange={(pressed) =>
                  updateServiceField(
                    "environment_syntax",
                    pressed ? "dict" : "array"
                  )
                }
                aria-label="Dictionary syntax"
                className="border rounded px-2 py-1 text-xs"
              >
                Dict
              </Toggle>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {svc.environment.map((env, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <Input
                  value={env.key}
                  onChange={(e) =>
                    updateListField("environment", idx, {
                      ...env,
                      key: e.target.value,
                    })
                  }
                  placeholder="KEY"
                  className="w-1/2"
                />
                <Input
                  value={env.value}
                  onChange={(e) =>
                    updateListField("environment", idx, {
                      ...env,
                      value: e.target.value,
                    })
                  }
                  placeholder="value"
                  className="w-1/2"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removeListField("environment", idx)}
                  title="Remove this environment variable"
                >
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => addListField("environment")}
              >
                + Add Variable
              </Button>
              {svc.environment.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (typeof selectedIdx !== "number") return;
                    const newServices = [...services];
                    newServices[selectedIdx].environment = [];
                    setServices(newServices);
                  }}
                >
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Section */}
      <div className="space-y-4">
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between shadow-sm hover:shadow-md transition-all">
              <span className="flex items-center gap-2">
                <div className="h-4 w-0.5 bg-primary/50 rounded-full"></div>
                Advanced Options
              </span>
              <svg
                className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 flex flex-col gap-4">
            {/* Healthcheck */}
            <div>
              <Label className="mb-1 block">Healthcheck</Label>
              <Input
                value={svc.healthcheck?.test || ""}
                onChange={(e) =>
                  updateHealthcheckField("test", e.target.value)
                }
                placeholder="Test command (e.g. CMD curl -f http://localhost)"
              />
              <div className="flex gap-2 mt-2">
                <Input
                  value={svc.healthcheck?.interval || ""}
                  onChange={(e) =>
                    updateHealthcheckField("interval", e.target.value)
                  }
                  placeholder="Interval (e.g. 1m30s)"
                  className="w-1/2"
                />
                <Input
                  value={svc.healthcheck?.timeout || ""}
                  onChange={(e) =>
                    updateHealthcheckField("timeout", e.target.value)
                  }
                  placeholder="Timeout (e.g. 10s)"
                  className="w-1/2"
                />
              </div>
              <div className="flex gap-2 mt-2">
                <Input
                  value={svc.healthcheck?.retries || ""}
                  onChange={(e) =>
                    updateHealthcheckField("retries", e.target.value)
                  }
                  placeholder="Retries (e.g. 3)"
                  className="w-1/2"
                />
                <Input
                  value={svc.healthcheck?.start_period || ""}
                  onChange={(e) =>
                    updateHealthcheckField("start_period", e.target.value)
                  }
                  placeholder="Start period (e.g. 40s)"
                  className="w-1/2"
                />
              </div>
              <Input
                value={svc.healthcheck?.start_interval || ""}
                onChange={(e) =>
                  updateHealthcheckField("start_interval", e.target.value)
                }
                placeholder="Start interval (e.g. 5s)"
                className="mt-2"
              />
            </div>
            {/* Depends On */}
            <div>
              <Label className="mb-1 block">Depends On</Label>
              <div className="flex flex-col gap-2">
                {svc.depends_on?.map((dep, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Input
                      value={dep}
                      onChange={(e) => updateDependsOn(idx, e.target.value)}
                      placeholder="Service name"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeDependsOn(idx)}
                    >
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </Button>
                  </div>
                ))}
                <Button size="sm" variant="outline" onClick={addDependsOn}>
                  + Add Dependency
                </Button>
              </div>
            </div>
            {/* Resource Allocation */}
            <div>
              <Label className="mb-1 block">Resource Allocation</Label>
              <div className="space-y-4">
                <div>
                  <Label className="mb-1 block text-sm font-medium">Limits</Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label className="mb-1 block text-xs text-muted-foreground">
                        CPUs
                      </Label>
                      <Input
                        value={svc.deploy?.resources?.limits?.cpus || ""}
                        onChange={(e) =>
                          updateResourceField("limits", "cpus", e.target.value)
                        }
                        placeholder="e.g. 0.5 or 2"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="mb-1 block text-xs text-muted-foreground">
                        Memory
                      </Label>
                      <Input
                        value={
                          svc.deploy?.resources?.limits?.memory || ""
                        }
                        onChange={(e) =>
                          updateResourceField("limits", "memory", e.target.value)
                        }
                        placeholder="e.g. 512m or 2g"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="mb-1 block text-sm font-medium">
                    Reservations
                  </Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label className="mb-1 block text-xs text-muted-foreground">
                        CPUs
                      </Label>
                      <Input
                        value={
                          svc.deploy?.resources?.reservations?.cpus || ""
                        }
                        onChange={(e) =>
                          updateResourceField(
                            "reservations",
                            "cpus",
                            e.target.value
                          )
                        }
                        placeholder="e.g. 0.25 or 1"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="mb-1 block text-xs text-muted-foreground">
                        Memory
                      </Label>
                      <Input
                        value={
                          svc.deploy?.resources?.reservations?.memory || ""
                        }
                        onChange={(e) =>
                          updateResourceField(
                            "reservations",
                            "memory",
                            e.target.value
                          )
                        }
                        placeholder="e.g. 256m or 1g"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Entrypoint */}
            <div>
              <Label className="mb-1 block">Entrypoint</Label>
              <Input
                value={svc.entrypoint || ""}
                onChange={(e) =>
                  updateServiceField("entrypoint", e.target.value)
                }
                placeholder="Entrypoint"
              />
            </div>
            {/* Env File */}
            <div>
              <Label className="mb-1 block">Env File</Label>
              <Input
                value={svc.env_file || ""}
                onChange={(e) => updateServiceField("env_file", e.target.value)}
                placeholder=".env file path"
              />
            </div>
            {/* Extra Hosts */}
            <div>
              <Label className="mb-1 block">Extra Hosts</Label>
              <Input
                value={svc.extra_hosts?.join(",") || ""}
                onChange={(e) =>
                  updateServiceField("extra_hosts", e.target.value.split(","))
                }
                placeholder="host1:ip1,host2:ip2"
              />
            </div>
            {/* DNS */}
            <div>
              <Label className="mb-1 block">DNS</Label>
              <Input
                value={svc.dns?.join(",") || ""}
                onChange={(e) =>
                  updateServiceField("dns", e.target.value.split(","))
                }
                placeholder="8.8.8.8,8.8.4.4"
              />
            </div>
            {/* Networks */}
            <div>
              <Label className="mb-1 block">Networks</Label>
              <Input
                value={svc.networks?.join(",") || ""}
                onChange={(e) =>
                  updateServiceField("networks", e.target.value.split(","))
                }
                placeholder="network1,network2"
              />
            </div>
            {/* User */}
            <div>
              <Label className="mb-1 block">User</Label>
              <Input
                value={svc.user || ""}
                onChange={(e) => updateServiceField("user", e.target.value)}
                placeholder="user"
              />
            </div>
            {/* Working Dir */}
            <div>
              <Label className="mb-1 block">Working Dir</Label>
              <Input
                value={svc.working_dir || ""}
                onChange={(e) =>
                  updateServiceField("working_dir", e.target.value)
                }
                placeholder="/app"
              />
            </div>
            {/* Labels */}
            <div>
              <Label className="mb-1 block">Labels</Label>
              <div className="flex flex-col gap-2">
                {svc.labels?.map((label, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Input
                      value={label.key}
                      onChange={(e) => {
                        const newLabels = [...(svc.labels || [])];
                        newLabels[idx] = {
                          ...newLabels[idx],
                          key: e.target.value,
                        };
                        updateServiceField("labels", newLabels);
                      }}
                      placeholder="Key"
                      className="w-1/2"
                    />
                    <Input
                      value={label.value}
                      onChange={(e) => {
                        const newLabels = [...(svc.labels || [])];
                        newLabels[idx] = {
                          ...newLabels[idx],
                          value: e.target.value,
                        };
                        updateServiceField("labels", newLabels);
                      }}
                      placeholder="Value"
                      className="w-1/2"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        const newLabels = [...(svc.labels || [])];
                        newLabels.splice(idx, 1);
                        updateServiceField("labels", newLabels);
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </Button>
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    updateServiceField("labels", [
                      ...(svc.labels || []),
                      { key: "", value: "" },
                    ])
                  }
                >
                  + Add Label
                </Button>
              </div>
            </div>
            {/* Privileged */}
            <div className="flex items-center gap-2">
              <Toggle
                pressed={!!svc.privileged}
                onPressedChange={(v) => updateServiceField("privileged", v)}
                aria-label="Privileged"
                className="border rounded px-2 py-1"
              >
                <span className="select-none">Privileged</span>
              </Toggle>
            </div>
            {/* Read Only */}
            <div className="flex items-center gap-2">
              <Toggle
                pressed={!!svc.read_only}
                onPressedChange={(v) => updateServiceField("read_only", v)}
                aria-label="Read Only"
                className="border rounded px-2 py-1"
              >
                <span className="select-none">Read Only</span>
              </Toggle>
            </div>
            {/* Shared Memory Size */}
            <div>
              <Label className="mb-1 block">Shared Memory Size</Label>
              <Input
                value={svc.shm_size || ""}
                onChange={(e) => updateServiceField("shm_size", e.target.value)}
                placeholder="e.g. 1gb, 512m"
              />
            </div>
            {/* Security Options */}
            <div>
              <Label className="mb-1 block">Security Options</Label>
              <div className="flex flex-col gap-2">
                {svc.security_opt?.map((opt, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Input
                      value={opt}
                      onChange={(e) => updateSecurityOpt(idx, e.target.value)}
                      placeholder="e.g. seccomp:unconfined"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeSecurityOpt(idx)}
                    >
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </Button>
                  </div>
                ))}
                <Button size="sm" variant="outline" onClick={addSecurityOpt}>
                  + Add Security Option
                </Button>
              </div>
            </div>
            {/* Network Mode */}
            <div>
              <Label className="mb-1 block">Network Mode</Label>
              <Input
                value={svc.network_mode || ""}
                onChange={(e) =>
                  updateServiceField("network_mode", e.target.value)
                }
                placeholder="e.g. host, bridge, none, service:name"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Options: host, bridge, none, service:service_name
              </p>
            </div>
            {/* Cap Add */}
            <div>
              <Label className="mb-1 block">Add Capabilities</Label>
              <div className="flex flex-col gap-2">
                {svc.cap_add?.map((cap, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Input
                      value={cap}
                      onChange={(e) => updateCapAdd(idx, e.target.value)}
                      placeholder="e.g. NET_ADMIN, SYS_MODULE"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeCapAdd(idx)}
                    >
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </Button>
                  </div>
                ))}
                <Button size="sm" variant="outline" onClick={addCapAdd}>
                  + Add Capability
                </Button>
              </div>
            </div>
            {/* Cap Drop */}
            <div>
              <Label className="mb-1 block">Drop Capabilities</Label>
              <div className="flex flex-col gap-2">
                {svc.cap_drop?.map((cap, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Input
                      value={cap}
                      onChange={(e) => updateCapDrop(idx, e.target.value)}
                      placeholder="e.g. ALL, CHOWN"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeCapDrop(idx)}
                    >
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </Button>
                  </div>
                ))}
                <Button size="sm" variant="outline" onClick={addCapDrop}>
                  + Drop Capability
                </Button>
              </div>
            </div>
            {/* Sysctls */}
            <div>
              <Label className="mb-1 block">Sysctls</Label>
              <div className="flex flex-col gap-2">
                {svc.sysctls?.map((sysctl, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Input
                      value={sysctl.key}
                      onChange={(e) =>
                        updateSysctl(idx, "key", e.target.value)
                      }
                      placeholder="Key (e.g. net.ipv4.ip_forward)"
                      className="w-1/2"
                    />
                    <Input
                      value={sysctl.value}
                      onChange={(e) =>
                        updateSysctl(idx, "value", e.target.value)
                      }
                      placeholder="Value (e.g. 1)"
                      className="w-1/2"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeSysctl(idx)}
                    >
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </Button>
                  </div>
                ))}
                <Button size="sm" variant="outline" onClick={addSysctl}>
                  + Add Sysctl
                </Button>
              </div>
            </div>
            {/* Devices */}
            <div>
              <Label className="mb-1 block">Devices</Label>
              <div className="flex flex-col gap-2">
                {svc.devices?.map((device, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Input
                      value={device}
                      onChange={(e) => updateDevice(idx, e.target.value)}
                      placeholder="e.g. /dev/ttyUSB0:/dev/ttyUSB0"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeDevice(idx)}
                    >
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </Button>
                  </div>
                ))}
                <Button size="sm" variant="outline" onClick={addDevice}>
                  + Add Device
                </Button>
              </div>
            </div>
            {/* Tmpfs */}
            <div>
              <Label className="mb-1 block">Tmpfs</Label>
              <div className="flex flex-col gap-2">
                {svc.tmpfs?.map((tmpfs, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Input
                      value={tmpfs}
                      onChange={(e) => updateTmpfs(idx, e.target.value)}
                      placeholder="e.g. /tmp:rw,noexec,nosuid,size=100m"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeTmpfs(idx)}
                    >
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </Button>
                  </div>
                ))}
                <Button size="sm" variant="outline" onClick={addTmpfs}>
                  + Add Tmpfs
                </Button>
              </div>
            </div>
            {/* Ulimits */}
            <div>
              <Label className="mb-1 block">Ulimits</Label>
              <div className="flex flex-col gap-2">
                {svc.ulimits?.map((ulimit, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Input
                      value={ulimit.name}
                      onChange={(e) =>
                        updateUlimit(idx, "name", e.target.value)
                      }
                      placeholder="Name (e.g. nofile)"
                      className="w-1/3"
                    />
                    <Input
                      value={ulimit.soft || ""}
                      onChange={(e) =>
                        updateUlimit(idx, "soft", e.target.value)
                      }
                      placeholder="Soft limit"
                      className="w-1/3"
                    />
                    <Input
                      value={ulimit.hard || ""}
                      onChange={(e) =>
                        updateUlimit(idx, "hard", e.target.value)
                      }
                      placeholder="Hard limit"
                      className="w-1/3"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeUlimit(idx)}
                    >
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </Button>
                  </div>
                ))}
                <Button size="sm" variant="outline" onClick={addUlimit}>
                  + Add Ulimit
                </Button>
              </div>
            </div>
            {/* Init */}
            <div className="flex items-center gap-2">
              <Toggle
                pressed={!!svc.init}
                onPressedChange={(v) => updateServiceField("init", v)}
                aria-label="Init"
                className="border rounded px-2 py-1"
              >
                <span className="select-none">Init (PID 1)</span>
              </Toggle>
            </div>
            {/* Stop Grace Period */}
            <div>
              <Label className="mb-1 block">Stop Grace Period</Label>
              <Input
                value={svc.stop_grace_period || ""}
                onChange={(e) =>
                  updateServiceField("stop_grace_period", e.target.value)
                }
                placeholder="e.g. 10s, 1m30s"
              />
            </div>
            {/* Stop Signal */}
            <div>
              <Label className="mb-1 block">Stop Signal</Label>
              <Input
                value={svc.stop_signal || ""}
                onChange={(e) =>
                  updateServiceField("stop_signal", e.target.value)
                }
                placeholder="e.g. SIGTERM, SIGKILL"
              />
            </div>
            {/* TTY */}
            <div className="flex items-center gap-2">
              <Toggle
                pressed={!!svc.tty}
                onPressedChange={(v) => updateServiceField("tty", v)}
                aria-label="TTY"
                className="border rounded px-2 py-1"
              >
                <span className="select-none">TTY</span>
              </Toggle>
            </div>
            {/* Stdin Open */}
            <div className="flex items-center gap-2">
              <Toggle
                pressed={!!svc.stdin_open}
                onPressedChange={(v) => updateServiceField("stdin_open", v)}
                aria-label="Stdin Open"
                className="border rounded px-2 py-1"
              >
                <span className="select-none">Stdin Open</span>
              </Toggle>
            </div>
            {/* Hostname */}
            <div>
              <Label className="mb-1 block">Hostname</Label>
              <Input
                value={svc.hostname || ""}
                onChange={(e) => updateServiceField("hostname", e.target.value)}
                placeholder="Container hostname"
              />
            </div>
            {/* Domainname */}
            <div>
              <Label className="mb-1 block">Domainname</Label>
              <Input
                value={svc.domainname || ""}
                onChange={(e) =>
                  updateServiceField("domainname", e.target.value)
                }
                placeholder="Container domainname"
              />
            </div>
            {/* MAC Address */}
            <div>
              <Label className="mb-1 block">MAC Address</Label>
              <Input
                value={svc.mac_address || ""}
                onChange={(e) =>
                  updateServiceField("mac_address", e.target.value)
                }
                placeholder="e.g. 02:42:ac:11:65:43"
              />
            </div>
            {/* IPC Mode */}
            <div>
              <Label className="mb-1 block">IPC Mode</Label>
              <Input
                value={svc.ipc_mode || ""}
                onChange={(e) => updateServiceField("ipc_mode", e.target.value)}
                placeholder="e.g. host, container:name, shareable"
              />
            </div>
            {/* PID */}
            <div>
              <Label className="mb-1 block">PID</Label>
              <Input
                value={svc.pid || ""}
                onChange={(e) => updateServiceField("pid", e.target.value)}
                placeholder="e.g. host, container:name"
              />
            </div>
            {/* UTS */}
            <div>
              <Label className="mb-1 block">UTS</Label>
              <Input
                value={svc.uts || ""}
                onChange={(e) => updateServiceField("uts", e.target.value)}
                placeholder="e.g. host, container:name"
              />
            </div>
            {/* Cgroup Parent */}
            <div>
              <Label className="mb-1 block">Cgroup Parent</Label>
              <Input
                value={svc.cgroup_parent || ""}
                onChange={(e) =>
                  updateServiceField("cgroup_parent", e.target.value)
                }
                placeholder="e.g. /system.slice"
              />
            </div>
            {/* Isolation */}
            <div>
              <Label className="mb-1 block">Isolation</Label>
              <Input
                value={svc.isolation || ""}
                onChange={(e) =>
                  updateServiceField("isolation", e.target.value)
                }
                placeholder="e.g. default, process, hyperv"
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}

