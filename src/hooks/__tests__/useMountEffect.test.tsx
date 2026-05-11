import { describe, expect, it, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { useMountEffect } from "../useMountEffect";

describe("useMountEffect", () => {
  it("runs the effect exactly once on mount", () => {
    const fn = vi.fn();
    function Box() {
      useMountEffect(fn);
      return null;
    }
    const { rerender } = render(<Box />);
    expect(fn).toHaveBeenCalledTimes(1);
    rerender(<Box />);
    rerender(<Box />);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("runs the cleanup on unmount", () => {
    const cleanupFn = vi.fn();
    function Box() {
      useMountEffect(() => cleanupFn);
      return null;
    }
    const { unmount } = render(<Box />);
    expect(cleanupFn).not.toHaveBeenCalled();
    unmount();
    expect(cleanupFn).toHaveBeenCalledTimes(1);
  });

  it("isolates effects across multiple mounts (each instance fires once)", () => {
    const fn = vi.fn();
    function Box() {
      useMountEffect(fn);
      return null;
    }
    render(<Box />);
    cleanup();
    render(<Box />);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
