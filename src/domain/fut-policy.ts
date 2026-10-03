import { catalog, faculties, type Fut } from "./catalog";
import { PortalError } from "./errors";

const limits: Record<Exclude<keyof Fut, "consent">, number> = {
  name: 160, dni: 20, faculty: 80, school: 100, code: 30,
  email: 200, phone: 30, address: 240, recipient: 160, role: 100,
  serviceId: 80, other: 240, reason: 12000, signature: 160,
};

export function parseFut(value: unknown): Fut {
  const invalid = () => new PortalError("invalid", "Revisa los campos del FUT: uno o más valores no son válidos.");
  if (!value || typeof value !== "object" || Array.isArray(value)) throw invalid();
  const fields = value as Record<string, unknown>;
  if (Object.keys(fields).length !== Object.keys(limits).length + 1 || typeof fields.consent !== "boolean") throw invalid();
  for (const [key, limit] of Object.entries(limits)) {
    if (typeof fields[key] !== "string" || fields[key].length > limit) throw invalid();
  }
  if (Object.keys(fields).some(key => key !== "consent" && !(key in limits))) throw invalid();
  const result = { ...fields } as Fut;
  if (result.serviceId && !catalog.some(s => s.id === result.serviceId)) {
    throw new PortalError("invalid", "Selecciona un trámite del catálogo.");
  }
  return result;
}

export function validateSubmit(f: Fut, external = false) {
  for (const [key, label] of [
    ["name", "nombres y apellidos"], ["dni", "documento de identidad"],
    ["code", "código de estudiante"], ["email", "correo"],
    ["phone", "teléfono"], ["address", "domicilio"],
    ["recipient", "destinatario"], ["role", "cargo"],
    ["serviceId", "tipo de trámite"], ["reason", "fundamento"],
    ["signature", "declaración de autoría"],
  ] as const) {
    if (external && key === "code") continue;
    if (f[key].trim().length < 2) throw new PortalError("invalid", `Completa el campo: ${label}.`);
  }
  if (!/^\d{8}$/.test(f.dni)) throw new PortalError("invalid", "El DNI debe tener 8 dígitos.");
  if (!/^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i.test(f.email)) {
    throw new PortalError("invalid", "Ingresa un correo válido.");
  }
  if (!/^\d{9}$/.test(f.phone.replace(/[ +()-]/g, ""))) throw new PortalError("invalid", "Ingresa un teléfono de 9 dígitos.");
  if (!external && !faculties[f.faculty]?.includes(f.school)) throw new PortalError("invalid", "Selecciona una facultad y escuela válidas.");
  if (!f.consent) throw new PortalError("invalid", "Confirma tu declaración de veracidad.");
  if (f.signature.trim().toLocaleLowerCase() !== f.name.trim().toLocaleLowerCase()) {
    throw new PortalError("invalid", "La declaración de autoría debe coincidir con tu nombre completo.");
  }
  if (/\[[^\]]+\]/.test(f.reason)) throw new PortalError("invalid", "Reemplaza los textos entre corchetes de la plantilla antes de enviarla.");
  if (f.serviceId === "fut-6-3" && !f.other.trim()) throw new PortalError("invalid", "Describe el trámite en «Otros».");
}
