import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

let checks = 0;
const check = (condition, message) => { assert.ok(condition, message); checks++; };
const root = process.cwd();
function files(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? files(file) : /\.tsx?$/.test(file) ? [file] : [];
  });
}
// Verificación estática de la regla de dependencias, incluyendo imports de tipos.
for (const layer of ["domain", "application"]) {
  for (const file of files(path.join(root, "src", layer))) {
    const source = fs.readFileSync(file, "utf8"), ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
    for (const statement of ast.statements) {
      if ((ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)) && statement.moduleSpecifier) {
        const specifier = statement.moduleSpecifier.text;
        const resolved = path.resolve(path.dirname(file), specifier);
        const allowed = layer === "domain" ? ["domain"] : ["domain", "application"];
        check(specifier.startsWith(".") && allowed.some(name => resolved.startsWith(path.join(root, "src", name) + path.sep)), `Dependencia exterior en ${file}: ${specifier}`);
      }
    }
    check(!/\b(?:fetch|Response|Request|D1Database|R2Bucket|localStorage)\b|cloudflare:|from\s+["'](?:react|next|zod)/.test(source), `Acoplamiento de plataforma en ${file}`);
  }
}
for (const file of files(path.join(root, "src", "presentation", "views"))) {
  const source = fs.readFileSync(file, "utf8");
  check(!/\bfetch\s*\(|\bapi\s*\(|\.prepare\s*\(|\.batch\s*\(|from ["'][^"']*(?:infrastructure|composition|client\/)/.test(source), "Una vista contiene acceso a infraestructura");
}
const controller = fs.readFileSync(path.join(root, "src/presentation/controllers/portal-http-controller.ts"), "utf8");
check(!/\.prepare\s*\(|\.batch\s*\(|D1Database|R2Bucket|cloudflare:/.test(controller), "SQL o proveedores en controlador HTTP");

// Ejecuta el núcleo TypeScript sin framework, servidor, SQL ni almacenamiento real.
const modules = new Map();
function moduleFor(file) {
  file = path.resolve(file);
  if (modules.has(file)) return modules.get(file);
  const source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText;
  const module = new vm.SourceTextModule(source, { identifier: file });
  modules.set(file, module);
  return module;
}
async function load(relative) {
  const module = moduleFor(path.join(root, relative));
  if (module.status === "unlinked") await module.link((specifier, parent) => moduleFor(path.resolve(path.dirname(parent.identifier), specifier) + ".ts"));
  if (module.status !== "evaluated") await module.evaluate();
  return module.namespace;
}
const { PortalService } = await load("src/application/portal-service.ts");
const { parseFut, validateSubmit } = await load("src/domain/fut-policy.ts");
const { blankFut } = await load("src/domain/catalog.ts");
const { authorizeRead, authorizeUpload } = await load("src/domain/request-policy.ts");
const { validateFile, validateFileQuota } = await load("src/domain/file-policy.ts");
const rejected = (run, code) => { assert.throws(run, error => error.code === code); checks++; };
const rejectedAsync = async (run, code) => { await assert.rejects(run, error => error.code === code); checks++; };
const user = { id: "student", name: "Prueba local", email: "test@example.test", role: "student", profile: {} };
const staff = { ...user, id: "staff", role: "staff" };
const fut = { ...blankFut, name: user.name, signature: user.name, dni: "12345678", code: "TEST2026", email: user.email,
  phone: "999000111", address: "Domicilio ficticio", serviceId: "justificacion-medica", reason: "Situación ficticia para pruebas aisladas.", consent: true };
check(parseFut(fut).name === user.name, "FUT válido");
validateSubmit(fut); checks++;
rejected(() => parseFut({ ...fut, extra: true }), "invalid");
rejected(() => parseFut({ ...fut, name: 123 }), "invalid");
rejected(() => parseFut({ ...fut, serviceId: "unknown" }), "invalid");
rejected(() => validateSubmit({ ...fut, dni: "123" }), "invalid");
rejected(() => validateSubmit({ ...fut, email: "bad" }), "invalid");
rejected(() => validateSubmit({ ...fut, signature: "Otra persona" }), "invalid");
rejected(() => validateSubmit({ ...fut, reason: "Solicito [completar]" }), "invalid");
rejected(() => validateSubmit({ ...fut, consent: false }), "invalid");
rejected(() => validateSubmit({ ...fut, serviceId: "fut-6-3", other: "" }), "invalid");
let record = { id: "request", serial: 7, owner: user.id, code: null, content: fut, status: "draft", office: "Secretaría de Escuela",
  response: "", revision: 1, created: "2026-10-02T12:00:00.000Z", updated: "2026-10-02T12:00:00.000Z", submitted: null };
rejected(() => authorizeRead(record, staff), "not_found");
authorizeRead(record, user); checks++;
authorizeRead({ ...record, code: "UNS-2026-000007" }, staff); checks++;
rejected(() => authorizeUpload(record, staff, "evidence"), "forbidden");
rejected(() => authorizeUpload(record, user, "response"), "forbidden");
const pdf = new TextEncoder().encode("%PDF-1.7 test");
check(validateFile("valid.pdf", pdf, pdf.length).mime === "application/pdf", "Firma PDF");
rejected(() => validateFile("false.pdf", new Uint8Array([1, 2]), 2), "invalid");
rejected(() => validateFileQuota({ n: 10, size: 0 }, 1), "invalid");
let evidence = 0, applied = 0, failInsert = false, deletedKey = null;
const repository = {
  ensureUser: async () => user, findRequest: async () => record,
  detail: async value => ({ ...value, files: [], events: [] }), evidenceCount: async () => evidence,
  fileTotals: async () => ({ n: 0, size: 0 }),
  change: async (_record, _user, _revision, change) => {
    applied++; record = { ...record, ...change, revision: record.revision + 1 };
    return { ...record, files: [], events: [] };
  },
  addFile: async () => { if (failInsert) throw new Error("Simulated write failure"); },
};
const dependencies = { repository, identity: { current: async () => ({ userId: user.id, email: user.email, displayName: user.name }) },
  clock: { now: () => "2026-10-02T12:00:00.000Z", year: () => 2026 }, ids: { next: () => "fixed-id" },
  blobs: { put: async () => {}, delete: async key => { deletedKey = key; } } };
const service = new PortalService(dependencies);
check((await service.actor()).id === user.id, "Identidad inyectada");
await rejectedAsync(() => new PortalService({ ...dependencies, identity: { current: async () => null } }).actor(), "unauthenticated");
await rejectedAsync(() => service.act(record.id, user, { action: "submit", revision: 1, content: fut }), "invalid");
check(applied === 0, "Sin sustento no se persiste el envío");
evidence = 1;
await rejectedAsync(() => service.act(record.id, user, { action: "submit", revision: 0, content: fut }), "conflict");
const submitted = await service.act(record.id, user, { action: "submit", revision: 1, content: fut });
check(submitted.status === "received" && submitted.code === "UNS-2026-000007", "Envío y correlativo con reloj inyectado");
await rejectedAsync(() => service.act(record.id, user, { action: "review", revision: 2, message: "Evaluación ficticia" }), "forbidden");
await service.act(record.id, staff, { action: "observe", revision: 2, message: "Completar sustento ficticio" });
check(record.status === "observed", "Secretaría observa");
await service.act(record.id, user, { action: "correct", revision: 3, content: fut });
check(record.status === "corrected", "Solicitante subsana");
await service.act(record.id, staff, { action: "resolve", revision: 4, message: "Respuesta ficticia de prueba" });
check(record.status === "resolved", "Secretaría resuelve");
await rejectedAsync(() => service.act(record.id, staff, { action: "review", revision: 5, message: "Intento de reapertura" }), "conflict");
record = { ...record, status: "draft", code: null };
failInsert = true;
await assert.rejects(() => service.upload(record.id, user, { name: "test.pdf", size: pdf.length, bytes: pdf, kind: "evidence", revision: 5 }), /Simulated write failure/); checks++;
check(deletedKey === "requests/request/fixed-id.pdf", "Compensación solo del objeto nuevo");
const {parseSimulatedLogin} = await load("src/domain/account-policy.ts");
const simulated = {kind:"institutional",password:"123",email:"  QA@UNS.EDU.PE  "};
check(parseSimulatedLogin(simulated).email === "qa@uns.edu.pe", "Correo normalizado");
rejected(() => parseSimulatedLogin({...simulated,email:"qa@sub.uns.edu.pe"}), "invalid");
rejected(() => parseSimulatedLogin({...simulated,email:"qa@uns.edu.pe.evil.test"}), "invalid");
rejected(() => parseSimulatedLogin({...simulated,password:"test"}), "invalid");
rejected(() => parseSimulatedLogin({...simulated,kind:"external"}), "invalid");
const {AccountSimulationService, SimulatedIdentityProvider} = await load("src/application/account-simulation.ts");
let opened = null, closed = null;
const gateIdentity = {userId:"private-owner",email:"owner@example.test",displayName:"Owner"};
const demoIdentity = {userId:"demo-test",email:"qa@uns.edu.pe",displayName:"Persona Ficticia",accountKind:"institutional"};
const gate = {current:async () => gateIdentity};
const sessions = {current:async id => id === "private-owner" ? demoIdentity : null, open:async (id,input) => {opened={id,input};},close:async id => {closed=id;}};
const simulation = new AccountSimulationService(gate,repository,sessions);
await simulation.signIn(simulated);
check(opened.id === "private-owner" && opened.input.email === "qa@uns.edu.pe", "Perfil sujeto al propietario privado");
await simulation.signOut(); check(closed === "private-owner", "Cierre acotado al propietario");
check((await new SimulatedIdentityProvider(gate,sessions).current()).userId === "demo-test", "Perfil simulado inyectado");
check(await new SimulatedIdentityProvider(gate,{...sessions,current:async () => null}).current() === null, "Sin cuenta elegida no hay sesión SIGET");
check(await new SimulatedIdentityProvider({current:async () => null},sessions).current() === null, "Sin acceso real no hay perfil simulado");
await rejectedAsync(() => new AccountSimulationService({current:async () => null},repository,sessions).signIn(simulated), "unauthenticated");
check((await simulation.status()).canAdmin === false, "El solicitante no puede entrar en administración");
await rejectedAsync(() => simulation.signInAdministration(), "forbidden");
let operator = null;
await new AccountSimulationService(gate,{...repository,ensureUser:async () => ({...user,role:"admin"})},{...sessions,openAdministration:async id => {operator=id;}}).signInAdministration();
check(operator === "private-owner", "Administración requiere entrada explícita autorizada");
console.log(`${checks} comprobaciones de arquitectura, dominio y casos de uso correctas.`);
