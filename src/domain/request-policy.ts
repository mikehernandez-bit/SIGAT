import type { RequestRecord, User } from "./models";
import { PortalError } from "./errors";

export const isStaff = (user: User) => user.role === "staff" || user.role === "admin";
export const isEditable = (status: string) => ["draft", "observed"].includes(status);
export const isClosedToStaff = (status: string) => ["draft", "resolved", "rejected", "cancelled"].includes(status);

export function authorizeRead(record: RequestRecord | null, user: User): asserts record is RequestRecord {
  if (!record || (record.owner !== user.id && (!isStaff(user) || !record.code))) {
    throw new PortalError("not_found", "No se encontró una solicitud disponible para tu cuenta.");
  }
}
export function authorizeOwner(record: RequestRecord, user: User) {
  if (record.owner !== user.id) throw new PortalError("forbidden", "Solo el solicitante puede modificar su FUT.");
}
export function assertRevision(record: RequestRecord, expected: number) {
  if (!Number.isInteger(expected) || expected !== record.revision) {
    throw new PortalError("conflict", "La solicitud cambió. Vuelve a cargarla antes de guardar.");
  }
}
export function authorizeUpload(record: RequestRecord, user: User, kind: string) {
  if (kind === "evidence" && (record.owner !== user.id || !isEditable(record.status))) {
    throw new PortalError("forbidden", "No se pueden adjuntar documentos a este FUT.");
  }
  if (kind === "response" && (!isStaff(user) || isClosedToStaff(record.status))) {
    throw new PortalError("forbidden", "No se pueden adjuntar respuestas a este expediente.");
  }
}
