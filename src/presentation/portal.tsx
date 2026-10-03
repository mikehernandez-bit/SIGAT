"use client";
import { portalClient } from "../composition/browser";
import { usePortalController } from "./controllers/use-portal-controller";
import PortalView from "./views/portal-view";
export default function Portal() {
  return <PortalView controller={usePortalController(portalClient)} />;
}
