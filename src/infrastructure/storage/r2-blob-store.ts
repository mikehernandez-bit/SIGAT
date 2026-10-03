import type { BlobStore } from "../../application/ports";
import { PortalError } from "../../domain/errors";
export class R2BlobStore implements BlobStore {
  constructor(private readonly binding: R2Bucket | undefined) {}
  private get bucket() {
    if (!this.binding) throw new PortalError("unavailable", "El almacenamiento de archivos no está disponible.");
    return this.binding;
  }
  async put(key: string, bytes: Uint8Array, mime: string) {
    await this.bucket.put(key, bytes, { httpMetadata: { contentType: mime } });
  }
  async get(key: string) {
    const object = await this.bucket.get(key);
    return object ? { body: object.body } : null;
  }
  async delete(key: string) { await this.bucket.delete(key); }
}
