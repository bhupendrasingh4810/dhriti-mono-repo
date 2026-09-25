import { useState } from "react";
import { OAuthButtonProps } from "@/types/oauth.types";
import LinkedInIcon from "../icons/linkedin.icon";

export function LinkedInOAuthButton({ mode = "login", onClick, disabled = false, className = "" }: OAuthButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (disabled || loading) return;

    setLoading(true);
    try {
      onClick?.("linkedin");
      // TODO: Implement actual OAuth flow
      // window.location.href = `/api/auth/oauth/linkedin?mode=${mode}`;
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
      <LinkedInIcon />
      LinkedIn
    </button>
  );
}
