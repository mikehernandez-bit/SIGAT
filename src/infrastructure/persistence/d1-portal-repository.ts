import type { Fut } from "../../domain/catalog";
import type { Bootstrap, Detail, Event, Attachment, Notice, RequestRecord, User } from "../../domain/models";
import { PortalError } from "../../domain/errors";
import { isStaff } from "../../domain/request-policy";
import type { Clock, Identity, IdGenerator, PortalRepository, RequestChange, StoredFile } from "../../application/ports";

type RequestRow = Omit<RequestRecord, "content"> & { content: string; last_op: string };
type UserRow = Omit<User, "profile"> & { profile: string; created: string };
const requestModel = ({ content, last_op: _operation, ...fields }: RequestRow): RequestRecord => ({ ...fields, content: JSON.parse(content) as Fut });
const userModel = (row: UserRow): User => ({ ...row, profile: JSON.parse(row.profile) });

/** Adaptador SQL: mapeo de filas, sentencias preparadas y escrituras atómicas D1. */
export class D1PortalRepository implements PortalRepository {
  constructor(private readonly binding: D1Database | undefined, private readonly clock: Clock, private readonly ids: IdGenerator) {}
  private get db() {
    if (!this.binding) throw new PortalError("unavailable", "La base de datos no está disponible. Tu información no se ha enviado.");
    return this.binding;
  }
  async ensureUser(identity: Identity): Promise<User> {
    // Solo el primer propietario del entorno privado inicializa administración.
    await this.db.batch([
      this.db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('owner', ?)").bind(identity.userId),
      this.db.prepare("INSERT OR IGNORE INTO users (id, email, name, role, profile, created) VALUES (?, ?, ?, CASE WHEN ? = (SELECT value FROM settings WHERE key = 'owner') THEN 'admin' ELSE 'student' END, '{}', ?)")
        .bind(identity.userId, identity.email, identity.displayName, identity.userId, this.clock.now()),
    ]);
    const row = await this.db.prepare("SELECT u.*,a.kind AS accountKind FROM users u LEFT JOIN simulated_accounts a ON a.id=u.id WHERE u.id = ?").bind(identity.userId).first<UserRow>();
    if (!row) throw new PortalError("unavailable", "No se pudo cargar la cuenta.");
    return { ...userModel(row), accountKind: row.accountKind ?? undefined };
  }
  async bootstrap(user: User): Promise<Bootstrap> {
    const [mine, notifications, all, users] = await this.db.batch([
      this.db.prepare("SELECT * FROM requests WHERE owner=? ORDER BY updated DESC").bind(user.id),
      this.db.prepare("SELECT * FROM notifications WHERE owner=? ORDER BY created DESC LIMIT 200").bind(user.id),
      isStaff(user) ? this.db.prepare("SELECT * FROM requests WHERE code IS NOT NULL ORDER BY updated DESC") : this.db.prepare("SELECT * FROM requests WHERE 0"),
      user.role === "admin" ? this.db.prepare("SELECT id,name,email,role FROM users ORDER BY name") : this.db.prepare("SELECT id,name,email,role FROM users WHERE 0"),
    ]);
    return {
      user, mine: (mine.results as RequestRow[]).map(requestModel),
      notifications: notifications.results as Notice[], all: (all.results as RequestRow[]).map(requestModel),
      users: users.results as Bootstrap["users"],
    };
  }
  async findRequest(id: string) {
    const row = await this.db.prepare("SELECT * FROM requests WHERE id = ?").bind(id).first<RequestRow>();
    return row ? requestModel(row) : null;
  }
  async detail(record: RequestRecord): Promise<Detail> {
    const [history, attachments] = await this.db.batch([
      this.db.prepare("SELECT id, status, title, message, actor, snapshot, created FROM events WHERE request = ? ORDER BY created, rowid").bind(record.id),
      this.db.prepare("SELECT id, name, mime, size, kind, retired, created FROM files WHERE request = ? ORDER BY created").bind(record.id),
    ]);
    return { ...record, events: history.results as Event[], files: attachments.results as Attachment[] };
  }
  private async reload(id: string) {
    const record = await this.findRequest(id);
    if (!record) throw new PortalError("not_found", "Expediente no encontrado.");
    return this.detail(record);
  }
  async createDraft(user: User, fut: Fut, office: string) {
    const id = this.ids.next(), now = this.clock.now();
    await this.db.prepare("INSERT INTO requests (id, owner, content, status, office, revision, last_op, created, updated) VALUES (?, ?, ?, 'draft', ?, 1, ?, ?, ?)")
      .bind(id, user.id, JSON.stringify(fut), office, this.ids.next(), now, now).run();
    return this.reload(id);
  }
  async change(r: RequestRecord, user: User, revision: number, data: RequestChange) {
    const op = this.ids.next(), now = this.clock.now(), content = JSON.stringify(data.content ?? r.content);
    const statements = [
      this.db.prepare("UPDATE requests SET status=?, content=?, office=?, response=?, code=?, submitted=?, revision=revision+1, last_op=?, updated=? WHERE id=? AND revision=?")
        .bind(data.status, content, data.office ?? r.office, data.response ?? r.response,
          data.code === undefined ? r.code : data.code, data.submitted === undefined ? r.submitted : data.submitted,
          op, now, r.id, revision),
      this.db.prepare("INSERT INTO events (id, request, status, title, message, actor, snapshot, created) SELECT ?, id, ?, ?, ?, ?, ?, ? FROM requests WHERE id=? AND last_op=?")
        .bind(this.ids.next(), data.status, data.title, data.message, user.name, data.status === "draft" ? null : content, now, r.id, op),
    ];
    if (data.notify) statements.push(
      this.db.prepare("INSERT INTO notifications (id, owner, request, message, read, created) SELECT ?, owner, id, ?, 0, ? FROM requests WHERE id=? AND last_op=?")
        .bind(this.ids.next(), data.message, now, r.id, op),
    );
    const result = await this.db.batch(statements);
    if (!result[0].meta.changes) throw new PortalError("conflict", "Otra acción modificó el expediente. Vuelve a cargarlo.");
    return this.reload(r.id);
  }
  async evidenceCount(id: string) {
    const count = await this.db.prepare("SELECT count(*) AS n FROM files WHERE request=? AND kind='evidence' AND retired=0").bind(id).first<{ n: number }>();
    return count?.n ?? 0;
  }
  async fileTotals(id: string) {
    return await this.db.prepare("SELECT count(*) AS n, coalesce(sum(size),0) AS size FROM files WHERE request=? AND retired=0").bind(id).first<{ n: number; size: number }>() ?? { n: 0, size: 0 };
  }
  async findFile(id: string) { return this.db.prepare("SELECT * FROM files WHERE id=?").bind(id).first<StoredFile>(); }
  async addFile(record: RequestRecord, revision: number, file: StoredFile) {
    const op = this.ids.next(), now = this.clock.now();
    const result = await this.db.batch([
      this.db.prepare("UPDATE requests SET revision=revision+1,last_op=?,updated=? WHERE id=? AND revision=?").bind(op, now, record.id, revision),
      this.db.prepare("INSERT INTO files (id,request,name,object_key,mime,size,kind,created) SELECT ?,id,?,?,?,?,?,? FROM requests WHERE id=? AND last_op=?")
        .bind(file.id, file.name, file.object_key, file.mime, file.size, file.kind, file.created, record.id, op),
    ]);
    if (!result[0].meta.changes) throw new PortalError("conflict", "El expediente cambió. Recárgalo y vuelve a adjuntar el archivo.");
  }
  async retireFile(record: RequestRecord, revision: number, fileId: string) {
    const op = this.ids.next(), now = this.clock.now();
    const result = await this.db.batch([
      this.db.prepare("UPDATE requests SET revision=revision+1,last_op=?,updated=? WHERE id=? AND revision=?").bind(op, now, record.id, revision),
      this.db.prepare("UPDATE files SET retired=1 WHERE id=? AND request=? AND EXISTS (SELECT 1 FROM requests WHERE id=? AND last_op=?)").bind(fileId, record.id, record.id, op),
    ]);
    if (!result[0].meta.changes) throw new PortalError("conflict", "El expediente cambió. Recárgalo.");
  }
  async updateProfile(user: User, profile: Partial<Fut>) {
    await this.db.prepare("UPDATE users SET profile=?, name=? WHERE id=?").bind(JSON.stringify(profile), profile.name?.trim() || user.name, user.id).run();
  }
  async markNotifications(userId: string, noticeId?: string) {
    if (noticeId) await this.db.prepare("UPDATE notifications SET read=1 WHERE id=? AND owner=?").bind(noticeId, userId).run();
    else await this.db.prepare("UPDATE notifications SET read=1 WHERE owner=?").bind(userId).run();
  }
  async ownerId() {
    const owner = await this.db.prepare("SELECT value FROM settings WHERE key='owner'").first<{ value: string }>();
    return owner?.value ?? null;
  }
  async changeRole(id: string, role: string) { await this.db.prepare("UPDATE users SET role=? WHERE id=?").bind(role, id).run(); }
}
