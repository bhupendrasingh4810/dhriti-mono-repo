import React from "react";

type Size = "small" | "medium" | "large";

interface LogoProps {
    size: Size;
}

export default function Logo({ size }: LogoProps) {
    return (
        <div
            className={`rounded-xl flex items-center justify-center ${
                size === "small" ? "w-6 h-6" : size === "medium" ? "w-9 h-9" : "w-12 h-12"
            }`}
            style={{ backgroundColor: "#036c5f" }}
        >
            <svg width={size === "small" ? "12" : size === "medium" ? "18" : "24"} height={size === "small" ? "12" : size === "medium" ? "18" : "24"} viewBox="0 0 20 20" fill="none">
                <rect x="2" y="2" width="7" height="7" rx="2" fill="white" />
                <rect x="11" y="2" width="7" height="7" rx="2" fill="white" fillOpacity="0.6" />
                <rect x="2" y="11" width="7" height="7" rx="2" fill="white" fillOpacity="0.6" />
                <rect x="11" y="11" width="7" height="7" rx="2" fill="white" />
            </svg>
        </div>
    );
}