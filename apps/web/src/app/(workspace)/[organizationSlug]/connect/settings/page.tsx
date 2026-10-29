import type { Metadata } from "next";
import AppSettingsPage from "@/features/settings/AppSettingsPage";

export const metadata: Metadata = {
  title: "Connect settings | Dhriti",
  description: "Manage Connect settings for your organization.",
};

export default function Page() {
  return <AppSettingsPage app="connect" />;
}
