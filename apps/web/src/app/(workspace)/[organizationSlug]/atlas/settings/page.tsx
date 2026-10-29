import type { Metadata } from "next";
import AppSettingsPage from "@/features/settings/AppSettingsPage";

export const metadata: Metadata = {
  title: "Atlas settings | Dhriti",
  description: "Manage Atlas settings for your organization.",
};

export default function Page() {
  return <AppSettingsPage app="atlas" />;
}
