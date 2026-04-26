"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export default function BackButton({ href }: { href?: string } = {}) {
  const router = useRouter();
  return href ? (
    <a
      href={href}
      className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 p-1.5 text-white/70 hover:bg-white/10 hover:text-white transition"
    >
      <ChevronLeft className="h-4 w-4" />
    </a>
  ) : (
    <button
      type="button"
      onClick={() => router.back()}
      className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 p-1.5 text-white/70 hover:bg-white/10 hover:text-white transition"
    >
      <ChevronLeft className="h-4 w-4" />
    </button>
  );
}
