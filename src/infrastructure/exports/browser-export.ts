import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { catalog, states } from "../../domain/catalog";
import type { RequestRecord } from "../../domain/models";
function download(bytes: Uint8Array | string, name: string, type: string) {
  const blob = new Blob(
      [
        typeof bytes === "string"
          ? bytes
          : (bytes.slice().buffer as ArrayBuffer),
      ],
      { type },
    ),
    url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
export async function exportPdf(r: RequestRecord, kind: "fut" | "receipt") {
  const doc = await PDFDocument.create(),
    font = await doc.embedFont(StandardFonts.Helvetica),
    bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const logoResponse = await fetch("/uns-logo.png"),
    logo = logoResponse.ok
      ? await doc.embedPng(await logoResponse.arrayBuffer())
      : null;
  let page = doc.addPage([595.28, 841.89]),
    y = 780;
  const clean = (s: string) =>
    s.replace(/[^\u0020-\u007e\u00a0-\u00ff\n]/g, " ");
  const addPage = () => {
    page = doc.addPage([595.28, 841.89]);
    y = 775;
  };
  const text = (value: string, size = 11, heavy = false) => {
    const face = heavy ? bold : font;
    for (const paragraph of clean(value).split("\n")) {
      let line = "";
      const chunks = paragraph
        .split(/\s+/)
        .flatMap((word) =>
          word.length > 65 ? word.match(/.{1,55}/g) || [word] : [word],
        );
      for (const word of chunks) {
        if (line && face.widthOfTextAtSize(line + " " + word, size) > 475) {
          if (y < 70) addPage();
          page.drawText(line, {
            x: 60,
            y,
            size,
            font: face,
            color: rgb(0.15, 0.18, 0.24),
          });
          y -= size + 6;
          line = word;
        } else line += (line ? " " : "") + word;
      }
      if (y < 70) addPage();
      if (line)
        page.drawText(line, {
          x: 60,
          y,
          size,
          font: face,
          color: rgb(0.15, 0.18, 0.24),
        });
      y -= size + 7;
    }
  };
  if (logo) page.drawImage(logo, { x: 60, y: 745, width: 132, height: 66 });
  page.drawText("UNIVERSIDAD NACIONAL DEL SANTA", {
    x: 220,
    y: 785,
    size: 12,
    font: bold,
    color: rgb(0.64, 0.14, 0.24),
  });
  page.drawText("Proyecto de pasantía 2026 - entorno de prueba", {
    x: 220,
    y: 765,
    size: 9,
    font,
  });
  page.drawLine({
    start: { x: 60, y: 730 },
    end: { x: 535, y: 730 },
    thickness: 1,
    color: rgb(0.8, 0.82, 0.86),
  });
  y = 699;
  text(
    kind === "receipt" ? "CONSTANCIA DE RECEPCIÓN" : "FORMATO ÚNICO DE TRÁMITE",
    17,
    true,
  );
  y -= 12;
  text("Expediente: " + (r.code || "Borrador - no presentado"), 13, true);
  text(
    "Fecha de recepción: " +
      (r.submitted
        ? new Date(r.submitted).toLocaleString("es-PE", {
            timeZone: "America/Lima",
          })
        : "Sin enviar"),
  );
  text("Estado al generar: " + states[r.status]);
  text(
    "Trámite: " +
      (catalog.find((s) => s.id === r.content.serviceId)?.name ||
        "Sin seleccionar") +
      (r.content.other ? " - " + r.content.other : ""),
  );
  y -= 12;
  text("DATOS DEL SOLICITANTE", 11, true);
  for (const [label, value] of [
    ["Nombres y apellidos", r.content.name],
    ["DNI", r.content.dni],
    ["Facultad", r.content.faculty],
    ["Escuela profesional", r.content.school],
    ["Código de estudiante", r.content.code],
    ["Correo", r.content.email],
    ["Teléfono", r.content.phone],
    ["Domicilio", r.content.address],
  ])
    text(label + ": " + (value || "Pendiente"));
  y -= 12;
  if (kind === "fut") {
    text("DESTINATARIO", 11, true);
    text(r.content.recipient + " - " + r.content.role);
    y -= 10;
    text("FUNDAMENTO DE LA SOLICITUD", 11, true);
    text(r.content.reason || "Pendiente");
    y -= 14;
    text("Declaración de autoría: " + (r.content.signature || "Pendiente"));
    text(
      r.content.consent
        ? "El solicitante declaró la veracidad de los datos y documentos."
        : "Declaración de veracidad pendiente.",
    );
    text("La autoría declarada no equivale a firma digital certificada.", 9);
  } else {
    text("RECEPCIÓN DEL PORTAL", 11, true);
    text("Dependencia de atención: " + r.office);
    text(
      "Esta constancia registra el ingreso de la solicitud al entorno de prueba. No acredita aprobación, pago ni presentación ante la UNS.",
    );
    text(
      "Consulta el historial en Mis solicitudes o Seguimiento usando tu número de expediente y tu cuenta privada.",
    );
  }
  y -= 15;
  text(
    "Documento generado por un proyecto académico independiente. No es una constancia institucional oficial.",
    9,
  );
  const pages = doc.getPages();
  pages.forEach((p, i) => {
    p.drawLine({
      start: { x: 60, y: 48 },
      end: { x: 535, y: 48 },
      thickness: 0.5,
      color: rgb(0.8, 0.82, 0.86),
    });
    p.drawText("SIGET-UNS | Proyecto de pasantía 2026", {
      x: 60,
      y: 30,
      size: 8,
      font,
    });
    p.drawText(`${i + 1} / ${pages.length}`, { x: 500, y: 30, size: 8, font });
  });
  doc.setTitle(
    (kind === "fut" ? "FUT" : "Constancia") + " " + (r.code || "borrador"),
  );
  doc.setSubject(
    "Entorno de prueba - no es un documento institucional oficial",
  );
  download(
    await doc.save(),
    (kind === "fut" ? "FUT-" : "Constancia-") + (r.code || "borrador") + ".pdf",
    "application/pdf",
  );
}
export function exportCsv(records: RequestRecord[]) {
  const cell = (value: string) =>
    '"' +
    (/^[=+@\-\t\r]/.test(value) ? "'" : "") +
    value.replace(/"/g, '""') +
    '"';
  const rows = [
    [
      "Expediente",
      "Trámite",
      "Escuela",
      "Estado",
      "Dependencia",
      "Recepción",
      "Actualización",
    ],
    ...records.map((r) => [
      r.code || "",
      catalog.find((s) => s.id === r.content.serviceId)?.name || "",
      r.content.school,
      states[r.status],
      r.office,
      r.submitted || "",
      r.updated,
    ]),
  ];
  download(
    "\ufeff" + rows.map((row) => row.map(cell).join(";")).join("\r\n"),
    "reporte-tramites-uns.csv",
    "text/csv;charset=utf-8",
  );
}
