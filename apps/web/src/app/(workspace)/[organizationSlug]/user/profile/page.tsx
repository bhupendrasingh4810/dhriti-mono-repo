import type { Metadata } from "next";
import ProfilePage from "@/features/profile/ProfilePage";

export const metadata: Metadata = {
  title: "My profile | Dhriti",
  description: "Manage your Dhriti profile and personal preferences.",
};

export default function Page() {
  return <ProfilePage />;
}
