import { parseSimulatedLogin, type SimulatedLogin } from "../domain/account-policy";
import { PortalError } from "../domain/errors";
import type { Identity, IdentityProvider, PortalRepository } from "./ports";

export interface SimulationRepository {
  current(gateId: string): Promise<Identity | null>;
  open(gateId: string, input: SimulatedLogin): Promise<void>;
  close(gateId: string): Promise<void>;
  openAdministration(gateId: string): Promise<void>;
}
/** Demostración de perfiles dentro del sitio privado; nunca verifica credenciales Microsoft. */
export class AccountSimulationService {
  constructor(private readonly gate: IdentityProvider, private readonly users: PortalRepository, private readonly sessions: SimulationRepository) {}
  private async owner() {
    const identity = await this.gate.current();
    if (!identity) throw new PortalError("unauthenticated", "Primero ingresa al entorno privado de demostración.");
    await this.users.ensureUser(identity);
    return identity.userId;
  }
  async signIn(value: unknown) { await this.sessions.open(await this.owner(), parseSimulatedLogin(value)); }
  async signOut() { await this.sessions.close(await this.owner()); }
  async status() {
    const identity = await this.gate.current();
    if (!identity) return {available:false, canAdmin:false};
    const user = await this.users.ensureUser(identity);
    return {available:true, canAdmin:user.role === "admin" || user.role === "staff"};
  }
  async signInAdministration() {
    const identity = await this.gate.current();
    if (!identity) throw new PortalError("unauthenticated", "Ingresa al entorno privado de demostración.");
    const user = await this.users.ensureUser(identity);
    if (user.role !== "admin" && user.role !== "staff") throw new PortalError("forbidden", "No tienes permiso administrativo.");
    await this.sessions.openAdministration(identity.userId);
  }
}

export class SimulatedIdentityProvider implements IdentityProvider {
  constructor(private readonly gate: IdentityProvider, private readonly sessions: SimulationRepository) {}
  async current() {
    const realIdentity = await this.gate.current();
    if (!realIdentity) return null;
    // El acceso al entorno privado no inicia una sesión en SIGET-UNS.
    return await this.sessions.current(realIdentity.userId);
  }
}
