import React from "react";
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

export const CARD_W = 242;
export const CARD_H = 153;

const NAVY  = "#0B1220";
const GOLD  = "#C9A94E";
const WHITE = "#FFFFFF";
const GRAY  = "#6B7280";
const DARK  = "#111827";

const HEADER_H  = 38;
const FOOTER_H  = 22;
const GOLDLINE_H = 2;
const BODY_H = CARD_H - HEADER_H - FOOTER_H - GOLDLINE_H;

export type CarnetProps = {
  iglesiaFull: string;
  iglesiaShort: string;
  logoUrl?: string | null;
  watermarkUrl?: string | null;
  miembro: {
    rut: string;
    nombres?: string | null;
    apellidos?: string | null;
    departamento?: string | null;
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
  const d = new Date(raw + "T12:00:00");
  if (isNaN(d.getTime())) return raw;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  return `${dd}/${mm}/${yy}`;
}

function firstDept(raw?: string | null) {
  if (!raw) return "";
  return raw.split(/[,;]/)[0].trim();
}

const s = StyleSheet.create({
  page: { padding: 0, backgroundColor: WHITE },

  /* ── CARD WRAPPER ── */
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

  /* ── HEADER ── */
  header: {
    height: HEADER_H,
    backgroundColor: NAVY,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    gap: 8,
  },
  logoCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: GOLD,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  logoImg: { width: 22, height: 22, objectFit: "contain" },
  logoFallback: { fontSize: 11, color: GOLD, fontFamily: "Helvetica-Bold" },
  churchCol: { flex: 1 },
  churchFull: {
    fontSize: 5.8,
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
    letterSpacing: 1.6,
    marginTop: 2,
  },

  /* ── BODY ── */
  body: {
    height: BODY_H,
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 4,
    gap: 8,
  },

  /* FOTO */
  photoWrap: {
    width: 60,
    height: 76,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: GOLD,
    overflow: "hidden",
    backgroundColor: "#F1F5F9",
    flexShrink: 0,
  },
  photo: { width: "100%", height: "100%", objectFit: "cover" },

  /* INFO */
  infoCol: { flex: 1, flexDirection: "column", gap: 2 },
  tagLabel: {
    fontSize: 6.5,
    color: GRAY,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.8,
    marginBottom: 1,
  },
  memberName: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    lineHeight: 1.2,
  },
  rolePill: {
    flexDirection: "row",
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 10,
    backgroundColor: NAVY,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    marginTop: 3,
  },
  rolePillText: {
    fontSize: 7.5,
    color: WHITE,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.2,
  },
  fieldsWrap: { marginTop: 5, gap: 2.5 },
  fieldRow: { flexDirection: "row", gap: 4 },
  fieldLabel: { fontSize: 8, color: GRAY },
  fieldValue: { fontSize: 8, color: DARK, fontFamily: "Helvetica-Bold" },

  /* QR */
  qrCol: {
    width: 66,
    alignItems: "center",
    justifyContent: "center",
  },
  qrBox: {
    width: 62,
    height: 62,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: GOLD,
    backgroundColor: "#FAFAFA",
    alignItems: "center",
    justifyContent: "center",
  },
  qrImg: { width: 54, height: 54 },

  /* GOLD LINE */
  goldLine: {
    height: GOLDLINE_H,
    backgroundColor: GOLD,
  },

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
    marginHorizontal: 4,
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
  wm: { width: 120, height: 120, objectFit: "contain", opacity: 0.04 },

  /* ── BACK ── */
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
    height: 34,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    gap: 7,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(201,169,78,0.3)",
  },
  backLogoCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "rgba(201,169,78,0.5)",
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  backLogoText: { fontSize: 9, color: GOLD, fontFamily: "Helvetica-Bold" },
  backChurchShort: { fontSize: 8, color: WHITE, fontFamily: "Helvetica-Bold", letterSpacing: 1.2 },
  backChurchFull: { fontSize: 5, color: "rgba(201,169,78,0.7)", letterSpacing: 0.15, marginTop: 1.5 },
  backBody: {
    flex: 1,
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 8,
  },
  backInfo: { flex: 1, gap: 5 },
  backFieldWrap: { gap: 1 },
  backFieldLabel: {
    fontSize: 6,
    color: "rgba(201,169,78,0.65)",
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  backFieldVal: { fontSize: 8, color: WHITE, fontFamily: "Helvetica-Bold" },
  backFieldSub: { fontSize: 6.5, color: "rgba(255,255,255,0.45)" },
  divider: { borderTopWidth: 1, borderTopColor: "rgba(201,169,78,0.2)", borderStyle: "dashed", marginTop: 4, paddingTop: 5 },
  foundLabel: { fontSize: 6, color: "rgba(201,169,78,0.6)", fontFamily: "Helvetica-Bold", letterSpacing: 0.4 },
  foundVal: { fontSize: 7, color: "rgba(255,255,255,0.5)", lineHeight: 1.4, marginTop: 1.5 },
  backQrCol: { width: 54, alignItems: "center", justifyContent: "center", gap: 4 },
  backQrBox: {
    width: 50,
    height: 50,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  backQrImg: { width: 42, height: 42 },
  backQrLabel: { fontSize: 6, color: "rgba(201,169,78,0.6)", textAlign: "center" },
  backGoldLine: { height: 1.5, backgroundColor: "rgba(201,169,78,0.4)" },
  backFooter: {
    height: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  backFootLeft: { fontSize: 6.5, color: "rgba(255,255,255,0.35)" },
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
  const nombres   = safe(miembro.nombres)   || "—";
  const apellidos = safe(miembro.apellidos) || "";
  const fullName  = apellidos ? `${nombres} ${apellidos}` : nombres;
  const dept      = firstDept(miembro.departamento);
  const fnac      = formatDate(miembro.fecha_nacimiento);

  return (
    <View style={s.card}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.logoCircle}>
          {logoUrl
            ? <Image style={s.logoImg} src={logoUrl} />
            : <Text style={s.logoFallback}>+</Text>}
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
        {/* Foto */}
        <View style={s.photoWrap}>
          {fotoUrl ? <Image style={s.photo} src={fotoUrl} /> : null}
        </View>

        {/* Info */}
        <View style={s.infoCol}>
          <Text style={s.tagLabel}>CARNET DE MIEMBRO</Text>
          <Text style={s.memberName}>{fullName}</Text>
          {dept ? (
            <View style={s.rolePill}>
              <Text style={s.rolePillText}>{dept}</Text>
            </View>
          ) : null}
          <View style={s.fieldsWrap}>
            <View style={s.fieldRow}>
              <Text style={s.fieldLabel}>RUT</Text>
              <Text style={s.fieldValue}>{miembro.rut}</Text>
            </View>
            {miembro.departamento ? (
              <View style={s.fieldRow}>
                <Text style={s.fieldLabel}>Depto.</Text>
                <Text style={s.fieldValue}>{safe(miembro.departamento)}</Text>
              </View>
            ) : null}
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
      {/* Header */}
      <View style={s.backHeader}>
        <View style={s.backLogoCircle}>
          {logoUrl
            ? <Image style={{ width: 16, height: 16, objectFit: "contain" }} src={logoUrl} />
            : <Text style={s.backLogoText}>+</Text>}
        </View>
        <View>
          <Text style={s.backChurchShort}>{iglesiaShort}</Text>
          <Text style={s.backChurchFull}>{iglesiaFull}</Text>
        </View>
      </View>

      {/* Body */}
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
            <Text style={s.foundVal}>Por favor devuelvala a cualquier{"\n"}responsable de la iglesia. Gracias.</Text>
          </View>
        </View>

        <View style={s.backQrCol}>
          <View style={s.backQrBox}>
            <Image style={s.backQrImg} src={qrWebDataUrl} />
          </View>
          <Text style={s.backQrLabel}>{web}</Text>
        </View>
      </View>

      {/* Linea dorada */}
      <View style={s.backGoldLine} />

      {/* Footer */}
      <View style={s.backFooter}>
        <Text style={s.backFootLeft}>Este carnet es de uso personal e intransferible</Text>
        <Text style={s.backFootRight}>{rut}</Text>
      </View>
    </View>
  );
}

/* ─────────────────────────────────────────────────── */
/*  PDF INDIVIDUAL (frente + reverso)                 */
/* ─────────────────────────────────────────────────── */
export default function CarnetPdf(props: CarnetProps & {
  backProps: CarnetBackProps;
}) {
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
