import React from "react";
import Link from "next/link";

interface BrandLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = "", size = "md" }) => {
  const markDimensions =
    size === "sm" ? "w-8 h-8 rounded-lg" : size === "lg" ? "w-10 h-10 rounded-xl" : "w-9 h-9 rounded-lg";
  const iconSize = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-6 h-6" : "w-5 h-5";
  const titleSize = size === "sm" ? "text-sm" : size === "lg" ? "text-lg" : "text-base";

  return (
    <Link href="/" className={`inline-flex items-center gap-2.5 group select-none ${className}`}>
      {/* Brand Mark - Shield with River Waves */}
      <span className={`${markDimensions} inline-flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--foreground)]`}>
        <svg viewBox="0 0 24 24" fill="none" className={iconSize}>
          {/* Shield Outline */}
          <path
            d="M12 2.5L4.5 5.5v6c0 5 3.5 9.5 7.5 10.5 4-1 7.5-5.5 7.5-10.5v-6L12 2.5z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* River Waves inside Shield */}
          <path
            d="M7.5 10c1.5-1 2.5-1 4.5 0s3 1 4.5 0"
            stroke="#0FA978"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M7.5 13.5c1.5-1 2.5-1 4.5 0s3 1 4.5 0"
            stroke="#38C798"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </span>

      {/* Brand Typography */}
      <span
        className={`font-heading font-bold tracking-[0.14em] text-[var(--foreground)] ${titleSize} leading-none`}
      >
        SURAKSHA
      </span>
    </Link>
  );
};
