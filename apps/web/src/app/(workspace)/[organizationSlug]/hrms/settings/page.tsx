import type { Metadata } from "next";
import AppSettingsPage from "@/features/settings/AppSettingsPage";

export const metadata: Metadata = {
  title: "HRMS settings | Dhriti",
  description: "Manage HRMS settings for your organization.",
};

export default function Page() {
  return <AppSettingsPage app="hrms" />;
}
