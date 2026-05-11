import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { SetupSidebar } from "../SetupSidebar";

describe("SetupSidebar", () => {
  it("renders all three rail items", () => {
    render(<SetupSidebar view="compose" onNav={() => {}} />);
    expect(screen.getByTitle("Compose Builder")).toBeTruthy();
    expect(screen.getByTitle("Config Builder")).toBeTruthy();
    expect(screen.getByTitle("Scheduler Builder")).toBeTruthy();
  });

  it("marks the active item with .active", () => {
    const { container } = render(<SetupSidebar view="scheduler" onNav={() => {}} />);
    const active = container.querySelector(".rail-item.active");
    expect(active).toBeTruthy();
    expect(active?.getAttribute("title")).toBe("Scheduler Builder");
  });

  it("fires onNav with the right view id when clicked", () => {
    const onNav = vi.fn();
    render(<SetupSidebar view="compose" onNav={onNav} />);
    fireEvent.click(screen.getByTitle("Config Builder"));
    expect(onNav).toHaveBeenCalledWith("config");
  });

  it("toggles pinned state via the rail-brand click", () => {
    const { container } = render(<SetupSidebar view="compose" onNav={() => {}} />);
    const sidebar = container.querySelector(".setup-sidebar");
    expect(sidebar?.className).not.toContain("pinned");
    const brand = container.querySelector(".rail-brand") as HTMLElement;
    fireEvent.click(brand);
    expect(sidebar?.className).toContain("pinned");
    fireEvent.click(brand);
    expect(sidebar?.className).not.toContain("pinned");
  });
});
