// ============================================================
//  MEUOJEC — Sincronización Google Sheets → Supabase
//  Pega este código en: script.google.com (nuevo proyecto)
//  Luego ejecuta: sincronizarMiembros()
// ============================================================

// ── CONFIGURACIÓN ────────────────────────────────────────────
var CONFIG = {
  SHEET_ID:       "1rsacpWEar7V1MUq0zC90pA1qecRrW-oEmgCjXbhYzAg",
  SHEET_NAME:     "Hoja1",                  // <-- cambia si tu hoja tiene otro nombre
  SUPABASE_URL:   "https://mhewguufhtdinryeukbe.supabase.co",
  SUPABASE_KEY:   "TU_SUPABASE_SERVICE_ROLE_KEY_AQUI",
  BUCKET:         "fotos-identidad",
  TABLE:          "miembros",

  // Carpeta raíz donde AppSheet guarda las fotos en Google Drive.
  // Normalmente es algo como: AppSheet/data/{NombreApp}
  // Deja null y el script buscará el archivo por nombre en todo Drive.
  APPSHEET_DRIVE_FOLDER_ID: null,
};

// ── MAPEO: columnas del Sheet → columnas de Supabase ─────────
// El índice 0 corresponde a la primera columna del Sheet (A).
var COLUMNS = {
  RUT:                        0,   // A
  NOMBRES:                    1,   // B
  APELLIDOS:                  2,   // C
  FOTO_DE_IDENTIDAD:          3,   // D
  SEXO:                       4,   // E
  FECHA_DE_NACIMIENTO:        5,   // F
  NACIONALIDAD:               6,   // G
  EDAD:                       7,   // H  (se recalcula, pero la guardamos igual)
  ESTADO_CIVIL:               8,   // I
  FECHA_DE_MATRIMONIO:        9,   // J
  ANIO_DE_MATRIMONIO:        10,   // K
  NOMBRE_DEL_CONYUGE:        11,   // L
  NRO_DE_HIJOS:              12,   // M
  DIRECCION:                 13,   // N
  COMUNA:                    14,   // O
  TELEFONO:                  15,   // P
  CORREO_ELECTRONICO:        16,   // Q
  RAZON_DE_ALTA:             17,   // R
  FECHA_DE_CONVERSION:       18,   // S
  FECHA_DE_BAUTIZO:          19,   // T
  ESTADO_DE_MEMBRESIA:       20,   // U
  DEPARTAMENTO_MINISTERIOS:  21,   // V
  ASISTIA_ANTES_OTRA_IGLESIA:22,  // W
  NOMBRE_IGLESIA_ANTERIOR:   23,   // X
  PROFESION_U_OFICIO:        24,   // Y
  LUGAR_TRABAJO_ESTUDIO:     25,   // Z
  NIVEL_ACADEMICO:           26,   // AA
  DED:                       27,   // AB
  PREVISION_SALUD:           28,   // AC
  ALERGIA_MEDICAMENTOS:      29,   // AD
  MEDICACION_PERMANENTE:     30,   // AE
  DISCAPACIDAD_FISICA:       31,   // AF
  TIENE_VEHICULO:            32,   // AG
  MARCA_Y_MODELO:            33,   // AH
  PATENTE:                   34,   // AI
  OBSERVACIONES:             35,   // AJ
};

// ── FUNCIÓN PRINCIPAL ─────────────────────────────────────────
function sincronizarMiembros() {
  var ss    = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

  if (!sheet) {
    Logger.log("❌ No se encontró la hoja: " + CONFIG.SHEET_NAME);
    Logger.log("Hojas disponibles: " + ss.getSheets().map(function(s){ return s.getName(); }).join(", "));
    return;
  }

  var data      = sheet.getDataRange().getValues();
  var headers   = data[0];  // Fila 1 = encabezados
  var rows      = data.slice(1);

  Logger.log("📋 Total filas encontradas: " + rows.length);

  var ok = 0, errores = 0, saltados = 0;

  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var rut = normalizeRut(String(row[COLUMNS.RUT] || ""));

    if (!rut) {
      Logger.log("⚠️  Fila " + (i + 2) + ": RUT vacío, saltando.");
      saltados++;
      continue;
    }

    try {
      // 1) Procesar foto
      var fotoResult = procesarFoto(row, rut);

      // 2) Construir payload
      var payload = construirPayload(row, rut, fotoResult.foto_path, fotoResult.foto_url);

      // 3) Upsert en Supabase
      upsertMiembro(payload);

      Logger.log("✅ Fila " + (i + 2) + " — " + rut + " — OK (nuevo o ya existía)");
      ok++;

    } catch (e) {
      Logger.log("❌ Fila " + (i + 2) + " — " + rut + " — ERROR: " + e.message);
      errores++;
    }

    // Pausa pequeña para no superar límites de la API
    Utilities.sleep(200);
  }

  Logger.log("─────────────────────────────────────────");
  Logger.log("✅ Sincronizados: " + ok);
  Logger.log("⚠️  Saltados:     " + saltados);
  Logger.log("❌ Errores:       " + errores);
  Logger.log("─────────────────────────────────────────");
}

// ── PROCESAR FOTO ─────────────────────────────────────────────
function procesarFoto(row, rut) {
  var fotoCelda = String(row[COLUMNS.FOTO_DE_IDENTIDAD] || "").trim();

  if (!fotoCelda) {
    return { foto_path: null, foto_url: null };
  }

  try {
    var blob = null;
    var ext  = "jpg";

    // Caso A: URL de Google Drive (drive.google.com/...)
    if (fotoCelda.indexOf("drive.google.com") !== -1) {
      var fileId = extraerDriveId(fotoCelda);
      if (fileId) {
        var driveFile = DriveApp.getFileById(fileId);
        blob = driveFile.getBlob();
        ext  = extensionDeMime(driveFile.getMimeType());
      }

    // Caso B: Path de AppSheet (ej: "Miembros/FOTO DE IDENTIDAD/12345678-9.FOTO DE IDENTIDAD.jpg")
    } else if (fotoCelda.indexOf("/") !== -1 || fotoCelda.indexOf(".") !== -1) {
      // Buscar por nombre de archivo en Drive
      var nombreArchivo = fotoCelda.split("/").pop();
      ext = nombreArchivo.split(".").pop().toLowerCase() || "jpg";

      var archivos;
      if (CONFIG.APPSHEET_DRIVE_FOLDER_ID) {
        var folder = DriveApp.getFolderById(CONFIG.APPSHEET_DRIVE_FOLDER_ID);
        archivos = buscarArchivoEnCarpeta(folder, nombreArchivo);
      } else {
        archivos = DriveApp.getFilesByName(nombreArchivo);
      }

      if (archivos && archivos.hasNext()) {
        blob = archivos.next().getBlob();
      } else {
        // Intentar búsqueda alternativa con el prefijo del RUT
        var prefijo = rut + ".FOTO DE IDENTIDAD";
        var busqueda = DriveApp.searchFiles("title contains '" + prefijo + "'");
        if (busqueda.hasNext()) {
          var f = busqueda.next();
          blob = f.getBlob();
          ext  = extensionDeMime(f.getMimeType());
        }
      }
    }

    if (!blob) {
      Logger.log("  ⚠️  " + rut + ": Foto no encontrada en Drive → se omite");
      return { foto_path: null, foto_url: null };
    }

    // Subir a Supabase Storage
    var safeExt   = ["jpg","jpeg","png","webp"].indexOf(ext) !== -1 ? ext : "jpg";
    var foto_path = rut + ".FOTO DE IDENTIDAD." + safeExt;
    var foto_url  = subirFotoSupabase(blob, foto_path, "image/" + safeExt);

    Logger.log("  📷 " + rut + ": Foto subida → " + foto_path);
    return { foto_path: foto_path, foto_url: foto_url };

  } catch (e) {
    Logger.log("  ⚠️  " + rut + ": Error procesando foto — " + e.message);
    return { foto_path: null, foto_url: null };
  }
}

// ── SUBIR FOTO A SUPABASE STORAGE ─────────────────────────────
function subirFotoSupabase(blob, path, mimeType) {
  var url = CONFIG.SUPABASE_URL + "/storage/v1/object/" + CONFIG.BUCKET + "/" + encodeURIComponent(path);

  var response = UrlFetchApp.fetch(url, {
    method:             "POST",
    contentType:        mimeType,
    payload:            blob.getBytes(),
    muteHttpExceptions: true,
    headers: {
      "apikey":        CONFIG.SUPABASE_KEY,
      "Authorization": "Bearer " + CONFIG.SUPABASE_KEY,
      "x-upsert":      "true",   // sobreescribir si ya existe
    },
  });

  var code = response.getResponseCode();
  if (code !== 200 && code !== 201) {
    // Foto ya existente (200/200 con upsert) — obtener URL pública de todas formas
    Logger.log("    Storage response " + code + ": " + response.getContentText().substring(0, 120));
  }

  // Devolver URL pública
  return CONFIG.SUPABASE_URL + "/storage/v1/object/public/" + CONFIG.BUCKET + "/" + encodeURIComponent(path);
}

// ── CONSTRUIR PAYLOAD ─────────────────────────────────────────
function construirPayload(row, rut, foto_path, foto_url) {
  var payload = {
    rut:                       rut,
    nombres:                   strOrNull(row[COLUMNS.NOMBRES]),
    apellidos:                 strOrNull(row[COLUMNS.APELLIDOS]),
    sexo:                      strOrNull(row[COLUMNS.SEXO]),
    fecha_nacimiento:          fechaISO(row[COLUMNS.FECHA_DE_NACIMIENTO]),
    edad:                      intOrNull(row[COLUMNS.EDAD]),
    nacionalidad:              strOrNull(row[COLUMNS.NACIONALIDAD]),
    estado_civil:              strOrNull(row[COLUMNS.ESTADO_CIVIL]),
    fecha_matrimonio:          fechaISO(row[COLUMNS.FECHA_DE_MATRIMONIO]),
    anio_matrimonio:           intOrNull(row[COLUMNS.ANIO_DE_MATRIMONIO]),
    nombre_conyuge:            strOrNull(row[COLUMNS.NOMBRE_DEL_CONYUGE]),
    numero_hijos:              intOrNull(row[COLUMNS.NRO_DE_HIJOS]),
    direccion:                 strOrNull(row[COLUMNS.DIRECCION]),
    comuna:                    strOrNull(row[COLUMNS.COMUNA]),
    telefono:                  strOrNull(row[COLUMNS.TELEFONO]),
    correo_electronico:        strOrNull(row[COLUMNS.CORREO_ELECTRONICO]),
    razon_alta:                strOrNull(row[COLUMNS.RAZON_DE_ALTA]),
    fecha_conversion:          fechaISO(row[COLUMNS.FECHA_DE_CONVERSION]),
    fecha_bautizo:             fechaISO(row[COLUMNS.FECHA_DE_BAUTIZO]),
    estado_membresia:          strOrNull(row[COLUMNS.ESTADO_DE_MEMBRESIA]),
    departamento:              strOrNull(row[COLUMNS.DEPARTAMENTO_MINISTERIOS]),
    asiste_antes_otra_iglesia: boolOrNull(row[COLUMNS.ASISTIA_ANTES_OTRA_IGLESIA]),
    nombre_iglesia_anterior:   strOrNull(row[COLUMNS.NOMBRE_IGLESIA_ANTERIOR]),
    profesion_oficio:          strOrNull(row[COLUMNS.PROFESION_U_OFICIO]),
    lugar_trabajo_estudio:     strOrNull(row[COLUMNS.LUGAR_TRABAJO_ESTUDIO]),
    nivel_academico:           strOrNull(row[COLUMNS.NIVEL_ACADEMICO]),
    ded:                       strOrNull(row[COLUMNS.DED]),
    prevision:                 strOrNull(row[COLUMNS.PREVISION_SALUD]),
    alergia_medicamento:       strOrNull(row[COLUMNS.ALERGIA_MEDICAMENTOS]),
    medicacion_permanente:     strOrNull(row[COLUMNS.MEDICACION_PERMANENTE]),
    discapacidad_fisica:       boolOrNull(row[COLUMNS.DISCAPACIDAD_FISICA]),
    tiene_vehiculo:            boolOrNull(row[COLUMNS.TIENE_VEHICULO]),
    marca_modelo:              strOrNull(row[COLUMNS.MARCA_Y_MODELO]),
    patente:                   strOrNull(row[COLUMNS.PATENTE]),
    observaciones:             strOrNull(row[COLUMNS.OBSERVACIONES]),
  };

  // Fotos solo si se obtuvieron
  if (foto_path) payload.foto_path = foto_path;
  if (foto_url)  payload.foto_url  = foto_url;

  // No sobreescribir con null: si el Sheet tiene vacío un campo,
  // se respeta el valor que ya existe en Supabase (ej. ingresado por la web).
  // Solo se envían los campos que tienen valor real desde el Sheet.
  var CAMPOS_OBLIGATORIOS = { rut: true, nombres: true, apellidos: true,
                               fecha_nacimiento: true, estado_membresia: true };
  Object.keys(payload).forEach(function(k) {
    if (payload[k] === null && !CAMPOS_OBLIGATORIOS[k]) {
      delete payload[k];
    }
  });

  return payload;
}

// ── UPSERT EN SUPABASE ────────────────────────────────────────
function upsertMiembro(payload) {
  var url = CONFIG.SUPABASE_URL + "/rest/v1/" + CONFIG.TABLE;

  var response = UrlFetchApp.fetch(url, {
    method:             "POST",
    contentType:        "application/json",
    payload:            JSON.stringify(payload),
    muteHttpExceptions: true,
    headers: {
      "apikey":          CONFIG.SUPABASE_KEY,
      "Authorization":   "Bearer " + CONFIG.SUPABASE_KEY,
      "Content-Type":    "application/json",
      "Prefer":          "resolution=ignore-duplicates",  // INSERT solo si no existe, nunca sobreescribe
    },
  });

  var code = response.getResponseCode();
  if (code !== 200 && code !== 201) {
    var body = response.getContentText();
    throw new Error("HTTP " + code + " — " + body.substring(0, 200));
  }
}

// ── HELPERS ───────────────────────────────────────────────────

function normalizeRut(rut) {
  var clean = rut.replace(/[^0-9kK]/g, "").toUpperCase();
  if (clean.length < 2) return "";
  return clean.slice(0, -1) + "-" + clean.slice(-1);
}

function strOrNull(val) {
  if (val === null || val === undefined) return null;
  var s = String(val).trim();
  return s ? s : null;
}

function intOrNull(val) {
  if (val === null || val === undefined || val === "") return null;
  var n = parseInt(String(val), 10);
  return isNaN(n) ? null : n;
}

function boolOrNull(val) {
  if (val === null || val === undefined || val === "") return null;
  var s = String(val).trim().toLowerCase();
  if (s === "true" || s === "sí" || s === "si" || s === "yes" || s === "1" || s === "x") return true;
  if (s === "false" || s === "no"  || s === "0") return false;
  return null;
}

function fechaISO(val) {
  if (!val || val === "") return null;
  // Si ya es un objeto Date (Google Sheets lo deserializa automáticamente)
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    var y = val.getFullYear();
    var m = String(val.getMonth() + 1).padStart(2, "0");
    var d = String(val.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  }
  // Si es string con formato DD/MM/YYYY o DD-MM-YYYY
  var s = String(val).trim();
  var match = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (match) {
    return match[3] + "-" + match[2].padStart(2,"0") + "-" + match[1].padStart(2,"0");
  }
  // Si ya es YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return null;
}

function extensionDeMime(mimeType) {
  var mapa = {
    "image/jpeg":    "jpg",
    "image/jpg":     "jpg",
    "image/png":     "png",
    "image/webp":    "webp",
    "image/gif":     "gif",
  };
  return mapa[mimeType] || "jpg";
}

function extraerDriveId(url) {
  // Formatos: /file/d/{ID}/view  o  id={ID}  o  /d/{ID}
  var match = url.match(/\/d\/([a-zA-Z0-9_-]{20,})/);
  if (match) return match[1];
  match = url.match(/[?&]id=([a-zA-Z0-9_-]{20,})/);
  if (match) return match[1];
  return null;
}

function buscarArchivoEnCarpeta(folder, nombre) {
  // Búsqueda recursiva dentro de una carpeta
  var files = folder.getFilesByName(nombre);
  if (files.hasNext()) return files;

  var subfolders = folder.getFolders();
  while (subfolders.hasNext()) {
    var result = buscarArchivoEnCarpeta(subfolders.next(), nombre);
    if (result && result.hasNext()) return result;
  }
  return null;
}

// ── FUNCIÓN AUXILIAR: ver nombres de hojas disponibles ────────
function listarHojas() {
  var ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  var hojas = ss.getSheets().map(function(s) { return s.getName(); });
  Logger.log("Hojas disponibles: " + hojas.join(", "));
}

// ── FUNCIÓN AUXILIAR: probar con UNA sola fila ────────────────
function probarPrimeraFila() {
  var ss    = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) { Logger.log("Hoja no encontrada"); return; }

  var data = sheet.getDataRange().getValues();
  var row  = data[1]; // Fila 2 (primera de datos)

  Logger.log("RUT raw: "     + row[COLUMNS.RUT]);
  Logger.log("Nombres: "     + row[COLUMNS.NOMBRES]);
  Logger.log("Apellidos: "   + row[COLUMNS.APELLIDOS]);
  Logger.log("Foto celda: "  + row[COLUMNS.FOTO_DE_IDENTIDAD]);
  Logger.log("Fecha nac: "   + row[COLUMNS.FECHA_DE_NACIMIENTO]);
  Logger.log("Sexo: "        + row[COLUMNS.SEXO]);
}

// ── LIMPIAR: borra de Supabase los miembros que NO están en el Sheet ──────────
function limpiarMiembrosHuerfanos() {
  var ss    = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  var data  = sheet.getDataRange().getValues();

  // Construir set de RUTs válidos desde el Sheet
  var rutsSheet = {};
  for (var i = 1; i < data.length; i++) {
    var rut = normalizeRut(String(data[i][COLUMNS.RUT] || ""));
    if (rut) rutsSheet[rut] = true;
  }
  Logger.log("RUTs en Sheet: " + Object.keys(rutsSheet).length);

  // Traer todos los RUTs de Supabase
  var url = CONFIG.SUPABASE_URL + "/rest/v1/" + CONFIG.TABLE + "?select=rut&limit=1000";
  var response = UrlFetchApp.fetch(url, {
    method: "GET",
    muteHttpExceptions: true,
    headers: {
      "apikey":        CONFIG.SUPABASE_KEY,
      "Authorization": "Bearer " + CONFIG.SUPABASE_KEY,
    },
  });

  var miembrosSupabase = JSON.parse(response.getContentText());
  Logger.log("RUTs en Supabase: " + miembrosSupabase.length);

  // Mostrar y eliminar los que NO están en el Sheet
  var eliminados = 0;
  miembrosSupabase.forEach(function(m) {
    if (!rutsSheet[m.rut]) {
      Logger.log("🗑️  Eliminando huérfano: " + m.rut);
      var delUrl = CONFIG.SUPABASE_URL + "/rest/v1/" + CONFIG.TABLE
                 + "?rut=eq." + encodeURIComponent(m.rut);
      UrlFetchApp.fetch(delUrl, {
        method: "DELETE",
        muteHttpExceptions: true,
        headers: {
          "apikey":        CONFIG.SUPABASE_KEY,
          "Authorization": "Bearer " + CONFIG.SUPABASE_KEY,
        },
      });
      eliminados++;
    }
  });

  Logger.log("─────────────────────────────────────────");
  Logger.log("✅ Eliminados: " + eliminados + " miembros huérfanos.");
  Logger.log("📋 Quedan en Supabase: " + (miembrosSupabase.length - eliminados));
  Logger.log("─────────────────────────────────────────");
}
