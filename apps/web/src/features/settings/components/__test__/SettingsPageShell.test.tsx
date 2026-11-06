import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { SettingsLoadError, SettingsPageShell, SettingsSaveBar, SettingsStatus } from "../SettingsPageShell";

test("renders page context and its read-only notice", () => {
  render(
    <SettingsPageShell scope="Connect" title="Team settings" description="Manage the team." readOnly>
      <p>Settings content</p>
    </SettingsPageShell>,
  );

  expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toHaveTextContent("Connect");
  expect(screen.getByRole("heading", { name: "Team settings" })).toBeVisible();
  expect(screen.getByText(/Only people with the organization/)).toBeVisible();
  expect(screen.getByText("Settings content")).toBeVisible();
});

test("announces statuses, retries loading, and protects invalid saves", () => {
  const onRetry = vi.fn();
  const onDiscard = vi.fn();
  render(
    <>
      <SettingsStatus success="Saved" error="Could not save" />
      <SettingsLoadError message="Failed to load" onRetry={onRetry} />
      <SettingsSaveBar dirty saving={false} invalid onDiscard={onDiscard} />
    </>,
  );

  expect(screen.getByRole("status")).toHaveTextContent("Saved");
  expect(screen.getAllByRole("alert")).toHaveLength(2);
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(onRetry).toHaveBeenCalledOnce();
  expect(screen.getByRole("button", { name: "Discard" })).toBeEnabled();
  expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
});
