import type { Metadata } from "next";
import AppSettingsPage from "@/features/settings/AppSettingsPage";

export const metadata: Metadata = {
  title: "Nexus settings | Dhriti",
  description: "Manage Nexus settings for your organization.",
};

export default function Page() {
  return <AppSettingsPage app="nexus" />;
}
