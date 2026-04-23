type Row = {
  mes: string; // YYYY-MM
  ingresos: number;
  egresos: number;
  transferencias: number;
  saldo: number;
};

function money(n: number) {
  return n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
}

export default function SerieMensual({ rows }: { rows: Row[] }) {
  const max = rows.reduce((m, r) => Math.max(m, r.ingresos, r.egresos, r.transferencias), 0);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="text-sm font-semibold text-white">Serie mensual</div>
        <div className="text-xs text-white/60">{rows.length} meses</div>
      </div>

      {rows.length === 0 ? (
        <div className="px-4 py-8 text-white/60">Sin datos para el rango seleccionado.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-white/70">
              <tr>
                <th className="px-4 py-3">Mes</th>
                <th className="px-4 py-3">Ingresos</th>
                <th className="px-4 py-3">Egresos</th>
                <th className="px-4 py-3">Transferencias</th>
                <th className="px-4 py-3">Saldo</th>
                <th className="px-4 py-3">Visual</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const wIng = max > 0 ? (r.ingresos / max) * 100 : 0;
                const wEgr = max > 0 ? (r.egresos / max) * 100 : 0;

                return (
                  <tr key={r.mes} className="border-b border-white/5 hover:bg-white/[0.03]">
                    <td className="px-4 py-3 text-white">{r.mes}</td>
                    <td className="px-4 py-3 text-white/90 font-semibold">{money(r.ingresos)}</td>
                    <td className="px-4 py-3 text-white/90 font-semibold">{money(r.egresos)}</td>
                    <td className="px-4 py-3 text-white/80">{money(r.transferencias)}</td>
                    <td className="px-4 py-3 text-white/90 font-semibold">{money(r.saldo)}</td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="h-2 w-full rounded-full bg-white/10">
                          <div className="h-2 rounded-full bg-white/40" style={{ width: `${Math.min(100, wIng)}%` }} />
                        </div>
                        <div className="h-2 w-full rounded-full bg-white/10">
                          <div className="h-2 rounded-full bg-white/25" style={{ width: `${Math.min(100, wEgr)}%` }} />
                        </div>
                        <div className="text-[10px] text-white/50">Arriba: ingresos · Abajo: egresos</div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
