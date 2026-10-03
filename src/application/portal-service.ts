import { blankFut, offices, type Fut } from "../domain/catalog";
import type { Detail, RequestRecord, User } from "../domain/models";
import { PortalError } from "../domain/errors";
import { parseFut, validateSubmit } from "../domain/fut-policy";
import { authorizeOwner, authorizeRead, authorizeUpload, assertRevision, isEditable, isClosedToStaff, isStaff } from "../domain/request-policy";
import { validateFile, validateFileQuota } from "../domain/file-policy";
import type { BlobStore, Clock, IdGenerator, IdentityProvider, PortalRepository, RequestChange } from "./ports";

export type RequestCommand = {
  action: string; revision: number; content?: unknown;
  fileId?: string; message?: unknown; office?: string;
};
export type UploadCommand = {
  name: string; size: number; bytes: Uint8Array;
  kind: "evidence" | "response"; revision: number;
};

/** Casos de uso. Todas las dependencias externas entran por puertos. */
export class PortalService {
  constructor(private readonly dependencies: {
    repository: PortalRepository; blobs: BlobStore;
    identity: IdentityProvider; clock: Clock; ids: IdGenerator;
  }) {}
  private get repo() { return this.dependencies.repository; }

  async actor(): Promise<User> {
    const identity = await this.dependencies.identity.current();
    if (!identity) throw new PortalError("unauthenticated", "Inicia sesión para acceder a tus solicitudes.");
    return this.repo.ensureUser(identity);
  }
  async bootstrap(user: User) { return this.repo.bootstrap(user); }
  private identifiedFut(user: User, fut: Fut): Fut {
    if (!user.accountKind || user.accountKind === "administration") return fut;
    return { ...fut, name: user.name, email: user.email, signature: user.name,
      ...(user.accountKind === "external" ? { faculty: "", school: "", code: "" } : {}),
    };
  }
  private async request(id: string, user: User) {
    const record = await this.repo.findRequest(id);
    authorizeRead(record, user);
    return record;
  }
  async getDetail(id: string, user: User) { return this.repo.detail(await this.request(id, user)); }
  async createDraft(user: User, value?: unknown) {
    const fut = this.identifiedFut(user, value ? parseFut(value) : { ...blankFut, ...user.profile });
    return this.repo.createDraft(user, fut, offices[1]);
  }
  async updateProfile(user: User, value: unknown) {
    const parsed = parseFut(value);
    if (parsed.name.trim().length < 3) throw new PortalError("invalid", "Completa tu nombre en Mis datos.");
    const f = this.identifiedFut({...user,name:parsed.name.trim()}, parsed);
    await this.repo.updateProfile(user, {
      name: f.name, dni: f.dni, faculty: f.faculty, school: f.school,
      code: f.code, email: f.email, phone: f.phone, address: f.address,
    });
  }
  async markNotifications(user: User, id?: string) { await this.repo.markNotifications(user.id, id); }
  async changeRole(user: User, value: unknown) {
    if (user.role !== "admin") throw new PortalError("not_found", "Ruta no encontrada.");
    const data = value as Record<string, unknown> | null;
    if (!data || Array.isArray(data) || Object.keys(data).length !== 2 ||
        typeof data.id !== "string" || !data.id.length || typeof data.role !== "string" ||
        !["student", "staff", "admin"].includes(data.role)) {
      throw new PortalError("invalid", "Rol no válido.");
    }
    if (await this.repo.ownerId() === data.id) throw new PortalError("invalid", "No se puede modificar el rol del propietario del proyecto.");
    await this.repo.changeRole(data.id, data.role);
  }
  private async commit(record: RequestRecord, user: User, revision: number, data: RequestChange) {
    assertRevision(record, revision);
    return this.repo.change(record, user, revision, data);
  }

  async act(id: string, user: User, data: RequestCommand): Promise<Detail> {
    const r = await this.request(id, user), a = data.action;
    if (["save", "submit", "correct", "cancel", "retireFile"].includes(a)) authorizeOwner(r, user);
    if (a === "save") {
      if (!isEditable(r.status)) throw new PortalError("conflict", "El FUT solo se edita en borrador o cuando está observado.");
      return this.commit(r, user, data.revision, {
        status: r.status, title: r.status === "draft" ? "Borrador guardado" : "Corrección guardada",
        message: "El solicitante actualizó su FUT.", content: this.identifiedFut(user, parseFut(data.content)),
      });
    }
    if (a === "submit" || a === "correct") {
      if ((a === "submit" && r.status !== "draft") || (a === "correct" && r.status !== "observed")) {
        throw new PortalError("conflict", "La solicitud no está disponible para esta acción.");
      }
      const fut = this.identifiedFut(user, parseFut(data.content));
      validateSubmit(fut, user.accountKind === "external");
      if (fut.serviceId === "justificacion-medica" && !await this.repo.evidenceCount(r.id)) {
        throw new PortalError("invalid", "Adjunta al menos un documento de sustento médico.");
      }
      const code = r.code ?? `UNS-${this.dependencies.clock.year()}-${String(r.serial).padStart(6, "0")}`;
      return this.commit(r, user, data.revision, {
        content: fut, status: a === "submit" ? "received" : "corrected",
        title: a === "submit" ? "Solicitud recibida" : "Observación subsanada",
        message: a === "submit"
          ? `Tu solicitud ${code} fue recibida en este portal de prueba. Puedes seguir su atención.`
          : "El solicitante presentó la subsanación para una nueva evaluación.",
        code, submitted: r.submitted ?? this.dependencies.clock.now(), notify: true,
      });
    }
    if (a === "cancel") {
      if (!["draft", "received", "observed"].includes(r.status)) throw new PortalError("conflict", "Solo se pueden cancelar borradores y solicitudes recibidas u observadas.");
      return this.commit(r, user, data.revision, {
        status: "cancelled", title: "Solicitud cancelada",
        message: "El solicitante canceló la solicitud. El historial se conserva.", notify: true,
      });
    }
    if (a === "retireFile") {
      if (!isEditable(r.status)) throw new PortalError("conflict", "No se puede retirar un adjunto en este estado.");
      const f = data.fileId ? await this.repo.findFile(data.fileId) : null;
      if (!f || f.request !== r.id || f.kind !== "evidence" || f.retired) throw new PortalError("not_found", "Adjunto no disponible.");
      assertRevision(r, data.revision);
      await this.repo.retireFile(r, data.revision, f.id);
      return this.getDetail(r.id, user);
    }
    if (!isStaff(user)) throw new PortalError("forbidden", "La atención requiere un rol de secretaría.");
    if (isClosedToStaff(r.status)) throw new PortalError("conflict", "Este expediente no admite más acciones de atención.");
    const message = typeof data.message === "string" ? data.message.trim() : "";
    if (message.length < 5 || message.length > 6000) throw new PortalError("invalid", "Escribe una observación o respuesta de al menos 5 caracteres.");
    if (a === "review") return this.commit(r, user, data.revision, {
      status: "reviewing", title: "Evaluación iniciada", message, notify: true,
    });
    if (a === "observe") {
      if (r.status === "observed") throw new PortalError("conflict", "La solicitud ya está observada.");
      return this.commit(r, user, data.revision, { status: "observed", title: "Subsanación requerida", message, notify: true });
    }
    if (a === "refer") {
      if (!data.office || !offices.includes(data.office)) throw new PortalError("invalid", "Selecciona una dependencia válida.");
      return this.commit(r, user, data.revision, {
        status: "referred", title: `Derivado a ${data.office}`, message, office: data.office, notify: true,
      });
    }
    if (a === "resolve" || a === "reject") return this.commit(r, user, data.revision, {
      status: a === "resolve" ? "resolved" : "rejected",
      title: a === "resolve" ? "Solicitud atendida" : "Solicitud no procedente",
      message, response: message, notify: true,
    });
    throw new PortalError("invalid", "Acción no reconocida.");
  }

  async upload(id: string, user: User, input: UploadCommand) {
    if (!id) throw new PortalError("invalid", "Selecciona un expediente.");
    const record = await this.request(id, user);
    authorizeUpload(record, user, input.kind);
    validateFileQuota(await this.repo.fileTotals(id), input.size);
    const file = validateFile(input.name, input.bytes, input.size);
    assertRevision(record, input.revision);
    const fileId = this.dependencies.ids.next(), key = `requests/${id}/${fileId}.${file.ext}`;
    await this.dependencies.blobs.put(key, input.bytes, file.mime);
    try {
      await this.repo.addFile(record, input.revision, {
        id: fileId, request: id, object_key: key, name: file.name, mime: file.mime,
        size: input.size, kind: input.kind, retired: 0, created: this.dependencies.clock.now(),
      });
    } catch (error) {
      // Compensación: solo se elimina el objeto nuevo creado por esta operación fallida.
      await this.dependencies.blobs.delete(key);
      throw error;
    }
    return this.getDetail(id, user);
  }
  async download(id: string, user: User) {
    const file = await this.repo.findFile(id);
    if (!file) throw new PortalError("not_found", "Archivo no encontrado.");
    await this.request(file.request, user);
    const object = await this.dependencies.blobs.get(file.object_key);
    if (!object) throw new PortalError("not_found", "Archivo no disponible.");
    return { body: object.body, mime: file.mime, name: file.name };
  }
}
