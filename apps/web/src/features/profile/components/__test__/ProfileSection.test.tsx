import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProfileDetail, ProfileSection } from "../ProfileSection";

describe("ProfileSection", () => {
  it("connects its labelled heading, description, children, and detail values", () => {
    render(
      <ProfileSection id="personal-heading" icon={<span>Icon</span>} title="Personal information" description="Your details">
        <dl><ProfileDetail label="Nationality" value="Indian" /></dl>
      </ProfileSection>,
    );

    expect(screen.getByRole("region", { name: "Personal information" })).toHaveTextContent("Your details");
    expect(screen.getByText("Nationality")).toHaveTextContent("Nationality");
    expect(screen.getByText("Indian")).toBeInTheDocument();
  });
});
