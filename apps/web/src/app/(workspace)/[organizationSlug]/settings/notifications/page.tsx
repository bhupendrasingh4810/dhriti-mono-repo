import type { Metadata } from "next";
import NotificationSettingsPage from "@/features/settings/NotificationSettingsPage";

export const metadata: Metadata = {
  title: "Notification settings | Dhriti",
  description: "Choose which notifications you receive and set quiet hours.",
};

export default function Page() {
  return <NotificationSettingsPage />;
}
