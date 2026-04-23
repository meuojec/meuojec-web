"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function ClickableRow({
  href,
  children,
  ariaLabel,
}: {
  href: string;
  children: React.ReactNode;
  ariaLabel?: string;
}) {
  const router = useRouter();

  const go = () => router.push(href);

  return (
    <tr
      role="link"
      tabIndex={0}
      aria-label={ariaLabel ?? "Ver detalle"}
      onClick={go}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          go();
        }
        if (e.key === " ") {
          e.preventDefault();
          go();
        }
      }}
      className={[
        "border-t border-white/10",
        "cursor-pointer select-none",
        "transition-colors",
        "hover:bg-white/5",
        "focus-visible:bg-white/5",
        "focus-visible:outline-none",
        "focus-visible:ring-2 focus-visible:ring-white/20",
      ].join(" ")}
    >
      {children}
    </tr>
  );
}