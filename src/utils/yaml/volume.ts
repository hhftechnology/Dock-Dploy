// Build the top-level `volumes:` block.

import type { VolumeConfig } from "../../types/compose";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type VolumesBlock = Record<string, any>;

export function buildVolumesBlock(volumes: VolumeConfig[]): VolumesBlock | undefined {
  if (!volumes.length) return undefined;
  const out: VolumesBlock = {};
  volumes.forEach((v) => {
    if (!v.name) return;
    if (v.external) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const externalVolume: any = {
        external: v.name_external ? { name: v.name_external } : true,
      };
      if (v.driver) externalVolume.driver = v.driver;

      const driverOpts: Record<string, string> = {};
      if (v.driver_opts && v.driver_opts.length) {
        v.driver_opts
          .filter((opt) => opt.key)
          .forEach(({ key, value }) => {
            driverOpts[key] = value;
          });
      }
      if (v.driver_opts_type) driverOpts.type = v.driver_opts_type;
      if (v.driver_opts_device) driverOpts.device = v.driver_opts_device;
      if (v.driver_opts_o) driverOpts.o = v.driver_opts_o;
      if (Object.keys(driverOpts).length > 0) externalVolume.driver_opts = driverOpts;

      if (v.labels && v.labels.length) {
        externalVolume.labels = v.labels
          .filter((l) => l.key)
          .map(({ key, value }) => `${key}=${value}`);
      }
      out[v.name] = externalVolume;
    } else {
      const driverOpts: Record<string, string> = {};
      if (v.driver_opts && v.driver_opts.length) {
        v.driver_opts
          .filter((opt) => opt.key)
          .forEach(({ key, value }) => {
            driverOpts[key] = value;
          });
      }
      if (v.driver_opts_type) driverOpts.type = v.driver_opts_type;
      if (v.driver_opts_device) driverOpts.device = v.driver_opts_device;
      if (v.driver_opts_o) driverOpts.o = v.driver_opts_o;

      out[v.name] = {
        driver: v.driver || undefined,
        driver_opts: Object.keys(driverOpts).length > 0 ? driverOpts : undefined,
        labels:
          v.labels && v.labels.length
            ? v.labels.filter((l) => l.key).map(({ key, value }) => `${key}=${value}`)
            : undefined,
      };
    }
    Object.keys(out[v.name]).forEach(
      (k) => out[v.name][k] === undefined && delete out[v.name][k],
    );
  });
  return Object.keys(out).length > 0 ? out : undefined;
}
