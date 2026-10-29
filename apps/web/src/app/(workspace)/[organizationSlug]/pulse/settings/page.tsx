import type { Metadata } from "next";
import AppSettingsPage from "@/features/settings/AppSettingsPage";

export const metadata: Metadata = {
  title: "Pulse settings | Dhriti",
  description: "Manage Pulse settings for your organization.",
};

export default function Page() {
  return <AppSettingsPage app="pulse" />;
}
