import { useState } from "react";
import type { VPNConfig } from "../../../types/vpn-configs";

const ICON_BASE = "https://cdn.jsdelivr.net/gh/selfhst/icons/png";

export interface ProviderTile {
  id: NonNullable<VPNConfig["type"]> | "none";
  name: string;
  blurb: string;
  monogram: string;
  // CSS variable name (no hex literals in component code).
  tint: string;
  iconUrl?: string;
}

export const PROVIDER_TILES: ProviderTile[] = [
  {
    id: "wireguard",
    name: "WireGuard",
    blurb: "Modern, fast, kernel-native.",
    monogram: "W",
    tint: "var(--coral)",
    iconUrl: `${ICON_BASE}/wireguard.png`,
  },
  {
    id: "tailscale",
    name: "Tailscale",
    blurb: "Mesh VPN, zero-config.",
    monogram: "T",
    tint: "var(--slate)",
    iconUrl: `${ICON_BASE}/tailscale.png`,
  },
  {
    id: "cloudflared",
    name: "Cloudflared",
    blurb: "Cloudflare tunnel sidecar.",
    monogram: "C",
    tint: "var(--amber)",
    iconUrl: `${ICON_BASE}/cloudflare.png`,
  },
  {
    id: "newt",
    name: "Newt",
    blurb: "Pangolin reverse proxy tunnel.",
    monogram: "N",
    tint: "var(--violet)",
    iconUrl: `${ICON_BASE}/pangolin.png`,
  },
  {
    id: "zerotier",
    name: "ZeroTier",
    blurb: "Software-defined network.",
    monogram: "Z",
    tint: "var(--teal)",
    iconUrl: `${ICON_BASE}/zerotier.png`,
  },
  {
    id: "netbird",
    name: "NetBird",
    blurb: "WireGuard-based mesh.",
    monogram: "B",
    tint: "var(--coral-active)",
    iconUrl: `${ICON_BASE}/netbird.png`,
  },
  {
    id: "none",
    name: "Disabled",
    blurb: "No VPN sidecar.",
    monogram: "—",
    tint: "var(--muted-soft)",
  },
];

interface VpnProviderTilesProps {
  value: VPNConfig["type"];
  onChange: (next: VPNConfig["type"] | "none") => void;
}

function ProviderMark({ tile }: { tile: ProviderTile }) {
  const [failed, setFailed] = useState(false);
  const showImg = Boolean(tile.iconUrl) && !failed;
  return (
    <span
      className={
        "vpn-provider-mark" + (showImg ? " vpn-provider-mark--img" : "")
      }
      // eslint-disable-next-line no-restricted-syntax
      style={showImg ? undefined : { background: tile.tint }} // check-no-magic-css-allow
      aria-hidden
    >
      {showImg ? (
        <img
          src={tile.iconUrl}
          alt=""
          className="vpn-provider-img"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        tile.monogram
      )}
    </span>
  );
}

export function VpnProviderTiles({ value, onChange }: VpnProviderTilesProps) {
  return (
    <div className="vpn-providers">
      {PROVIDER_TILES.map((tile) => {
        const isActive =
          (tile.id === "none" && (value === null || value === undefined)) ||
          tile.id === value;
        return (
          <button
            key={tile.id}
            type="button"
            className={"vpn-provider" + (isActive ? " active" : "")}
            onClick={() => onChange(tile.id)}
            aria-pressed={isActive}
          >
            <ProviderMark tile={tile} />
            <span className="vpn-provider-text">
              <span className="vpn-provider-name">{tile.name}</span>
              <span className="vpn-provider-desc">{tile.blurb}</span>
            </span>
            <span className="vpn-radio" aria-hidden>
              <span />
            </span>
          </button>
        );
      })}
    </div>
  );
}
