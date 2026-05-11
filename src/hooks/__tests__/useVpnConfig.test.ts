import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useVpnConfig } from "../useVpnConfig";

describe("useVpnConfig", () => {
  it("starts disabled with no provider", () => {
    const { result } = renderHook(() => useVpnConfig());
    expect(result.current.vpnConfig.enabled).toBe(false);
    expect(result.current.vpnConfig.type).toBeNull();
  });

  it("switching to tailscale enables and provisions defaults", () => {
    const { result } = renderHook(() => useVpnConfig());
    act(() => result.current.updateVpnType("tailscale"));
    expect(result.current.vpnConfig.enabled).toBe(true);
    expect(result.current.vpnConfig.type).toBe("tailscale");
    expect(result.current.vpnConfig.tailscale).toBeDefined();
    expect(result.current.vpnConfig.tailscale?.authKey).toBe("");
  });

  it("switching providers clears the previous provider's block", () => {
    const { result } = renderHook(() => useVpnConfig());
    act(() => result.current.updateVpnType("tailscale"));
    expect(result.current.vpnConfig.tailscale).toBeDefined();
    act(() => result.current.updateVpnType("wireguard"));
    expect(result.current.vpnConfig.type).toBe("wireguard");
    expect(result.current.vpnConfig.wireguard).toBeDefined();
    expect(result.current.vpnConfig.tailscale).toBeUndefined();
  });

  it("updateTailscaleConfig merges partial updates", () => {
    const { result } = renderHook(() => useVpnConfig());
    act(() => result.current.updateVpnType("tailscale"));
    act(() =>
      result.current.updateTailscaleConfig({ authKey: "tskey-abc" }),
    );
    expect(result.current.vpnConfig.tailscale?.authKey).toBe("tskey-abc");
  });

  it("updateServicesUsingVpn writes the list verbatim", () => {
    const { result } = renderHook(() => useVpnConfig());
    act(() => result.current.updateVpnType("tailscale"));
    act(() => result.current.updateServicesUsingVpn(["web", "api"]));
    expect(result.current.vpnConfig.servicesUsingVpn).toEqual(["web", "api"]);
  });
});
