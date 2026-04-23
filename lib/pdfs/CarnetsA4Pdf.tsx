import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { CarnetCard, CARD_W, CARD_H } from "@/lib/pdfs/CarnetPdf";

type Miembro = {
  rut: string;
  nombres?: string | null;
  apellidos?: string | null;
  fotoUrl?: string | null;
  qrDataUrl: string;
};

const styles = StyleSheet.create({
  page: { padding: 18, fontFamily: "Helvetica" },

  header: {
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  title: { fontSize: 12, fontWeight: 700 },
  meta: { fontSize: 9, color: "#6B7280" },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  // Celda para centrar el carnet dentro de 2 columnas x 4 filas
  cell: {
    width: 270,
    height: 170,
    justifyContent: "center",
    alignItems: "center",
  },
});

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export default function CarnetsA4Pdf({
  titulo = "Carnets de miembros",
  iglesiaNombre,
  logoUrl,
  watermarkUrl,
  miembros,
}: {
  titulo?: string;
  iglesiaNombre: string;
  logoUrl?: string | null;
  watermarkUrl?: string | null;
  miembros: Miembro[];
}) {
  const stamp = new Date().toLocaleString("es-CL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  // 8 carnets por hoja A4
  const pages = chunk(miembros, 8);

  return (
    <Document>
      {pages.map((chunkMiembros, pi) => (
        <Page key={pi} size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.title}>{titulo} (A4 · 8 por hoja)</Text>
            <Text style={styles.meta}>
              Generado: {stamp} · Página {pi + 1}/{pages.length}
            </Text>
          </View>

          <View style={styles.grid}>
            {chunkMiembros.map((m) => (
              <View key={m.rut} style={styles.cell}>
                <CarnetCard
                  iglesiaNombre={iglesiaNombre}
                  logoUrl={logoUrl ?? null}
                  watermarkUrl={watermarkUrl ?? null}
                  miembro={{
                    rut: m.rut,
                    nombres: m.nombres,
                    apellidos: m.apellidos,
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