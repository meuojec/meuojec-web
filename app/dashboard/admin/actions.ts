"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminRole = {
  id: string;
  key: string;
  name: string;
  description?: string | null;
};

export type AdminUserRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  is_active: boolean;
  roles: string[];
  role_ids: string[];
  perms?: any;
};

// 1) Usuarios con roles (RPC)
export async function getUsersWithRoles() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_get_users_with_roles");
  if (error) return { ok: false as const, error: error.message, data: [] as AdminUserRow[] };
  return { ok: true as const, data: (data ?? []) as AdminUserRow[] };
}

// 2) Roles (tabla roles)
export async function getRoles() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("roles")
    .select("id,key,name,description")
    .order("name", { ascending: true });
  if (error) return { ok: false as const, error: error.message, data: [] as AdminRole[] };
  return { ok: true as const, data: (data ?? []) as AdminRole[] };
}

// 3) Set roles (RPC)
export async function setUserRoles(userId: string, roleKeys: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "No autenticado." };
  const { error } = await supabase.rpc("admin_set_user_roles", {
    p_user_id: userId,
    p_role_keys: roleKeys,
  });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/dashboard/admin/usuarios");
  return { ok: true as const };
}

// 4) Update perfil (RPC)
export async function adminUpdateProfile(userId: string, displayName: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_update_profile", {
    p_user_id: userId,
    p_display_name: displayName,
    p_is_active: isActive,
  });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/dashboard/admin/usuarios");
  return { ok: true as const };
}

// 5) Update email
export async function adminUpdateEmail(userId: string, newEmail: string) {
  const admin = createAdminClient();
  const email = (newEmail || "").trim().toLowerCase();
  if (!email) return { ok: false as const, error: "El email es obligatorio." };
  const { error } = await admin.auth.admin.updateUserById(userId, { email });
  if (error) return { ok: false as const, error: error.message };
  // Actualizar también en profiles
  await admin.from("profiles").update({ email }).eq("id", userId);
  revalidatePath("/dashboard/admin/usuarios");
  return { ok: true as const };
}

// 6) Eliminar usuario
export async function adminDeleteUser(userId: string) {
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/dashboard/admin/usuarios");
  return { ok: true as const };
}

// 7) Update módulos visibles (profiles.perms)
export async function adminUpdatePerms(userId: string, perms: Record<string, boolean>) {
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ perms }).eq("id", userId);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/dashboard/admin/usuarios");
  return { ok: true as const };
}

// helper: generar contraseña temporal
function genTempPassword(len = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@$%";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

// 8) Crear usuario desde UI (SIN email flow)
export async function adminCreateUser(params: {
  email: string;
  displayName?: string;
  isActive?: boolean;
  password?: string;
  roleKeys?: string[];
}) {
  const admin = createAdminClient();
  const email = (params.email || "").trim().toLowerCase();
  if (!email) return { ok: false as const, error: "Email es obligatorio." };
  const password = (params.password && params.password.trim()) || genTempPassword(10);
  if (password.length < 6) {
    return { ok: false as const, error: "La contrasena debe tener al menos 6 caracteres." };
  }
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) return { ok: false as const, error: error.message };
  const userId = data.user?.id;
  if (!userId) return { ok: false as const, error: "No se pudo obtener el id del usuario creado." };
  const { error: upErr } = await admin
    .from("profiles")
    .upsert({
      id: userId,
      email,
      display_name: params.displayName ?? null,
      is_active: params.isActive ?? true,
      perms: {
        dash: true,
        miembros: false,
        asist: false,
        eventos: false,
        fin: false,
        inv: false,
        ded: false,
        reportes: false,
        admin: false,
      },
    })
    .eq("id", userId);
  if (upErr) return { ok: false as const, error: upErr.message };
  if (params.roleKeys?.length) {
    const supabase = await createClient();
    const { error: roleErr } = await supabase.rpc("admin_set_user_roles", {
      p_user_id: userId,
      p_role_keys: params.roleKeys,
    });
    if (roleErr) return { ok: false as const, error: roleErr.message };
  }
  revalidatePath("/dashboard/admin/usuarios");
  return {
    ok: true as const,
    user_id: userId,
    tempPassword: params.password ? null : password,
  };
}

// 9) Cambiar contrasena (SIN email)
export async function adminSetPassword(userId: string, newPassword: string) {
  const admin = createAdminClient();
  if (!newPassword || newPassword.length < 6) {
    return { ok: false as const, error: "La contrasena debe tener al menos 6 caracteres." };
  }
  const { error } = await admin.auth.admin.updateUserById(userId, { password: newPassword });
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}
