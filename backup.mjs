#!/usr/bin/env node
/**
 * scripts/backup.mjs
 * Backup semanal MEUOJEC: Supabase → ZIP de CSVs → Google Drive
 *
 * Variables de entorno requeridas:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   GOOGLE_SERVICE_ACCOUNT_KEY   (JSON completo de la cuenta de servicio)
 *   GOOGLE_DRIVE_FOLDER_ID       (ID de la carpeta destino en Drive)
 */

import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";
import { createWriteStream, createReadStream } from "fs";
import { mkdir, writeFile, rm } from "fs/promises";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";
import archiver from "archiver";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Validar env ──────────────────────────────────────────────────────────────
const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  GOOGLE_SERVICE_ACCOUNT_KEY,
  GOOGLE_DRIVE_FOLDER_ID,
} = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌  Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
if (!GOOGLE_SERVICE_ACCOUNT_KEY || !GOOGLE_DRIVE_FOLDER_ID) {
  console.error("❌  Faltan GOOGLE_SERVICE_ACCOUNT_KEY y/o GOOGLE_DRIVE_FOLDER_ID");
  process.exit(1);
}

// ─── Tablas a exportar ────────────────────────────────────────────────────────
const TABLES = [
  // Personas
  "miembros",
  "miembros_historial",
  "profiles",
  // Asistencias
  "asistencias",
  // Eventos
  "eventos",
  "eventos_sesiones",
  // Finanzas
  "contribuciones",
  "fin_categorias",
  "fin_cierres",
  "fin_cuentas",
  "fin_movimientos",
  // Pastoral
  "visitantes",
  "visitantes_seguimiento",
  "seguimiento_pastoral",
  // Ministerios
  "ministerios",
  "miembros_ministerios",
  // Comunicación
  "anuncios",
  "agenda",
  // Roles
  "roles",
  // Escuela Dominical
  "ded_clases",
  "ded_sesiones",
  "ded_sesion_detalle",
  // Inventario
  "inv_categorias",
  "inv_productos",
  "inv_stock",
  "inv_ubicaciones",
  "inv_movimientos",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toCSV(rows) {
  if (!rows || rows.length === 0) return "﻿"; // BOM vacío
  const headers = Object.keys(rows[0]);
  const escape = (v) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const lines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ];
  return "﻿" + lines.join("\n");
}

async function fetchTable(supabase, table) {
  let all = [];
  let from = 0;
  const PAGE = 1000;
  for (;;) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

function nowChile() {
  // Devuelve string tipo "2026-04-27T00-00" (safe para nombre de archivo)
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
    .format(new Date())
    .replace(" ", "T")
    .replace(/:/g, "-");
}

function zipDir(srcDir, destZip) {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(destZip);
    const archive = archiver("zip", { zlib: { level: 9 } });
    output.on("close", resolve);
    archive.on("error", reject);
    archive.pipe(output);
    archive.directory(srcDir, false);
    archive.finalize();
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const label = nowChile();
  const tmpDir = resolve(__dirname, `tmp/backup-${label}`);
  const zipPath = resolve(__dirname, `tmp/meuojec-backup-${label}.zip`);

  console.log(`\n🗂  Backup MEUOJEC — ${label}\n`);

  // 1) Cliente Supabase (service role — sin RLS)
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // 2) Directorio temporal
  await mkdir(tmpDir, { recursive: true });

  // 3) Exportar cada tabla a CSV
  let ok = 0;
  let fail = 0;
  for (const table of TABLES) {
    try {
      const rows = await fetchTable(supabase, table);
      await writeFile(join(tmpDir, `${table}.csv`), toCSV(rows), "utf-8");
      console.log(`  ✓  ${table.padEnd(28)} ${rows.length} filas`);
      ok++;
    } catch (e) {
      console.warn(`  ⚠  ${table.padEnd(28)} ERROR: ${e.message}`);
      fail++;
    }
  }

  // 4) Crear ZIP
  console.log(`\n📦  Comprimiendo ${ok} archivos...`);
  await zipDir(tmpDir, zipPath);
  console.log(`  ✓  ZIP: meuojec-backup-${label}.zip`);

  // 5) Subir a Google Drive
  console.log(`\n☁️   Subiendo a Google Drive...`);
  const creds = JSON.parse(GOOGLE_SERVICE_ACCOUNT_KEY);
  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });
  const drive = google.drive({ version: "v3", auth });

  const { data: uploaded } = await drive.files.create({
    requestBody: {
      name: `meuojec-backup-${label}.zip`,
      mimeType: "application/zip",
      parents: [GOOGLE_DRIVE_FOLDER_ID],
    },
    media: {
      mimeType: "application/zip",
      body: createReadStream(zipPath),
    },
    fields: "id,name",
  });
  console.log(`  ✓  Subido: ${uploaded.name}  (id: ${uploaded.id})`);

  // 6) Limpiar temporales
  await rm(tmpDir, { recursive: true, force: true });
  await rm(zipPath, { force: true });

  console.log(`\n✅  Backup completado — ${ok} tablas OK, ${fail} con advertencia\n`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error("\n❌  Backup fallido:", e.message);
  process.exit(1);
});
