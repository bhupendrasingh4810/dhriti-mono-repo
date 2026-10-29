import type { Metadata } from "next";
import GeneralSettingsPage from "@/features/settings/GeneralSettingsPage";

export const metadata: Metadata = {
  title: "General settings | Dhriti",
  description: "Manage your status, messaging, alerts, and call preferences.",
};

export default function Page() {
  return <GeneralSettingsPage />;
}
