import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  TemplateStoreModal,
  type Template,
} from "../TemplateStoreModal";

beforeEach(() => {
  // useSearchParams reads window.location.search; reset between tests so a
  // search query typed in one test doesn't leak into the next.
  window.history.pushState({}, "", window.location.pathname);
});

const TEMPLATES: Template[] = [
  {
    id: "nginx",
    name: "Nginx",
    description: "Reverse proxy",
    version: "1.0.0",
    tags: ["web", "proxy"],
  },
  {
    id: "postgres",
    name: "Postgres",
    description: "Relational DB",
    version: "16",
    tags: ["database"],
  },
];

describe("TemplateStoreModal", () => {
  it("does not render when closed", () => {
    render(
      <TemplateStoreModal
        open={false}
        onOpenChange={() => {}}
        templates={TEMPLATES}
        onRefresh={() => {}}
        onTemplateSelect={() => {}}
      />,
    );
    expect(screen.queryByText("Templates")).not.toBeInTheDocument();
  });

  it("renders template cards", () => {
    render(
      <TemplateStoreModal
        open
        onOpenChange={() => {}}
        templates={TEMPLATES}
        onRefresh={() => {}}
        onTemplateSelect={() => {}}
      />,
    );
    expect(screen.getByText("Nginx")).toBeInTheDocument();
    expect(screen.getByText("Postgres")).toBeInTheDocument();
  });

  it("surfaces an error with a Try again button", () => {
    const onRefresh = vi.fn();
    render(
      <TemplateStoreModal
        open
        onOpenChange={() => {}}
        templates={[]}
        error="Network error"
        onRefresh={onRefresh}
        onTemplateSelect={() => {}}
      />,
    );
    expect(screen.getByText("Failed to load templates")).toBeInTheDocument();
    expect(screen.getByText("Network error")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /try again/i }),
    ).toBeInTheDocument();
  });

  it("filters templates by search query", async () => {
    render(
      <TemplateStoreModal
        open
        onOpenChange={() => {}}
        templates={TEMPLATES}
        onRefresh={() => {}}
        onTemplateSelect={() => {}}
      />,
    );
    const input = screen.getByPlaceholderText(/search templates/i);
    await userEvent.type(input, "postg");
    expect(screen.queryByText("Nginx")).not.toBeInTheDocument();
    expect(screen.getByText("Postgres")).toBeInTheDocument();
  });

  it("calls onTemplateSelect when a card is clicked", async () => {
    const onSelect = vi.fn();
    render(
      <TemplateStoreModal
        open
        onOpenChange={() => {}}
        templates={TEMPLATES}
        onRefresh={() => {}}
        onTemplateSelect={onSelect}
      />,
    );
    await userEvent.click(screen.getByText("Nginx"));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "nginx" }),
    );
  });

  it("calls onRefresh when the refresh button is clicked", async () => {
    const onRefresh = vi.fn();
    render(
      <TemplateStoreModal
        open
        onOpenChange={() => {}}
        templates={TEMPLATES}
        onRefresh={onRefresh}
        onTemplateSelect={() => {}}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /refresh/i }));
    expect(onRefresh).toHaveBeenCalled();
  });
});
