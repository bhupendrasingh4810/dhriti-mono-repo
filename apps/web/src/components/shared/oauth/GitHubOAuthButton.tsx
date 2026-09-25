import { useState } from "react";
import GitHubIcon from "../icons/github.icon";
import { OAuthButtonProps } from "@/types/oauth.types";

export function GitHubOAuthButton({ mode = "login", onClick, disabled = false, className = "" }: OAuthButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (disabled || loading) return;

    setLoading(true);
    try {
      onClick?.("github");
      window.location.assign(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/oauth/github?mode=${mode}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      className={`flex items-center justify-center cursor-pointer gap-2 px-4 py-2.5 rounded-[10px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-all ${className}`}
      onClick={handleClick}
    >
      <GitHubIcon />
      GitHub
    </button>
  );
}
