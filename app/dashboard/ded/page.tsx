import { redirect } from "next/navigation";
import BackButton from "@/app/components/BackButton";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function DedSesionIndex() {
  redirect(`/dashboard/ded/sesion/${todayISO()}`);
}
