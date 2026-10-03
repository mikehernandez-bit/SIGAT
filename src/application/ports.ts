import type { Fut } from "../domain/catalog";
import type { Attachment, Bootstrap, Detail, RequestRecord, User } from "../domain/models";

export interface Identity { userId: string; email: string; displayName: string; accountKind?: "institutional" | "external" | "administration" }
export interface IdentityProvider { current(): Promise<Identity | null> }
export interface Clock { now(): string; year(): number }
export interface IdGenerator { next(): string }

export type RequestChange = {
  status: string; title: string; message: string; content?: Fut;
  office?: string; response?: string; code?: string | null;
  submitted?: string | null; notify?: boolean;
};
export type StoredFile = Attachment & { request: string; object_key: string };

/** Puerto específico del expediente: no expone SQL, D1 ni transacciones del proveedor. */
export interface PortalRepository {
  ensureUser(identity: Identity): Promise<User>;
  bootstrap(user: User): Promise<Bootstrap>;
  findRequest(id: string): Promise<RequestRecord | null>;
  detail(record: RequestRecord): Promise<Detail>;
  createDraft(user: User, fut: Fut, office: string): Promise<Detail>;
  change(record: RequestRecord, user: User, revision: number, change: RequestChange): Promise<Detail>;
  evidenceCount(id: string): Promise<number>;
  fileTotals(id: string): Promise<{ n: number; size: number }>;
  findFile(id: string): Promise<StoredFile | null>;
  addFile(record: RequestRecord, revision: number, file: StoredFile): Promise<void>;
  retireFile(record: RequestRecord, revision: number, fileId: string): Promise<void>;
  updateProfile(user: User, profile: Partial<Fut>): Promise<void>;
  markNotifications(userId: string, noticeId?: string): Promise<void>;
  ownerId(): Promise<string | null>;
  changeRole(id: string, role: string): Promise<void>;
}
export interface BlobStore {
  put(key: string, bytes: Uint8Array, mime: string): Promise<void>;
  get(key: string): Promise<{ body: ReadableStream<Uint8Array> } | null>;
  delete(key: string): Promise<void>;
}
