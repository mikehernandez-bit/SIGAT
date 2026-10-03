"use client";
import type { PortalController } from "../controllers/use-portal-controller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AccountAccessView({ controller: c }: { controller: PortalController }) {
  return <section className="panel access account-access">
    <h1>Iniciar sesión</h1>
    <p>Ingresa con tu cuenta para acceder a tus trámites.</p>
    <p className="footnote">Demostración privada: no conecta con Microsoft, no verifica correos ni presenta trámites ante la UNS. Usa datos ficticios y nunca ingreses contraseñas.</p>
    {c.loadError && <div role="alert"><p>{c.loadError}</p><Button variant="outline" onClick={() => c.refresh()}>Reintentar</Button></div>}
    {!c.accessStatus.available ? <a href="/signin-with-chatgpt?return_to=%2F" className="primary-link">Habilitar entorno de demostración</a> : <>
      {c.boot?.user.accountKind && <div role="status">
        <h3>Cuenta activa · {c.external ? "Persona externa" : "Estudiante UNS"}</h3>
        <p>{c.boot.user.name}<br />{c.boot.user.email}</p>
        <Button onClick={() => c.nav("inicio")}>Continuar con esta cuenta</Button>{" "}
        <Button variant="outline" disabled={c.busy} onClick={c.signOutAccount}>Cerrar cuenta simulada</Button>
      </div>}
      <Tabs value={c.accessKind} onValueChange={v => c.changeAccount(v as "institutional" | "external")}>
        <TabsList><TabsTrigger value="institutional">Estudiante UNS</TabsTrigger><TabsTrigger value="external">Persona externa</TabsTrigger></TabsList>
      </Tabs>
      <form className="form-grid" onSubmit={e => { e.preventDefault(); c.signInAccount(); }} style={{textAlign:"left", marginTop:24}}>
        <label>Nombre completo de prueba<Input required minLength={3} maxLength={160} value={c.accessName} onChange={e => c.setAccessName(e.target.value)} autoComplete="off" placeholder="Nombre y apellidos" /></label>
        <label>{c.accessKind === "institutional" ? "Correo institucional UNS" : "Correo personal"}<Input required type="email" maxLength={200} value={c.accessEmail} onChange={e => c.setAccessEmail(e.target.value)} autoComplete="off" placeholder={c.accessKind === "institutional" ? "estudiante@uns.edu.pe" : "persona@example.com"} /></label>
        <p>{c.accessKind === "institutional" ? "Simula la opción Microsoft con un correo terminado en @uns.edu.pe." : "Puedes usar un correo personal de cualquier proveedor, diferente de @uns.edu.pe. No se exige matrícula."}</p>
        <Button type="submit" disabled={c.busy}>{c.busy ? "Abriendo cuenta..." : c.accessKind === "institutional" ? "Continuar con Microsoft · simulación" : "Continuar con correo personal · simulación"}</Button>
      </form>
      {c.formError && <p role="alert">{c.formError}</p>}
      {c.accessStatus.canAdmin && !c.boot && <details className="admin-login"><summary>Acceso de administración · demostración</summary><p>Solo para el operador autorizado del entorno de prueba.</p><Button variant="outline" disabled={c.busy} onClick={c.signInAdministration}>Iniciar sesión administrativa</Button></details>}
    </>}
  </section>;
}
