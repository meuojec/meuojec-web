export const CL_TZ = "America/Santiago";

export const MESES_ES = [
  "enero","febrero","marzo","abril","mayo","junio",
  "julio","agosto","septiembre","octubre","noviembre","diciembre",
];

export function todayISO() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: CL_TZ }).format(new Date());
}

export function fmtDateCL(dateStr: string) {
  return new Intl.DateTimeFormat("es-CL", {
    timeZone: CL_TZ, weekday: "long", day: "2-digit", month: "long", year: "numeric",
  }).format(new Date(dateStr));
}

export function fmtDateTimeCL(dateStr: string) {
  return new Intl.DateTimeFormat("es-CL", {
    timeZone: CL_TZ, weekday: "short", day: "2-digit", month: "short",
    year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(new Date(dateStr));
}

export function fmtDayMonthCL(dateStr?: string | null) {
  if (!dateStr) return "—";
  const [yy, mm, dd] = dateStr.split("-").map(Number);
  if (!yy || !mm || !dd) return "—";
  return `${String(dd).padStart(2, "0")} de ${MESES_ES[mm - 1] ?? ""}`;
}
