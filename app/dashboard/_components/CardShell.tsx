import React from "react";

export default function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      {children}
    </div>
  );
}
