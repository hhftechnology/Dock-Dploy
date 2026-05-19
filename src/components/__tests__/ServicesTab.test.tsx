import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ServicesTab } from "../compose-builder/ConfigColumn/ServicesTab";
import { defaultService } from "../../utils/default-configs";

describe("ServicesTab", () => {
  it("hides the trash icon on the last remaining service", () => {
    render(
      <ServicesTab
        services={[defaultService()]}
        selectedIdx={0}
        selectedType="service"
        onSelectService={() => {}}
        onAddService={() => {}}
        onBrowseTemplates={() => {}}
        onRemoveService={() => {}}
      />,
    );
    expect(
      screen.queryByRole("button", { name: /remove service/i }),
    ).not.toBeInTheDocument();
  });

  it("shows trash icons for manually added blank services when more than one exists", () => {
    render(
      <ServicesTab
        services={[defaultService(), defaultService()]}
        selectedIdx={1}
        selectedType="service"
        onSelectService={() => {}}
        onAddService={() => {}}
        onBrowseTemplates={() => {}}
        onRemoveService={() => {}}
      />,
    );
    expect(
      screen.getAllByRole("button", { name: /remove service/i }),
    ).toHaveLength(2);
  });

  it("fires onRemoveService when the trash is clicked", async () => {
    const onRemove = vi.fn();
    const svc = { ...defaultService(), name: "web", image: "nginx" };
    render(
      <ServicesTab
        services={[svc, defaultService()]}
        selectedIdx={0}
        selectedType="service"
        onSelectService={() => {}}
        onAddService={() => {}}
        onBrowseTemplates={() => {}}
        onRemoveService={onRemove}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: /remove service web/i }),
    );
    expect(onRemove).toHaveBeenCalledWith(0);
  });
});
