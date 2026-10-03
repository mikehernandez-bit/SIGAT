import type { PortalService, RequestCommand } from "../../application/portal-service";
import type { AccountSimulationService } from "../../application/account-simulation";
import { PortalError, type ErrorCode } from "../../domain/errors";

export type RouteContext = { params: Promise<{ path: string[] }> };
const statuses: Record<ErrorCode, number> = {
  invalid: 400, unauthenticated: 401, forbidden: 403, not_found: 404,
  conflict: 409, unavailable: 503, too_large: 413,
};
const json = (value: unknown) => Response.json(value, { headers: { "Cache-Control": "no-store" } });
function failure(error: unknown) {
  if (error instanceof PortalError) return Response.json({ error: error.message }, {
    status: statuses[error.code], headers: { "Cache-Control": "no-store" },
  });
  console.error("UNS API: operación no completada", error instanceof Error ? error.message : "error");
  return Response.json({ error: "El servicio no está disponible temporalmente. Conserva tu formulario y vuelve a intentarlo." }, {
    status: 503, headers: { "Cache-Control": "no-store" },
  });
}
function mutationGuard(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) throw new PortalError("forbidden", "Solicitud de origen no permitido.");
}
async function body(request: Request): Promise<Record<string, unknown>> {
  if (Number(request.headers.get("content-length") || 0) > 64000) throw new PortalError("too_large", "El formulario excede el tamaño permitido.");
  const raw = await request.text();
  if (raw.length > 64000) throw new PortalError("too_large", "El formulario excede el tamaño permitido.");
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("object required");
    return parsed;
  } catch { throw new PortalError("invalid", "La solicitud no tiene un formato válido."); }
}
const text = (value: unknown) => typeof value === "string" ? value : undefined;

/** Controlador MVC: adapta HTTP a comandos y resultados, sin consultas SQL. */
export class PortalHttpController {
  constructor(private readonly createService: () => PortalService, private readonly createSimulation: () => AccountSimulationService) {}
  async get(_request: Request, context: RouteContext) {
    try {
      const route = await context.params;
      if (route.path[0] === "simulation" && route.path[1] === "status") return json(await this.createSimulation().status());
      const service = this.createService(), user = await service.actor(), { path } = await context.params;
      if (path[0] === "bootstrap") return json(await service.bootstrap(user));
      if (path[0] === "requests" && path[1]) return json(await service.getDetail(path[1], user));
      if (path[0] === "files" && path[1]) {
        const file = await service.download(path[1], user);
        return new Response(file.body, { headers: {
          "Content-Type": file.mime,
          "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`,
          "X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store",
        } });
      }
      throw new PortalError("not_found", "Ruta no encontrada.");
    } catch (error) { return failure(error); }
  }
  async post(request: Request, context: RouteContext) {
    try {
      mutationGuard(request);
      const route = await context.params;
      if (route.path[0] === "simulation") {
        const simulation = this.createSimulation();
        if (route.path[1] === "signin") { await simulation.signIn(await body(request)); return json({ ok: true }); }
        if (route.path[1] === "signout") { await simulation.signOut(); return json({ ok: true }); }
        if (route.path[1] === "administration") { await simulation.signInAdministration(); return json({ ok: true }); }
        throw new PortalError("not_found", "Ruta no encontrada.");
      }
      const service = this.createService(), user = await service.actor(), { path } = await context.params;
      if (path[0] === "files") {
        if (Number(request.headers.get("content-length") || 0) > 26 * 1024 * 1024) throw new PortalError("too_large", "Cada archivo debe ser menor de 25 MB.");
        const form = await request.formData(), file = form.get("file");
        if (!(file instanceof File) || !file.size || file.size > 25 * 1024 * 1024) throw new PortalError("invalid", "Selecciona un archivo de hasta 25 MB.");
        return json(await service.upload(path[1], user, {
          name: file.name, size: file.size, bytes: new Uint8Array(await file.arrayBuffer()),
          kind: form.get("kind") === "response" ? "response" : "evidence", revision: Number(form.get("revision")),
        }));
      }
      const data = await body(request);
      if (path[0] === "draft") return json(await service.createDraft(user, data.content));
      if (path[0] === "profile") { await service.updateProfile(user, data.content); return json({ ok: true }); }
      if (path[0] === "notifications") { await service.markNotifications(user, text(data.id)); return json({ ok: true }); }
      if (path[0] === "users") { await service.changeRole(user, data); return json({ ok: true }); }
      if (path[0] === "requests" && path[1]) {
        const command: RequestCommand = {
          action: text(data.action) ?? "", revision: typeof data.revision === "number" ? data.revision : NaN,
          content: data.content, message: data.message, office: text(data.office), fileId: text(data.fileId),
        };
        return json(await service.act(path[1], user, command));
      }
      throw new PortalError("not_found", "Ruta no encontrada.");
    } catch (error) { return failure(error); }
  }
}
