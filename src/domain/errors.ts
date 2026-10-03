export type ErrorCode =
  | "invalid" | "unauthenticated" | "forbidden" | "not_found"
  | "conflict" | "unavailable" | "too_large";

/** Errores del negocio; la capa HTTP decide su código de respuesta. */
export class PortalError extends Error {
  constructor(public readonly code: ErrorCode, message: string) {
    super(message);
    this.name = "PortalError";
  }
}
