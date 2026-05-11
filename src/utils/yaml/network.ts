// Build the top-level `networks:` block.

import type { NetworkConfig } from "../../types/compose";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NetworksBlock = Record<string, any>;

export function buildNetworksBlock(networks: NetworkConfig[]): NetworksBlock | undefined {
  if (!networks.length) return undefined;
  const out: NetworksBlock = {};
  networks.forEach((n) => {
    if (!n.name) return;
    if (n.external) {
      out[n.name] = { external: n.name_external ? { name: n.name_external } : true };
    } else {
      out[n.name] = {
        driver: n.driver || undefined,
        attachable: n.attachable !== undefined ? n.attachable : undefined,
        internal: n.internal !== undefined ? n.internal : undefined,
        enable_ipv6: n.enable_ipv6 !== undefined ? n.enable_ipv6 : undefined,
        driver_opts:
          n.driver_opts && n.driver_opts.length
            ? n.driver_opts
                .filter((opt) => opt.key)
                .reduce(
                  (acc, { key, value }) => {
                    acc[key] = value;
                    return acc;
                  },
                  {} as Record<string, string>,
                )
            : undefined,
        labels:
          n.labels && n.labels.length
            ? n.labels.filter((l) => l.key).map(({ key, value }) => `${key}=${value}`)
            : undefined,
        ipam:
          n.ipam.driver || n.ipam.config.length || n.ipam.options.length
            ? {
                driver: n.ipam.driver || undefined,
                config: n.ipam.config.length ? n.ipam.config : undefined,
                options: n.ipam.options.length
                  ? n.ipam.options
                      .filter((opt) => opt.key)
                      .reduce(
                        (acc, { key, value }) => {
                          acc[key] = value;
                          return acc;
                        },
                        {} as Record<string, string>,
                      )
                  : undefined,
              }
            : undefined,
      };
    }
    Object.keys(out[n.name]).forEach(
      (k) => out[n.name][k] === undefined && delete out[n.name][k],
    );
  });
  return Object.keys(out).length > 0 ? out : undefined;
}
