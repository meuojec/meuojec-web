import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { CarnetCard, CARD_W, CARD_H } from "@/lib/pdfs/CarnetPdf";

type Miembro = {
  rut: string;
  nombres?: string | null;
  apellidos?: string | null;
  fecha_nacimiento?: string | null;
  fotoUrl?: string | null;
  qrDataUrl: string;
};

const styles = StyleSheet.create({
  page: { padding: 16, fontFamily: "Helvetica", backgroundColor: "#FFFFFF" },
  header: {
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  title: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  meta:  { fontSize: 8, color: "#6B7280" },
  grid:  { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cell:  { width: 258, height: 168, justifyContent: "center", alignItems: "center" },
});

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export default function CarnetsA4Pdf({
  titulo = "Carnets de miembros",
  iglesiaFull,
  iglesiaShort,
  logoUrl,
  watermarkUrl,
  miembros,
}: {
  titulo?: string;
  iglesiaFull: string;
  iglesiaShort: string;
  logoUrl?: string | null;
  watermarkUrl?: string | null;
  miembros: Miembro[];
}) {
  const stamp = new Date().toLocaleString("es-CL", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });

  const pages = chunk(miembros, 8);

  return (
    <Document>
      {pages.map((page, pi) => (
        <Page key={pi} size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.title}>{titulo} (A4 · 8 por hoja)</Text>
            <Text style={styles.meta}>Generado: {stamp} · Pagina {pi + 1}/{pages.length}</Text>
          </View>
          <View style={styles.grid}>
            {page.map((m) => (
              <View key={m.rut} style={styles.cell}>
                <CarnetCard
                  iglesiaFull={iglesiaFull}
                  iglesiaShort={iglesiaShort}
                  logoUrl={logoUrl ?? null}
                  watermarkUrl={watermarkUrl ?? null}
                  miembro={{
                    rut: m.rut,
                    nombres: m.nombres,
                    apellidos: m.apellidos,
                    fecha_nacimiento: m.fecha_nacimiento,
                  }}
                  fotoUrl={m.fotoUrl ?? null}
                  qrDataUrl={m.qrDataUrl}
                />
              </View>
            ))}
          </View>
        </Page>
      ))}
    </Document>
  );
}
