// app/api/miembros/export/pdf-doc.tsx
import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page:       { padding: 30, fontSize: 9 },
  header:     { marginBottom: 14 },
  title:      { fontSize: 14, fontWeight: "bold", marginBottom: 3 },
  subtitle:   { fontSize: 8, color: "#666" },
  table:      { width: "100%" },
  th: {
    flexDirection: "row",
    backgroundColor: "#1e3a5f",
    paddingVertical: 5,
    paddingHorizontal: 3,
  },
  tr: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderColor: "#dddddd",
    paddingVertical: 4,
    paddingHorizontal: 3,
  },
  trOdd:      { backgroundColor: "#f5f7fa" },
  headerCell: { color: "white", fontSize: 7.5, fontWeight: "bold" },
  cell:       { fontSize: 7.5, color: "#333" },

  // Anchos de columna (landscape A4 = ~820pt de ancho útil)
  colRut:    { width: "12%" },
  colNombre: { width: "26%" },
  colSexo:   { width: "6%" },
  colDed:    { width: "9%" },
  colTel:    { width: "13%" },
  colEmail:  { width: "22%" },
  colEstado: { width: "12%" },
});

export type PdfRow = {
  rut:    string;
  nombre: string;
  sexo:   string;
  ded:    string;
  tel:    string;
  email:  string;
  estado: string;
};

export function MiembrosPdf({ rows, fecha }: { rows: PdfRow[]; fecha: string }) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Encabezado */}
        <View style={styles.header}>
          <Text style={styles.title}>Listado de Miembros</Text>
          <Text style={styles.subtitle}>
            Generado el {fecha} · Total: {rows.length} miembros
          </Text>
        </View>

        {/* Tabla */}
        <View style={styles.table}>
          {/* Cabecera */}
          <View style={styles.th}>
            <View style={styles.colRut}><Text style={styles.headerCell}>RUT</Text></View>
            <View style={styles.colNombre}><Text style={styles.headerCell}>Nombre</Text></View>
            <View style={styles.colSexo}><Text style={styles.headerCell}>Sexo</Text></View>
            <View style={styles.colDed}><Text style={styles.headerCell}>DED</Text></View>
            <View style={styles.colTel}><Text style={styles.headerCell}>Teléfono</Text></View>
            <View style={styles.colEmail}><Text style={styles.headerCell}>Email</Text></View>
            <View style={styles.colEstado}><Text style={styles.headerCell}>Estado</Text></View>
          </View>

          {/* Filas */}
          {rows.map((r, i) => (
            <View key={r.rut + "-" + i} style={[styles.tr, i % 2 !== 0 ? styles.trOdd : {}]}>
              <View style={styles.colRut}><Text style={styles.cell}>{r.rut}</Text></View>
              <View style={styles.colNombre}><Text style={styles.cell}>{r.nombre}</Text></View>
              <View style={styles.colSexo}><Text style={styles.cell}>{r.sexo}</Text></View>
              <View style={styles.colDed}><Text style={styles.cell}>{r.ded}</Text></View>
              <View style={styles.colTel}><Text style={styles.cell}>{r.tel}</Text></View>
              <View style={styles.colEmail}><Text style={styles.cell}>{r.email}</Text></View>
              <View style={styles.colEstado}><Text style={styles.cell}>{r.estado}</Text></View>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}
