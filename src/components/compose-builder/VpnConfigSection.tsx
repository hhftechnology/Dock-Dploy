import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { Checkbox } from "../ui/checkbox";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "../ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Alert, AlertTitle, AlertDescription } from "../ui/alert";
import { Shield, ChevronDown, ChevronRight, AlertCircle } from "lucide-react";
import type { VPNConfig } from "../../types/vpn-configs";
import type { ServiceConfig, NetworkConfig } from "../../types/compose";

interface VpnConfigSectionProps {
  vpnConfig: VPNConfig;
  vpnConfigOpen: boolean;
  setVpnConfigOpen: (open: boolean) => void;
                updateVpnType: (type: VPNConfig["type"] | null) => void;
  updateTailscaleConfig: (updates: Partial<VPNConfig["tailscale"]>) => void;
  updateNewtConfig: (updates: Partial<VPNConfig["newt"]>) => void;
  updateCloudflaredConfig: (updates: Partial<VPNConfig["cloudflared"]>) => void;
  updateWireguardConfig: (updates: Partial<VPNConfig["wireguard"]>) => void;
  updateZerotierConfig: (updates: Partial<VPNConfig["zerotier"]>) => void;
  updateNetbirdConfig: (updates: Partial<VPNConfig["netbird"]>) => void;
  updateServicesUsingVpn: (services: string[]) => void;
  updateVpnNetworks: (networks: string[]) => void;
  services: ServiceConfig[];
  networks: NetworkConfig[];
}

export function VpnConfigSection({
  vpnConfig,
  vpnConfigOpen,
  setVpnConfigOpen,
  updateVpnType,
  updateTailscaleConfig,
  updateNewtConfig,
  updateCloudflaredConfig,
  updateWireguardConfig,
  updateZerotierConfig,
  updateNetbirdConfig,
  updateServicesUsingVpn,
  updateVpnNetworks,
  services,
  networks,
}: VpnConfigSectionProps) {
  return (
    <>
      <Collapsible open={vpnConfigOpen} onOpenChange={setVpnConfigOpen}>
        <div className="flex items-center justify-between mb-2 w-full box-border">
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              className="font-bold text-md w-full justify-between"
            >
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>VPN Configuration</span>
              </div>
              {vpnConfigOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <div className="flex flex-col gap-3 w-full box-border">
            <div>
              <Label className="mb-1 block text-sm">VPN Type</Label>
              <Select
                value={vpnConfig?.type || "none"}
                onValueChange={(value) => {
                  updateVpnType(value === "none" ? null : (value as VPNConfig["type"]));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select VPN type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="tailscale">Tailscale</SelectItem>
                  <SelectItem value="newt">Newt</SelectItem>
                  <SelectItem value="cloudflared">Cloudflared</SelectItem>
                  <SelectItem value="wireguard">Wireguard</SelectItem>
                  <SelectItem value="zerotier">ZeroTier</SelectItem>
                  <SelectItem value="netbird">Netbird</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {vpnConfig &&
              vpnConfig.enabled &&
              vpnConfig.type === "tailscale" &&
              vpnConfig.tailscale && (
                <div className="flex flex-col gap-3">
                  <div>
                    <Label className="mb-1 block text-sm">Auth Key</Label>
                    <Input
                      value={vpnConfig.tailscale.authKey}
                      onChange={(e) =>
                        updateTailscaleConfig({ authKey: e.target.value })
                      }
                      placeholder="${TS_AUTHKEY}"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Get from Tailscale admin console
                    </p>
                  </div>
                  <div>
                    <Label className="mb-1 block text-sm">Hostname</Label>
                    <Input
                      value={vpnConfig.tailscale.hostname}
                      onChange={(e) =>
                        updateTailscaleConfig({ hostname: e.target.value })
                      }
                      placeholder="my-service"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={vpnConfig.tailscale.acceptDns}
                      onCheckedChange={(checked) =>
                        updateTailscaleConfig({ acceptDns: checked === true })
                      }
                    />
                    <Label
                      className="text-sm cursor-pointer"
                      onClick={() => {
                        if (!vpnConfig.tailscale) return;
                        updateTailscaleConfig({
                          acceptDns: !vpnConfig.tailscale.acceptDns,
                        });
                      }}
                    >
                      Accept DNS
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={vpnConfig.tailscale.authOnce}
                      onCheckedChange={(checked) =>
                        updateTailscaleConfig({ authOnce: checked === true })
                      }
                    />
                    <Label
                      className="text-sm cursor-pointer"
                      onClick={() => {
                        if (!vpnConfig.tailscale) return;
                        updateTailscaleConfig({
                          authOnce: !vpnConfig.tailscale.authOnce,
                        });
                      }}
                    >
                      Auth Once
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={vpnConfig.tailscale.userspace}
                      onCheckedChange={(checked) =>
                        updateTailscaleConfig({ userspace: checked === true })
                      }
                    />
                    <Label
                      className="text-sm cursor-pointer"
                      onClick={() => {
                        if (!vpnConfig.tailscale) return;
                        updateTailscaleConfig({
                          userspace: !vpnConfig.tailscale.userspace,
                        });
                      }}
                    >
                      Userspace
                    </Label>
                  </div>
                  <div>
                    <Label className="mb-1 block text-sm">
                      Exit Node (optional)
                    </Label>
                    <Input
                      value={vpnConfig.tailscale.exitNode}
                      onChange={(e) =>
                        updateTailscaleConfig({ exitNode: e.target.value })
                      }
                      placeholder="Exit node IP or hostname"
                    />
                  </div>
                  {vpnConfig.tailscale.exitNode && (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={vpnConfig.tailscale.exitNodeAllowLan}
                        onCheckedChange={(checked) =>
                          updateTailscaleConfig({
                            exitNodeAllowLan: checked === true,
                          })
                        }
                      />
                      <Label
                        className="text-sm cursor-pointer"
                        onClick={() => {
                          if (!vpnConfig.tailscale) return;
                          updateTailscaleConfig({
                            exitNodeAllowLan:
                              !vpnConfig.tailscale.exitNodeAllowLan,
                          });
                        }}
                      >
                        Allow LAN Access
                      </Label>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={vpnConfig.tailscale.enableServe}
                      onCheckedChange={(checked) =>
                        updateTailscaleConfig({ enableServe: checked === true })
                      }
                    />
                    <Label
                      className="text-sm cursor-pointer"
                      onClick={() => {
                        if (!vpnConfig.tailscale) return;
                        updateTailscaleConfig({
                          enableServe: !vpnConfig.tailscale.enableServe,
                        });
                      }}
                    >
                      Enable Serve (TCP/HTTPS)
                    </Label>
                  </div>
                  {vpnConfig.tailscale.enableServe && (
                    <div className="flex flex-col gap-3 pl-4 border-l-2">
                      <div>
                        <Label className="mb-1 block text-sm">
                          Target Service
                        </Label>
                        <Select
                          value={vpnConfig.tailscale.serveTargetService}
                          onValueChange={(value) =>
                            updateTailscaleConfig({
                              serveTargetService: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select service..." />
                          </SelectTrigger>
                          <SelectContent>
                            {services
                              .filter((s) => s.name)
                              .map((s) => (
                                <SelectItem key={s.name} value={s.name}>
                                  {s.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="mb-1 block text-sm">
                          External Port
                        </Label>
                        <Input
                          value={vpnConfig.tailscale.serveExternalPort}
                          onChange={(e) =>
                            updateTailscaleConfig({
                              serveExternalPort: e.target.value,
                            })
                          }
                          placeholder="443"
                        />
                      </div>
                      <div>
                        <Label className="mb-1 block text-sm">
                          Internal Port
                        </Label>
                        <Input
                          value={vpnConfig.tailscale.serveInternalPort}
                          onChange={(e) =>
                            updateTailscaleConfig({
                              serveInternalPort: e.target.value,
                            })
                          }
                          placeholder="8080"
                        />
                      </div>
                      <div>
                        <Label className="mb-1 block text-sm">Path</Label>
                        <Input
                          value={vpnConfig.tailscale.servePath}
                          onChange={(e) =>
                            updateTailscaleConfig({
                              servePath: e.target.value,
                            })
                          }
                          placeholder="/"
                        />
                      </div>
                      <div>
                        <Label className="mb-1 block text-sm">Protocol</Label>
                        <Select
                          value={vpnConfig.tailscale.serveProtocol}
                          onValueChange={(value) =>
                            updateTailscaleConfig({
                              serveProtocol: value as "HTTPS" | "HTTP",
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="HTTPS">HTTPS</SelectItem>
                            <SelectItem value="HTTP">HTTP</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="mb-1 block text-sm">
                          Inside Protocol
                        </Label>
                        <Select
                          value={vpnConfig.tailscale.serveInsideProtocol || "http"}
                          onValueChange={(value) =>
                            updateTailscaleConfig({
                              serveInsideProtocol: value as "http" | "https" | "https+insecure",
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="http">HTTP</SelectItem>
                            <SelectItem value="https">HTTPS</SelectItem>
                            <SelectItem value="https+insecure">HTTPS (insecure)</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                          Protocol used to connect to your internal service
                        </p>
                      </div>
                      <div>
                        <Label className="mb-1 block text-sm">
                          Cert Domain (optional)
                        </Label>
                        <Input
                          value={vpnConfig.tailscale.certDomain}
                          onChange={(e) =>
                            updateTailscaleConfig({
                              certDomain: e.target.value,
                            })
                          }
                          placeholder="${TS_CERT_DOMAIN}"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

            {vpnConfig &&
              vpnConfig.enabled &&
              vpnConfig.type === "newt" &&
              vpnConfig.newt && (
                <div className="flex flex-col gap-3">
                  <div>
                    <Label className="mb-1 block text-sm">Endpoint</Label>
                    <Input
                      value={vpnConfig.newt.endpoint}
                      onChange={(e) =>
                        updateNewtConfig({ endpoint: e.target.value })
                      }
                      placeholder="https://app.pangolin.net"
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block text-sm">Newt ID</Label>
                    <Input
                      value={vpnConfig.newt.newtId}
                      onChange={(e) =>
                        updateNewtConfig({ newtId: e.target.value })
                      }
                      placeholder="${NEWT_ID}"
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block text-sm">Newt Secret</Label>
                    <Input
                      value={vpnConfig.newt.newtSecret}
                      onChange={(e) =>
                        updateNewtConfig({ newtSecret: e.target.value })
                      }
                      placeholder="${NEWT_SECRET}"
                      type="password"
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block text-sm">Network Name</Label>
                    <Input
                      value={vpnConfig.newt.networkName}
                      onChange={(e) =>
                        updateNewtConfig({ networkName: e.target.value })
                      }
                      placeholder="newt"
                    />
                  </div>
                </div>
              )}

            {vpnConfig &&
              vpnConfig.enabled &&
              vpnConfig.type === "cloudflared" &&
              vpnConfig.cloudflared && (
                <div className="flex flex-col gap-3">
                  <div>
                    <Label className="mb-1 block text-sm">Tunnel Token</Label>
                    <Input
                      value={vpnConfig.cloudflared.tunnelToken}
                      onChange={(e) =>
                        updateCloudflaredConfig({
                          tunnelToken: e.target.value,
                        })
                      }
                      placeholder="${TUNNEL_TOKEN}"
                      type="password"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Get from Cloudflare dashboard
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={vpnConfig.cloudflared.noAutoupdate}
                      onCheckedChange={(checked) =>
                        updateCloudflaredConfig({
                          noAutoupdate: checked === true,
                        })
                      }
                    />
                    <Label
                      className="text-sm cursor-pointer"
                      onClick={() => {
                        if (!vpnConfig.cloudflared) return;
                        updateCloudflaredConfig({
                          noAutoupdate:
                            !vpnConfig.cloudflared.noAutoupdate,
                        });
                      }}
                    >
                      No Auto-update
                    </Label>
                  </div>
                </div>
              )}

            {vpnConfig &&
              vpnConfig.enabled &&
              vpnConfig.type === "wireguard" &&
              vpnConfig.wireguard && (
                <div className="flex flex-col gap-3">
                  <div>
                    <Label className="mb-1 block text-sm">Config Path</Label>
                    <Input
                      value={vpnConfig.wireguard.configPath}
                      onChange={(e) =>
                        updateWireguardConfig({
                          configPath: e.target.value,
                        })
                      }
                      placeholder="/etc/wireguard/wg0.conf"
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block text-sm">Interface Name</Label>
                    <Input
                      value={vpnConfig.wireguard.interfaceName}
                      onChange={(e) =>
                        updateWireguardConfig({
                          interfaceName: e.target.value,
                        })
                      }
                      placeholder="wg0"
                    />
                  </div>
                </div>
              )}

            {vpnConfig &&
              vpnConfig.enabled &&
              vpnConfig.type === "zerotier" &&
              vpnConfig.zerotier && (
                <div className="flex flex-col gap-3">
                  <div>
                    <Label className="mb-1 block text-sm">Network ID</Label>
                    <Input
                      value={vpnConfig.zerotier.networkId}
                      onChange={(e) =>
                        updateZerotierConfig({
                          networkId: e.target.value,
                        })
                      }
                      placeholder="${ZT_NETWORK_ID}"
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block text-sm">Identity Path</Label>
                    <Input
                      value={vpnConfig.zerotier.identityPath}
                      onChange={(e) =>
                        updateZerotierConfig({
                          identityPath: e.target.value,
                        })
                      }
                      placeholder="/var/lib/zerotier-one"
                    />
                  </div>
                </div>
              )}

            {vpnConfig &&
              vpnConfig.enabled &&
              vpnConfig.type === "netbird" &&
              vpnConfig.netbird && (
                <div className="flex flex-col gap-3">
                  <div>
                    <Label className="mb-1 block text-sm">Setup Key</Label>
                    <Input
                      value={vpnConfig.netbird.setupKey}
                      onChange={(e) =>
                        updateNetbirdConfig({
                          setupKey: e.target.value,
                        })
                      }
                      placeholder="${NETBIRD_SETUP_KEY}"
                      type="password"
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block text-sm">
                      Management URL (optional)
                    </Label>
                    <Input
                      value={vpnConfig.netbird.managementUrl}
                      onChange={(e) =>
                        updateNetbirdConfig({
                          managementUrl: e.target.value,
                        })
                      }
                      placeholder="https://api.netbird.io"
                    />
                  </div>
                </div>
              )}

            {vpnConfig && vpnConfig.enabled && (
              <>
                {(() => {
                  let hasErrors = false;
                  let errorMessage = "";

                  if (!vpnConfig) return null;

                  if (
                    vpnConfig.type === "tailscale" &&
                    vpnConfig.tailscale
                  ) {
                    if (!vpnConfig.tailscale.authKey) {
                      hasErrors = true;
                      errorMessage = "Tailscale Auth Key is required";
                    }
                    if (
                      vpnConfig.tailscale.enableServe &&
                      !vpnConfig.tailscale.serveTargetService
                    ) {
                      hasErrors = true;
                      errorMessage =
                        "Target service is required when Serve is enabled";
                    }
                  } else if (
                    vpnConfig.type === "newt" &&
                    vpnConfig.newt
                  ) {
                    if (
                      !vpnConfig.newt.newtId ||
                      !vpnConfig.newt.newtSecret
                    ) {
                      hasErrors = true;
                      errorMessage = "Newt ID and Secret are required";
                    }
                  } else if (
                    vpnConfig.type === "cloudflared" &&
                    vpnConfig.cloudflared
                  ) {
                    if (!vpnConfig.cloudflared.tunnelToken) {
                      hasErrors = true;
                      errorMessage =
                        "Cloudflared Tunnel Token is required";
                    }
                  } else if (
                    vpnConfig.type === "zerotier" &&
                    vpnConfig.zerotier
                  ) {
                    if (!vpnConfig.zerotier.networkId) {
                      hasErrors = true;
                      errorMessage = "ZeroTier Network ID is required";
                    }
                  } else if (
                    vpnConfig.type === "netbird" &&
                    vpnConfig.netbird
                  ) {
                    if (!vpnConfig.netbird.setupKey) {
                      hasErrors = true;
                      errorMessage = "Netbird Setup Key is required";
                    }
                  }

                  if (vpnConfig.servicesUsingVpn.length === 0) {
                    hasErrors = true;
                    errorMessage =
                      "At least one service must be selected to use VPN";
                  }

                  return hasErrors ? (
                    <Alert className="mb-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Configuration Warning</AlertTitle>
                      <AlertDescription className="text-xs">
                        {errorMessage}
                      </AlertDescription>
                    </Alert>
                  ) : null;
                })()}
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-semibold">
                    Services Using VPN
                  </Label>
                  {services.filter((s) => s.name).length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Add services first
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                      {services
                        .filter((s) => s.name)
                        .map((svc) => (
                          <div
                            key={svc.name}
                            className="flex items-center gap-2"
                          >
                            <Checkbox
                              checked={vpnConfig.servicesUsingVpn.includes(
                                svc.name
                              )}
                              onCheckedChange={(checked) => {
                                const newServices = checked
                                  ? [
                                      ...vpnConfig.servicesUsingVpn,
                                      svc.name,
                                    ]
                                  : vpnConfig.servicesUsingVpn.filter(
                                      (n) => n !== svc.name
                                    );
                                updateServicesUsingVpn(newServices);
                              }}
                            />
                            <Label
                              htmlFor={`vpn-service-${svc.name}`}
                              className="text-sm cursor-pointer flex-1"
                              onClick={() => {
                                const isChecked =
                                  vpnConfig.servicesUsingVpn.includes(
                                    svc.name
                                  );
                                const newServices = !isChecked
                                  ? [
                                      ...vpnConfig.servicesUsingVpn,
                                      svc.name,
                                    ]
                                  : vpnConfig.servicesUsingVpn.filter(
                                      (n) => n !== svc.name
                                    );
                                updateServicesUsingVpn(newServices);
                              }}
                            >
                              {svc.name}
                            </Label>
                            {vpnConfig.type &&
                              ["tailscale", "cloudflared"].includes(
                                vpnConfig.type
                              ) &&
                              vpnConfig.servicesUsingVpn.includes(
                                svc.name
                              ) && (
                                <span className="text-xs text-muted-foreground ml-auto">
                                  (network_mode)
                                </span>
                              )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-semibold">
                    Networks
                  </Label>
                  {networks.filter((n) => n.name).length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Add networks first
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                      {networks
                        .filter((n) => n.name)
                        .map((net) => (
                          <div
                            key={net.name}
                            className="flex items-center gap-2"
                          >
                            <Checkbox
                              checked={vpnConfig.networks?.includes(net.name) || false}
                              onCheckedChange={(checked) => {
                                const currentNetworks = vpnConfig.networks || [];
                                const newNetworks = checked
                                  ? [...currentNetworks, net.name]
                                  : currentNetworks.filter((n) => n !== net.name);
                                updateVpnNetworks(newNetworks);
                              }}
                            />
                            <Label
                              htmlFor={`vpn-network-${net.name}`}
                              className="text-sm cursor-pointer flex-1"
                              onClick={() => {
                                const currentNetworks = vpnConfig.networks || [];
                                const isChecked = currentNetworks.includes(net.name);
                                const newNetworks = !isChecked
                                  ? [...currentNetworks, net.name]
                                  : currentNetworks.filter((n) => n !== net.name);
                                updateVpnNetworks(newNetworks);
                              }}
                            >
                              {net.name}
                            </Label>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
      <Separator className="my-2" />
    </>
  );
}

