// app/dashboard/admin/_components/UserRolesTable.tsx
"use client";

import React, { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AdminRole, AdminUserRow } from "../actions";
import {
  adminCreateUser,
  adminDeleteUser,
  adminSetPassword,
  adminUpdateEmail,
  adminUpdateProfile,
  setUserRoles,
} from "../actions";

function chip(text: string) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-white/80">
      {text}
    </span>
  );
}

function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-2xl border border-white/10 bg-[#0b0b0b] p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-lg font-semibold">{title}</div>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
          >
            Cerrar
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function UserRolesTable({
  roles,
  users,
}: {
  roles: AdminRole[];
  users: AdminUserRow[];
}) {
  const router = useRouter();

  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return users;
    return users.filter((u) => {
      const hay =
        `${u.display_name ?? ""} ${u.email ?? ""} ${u.id ?? ""} ${u.roles?.join(" ") ?? ""}`.toLowerCase();
      return hay.includes(s);
    });
  }, [q, users]);

  // Modals state
  const [openRoles, setOpenRoles] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const [openPassword, setOpenPassword] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const [selected, setSelected] = useState<AdminUserRow | null>(null);

  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string>("");
  const [err, setErr] = useState<string>("");

  // Roles editor
  const [rolePick, setRolePick] = useState<string[]>([]);

  // Profile editor
  const [displayName, setDisplayName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Password editor
  const [newPass, setNewPass] = useState("");

  // Create user
  const [cEmail, setCEmail] = useState("");
  const [cName, setCName] = useState("");
  const [cActive, setCActive] = useState(true);
  const [cRoleKeys, setCRoleKeys] = useState<string[]>([]);
  const [cPassword, setCPassword] = useState("");

  function openManageRoles(u: AdminUserRow) {
    setErr(""); setMsg("");
    setSelected(u);
    setRolePick(u.roles ?? []);
    setOpenRoles(true);
  }

  function openEditProfile(u: AdminUserRow) {
    setErr(""); setMsg("");
    setSelected(u);
    setDisplayName(u.display_name ?? "");
    setEditEmail(u.email ?? "");
    setIsActive(!!u.is_active);
    setOpenProfile(true);
  }

  function openChangePass(u: AdminUserRow) {
    setErr(""); setMsg("");
    setSelected(u);
    setNewPass("");
    setOpenPassword(true);
  }

  function openConfirmDelete(u: AdminUserRow) {
    setErr(""); setMsg("");
    setSelected(u);
    setOpenDelete(true);
  }

  function openCreateUser() {
    setErr(""); setMsg("");
    setCEmail(""); setCName(""); setCActive(true); setCRoleKeys([]); setCPassword("");
    setOpenCreate(true);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-white/70">Usuarios: {filtered.length}</div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, email o UUID..."
            className="w-full md:w-80 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/20"
          />

          <button
            onClick={openCreateUser}
            className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20"
          >
            + Crear usuario
          </button>
        </div>
      </div>

      {(err || msg) && (
        <div
          className={[
            "mb-4 rounded-xl border p-3 text-sm",
            err
              ? "border-red-500/30 bg-red-500/10 text-red-200"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
          ].join(" ")}
        >
          {err || msg}
        </div>
      )}

      <div className="overflow-auto rounded-xl border border-white/10">
        <table className="min-w-[1000px] w-full text-left text-sm">
          <thead className="bg-white/5 text-white/70">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Activo</th>
              <th className="px-4 py-3">Roles</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-t border-white/10">
                <td className="px-4 py-3">
                  <div className="font-semibold">
                    {u.display_name?.trim() ? u.display_name : (u.email ?? "—")}
                  </div>
                  <div className="text-xs text-white/40">{u.id}</div>
                </td>
                <td className="px-4 py-3">{u.email ?? "—"}</td>
                <td className="px-4 py-3">{u.is_active ? chip("Sí") : chip("No")}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {(u.roles ?? []).length
                      ? u.roles!.map((r) => <span key={r}>{chip(r)}</span>)
                      : chip("sin roles")}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      disabled={isPending}
                      onClick={() => openEditProfile(u)}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold hover:bg-white/10 disabled:opacity-60"
                    >
                      Editar
                    </button>

                    <button
                      disabled={isPending}
                      onClick={() => openManageRoles(u)}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold hover:bg-white/10 disabled:opacity-60"
                    >
                      Roles
                    </button>

                    <button
                      disabled={isPending}
                      onClick={() => openChangePass(u)}
                      className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-500/20 disabled:opacity-60"
                    >
                      Clave
                    </button>

                    <button
                      disabled={isPending}
                      onClick={() => openConfirmDelete(u)}
                      className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/20 disabled:opacity-60"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-white/50" colSpan={5}>
                  No hay resultados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL: Gestionar roles */}
      <Modal
        open={openRoles}
        title={`Gestionar roles · ${selected?.email ?? selected?.id ?? ""}`}
        onClose={() => setOpenRoles(false)}
      >
        <div className="space-y-3">
          <div className="text-sm text-white/60">
            Selecciona los roles del usuario. (Se aplican por RLS en la BD)
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {roles.map((r) => {
              const rk = r.key ?? "";
              const checked = rk ? rolePick.includes(rk) : false;
              return (
                <label
                  key={r.id}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={!rk}
                    onChange={(e) => {
                      const on = e.target.checked;
                      setRolePick((prev) =>
                        on ? Array.from(new Set([...prev, rk])) : prev.filter((x) => x !== rk)
                      );
                    }}
                  />
                  <div>
                    <div className="text-sm font-semibold">{r.name}</div>
                    <div className="text-xs text-white/50">{r.key}</div>
                  </div>
                </label>
              );
            })}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setOpenRoles(false)}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              Cancelar
            </button>

            <button
              disabled={isPending || !selected}
              onClick={() => {
                if (!selected) return;
                setErr(""); setMsg("");
                startTransition(async () => {
                  const res = await setUserRoles(selected.id, rolePick);
                  if (!res.ok) setErr(res.error);
                  else { setMsg("Roles actualizados."); router.refresh(); }
                  setOpenRoles(false);
                });
              }}
              className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-60"
            >
              Guardar roles
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Editar perfil (+ email) */}
      <Modal
        open={openProfile}
        title={`Editar usuario · ${selected?.email ?? selected?.id ?? ""}`}
        onClose={() => setOpenProfile(false)}
      >
        <div className="space-y-3">
          <label className="block">
            <div className="mb-1 text-xs text-white/60">Nombre real (display_name)</div>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/20"
              placeholder="Ej: Jerry Sainteron"
            />
          </label>

          <label className="block">
            <div className="mb-1 text-xs text-white/60">Email</div>
            <input
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/20"
              placeholder="correo@ejemplo.com"
            />
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Activo
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setOpenProfile(false)}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              Cancelar
            </button>

            <button
              disabled={isPending || !selected}
              onClick={() => {
                if (!selected) return;
                setErr(""); setMsg("");
                startTransition(async () => {
                  // Actualizar perfil
                  const profRes = await adminUpdateProfile(selected.id, displayName, isActive);
                  if (!profRes.ok) { setErr(profRes.error); return; }

                  // Actualizar email si cambio
                  if (editEmail.trim().toLowerCase() !== (selected.email ?? "").toLowerCase()) {
                    const emailRes = await adminUpdateEmail(selected.id, editEmail);
                    if (!emailRes.ok) { setErr(emailRes.error); return; }
                  }

                  setMsg("Usuario actualizado.");
                  router.refresh();
                  setOpenProfile(false);
                });
              }}
              className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-60"
            >
              Guardar
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Cambiar contrasena */}
      <Modal
        open={openPassword}
        title={`Cambiar contrasena · ${selected?.email ?? selected?.id ?? ""}`}
        onClose={() => setOpenPassword(false)}
      >
        <div className="space-y-3">
          <label className="block">
            <div className="mb-1 text-xs text-white/60">Nueva contrasena</div>
            <input
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/20"
              placeholder="minimo 6 caracteres"
            />
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setOpenPassword(false)}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              Cancelar
            </button>

            <button
              disabled={isPending || !selected}
              onClick={() => {
                if (!selected) return;
                setErr(""); setMsg("");
                startTransition(async () => {
                  const res = await adminSetPassword(selected.id, newPass);
                  if (!res.ok) setErr(res.error);
                  else setMsg("Contrasena actualizada.");
                  setOpenPassword(false);
                });
              }}
              className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-200 hover:bg-amber-500/20 disabled:opacity-60"
            >
              Guardar contrasena
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Confirmar eliminacion */}
      <Modal
        open={openDelete}
        title="Eliminar usuario"
        onClose={() => setOpenDelete(false)}
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            Esta accion es <strong>irreversible</strong>. Se eliminara el usuario de Supabase Auth
            y perdera acceso al sistema de forma permanente.
          </div>

          <div className="text-sm text-white/70">
            <span className="font-semibold text-white">{selected?.display_name || selected?.email}</span>
            {selected?.email && selected?.display_name && (
              <span className="ml-1 text-white/40">({selected.email})</span>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setOpenDelete(false)}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              Cancelar
            </button>

            <button
              disabled={isPending || !selected}
              onClick={() => {
                if (!selected) return;
                setErr(""); setMsg("");
                startTransition(async () => {
                  const res = await adminDeleteUser(selected.id);
                  if (!res.ok) setErr(res.error);
                  else { setMsg("Usuario eliminado correctamente."); router.refresh(); }
                  setOpenDelete(false);
                });
              }}
              className="rounded-xl border border-red-500/40 bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/30 disabled:opacity-60"
            >
              Sí, eliminar
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Crear usuario */}
      <Modal open={openCreate} title="Crear usuario" onClose={() => setOpenCreate(false)}>
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="block">
              <div className="mb-1 text-xs text-white/60">Email</div>
              <input
                value={cEmail}
                onChange={(e) => setCEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/20"
                placeholder="usuario@correo.com"
              />
            </label>

            <label className="block">
              <div className="mb-1 text-xs text-white/60">Nombre real</div>
              <input
                value={cName}
                onChange={(e) => setCName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/20"
                placeholder="Nombre Apellido"
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={cActive} onChange={(e) => setCActive(e.target.checked)} />
            Activo
          </label>

          <label className="block">
            <div className="mb-1 text-xs text-white/60">Contrasena (opcional)</div>
            <input
              type="password"
              value={cPassword}
              onChange={(e) => setCPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/20"
              placeholder="Si lo dejas vacio se genera una temporal"
            />
          </label>

          <div className="text-xs text-white/60">Roles iniciales</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {roles.map((r) => {
              const rk = r.key ?? "";
              const checked = rk ? cRoleKeys.includes(rk) : false;
              return (
                <label
                  key={r.id}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={!rk}
                    onChange={(e) => {
                      const on = e.target.checked;
                      setCRoleKeys((prev) =>
                        on ? Array.from(new Set([...prev, rk])) : prev.filter((x) => x !== rk)
                      );
                    }}
                  />
                  <div>
                    <div className="text-sm font-semibold">{r.name}</div>
                    <div className="text-xs text-white/50">{r.key}</div>
                  </div>
                </label>
              );
            })}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setOpenCreate(false)}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              Cancelar
            </button>

            <button
              disabled={isPending}
              onClick={() => {
                setErr(""); setMsg("");
                startTransition(async () => {
                  const res = await adminCreateUser({
                    email: cEmail,
                    displayName: cName,
                    isActive: cActive,
                    roleKeys: cRoleKeys,
                    password: cPassword || undefined,
                  } as any);

                  if (!res.ok) { setErr(res.error); return; }

                  setMsg(
                    res.tempPassword
                      ? `Usuario creado. Contrasena inicial: ${res.tempPassword}`
                      : "Usuario creado."
                  );
                  router.refresh();
                  setOpenCreate(false);
                });
              }}
              className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-60"
            >
              Crear usuario
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
