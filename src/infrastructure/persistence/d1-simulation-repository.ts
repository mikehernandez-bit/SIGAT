import type { SimulatedLogin } from "../../domain/account-policy";
import { PortalError } from "../../domain/errors";
import type { Clock, Identity } from "../../application/ports";
import type { SimulationRepository } from "../../application/account-simulation";

export class D1SimulationRepository implements SimulationRepository {
  constructor(private readonly binding: D1Database | undefined, private readonly clock: Clock) {}
  private get db() {
    if (!this.binding) throw new PortalError("unavailable", "No está disponible el acceso simulado.");
    return this.binding;
  }
  async current(gateId: string): Promise<Identity | null> {
    return this.db.prepare("SELECT u.id AS userId,u.email,u.name AS displayName,a.kind AS accountKind FROM simulation_sessions s JOIN simulated_accounts a ON a.id=s.actor AND a.gate_owner=s.gate_owner JOIN users u ON u.id=a.id WHERE s.gate_owner=?")
      .bind(gateId).first<Identity>();
  }
  async open(gateId: string, input: SimulatedLogin) {
    // La misma dirección en otro espacio privado no permite acceder al mismo perfil.
    const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify([gateId, input.email]))));
    const id = "demo_" + Array.from(hash, b => b.toString(16).padStart(2, "0")).join("");
    const now = this.clock.now();
    await this.db.batch([
      this.db.prepare("INSERT OR IGNORE INTO users (id,email,name,role,profile,created) VALUES (?,?,?,'student',?,?)")
        .bind(id, input.email, input.name, JSON.stringify({ name: input.name, email: input.email }), now),
      this.db.prepare("INSERT OR IGNORE INTO simulated_accounts (id,gate_owner,email,kind) VALUES (?,?,?,?)").bind(id, gateId, input.email, input.kind),
      this.db.prepare("INSERT INTO simulation_sessions (gate_owner,actor,updated) VALUES (?,?,?) ON CONFLICT(gate_owner) DO UPDATE SET actor=excluded.actor,updated=excluded.updated")
        .bind(gateId, id, now),
    ]);
  }
  async close(gateId: string) { await this.db.prepare("DELETE FROM simulation_sessions WHERE gate_owner=?").bind(gateId).run(); }
  async openAdministration(gateId: string) {
    // Solo el caso de uso autorizado puede activar la identidad base de atención.
    await this.db.batch([
      this.db.prepare("INSERT OR IGNORE INTO simulated_accounts (id,gate_owner,email,kind) VALUES (?,?,'__administration__','administration')").bind(gateId,gateId),
      this.db.prepare("INSERT INTO simulation_sessions (gate_owner,actor,updated) VALUES (?,?,?) ON CONFLICT(gate_owner) DO UPDATE SET actor=excluded.actor,updated=excluded.updated").bind(gateId,gateId,this.clock.now()),
    ]);
  }
}
