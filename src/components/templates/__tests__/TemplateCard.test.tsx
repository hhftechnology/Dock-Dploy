import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TemplateCard } from "../TemplateCard";

describe("TemplateCard", () => {
  it("renders name, version and description", () => {
    render(
      <TemplateCard
        id="nginx"
        name="Nginx Proxy"
        description="Reverse proxy"
        version="1.0.0"
        onClick={() => {}}
      />,
    );
    expect(screen.getByText("Nginx Proxy")).toBeInTheDocument();
    expect(screen.getByText("Reverse proxy")).toBeInTheDocument();
    expect(screen.getByText("1.0.0")).toBeInTheDocument();
  });

  it("renders initials when no logo URL is provided", () => {
    render(
      <TemplateCard
        id="hello-world"
        name="Hello World"
        onClick={() => {}}
      />,
    );
    expect(screen.getByText("HW")).toBeInTheDocument();
  });

  it("calls onClick when the card is clicked", async () => {
    const onClick = vi.fn();
    render(<TemplateCard id="x" name="Item" onClick={onClick} />);
    await userEvent.click(screen.getByText("Item"));
    expect(onClick).toHaveBeenCalled();
  });

  it("calls onClick when Details is clicked", async () => {
    const onClick = vi.fn();
    render(<TemplateCard id="x" name="Item" onClick={onClick} />);
    await userEvent.click(screen.getByRole("button", { name: /details/i }));
    expect(onClick).toHaveBeenCalled();
  });

  it("renders quick-add button when onQuickAdd is provided and fires it without bubbling to card click", async () => {
    const onClick = vi.fn();
    const onQuickAdd = vi.fn();
    render(
      <TemplateCard
        id="x"
        name="Item"
        onClick={onClick}
        onQuickAdd={onQuickAdd}
      />,
    );
    const quickAdd = screen.getByRole("button", {
      name: /quick add to compose/i,
    });
    await userEvent.click(quickAdd);
    expect(onQuickAdd).toHaveBeenCalledTimes(1);
    // stopPropagation means the card-level onClick should NOT fire
    expect(onClick).not.toHaveBeenCalled();
  });

  it("renders up to 3 tags plus an overflow chip", () => {
    render(
      <TemplateCard
        id="x"
        name="Item"
        tags={["a", "b", "c", "d", "e"]}
        onClick={() => {}}
      />,
    );
    expect(screen.getByText("a")).toBeInTheDocument();
    expect(screen.getByText("b")).toBeInTheDocument();
    expect(screen.getByText("c")).toBeInTheDocument();
    expect(screen.getByText("+2")).toBeInTheDocument();
  });
});
