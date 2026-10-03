import { PortalError } from "./errors";
export const institutionalDomain = "uns.edu.pe";
export type SimulatedLogin = { kind: "institutional" | "external"; name: string; email: string };
export function parseSimulatedLogin(value: unknown): SimulatedLogin {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new PortalError("invalid", "Completa los datos de acceso simulado.");
  const data = value as Record<string, unknown>;
  if (Object.keys(data).length !== 3 || !["institutional", "external"].includes(String(data.kind)) ||
      data.password !== "123" ||
      typeof data.email !== "string" || data.email.length > 200 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    throw new PortalError("invalid", "Ingresa un correo válido y la contraseña de demostración 123. No uses tu contraseña real.");
  }
  const email = data.email.trim().toLowerCase(), institutional = email.split("@")[1] === institutionalDomain;
  if (data.kind === "institutional" && !institutional) throw new PortalError("invalid", "El acceso de estudiantes requiere un correo @uns.edu.pe.");
  if (data.kind === "external" && institutional) throw new PortalError("invalid", "Usa el acceso institucional para correos @uns.edu.pe.");
  // Alias inicial de prueba; el nombre completo se configura después en Mis datos.
  const name = (data.kind === "institutional" ? "Estudiante UNS " : "Persona externa ") + email.split("@")[0];
  return { kind: data.kind as SimulatedLogin["kind"], name: name.slice(0,160), email };
}
