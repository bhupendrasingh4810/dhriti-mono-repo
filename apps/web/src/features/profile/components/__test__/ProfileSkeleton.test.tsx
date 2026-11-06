import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProfileSkeleton } from "../ProfileSkeleton";

describe("ProfileSkeleton", () => {
  it("exposes a busy loading status while hiding decorative placeholders", () => {
    render(<ProfileSkeleton />);

    expect(screen.getByRole("status", { name: "Loading profile", busy: true })).toBeInTheDocument();
    expect(screen.queryByText(/profile/i)).not.toBeInTheDocument();
  });
});
