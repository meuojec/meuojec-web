import React from "react";
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

type Props = {
  miembro: Record<string, any>;
  fotoUrl?: string | null;
};

const styles = StyleSheet.create({
  page: { padding: 28, fontFamily: "Helvetica", fontSize: 11, color: "#111827" },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 10 },
  row: { flexDirection: "row", gap: 14 },
  fotoBox: { width: 120, height: 150, borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 8, overflow: "hidden" },
  foto: { width: "100%", height: "100%", objectFit: "cover" },
  section: { marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#E5E7EB" },
  label: { color: "#6B7280", fontSize: 9 },
  value: { marginBottom: 6 },
  field: { marginBottom: 8 },
});

function field(m: any, key: string) {
  const v = m?.[key];
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

export default function FichaMiembroPdf({ miembro, fotoUrl }: Props) {
  const fullName = [miembro.nombres, miembro.apellidos].filter(Boolean).join(" ").trim() || "—";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Ficha de Miembro</Text>

        <View style={styles.row}>
          <View style={styles.fotoBox}>
            {fotoUrl ? <Image style={styles.foto} src={fotoUrl} /> : null}
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: 700 }}>{fullName}</Text>
            <Text style={{ marginTop: 6 }}>RUT: {field(miembro, "rut")}</Text>
            <Text>DED: {field(miembro, "ded")}</Text>
            <Text>Sexo: {field(miembro, "sexo")}</Text>
            <Text>Fecha nacimiento: {field(miembro, "fecha_nacimiento")}</Text>
            <Text>Edad: {field(miembro, "edad")}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ fontSize: 12, fontWeight: 700 }}>Datos de contacto</Text>
          <View style={{ marginTop: 6 }}>
            <View style={styles.field}>
              <Text style={styles.label}>Teléfono</Text>
              <Text style={styles.value}>{field(miembro, "telefono")}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{field(miembro, "email")}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Dirección</Text>
              <Text style={styles.value}>{field(miembro, "direccion")}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ fontSize: 12, fontWeight: 700 }}>Observaciones</Text>
          <Text style={{ marginTop: 6 }}>{field(miembro, "observaciones")}</Text>
        </View>

        <Text style={{ marginTop: 18, color: "#6B7280", fontSize: 9 }}>
          Documento generado automáticamente.
        </Text>
      </Page>
    </Document>
  );
}