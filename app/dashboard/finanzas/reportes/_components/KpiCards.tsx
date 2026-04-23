type Props = {
  totalIngresos: number;
  totalEgresos: number;
  totalTransferencias: number;
  saldo: number;
  count: number;
};

function money(n: number) {
  return n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
}

export default function KpiCards({ totalIngresos, totalEgresos, totalTransferencias, saldo, count }: Props) {
  return (
    <div className="grid gap-3 md:grid-cols-5">
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="text-xs text-white/60">Total ingresos</div>
        <div className="text-xl font-semibold text-white">{money(totalIngresos)}</div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="text-xs text-white/60">Total egresos</div>
        <div className="text-xl font-semibold text-white">{money(totalEgresos)}</div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="text-xs text-white/60">Transferencias</div>
        <div className="text-xl font-semibold text-white">{money(totalTransferencias)}</div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="text-xs text-white/60">Saldo</div>
        <div className="text-xl font-semibold text-white">{money(saldo)}</div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="text-xs text-white/60">Transacciones</div>
        <div className="text-xl font-semibold text-white">{count.toLocaleString("es-CL")}</div>
      </div>
    </div>
  );
}
