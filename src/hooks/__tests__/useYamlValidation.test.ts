import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useYamlValidation } from "../useYamlValidation";
import { defaultVPNConfig, defaultService } from "../../utils/default-configs";

describe("useYamlValidation", () => {
  it("derives YAML from services without manual triggering", () => {
    const services = [{ ...defaultService(), name: "web", image: "nginx" }];
    const { result } = renderHook(() =>
      useYamlValidation({
        services,
        networks: [],
        volumes: [],
        vpnConfig: defaultVPNConfig(),
      }),
    );
    expect(result.current.yaml).toContain("services:");
    expect(result.current.yaml).toContain("web:");
    expect(result.current.yaml).toContain("nginx");
  });

  it("re-derives YAML when services change (no effect required)", () => {
    const initial = [{ ...defaultService(), name: "web", image: "nginx" }];
    const { result, rerender } = renderHook(
      ({ s }: { s: ReturnType<typeof defaultService>[] }) =>
        useYamlValidation({
          services: s,
          networks: [],
          volumes: [],
          vpnConfig: defaultVPNConfig(),
        }),
      { initialProps: { s: initial } },
    );

    expect(result.current.yaml).toContain("nginx");
    const next = [{ ...defaultService(), name: "api", image: "node:22" }];
    rerender({ s: next });
    expect(result.current.yaml).toContain("api:");
    expect(result.current.yaml).toContain("node:22");
  });

  it("validateAndReformat exposes a success flag on valid input", () => {
    const services = [{ ...defaultService(), name: "web", image: "nginx" }];
    const { result } = renderHook(() =>
      useYamlValidation({
        services,
        networks: [],
        volumes: [],
        vpnConfig: defaultVPNConfig(),
      }),
    );
    act(() => result.current.validateAndReformat());
    expect(result.current.validationError).toBeNull();
    expect(result.current.validationSuccess).toBe(true);
  });

  it("validateAndReformat reports errors on invalid input", () => {
    // No name + no image — validation should fail
    const services = [{ ...defaultService(), name: "", image: "" }];
    const { result } = renderHook(() =>
      useYamlValidation({
        services,
        networks: [],
        volumes: [],
        vpnConfig: defaultVPNConfig(),
      }),
    );
    act(() => result.current.validateAndReformat());
    expect(result.current.validationSuccess).toBe(false);
    expect(result.current.validationError).toBeTruthy();
  });
});
