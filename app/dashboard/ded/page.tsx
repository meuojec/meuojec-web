import { redirect } from "next/navigation";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function DedSesionIndex() {
  redirect(`/dashboard/ded/sesion/${todayISO()}`);
}
