"use client";

type Props = {
  filename: string;
  label: string;
  rows: Array<Record<string, any>>;
};

function toCSV(rows: Array<Record<string, any>>) {
  if (!rows || rows.length === 0) return "";

  const headers = (Array.from(rows.reduce((set: Set<string>, r) => { Object.keys(r).forEach((k) => set.add(k)); return set; }, new Set() as Set<string>)));

  const esc = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    // escapado CSV
    if (s.includes('"') || s.includes(",") || s.includes("\n")) {
      return `"${s.replaceAll('"', '""')}"`;
    }
    return s;
  };

  const lines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => esc(r[h])).join(",")),
  ];

  return lines.join("\n");
}

export default function ExportCSVButton({ filename, label, rows }: Props) {
  return (
    <button
      type="button"
      className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10"
      onClick={() => {
        const csv = toCSV(rows);
        if (!csv) {
          alert("No hay datos para exportar.");
          return;
        }

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
        a.click();

        URL.revokeObjectURL(url);
      }}
    >
      {label}
    </button>
  );
}
