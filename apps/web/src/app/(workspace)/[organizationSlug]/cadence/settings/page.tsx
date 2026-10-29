import type { Metadata } from "next";
import AppSettingsPage from "@/features/settings/AppSettingsPage";

export const metadata: Metadata = {
  title: "Cadence settings | Dhriti",
  description: "Manage Cadence settings for your organization.",
};

export default function Page() {
  return <AppSettingsPage app="cadence" />;
}
