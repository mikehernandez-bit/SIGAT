import assert from "node:assert/strict";
const origin = "http://127.0.0.1:5173";
let checks = 0;
const check = (actual, expected) => { assert.equal(actual, expected); checks++; };
async function call(path, data, expected = 200, headers = {}) {
  const response = await fetch(`${origin}/api/portal/${path}`, {method: data === undefined ? "GET" : "POST", headers: {Cookie: "__sites_local_auth=1", ...(data === undefined ? {} : {Origin: origin, "Content-Type": "application/json"}), ...headers}, body: data === undefined ? undefined : JSON.stringify(data)});
  const raw = await response.text(); let value; try { value = JSON.parse(raw); } catch { value = {error:raw}; }
  assert.equal(response.status, expected, `${path}: ${JSON.stringify(value)}`); checks++; return value;
}
const tag = Date.now();
const student = {kind: "institutional", password: "123", email: `qa${tag}@uns.edu.pe`};
const external = {kind: "external", password: "123", email: `qa${tag}@example.test`};
const studentName = `Estudiante UNS qa${tag}`, externalName = `Persona externa qa${tag}`;
await call("simulation/signout", {});
await call("bootstrap",undefined,401);
await call("draft",{},401);
const gate = await call("simulation/status"); check(gate.available,true); check(gate.canAdmin,true);
try {
  await call("simulation/signin", student, 401, {Cookie: ""});
  await call("simulation/signin", student, 403, {Origin: "https://foreign.example"});
  await call("simulation/signin", {...student, email:"qa@example.test"}, 400);
  await call("simulation/signin", {...external, email:"qa@uns.edu.pe"}, 400);
  await call("simulation/signin", {...student, role:"admin"}, 400);
  await call("simulation/signin", {...student, password:"never-collect-passwords"}, 400);
  await call("simulation/signin", student);
  let boot = await call("bootstrap");
  check(boot.user.accountKind, "institutional"); check(boot.user.role, "student"); check(boot.user.email, student.email); check(boot.mine.length, 0); check(boot.users.length, 0);
  let d = await call("draft", {});
  check(d.content.name, studentName); check(d.content.email, student.email); check(d.content.signature, studentName);
  const content = {...d.content, name:"Suplantación no permitida", email:"fake@example.test", signature:"Otra firma", dni:"12345678", phone:"999000111", address:"Domicilio ficticio QA", serviceId:"fut-1-1", reason:"Solicitud ficticia para probar el perfil y la vinculación del FUT.", code:"", consent:true};
  await call(`requests/${d.id}`, {action:"submit", revision:d.revision, content}, 400);
  d = await call(`requests/${d.id}`, {action:"submit", revision:d.revision, content:{...content,code:"QA2026"}});
  check(d.content.name, studentName); check(d.content.email, student.email); check(d.content.signature, studentName); check(d.status, "received");
  await call("users", {id:boot.user.id, role:"admin"}, 404);
  await call("simulation/signin", external);
  boot = await call("bootstrap");
  check(boot.user.accountKind, "external"); check(boot.user.role, "student"); check(boot.mine.length, 0);
  await call(`requests/${d.id}`, undefined, 404);
  await call(`requests/${d.id}`, {action:"save",revision:d.revision,content}, 404);
  let e = await call("draft", {});
  check(e.content.faculty, ""); check(e.content.school, ""); check(e.content.code, "");
  const ef = {...content,name:externalName,faculty:"",school:"",code:""};
  await call("profile", {content:ef});
  boot = await call("bootstrap"); check(boot.user.profile.name, externalName); check(boot.user.profile.email, external.email);
  e = await call(`requests/${e.id}`, {action:"submit",revision:e.revision,content:ef});
  check(e.content.name, externalName); check(e.content.email, external.email); check(e.content.signature, externalName); check(e.status,"received");
  boot = await call("bootstrap"); check(boot.mine.length,1); check(boot.mine[0].id,e.id);
  await call("simulation/signin", {...student,name:"Otro nombre no sobrescribe el perfil"},400);
  await call("simulation/signin", student);
  boot = await call("bootstrap"); check(boot.user.name,studentName); check(boot.mine.length,1); check(boot.mine[0].id,d.id);
  await call(`requests/${e.id}`,undefined,404);
  await call("simulation/signout",{});
  await call("bootstrap",undefined,401);
  await call("simulation/administration",{});
  boot = await call("bootstrap"); check(boot.user.role,"admin"); check(boot.user.accountKind,"administration");
  console.log(JSON.stringify({passed:checks,scope:"Solo entorno local; cuentas y datos ficticios."}));
} finally { await call("simulation/signout",{}); }
