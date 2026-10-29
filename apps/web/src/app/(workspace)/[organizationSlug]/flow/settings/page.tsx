import type { Metadata } from "next";
import AppSettingsPage from "@/features/settings/AppSettingsPage";

export const metadata: Metadata = {
  title: "Flow settings | Dhriti",
  description: "Manage Flow settings for your organization.",
};

export default function Page() {
  return <AppSettingsPage app="flow" />;
}
