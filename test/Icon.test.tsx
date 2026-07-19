import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Icon } from "@/components/ui/Icon";

describe("Icon", () => {
  it("renders car icon", () => {
    const { container } = render(<Icon name="car" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("accepts custom size", () => {
    const { container } = render(<Icon name="car" size={32} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "32");
    expect(svg).toHaveAttribute("height", "32");
  });

  it("accepts className", () => {
    const { container } = render(<Icon name="car" className="text-primary" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveClass("text-primary");
  });
});
