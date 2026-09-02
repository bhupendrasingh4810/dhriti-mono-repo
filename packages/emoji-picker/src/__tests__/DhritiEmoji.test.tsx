import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DhritiEmoji } from "../components/DhritiEmoji";

describe("DhritiEmoji", () => {
  it("renders the unicode emoji character for a known name", () => {
    render(<DhritiEmoji name="grinning-face" />);
    expect(screen.getByRole("img", { name: /grinning face/i })).toHaveTextContent("\ud83d\ude00");
  });

  it("resolves aliases", () => {
    render(<DhritiEmoji name="+1" />);
    expect(screen.getByRole("img")).toHaveTextContent("\ud83d\udc4d");
  });

  it("renders nothing (no crash) for an unknown name without a fallback", () => {
    const { container } = render(<DhritiEmoji name="not-a-real-emoji" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the provided fallback for an unknown name", () => {
    render(<DhritiEmoji name="not-a-real-emoji" fallback={<span>missing</span>} />);
    expect(screen.getByText("missing")).toBeInTheDocument();
  });

  it("uses a custom title as the accessible name", () => {
    render(<DhritiEmoji name="party-popper" title="Celebrate" />);
    expect(screen.getByRole("img", { name: "Celebrate" })).toBeInTheDocument();
  });
});
