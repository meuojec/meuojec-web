"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 print:hidden"
    >
      Imprimir
    </button>
  );
}