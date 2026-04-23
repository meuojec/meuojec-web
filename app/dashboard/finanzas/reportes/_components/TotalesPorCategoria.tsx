type Row = {
  categoria_id: string;
  nombre: string;
  tipo: "INGRESO" | "EGRESO";
  total: number;
  porcentaje: number;
};

function money(n: number) {
  return n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
}

export default function TotalesPorCategoria({ rows }: { rows: Row[] }) {
  const ingresos = rows.filter((r) => r.tipo === "INGRESO");
  const egresos = rows.filter((r) => r.tipo === "EGRESO");

  const section = (title: string, list: Row[]) => (
    <div className="rounded-2xl border border-white/10 bg-black/20">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="text-sm font-semibold text-white">{title}</div>
        <div className="text-xs text-white/60">{list.length} categorías</div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 text-white/70">
            <tr>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">% (grupo)</th>
              <th className="px-4 py-3">Barra</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-white/60" colSpan={4}>
                  Sin datos.
                </td>
              </tr>
            ) : (
              list.map((r) => (
                <tr key={r.categoria_id} className="border-b border-white/5 hover:bg-white/[0.03]">
                  <td className="px-4 py-3 text-white">{r.nombre}</td>
                  <td className="px-4 py-3 text-white/90 font-semibold">{money(r.total)}</td>
                  <td className="px-4 py-3 text-white/80">{(Math.round(r.porcentaje * 100) / 100).toFixed(2)}%</td>
                  <td className="px-4 py-3">
                    <div className="h-2 w-full rounded-full bg-white/10">
                      <div
                        className="h-2 rounded-full bg-white/40"
                        style={{ width: `${Math.min(100, Math.max(0, r.porcentaje))}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {section("Totales por categoría (INGRESOS)", ingresos)}
      {section("Totales por categoría (EGRESOS)", egresos)}
    </div>
  );
}
