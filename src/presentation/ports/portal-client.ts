import type { Detail, RequestRecord } from "../../domain/models";
export interface PortalClient {
  api<T = Detail>(path: string, data?: unknown): Promise<T>;
  uploadFile(id: string, file: File, kind: string, revision: number): Promise<Detail>;
  exportPdf(record: RequestRecord, kind: "fut" | "receipt"): Promise<void>;
  exportCsv(records: RequestRecord[]): Promise<void>;
}
