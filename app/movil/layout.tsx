import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Asistencia · MEUOJEC",
  description: "Toma de asistencia desde el celular",
};

export const viewport: Viewport = {
  themeColor: "#0b0b0b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// Layout sin dashboard shell — pantalla completa para modo móvil
export default function MovilLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-[#0b0b0b] text-white">{children}</div>;
}
