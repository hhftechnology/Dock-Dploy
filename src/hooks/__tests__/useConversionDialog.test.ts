import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useConversionDialog } from "../useConversionDialog";
import { defaultService, defaultVPNConfig } from "../../utils/default-configs";

describe("useConversionDialog", () => {
  function setup() {
    const services = [
      { ...defaultService(), name: "web", image: "nginx:latest" },
      { ...defaultService(), name: "api", image: "node:22" },
    ];
    return renderHook(() =>
      useConversionDialog({
        services,
        selectedIdx: null,
        yaml: "services:\n  web:\n    image: nginx",
        vpnConfig: defaultVPNConfig(),
      }),
    );
  }

  it("opens with docker-run output for all services when no selection", () => {
    const { result } = setup();
    act(() => result.current.handleConversion("docker-run"));
    expect(result.current.conversionDialogOpen).toBe(true);
    expect(result.current.conversionType).toBe("docker-run");
    expect(result.current.conversionOutput).toContain("docker run");
    // Should include both services
    expect(result.current.conversionOutput).toContain("nginx:latest");
    expect(result.current.conversionOutput).toContain("node:22");
  });

  it("handles env conversion", () => {
    const { result } = setup();
    act(() => result.current.handleConversion("env"));
    expect(result.current.conversionType).toBe("env");
    // generateEnvFile returns a string — may be empty for our services, that's fine
    expect(typeof result.current.conversionOutput).toBe("string");
  });

  it("closeDialog flips open back to false", () => {
    const { result } = setup();
    act(() => result.current.handleConversion("docker-run"));
    expect(result.current.conversionDialogOpen).toBe(true);
    act(() => result.current.closeDialog());
    expect(result.current.conversionDialogOpen).toBe(false);
  });
});
