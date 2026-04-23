import React from "react";
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

export const CARD_W = 242;
export const CARD_H = 153;
const BRAND = "#0B1220";

const HEADER_H = 22;     // franja azul superior
const SUBHEADER_H = 16;  // “CARNET DE MIEMBRO”
const FOOTER_H = 18;     // franja azul inferior

export type CarnetProps = {
  iglesiaNombre: string;
  logoUrl?: string | null;       // dataURL o URL absoluta
  watermarkUrl?: string | null;  // dataURL o URL absoluta
  miembro: {
    rut: string;
    nombres?: string | null;
    apellidos?: string | null;
  };
  fotoUrl?: string | null;
  qrDataUrl: string; // data:image/png;base64,...
};

const styles = StyleSheet.create({
  page: { padding: 0 },

  card: {
    width: CARD_W,
    height: CARD_H,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    overflow: "hidden",
    fontFamily: "Helvetica",
    backgroundColor: "#FFFFFF",
    position: "relative",
  },

  // HEADER AZUL
  header: {
    height: HEADER_H,
    backgroundColor: BRAND,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  headerInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: CARD_W - 20,
  },

  headerLogoBox: { width: 16, height: 16 },
  headerLogo: { width: "100%", height: "100%", objectFit: "contain" },

  headerText: {
    color: "#E5E7EB",
    fontSize: 7.5,
    fontWeight: 700,
    letterSpacing: 0.2,
  },

  // SUBHEADER
  subHeader: {
    height: SUBHEADER_H,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  subHeaderText: {
    fontSize: 7.2,
    color: "#6B7280",
    letterSpacing: 0.6,
    fontWeight: 700,
  },

  // WATERMARK
  watermarkWrap: {
    position: "absolute",
    left: 0,
    top: HEADER_H + SUBHEADER_H,
    width: CARD_W,
    height: CARD_H - HEADER_H - SUBHEADER_H - FOOTER_H,
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
  },
  watermark: {
    width: 150,
    height: 150,
    objectFit: "contain",
    opacity: 0.05,
  },

  // BODY
  body: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 8,
    gap: 10,
    height: CARD_H - HEADER_H - SUBHEADER_H - FOOTER_H,
  },

  // FOTO (borde único)
  fotoWrap: {
    width: 82,
    height: 96,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
  },
  foto: { width: "100%", height: "100%", objectFit: "cover" },

  // INFO
  info: {
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: 6,
  },
  nombres: {
    fontSize: 9,
    fontWeight: 700,
    color: "#111827",
    lineHeight: 1.05,
  },
  apellidos: {
    fontSize: 9,
    fontWeight: 700,
    color: "#111827",
    lineHeight: 1.05,
    marginTop: 2,
  },
  rut: {
    fontSize: 6,
    color: "#374151",
    marginTop: 6,
  },

  // QR
  qrCol: {
    width: 66,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 6,
  },
  qrLabel: {
    fontSize: 8,
    color: "#6B7280",
    marginBottom: 4,
  },
  qr: { width: 54, height: 54 },

  // FOOTER AZUL
  footer: {
    height: FOOTER_H,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: BRAND,
  },
  foot: { fontSize: 7.4, color: "#E5E7EB" },
});

function safe(s?: string | null) {
  return (s ?? "").trim();
}

/**
 * ✅ Componente reutilizable: sirve para individual y masivo.
 * NO crea Document/Page, solo el "carnet" (View).
 */
export function CarnetCard({
  iglesiaNombre,
  logoUrl,
  watermarkUrl,
  miembro,
  fotoUrl,
  qrDataUrl,
}: CarnetProps) {
  const nombres = safe(miembro.nombres) || "—";
  const apellidos = safe(miembro.apellidos) || "";

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <View style={styles.headerLogoBox}>
            {logoUrl ? <Image style={styles.headerLogo} src={logoUrl} /> : null}
          </View>
          <Text style={styles.headerText}>
            {iglesiaNombre}
          </Text>
        </View>
      </View>

      {/* SubHeader */}
      <View style={styles.subHeader}>
        <Text style={styles.subHeaderText}>
          CARNET DE MIEMBRO
        </Text>
      </View>

      {/* Watermark */}
      {watermarkUrl ? (
        <View style={styles.watermarkWrap}>
          <Image style={styles.watermark} src={watermarkUrl} />
        </View>
      ) : null}

      {/* Body */}
      <View style={styles.body}>
        {/* Foto */}
        <View style={styles.fotoWrap}>
          {fotoUrl ? <Image style={styles.foto} src={fotoUrl} /> : null}
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.nombres}>
            {nombres}
          </Text>
          <Text style={styles.apellidos}>
            {apellidos}
          </Text>
          <Text style={styles.rut}>
            RUT: {miembro.rut}
          </Text>
        </View>

        {/* QR */}
        <View style={styles.qrCol}>
          <Text style={styles.qrLabel}>Escanea</Text>
          <Image style={styles.qr} src={qrDataUrl} />
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.foot}>MEUOJEC APP</Text>
        <Text style={styles.foot}>Uso interno</Text>
      </View>
    </View>
  );
}

/**
 * ✅ PDF individual: 1 carnet por PDF.
 */
export default function CarnetPdf(props: CarnetProps) {
  return (
    <Document>
      <Page size={{ width: CARD_W, height: CARD_H }} style={styles.page}>
        <CarnetCard {...props} />
      </Page>
    </Document>
  );
}