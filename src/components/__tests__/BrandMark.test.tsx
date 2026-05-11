import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { BrandMark } from "../BrandMark";

describe("BrandMark", () => {
  it("renders an inline SVG", () => {
    const { container } = render(<BrandMark />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
  });

  it("respects size prop", () => {
    const { container } = render(<BrandMark size={64} />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("width")).toBe("64");
    expect(svg?.getAttribute("height")).toBe("64");
  });

  it("toggles tone class for dark surfaces", () => {
    const { container, rerender } = render(<BrandMark tone="ink" />);
    expect(container.querySelector(".brand-mark--ink")).toBeTruthy();
    rerender(<BrandMark tone="on-dark" />);
    expect(container.querySelector(".brand-mark--on-dark")).toBeTruthy();
  });
});
