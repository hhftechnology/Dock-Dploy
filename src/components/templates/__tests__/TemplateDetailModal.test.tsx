import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TemplateDetailModal } from "../TemplateDetailModal";
import { ToastProvider } from "../../ui/toast";

const VALID_TEMPLATE = {
  id: "nginx",
  name: "Nginx",
  composeContent: `services:
  nginx:
    image: nginx:latest
    ports:
      - "8080:80"
`,
};

function renderModal(props: Partial<Parameters<typeof TemplateDetailModal>[0]> = {}) {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    template: VALID_TEMPLATE,
    onImport: vi.fn().mockResolvedValue(undefined),
  };

  const merged = { ...defaultProps, ...props };
  render(
    <ToastProvider>
      <TemplateDetailModal {...merged} />
    </ToastProvider>,
  );
  return merged;
}

describe("TemplateDetailModal", () => {
  it("closes after a successful import", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onImport = vi.fn().mockResolvedValue(undefined);
    renderModal({ onOpenChange, onImport });

    await user.click(screen.getByRole("button", { name: /import template/i }));

    expect(onImport).toHaveBeenCalledWith(VALID_TEMPLATE);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
