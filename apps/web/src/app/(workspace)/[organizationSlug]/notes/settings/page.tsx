import type { Metadata } from "next";
import AppSettingsPage from "@/features/settings/AppSettingsPage";

export const metadata: Metadata = {
  title: "Notes settings | Dhriti",
  description: "Manage Notes settings for your organization.",
};

export default function Page() {
  return <AppSettingsPage app="notes" />;
}
