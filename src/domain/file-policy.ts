import { PortalError } from "./errors";

export function validateFile(name: string, bytes: Uint8Array, size: number) {
  if (!size || size !== bytes.byteLength || size > 25 * 1024 * 1024) {
    throw new PortalError("invalid", "Selecciona un archivo de hasta 25 MB.");
  }
  const ext = name.split(".").pop()?.toLowerCase();
  const mime = ext === "pdf" ? "application/pdf" : ext === "png" ? "image/png"
    : ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "docx"
      ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : null;
  const valid = ext === "pdf" ? new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-"
    : ext === "png" ? bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78
      : ext === "jpg" || ext === "jpeg" ? bytes[0] === 255 && bytes[1] === 216
        : ext === "docx" ? bytes[0] === 80 && bytes[1] === 75 : false;
  if (!mime || !valid) throw new PortalError("invalid", "Formato no permitido. Usa PDF, DOCX, JPG o PNG válidos.");
  return { ext: ext!, mime, name: name.replace(/[\r\n\u0000-\u001f/\\]/g, "_").slice(0, 180) };
}

export function validateFileQuota(total: { n: number; size: number }, size: number) {
  if (total.n >= 10 || total.size + size > 50 * 1024 * 1024) {
    throw new PortalError("invalid", "Máximo 10 archivos y 50 MB por expediente.");
  }
}
