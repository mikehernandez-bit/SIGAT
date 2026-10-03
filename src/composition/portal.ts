import { env } from "cloudflare:workers";
import { PortalService } from "../application/portal-service";
import type { Clock, IdGenerator } from "../application/ports";
import { D1PortalRepository } from "../infrastructure/persistence/d1-portal-repository";
import { R2BlobStore } from "../infrastructure/storage/r2-blob-store";
import { ChatGPTIdentityProvider } from "../infrastructure/auth/chatgpt-identity";
import { AccountSimulationService, SimulatedIdentityProvider } from "../application/account-simulation";
import { D1SimulationRepository } from "../infrastructure/persistence/d1-simulation-repository";

/** Composition root: único punto que conecta casos de uso con proveedores reales. */
export function createPortalService() {
  const bindings = env as Cloudflare.Env;
  const clock: Clock = { now: () => new Date().toISOString(), year: () => new Date().getFullYear() };
  const ids: IdGenerator = { next: () => crypto.randomUUID() };
  // Los adaptadores comprueban disponibilidad al usarse, después de autenticar.
  return new PortalService({
    repository: new D1PortalRepository(bindings.DB, clock, ids),
    blobs: new R2BlobStore(bindings.BUCKET),
    identity: new SimulatedIdentityProvider(new ChatGPTIdentityProvider(), new D1SimulationRepository(bindings.DB, clock)), clock, ids,
  });
}
export function createAccountSimulationService() {
  const bindings = env as Cloudflare.Env;
  const clock: Clock = { now: () => new Date().toISOString(), year: () => new Date().getFullYear() };
  return new AccountSimulationService(
    new ChatGPTIdentityProvider(),
    new D1PortalRepository(bindings.DB, clock, { next: () => crypto.randomUUID() }),
    new D1SimulationRepository(bindings.DB, clock),
  );
}
