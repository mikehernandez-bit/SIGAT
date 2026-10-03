import type { Detail } from "../../domain/models";

/** Adaptador HTTP del cliente. Las vistas no hacen peticiones directamente. */
export async function api<T = Detail>(path: string, data?: unknown): Promise<T> {
  const response = await fetch("/api/portal/" + path, {
    method: data === undefined ? "GET" : "POST",
    headers: data === undefined ? {} : { "Content-Type": "application/json" },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  return read<T>(response);
}
async function read<T>(response: Response): Promise<T> {
  const result = await response.json() as T & { error?: string };
  if (!response.ok) throw Object.assign(new Error(result.error || "No se pudo completar la operación."), { status: response.status });
  return result;
}
export async function uploadFile(id: string, file: File, kind: string, revision: number): Promise<Detail> {
  const form = new FormData();
  form.append("file", file); form.append("kind", kind); form.append("revision", String(revision));
  return read<Detail>(await fetch("/api/portal/files/" + id, { method: "POST", body: form }));
}
