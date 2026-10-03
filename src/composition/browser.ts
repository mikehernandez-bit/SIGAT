import { api, uploadFile } from "../presentation/client/portal-api";
import type { PortalClient } from "../presentation/ports/portal-client";
export const portalClient: PortalClient = {
  api, uploadFile,
  async exportPdf(record, kind) {
    const { exportPdf } = await import("../infrastructure/exports/browser-export");
    await exportPdf(record, kind);
  },
  async exportCsv(records) {
    const { exportCsv } = await import("../infrastructure/exports/browser-export");
    exportCsv(records);
  },
};
