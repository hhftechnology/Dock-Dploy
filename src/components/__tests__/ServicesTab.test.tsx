import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ServicesTab } from "../compose-builder/ConfigColumn/ServicesTab";
import { defaultService } from "../../utils/default-configs";

describe("ServicesTab", () => {
  it("hides the trash icon on an unnamed service", () => {
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

  it("shows the trash icon once a service is named", () => {
    const svc = { ...defaultService(), name: "web", image: "nginx" };
    render(
      <ServicesTab
        services={[svc]}
        selectedIdx={0}
        selectedType="service"
        onSelectService={() => {}}
        onAddService={() => {}}
        onBrowseTemplates={() => {}}
        onRemoveService={() => {}}
      />,
    );
    expect(
      screen.getByRole("button", { name: /remove service/i }),
    ).toBeInTheDocument();
  });

  it("fires onRemoveService when the trash is clicked", async () => {
    const onRemove = vi.fn();
    const svc = { ...defaultService(), name: "web", image: "nginx" };
    render(
      <ServicesTab
        services={[svc]}
        selectedIdx={0}
        selectedType="service"
        onSelectService={() => {}}
        onAddService={() => {}}
        onBrowseTemplates={() => {}}
        onRemoveService={onRemove}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: /remove service/i }),
    );
    expect(onRemove).toHaveBeenCalledWith(0);
  });
});
