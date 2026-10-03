import { createPortalService, createAccountSimulationService } from "@/src/composition/portal";
import { PortalHttpController, type RouteContext } from "@/src/presentation/controllers/portal-http-controller";
export const dynamic = "force-dynamic";
const controller = new PortalHttpController(createPortalService, createAccountSimulationService);
export function GET(request: Request, context: RouteContext) { return controller.get(request, context); }
export function POST(request: Request, context: RouteContext) { return controller.post(request, context); }
