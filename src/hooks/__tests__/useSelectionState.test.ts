import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useSelectionState } from "../useSelectionState";

describe("useSelectionState", () => {
  it("starts with the first service selected", () => {
    const { result } = renderHook(() => useSelectionState());
    expect(result.current.selectedIdx).toBe(0);
    expect(result.current.selectedType).toBe("service");
    expect(result.current.selectedNetworkIdx).toBeNull();
    expect(result.current.selectedVolumeIdx).toBeNull();
  });

  it("selectService clears network/volume", () => {
    const { result } = renderHook(() => useSelectionState());
    act(() => result.current.selectNetwork(2));
    expect(result.current.selectedNetworkIdx).toBe(2);
    act(() => result.current.selectService(1));
    expect(result.current.selectedIdx).toBe(1);
    expect(result.current.selectedType).toBe("service");
    expect(result.current.selectedNetworkIdx).toBeNull();
    expect(result.current.selectedVolumeIdx).toBeNull();
  });

  it("selectNetwork clears service/volume", () => {
    const { result } = renderHook(() => useSelectionState());
    act(() => result.current.selectVolume(1));
    expect(result.current.selectedVolumeIdx).toBe(1);
    act(() => result.current.selectNetwork(3));
    expect(result.current.selectedNetworkIdx).toBe(3);
    expect(result.current.selectedType).toBe("network");
    expect(result.current.selectedIdx).toBeNull();
    expect(result.current.selectedVolumeIdx).toBeNull();
  });

  it("selectVolume clears service/network", () => {
    const { result } = renderHook(() => useSelectionState());
    act(() => result.current.selectService(0));
    act(() => result.current.selectVolume(2));
    expect(result.current.selectedVolumeIdx).toBe(2);
    expect(result.current.selectedType).toBe("volume");
    expect(result.current.selectedIdx).toBeNull();
    expect(result.current.selectedNetworkIdx).toBeNull();
  });
});
