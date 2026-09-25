import GoogleIcon from "../icons/google.icon";
import MicrosoftIcon from "../icons/microsoft.icon";
import GitHubIcon from "../icons/github.icon";
import LinkedInIcon from "../icons/linkedin.icon";
import { OAuthProvider } from "@/types/oauth.types";

export const providerConfig: Record<
  OAuthProvider,
  {
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    bgColor: string;
    textColor: string;
    borderColor?: string;
  }
> = {
  google: {
    name: "Google",
    icon: GoogleIcon,
    bgColor: "bg-white",
    textColor: "text-gray-700",
    borderColor: "border-gray-300",
  },
  microsoft: {
    name: "Microsoft",
    icon: MicrosoftIcon,
    bgColor: "bg-white",
    textColor: "text-gray-700",
    borderColor: "border-gray-300",
  },
  github: {
    name: "GitHub",
    icon: GitHubIcon,
    bgColor: "bg-gray-900",
    textColor: "text-white",
  },
  linkedin: {
    name: "LinkedIn",
    icon: LinkedInIcon,
    bgColor: "bg-[#0077b5]",
    textColor: "text-white",
  },
};
