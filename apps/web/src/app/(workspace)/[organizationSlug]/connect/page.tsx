import ConnectWorkspace from "@/features/connect/ConnectWorkspace";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connect | Dhriti",
  description: "Connect your workspace to Dhriti.",
};

export default function ConnectPage() {
  return <ConnectWorkspace />;
}
