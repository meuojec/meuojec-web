"use client";
import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  userId: string;
  currentRole: string;
  onClose: () => void;
  onSaved: () => void;
};

const ROLES = ["admin", "lider", "ujier", "miembro", "visitante"];

export default function ManageUserRolesModal({ userId, currentRole, onClose, onSaved }: Props) {
  const [selectedRole, setSelectedRole] = useState(currentRole);
  const [isPending, startTransition] = useTransition();
  const [err, setErr] = useState("");

  function save() {
    setErr("");
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ role: selectedRole })
        .eq("id", userId);
      if (error) { setErr(error.message); return; }
      onSaved();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-900 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Cambiar rol</h2>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
        >
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        {err && <div className="text-sm text-red-300">{err}</div>}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={isPending}
            className="rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-2 text-sm text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50"
          >
            {isPending ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
