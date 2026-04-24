import React from "react";
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

export const CARD_W = 242;
export const CARD_H = 153;

const NAVY  = "#0B1220";
const GOLD  = "#C9A94E";
const WHITE = "#FFFFFF";
const GRAY  = "#6B7280";
const DARK  = "#111827";

const HEADER_H   = 38;
const FOOTER_H   = 22;
const GOLDLINE_H = 2;
const BODY_H     = CARD_H - HEADER_H - FOOTER_H - GOLDLINE_H; // 91

const PHOTO_W = 56;
const PHOTO_H = 74;
const PHOTO_R = 7;

export type CarnetProps = {
  iglesiaFull: string;
  iglesiaShort: string;
  logoUrl?: string | null;
  watermarkUrl?: string | null;
  miembro: {
    rut: string;
    nombres?: string | null;
    apellidos?: string | null;
    fecha_nacimiento?: string | null;
  };
  fotoUrl?: string | null;
  qrDataUrl: string;
};

export type CarnetBackProps = {
  iglesiaFull: string;
  iglesiaShort: string;
  logoUrl?: string | null;
  direccion: string;
  telefono: string;
  web: string;
  qrWebDataUrl: string;
  rut: string;
};

function safe(s?: string | null) { return (s ?? "").trim(); }

function formatDate(raw?: string | null) {
  if (!raw) return "";
  // Parse YYYY-MM-DD directly to avoid timezone shifts
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return raw;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

const s = StyleSheet.create({
  page: { padding: 0, backgroundColor: WHITE },

  card: {
    width: CARD_W,
    height: CARD_H,
    borderWidth: 1.5,
    borderColor: GOLD,
    borderRadius: 10,
    overflow: "hidden",
    fontFamily: "Helvetica",
    backgroundColor: WHITE,
    position: "relative",
  },

  /* HEADER */
  header: {
    height: HEADER_H,
    backgroundColor: NAVY,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    gap: 8,
  },
  logoCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: GOLD,
    overflow: "hidden",
    flexShrink: 0,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  logoImg: {
    width: 22,
    height: 22,
    objectFit: "contain",
  },
  churchCol: { flex: 1 },
  churchFull: {
    fontSize: 5.4,
    color: WHITE,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.1,
    lineHeight: 1.3,
    textTransform: "uppercase",
  },
  churchShort: {
    fontSize: 8,
    color: GOLD,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 2,
    marginTop: 2,
  },

  /* BODY */
  body: {
    height: BODY_H,
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingTop: 7,
    paddingBottom: 5,
    gap: 8,
  },

  /* PHOTO: outer (position:relative, no overflow) wraps inner (overflow:hidden) + overlay */
  photoOuter: {
    width: PHOTO_W,
    height: PHOTO_H,
    position: "relative",
    flexShrink: 0,
  },
  photoInner: {
    width: PHOTO_W,
    height: PHOTO_H,
    borderRadius: PHOTO_R,
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
  },
  photoImg: {
    width: PHOTO_W,
    height: PHOTO_H,
    objectFit: "cover",
  },
  /* Gold border drawn ON TOP of photo to cover corner artifacts */
  photoBorderOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: PHOTO_W,
    height: PHOTO_H,
    borderRadius: PHOTO_R,
    borderWidth: 1.5,
    borderColor: GOLD,
  },

  /* INFO */
  infoCol: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "flex-start",
    paddingTop: 1,
  },
  tagLabel: {
    fontSize: 5.5,
    color: GRAY,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  /* Nombres y apellidos en lineas separadas */
  memberNombre: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    lineHeight: 1.2,
  },
  memberApellido: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    lineHeight: 1.2,
    marginTop: 1,
  },
  fieldsWrap: { marginTop: 7, gap: 3 },
  fieldRow: { flexDirection: "row", gap: 4, alignItems: "center" },
  fieldLabel: { fontSize: 7, color: GRAY, minWidth: 44 },
  fieldValue: { fontSize: 7.5, color: DARK, fontFamily: "Helvetica-Bold" },

  /* QR grande */
  qrCol: {
    width: 66,
    alignItems: "center",
    justifyContent: "center",
  },
  qrBox: {
    width: 63,
    height: 63,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: GOLD,
    backgroundColor: "#FAFAFA",
    alignItems: "center",
    justifyContent: "center",
  },
  qrImg: { width: 55, height: 55 },

  /* GOLD LINE */
  goldLine: { height: GOLDLINE_H, backgroundColor: GOLD },

  /* FOOTER */
  footer: {
    height: FOOTER_H,
    backgroundColor: NAVY,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  footText: { fontSize: 7, color: "rgba(255,255,255,0.65)" },
  footDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: GOLD,
    marginHorizontal: 5,
  },
  footRight: { flexDirection: "row", alignItems: "center" },

  /* WATERMARK */
  wmWrap: {
    position: "absolute",
    left: 0,
    top: HEADER_H,
    width: CARD_W,
    height: BODY_H,
    alignItems: "center",
    justifyContent: "center",
  },
  wm: { width: 110, height: 110, objectFit: "contain", opacity: 0.04 },

  /* ── REVERSO ── */
  cardBack: {
    width: CARD_W,
    height: CARD_H,
    borderWidth: 1.5,
    borderColor: GOLD,
    borderRadius: 10,
    overflow: "hidden",
    fontFamily: "Helvetica",
    backgroundColor: NAVY,
    position: "relative",
  },
  backHeader: {
    height: 28,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(201,169,78,0.3)",
  },
  backLogoCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(201,169,78,0.5)",
    flexShrink: 0,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  backLogoImg: { width: 14, height: 14, objectFit: "contain" },
  backChurchShort: { fontSize: 7, color: WHITE, fontFamily: "Helvetica-Bold", letterSpacing: 1.0 },
  backChurchFull:  { fontSize: 4.5, color: "rgba(201,169,78,0.7)", letterSpacing: 0.1, marginTop: 1 },
  backBody: {
    flex: 1,
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 3,
    gap: 8,
  },
  backInfo: { flex: 1, gap: 3 },
  backFieldWrap: { gap: 1 },
  backFieldLabel: {
    fontSize: 6,
    color: "rgba(201,169,78,0.65)",
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  backFieldVal: { fontSize: 8.5, color: WHITE, fontFamily: "Helvetica-Bold" },
  backFieldSub:  { fontSize: 6.5, color: "rgba(255,255,255,0.45)" },
  divider: {
    borderTopWidth: 1,
    borderTopColor: "rgba(201,169,78,0.2)",
    borderStyle: "dashed",
    marginTop: 3,
    paddingTop: 3,
  },
  foundLabel: { fontSize: 5.5, color: "rgba(201,169,78,0.6)", fontFamily: "Helvetica-Bold", letterSpacing: 0.4 },
  foundVal:   { fontSize: 6.5, color: "rgba(255,255,255,0.5)", lineHeight: 1.4, marginTop: 1 },
  backQrCol:  { width: 54, alignItems: "center", justifyContent: "center", gap: 4 },
  backQrBox:  {
    width: 50,
    height: 50,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  backQrImg:   { width: 42, height: 42 },
  backQrLabel: { fontSize: 6, color: "rgba(201,169,78,0.6)", textAlign: "center" },
  backGoldLine: { height: 1.5, backgroundColor: "rgba(201,169,78,0.4)" },
  backFooter: {
    height: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  backFootLeft:  { fontSize: 6.5, color: "rgba(255,255,255,0.35)" },
  backFootRight: { fontSize: 7, color: GOLD, fontFamily: "Helvetica-Bold" },
});

/* ─────────────────────────────────────────────────── */
/*  FRENTE                                             */
/* ─────────────────────────────────────────────────── */
export function CarnetCard({
  iglesiaFull,
  iglesiaShort,
  logoUrl,
  watermarkUrl,
  miembro,
  fotoUrl,
  qrDataUrl,
}: CarnetProps) {
  const nombres   = safe(miembro.nombres)   || "";
  const apellidos = safe(miembro.apellidos) || "";
  const fnac      = formatDate(miembro.fecha_nacimiento);

  return (
    <View style={s.card}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.logoCircle}>
          {logoUrl ? (
            <Image style={s.logoImg} src={logoUrl} />
          ) : (
            <View style={{ width: 28, height: 28, backgroundColor: "rgba(201,169,78,0.15)" }} />
          )}
        </View>
        <View style={s.churchCol}>
          <Text style={s.churchFull}>{iglesiaFull}</Text>
          <Text style={s.churchShort}>{iglesiaShort}</Text>
        </View>
      </View>

      {/* Watermark */}
      {watermarkUrl ? (
        <View style={s.wmWrap}>
          <Image style={s.wm} src={watermarkUrl} />
        </View>
      ) : null}

      {/* Body */}
      <View style={s.body}>
        {/* Foto con overlay dorado encima para cubrir esquinas */}
        <View style={s.photoOuter}>
          <View style={s.photoInner}>
            {fotoUrl ? (
              <Image style={s.photoImg} src={fotoUrl} />
            ) : (
              <View style={{ width: PHOTO_W, height: PHOTO_H, backgroundColor: "#E5E7EB" }} />
            )}
          </View>
          {/* Borde dorado encima de la foto */}
          <View style={s.photoBorderOverlay} />
        </View>

        {/* Info */}
        <View style={s.infoCol}>
          <Text style={s.tagLabel}>CARNET DE MIEMBRO</Text>
          {/* Nombres y apellidos en lineas separadas */}
          <Text style={s.memberNombre}>{nombres || "—"}</Text>
          {apellidos ? <Text style={s.memberApellido}>{apellidos}</Text> : null}
          {/* Campos */}
          <View style={s.fieldsWrap}>
            <View style={s.fieldRow}>
              <Text style={s.fieldLabel}>RUT</Text>
              <Text style={s.fieldValue}>{miembro.rut}</Text>
            </View>
            {fnac ? (
              <View style={s.fieldRow}>
                <Text style={s.fieldLabel}>Nacimiento</Text>
                <Text style={s.fieldValue}>{fnac}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* QR grande */}
        <View style={s.qrCol}>
          <View style={s.qrBox}>
            <Image style={s.qrImg} src={qrDataUrl} />
          </View>
        </View>
      </View>

      {/* Linea dorada */}
      <View style={s.goldLine} />

      {/* Footer */}
      <View style={s.footer}>
        <Text style={s.footText}>Sede Quilicura</Text>
        <View style={s.footRight}>
          <View style={s.footDot} />
          <Text style={s.footText}>Uso oficial</Text>
        </View>
      </View>
    </View>
  );
}

/* ─────────────────────────────────────────────────── */
/*  REVERSO                                            */
/* ─────────────────────────────────────────────────── */
export function CarnetBackCard({
  iglesiaFull,
  iglesiaShort,
  logoUrl,
  direccion,
  telefono,
  web,
  qrWebDataUrl,
  rut,
}: CarnetBackProps) {
  return (
    <View style={s.cardBack}>
      <View style={s.backHeader}>
        <View style={s.backLogoCircle}>
          {logoUrl ? (
            <Image style={s.backLogoImg} src={logoUrl} />
          ) : (
            <View style={{ width: 18, height: 18, backgroundColor: "rgba(201,169,78,0.15)" }} />
          )}
        </View>
        <View>
          <Text style={s.backChurchShort}>{iglesiaShort}</Text>
          <Text style={s.backChurchFull}>{iglesiaFull}</Text>
        </View>
      </View>

      <View style={s.backBody}>
        <View style={s.backInfo}>
          <View style={s.backFieldWrap}>
            <Text style={s.backFieldLabel}>Direccion</Text>
            <Text style={s.backFieldVal}>{direccion}</Text>
            <Text style={s.backFieldSub}>Santiago, Region Metropolitana</Text>
          </View>
          <View style={s.backFieldWrap}>
            <Text style={s.backFieldLabel}>Telefono</Text>
            <Text style={s.backFieldVal}>{telefono}</Text>
          </View>
          <View style={s.backFieldWrap}>
            <Text style={s.backFieldLabel}>Web</Text>
            <Text style={s.backFieldVal}>{web}</Text>
          </View>
          <View style={s.divider}>
            <Text style={s.foundLabel}>Si encuentra esta tarjeta</Text>
            <Text style={s.foundVal}>Por favor devuelvala a cualquier responsable de la iglesia. Gracias.</Text>
          </View>
        </View>

        <View style={s.backQrCol}>
          <View style={s.backQrBox}>
            <Image style={s.backQrImg} src={qrWebDataUrl} />
          </View>
          <Text style={s.backQrLabel}>{web}</Text>
        </View>
      </View>

      <View style={s.backGoldLine} />

      <View style={s.backFooter}>
        <Text style={s.backFootLeft}>Uso personal e intransferible</Text>
        <Text style={s.backFootRight}>{rut}</Text>
      </View>
    </View>
  );
}

/* ─────────────────────────────────────────────────── */
/*  PDF INDIVIDUAL (frente + reverso)                 */
/* ─────────────────────────────────────────────────── */
export default function CarnetPdf(props: CarnetProps & { backProps: CarnetBackProps }) {
  const { backProps, ...frontProps } = props;
  return (
    <Document>
      <Page size={{ width: CARD_W, height: CARD_H }} style={{ padding: 0 }}>
        <CarnetCard {...frontProps} />
      </Page>
      <Page size={{ width: CARD_W, height: CARD_H }} style={{ padding: 0 }}>
        <CarnetBackCard {...backProps} />
      </Page>
    </Document>
  );
}
