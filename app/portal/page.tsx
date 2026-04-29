import PortalClient from "./PortalClient";

export const metadata = { title: "Portal del Miembro — MEUOJEC" };

export default function PortalPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 px-4 py-12">
      <PortalClient />
    </div>
  );
}
