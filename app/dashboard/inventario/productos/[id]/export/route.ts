import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";

function fmtCL(dt: string) {
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return dt;
  return d.toLocaleString("es-CL");
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const url = new URL(req.url);
  const ubicacion = (url.searchParams.get("ubicacion") ?? "").trim() || null;

  // 1) Producto
  const { data: producto, error: pErr } = await supabase
    .from("inv_productos")
    .select("id, nombre, sku, barcode, unidad, stock_minimo, activo")
    .eq("id", params.id)
    .single();

  if (pErr || !producto) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  // 2) Movimientos (filtrables)
  let q = supabase
    .from("inv_movimientos")
    .select(
      "fecha, tipo, cantidad, nota, ubicacion_origen_id, ubicacion_destino_id"
    )
    .eq("producto_id", params.id)
    .order("fecha", { ascending: false })
    .limit(5000);

  if (ubicacion) {
    q = q.or(
      `ubicacion_origen_id.eq.${ubicacion},ubicacion_destino_id.eq.${ubicacion}`
    );
  }

  const { data: movs, error: mErr } = await q;
  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 });

  // 3) Diccionario ubicaciones (para mostrar nombres)
  const ids = new Set<string>();
  (movs ?? []).forEach((m: any) => {
    if (m.ubicacion_origen_id) ids.add(m.ubicacion_origen_id);
    if (m.ubicacion_destino_id) ids.add(m.ubicacion_destino_id);
  });

  let ubicMap = new Map<string, string>();
  if (ids.size) {
    const { data: urows } = await supabase
      .from("inv_ubicaciones")
      .select("id, nombre")
      .in("id", Array.from(ids));
    (urows ?? []).forEach((u: any) => ubicMap.set(u.id, u.nombre ?? "—"));
  }

  // ---- Excel ----
  const wb = new ExcelJS.Workbook();
  wb.creator = "MEUOJEC";
  wb.created = new Date();

  // Hoja 1: Resumen
  const ws0 = wb.addWorksheet("Resumen");
  ws0.columns = [
    { header: "Campo", key: "k", width: 20 },
    { header: "Valor", key: "v", width: 50 },
  ];
  ws0.addRow({ k: "Nombre", v: producto.nombre ?? "—" });
  ws0.addRow({ k: "SKU", v: producto.sku ?? "—" });
  ws0.addRow({ k: "Barcode", v: producto.barcode ?? "—" });
  ws0.addRow({ k: "Unidad", v: producto.unidad ?? "—" });
  ws0.addRow({ k: "Stock mínimo", v: producto.stock_minimo ?? 0 });
  ws0.addRow({ k: "Activo", v: producto.activo ? "Sí" : "No" });
  ws0.addRow({ k: "Filtro ubicación", v: ubicacion ? (ubicMap.get(ubicacion) ?? ubicacion) : "Todas" });

  ws0.getRow(1).font = { bold: true };

  // Hoja 2: Movimientos
  const ws = wb.addWorksheet("Movimientos");
  ws.columns = [
    { header: "Fecha", key: "fecha", width: 22 },
    { header: "Tipo", key: "tipo", width: 12 },
    { header: "Cantidad", key: "cantidad", width: 12 },
    { header: "Origen", key: "origen", width: 22 },
    { header: "Destino", key: "destino", width: 22 },
    { header: "Nota", key: "nota", width: 40 },
  ];

  ws.getRow(1).font = { bold: true };

  (movs ?? []).forEach((m: any) => {
    ws.addRow({
      fecha: fmtCL(m.fecha),
      tipo: m.tipo,
      cantidad: Number(m.cantidad ?? 0),
      origen: m.ubicacion_origen_id ? (ubicMap.get(m.ubicacion_origen_id) ?? m.ubicacion_origen_id) : "—",
      destino: m.ubicacion_destino_id ? (ubicMap.get(m.ubicacion_destino_id) ?? m.ubicacion_destino_id) : "—",
      nota: m.nota ?? "",
    });
  });

  // Congelar encabezado
  ws.views = [{ state: "frozen", ySplit: 1 }];

  // Formato numérico cantidad
  ws.getColumn("cantidad").numFmt = "#,##0.####";

  // Generar buffer
  const buf = await wb.xlsx.writeBuffer();

  const safeName = String(producto.nombre ?? "producto")
    .replace(/[\\/:*?"<>|]/g, "-")
    .slice(0, 60);

  const filename = `movimientos_${safeName}_${params.id.slice(0, 8)}.xlsx`;

  return new NextResponse(Buffer.from(buf), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}