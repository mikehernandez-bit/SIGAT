import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
const origin="http://127.0.0.1:5173";
assert.equal((await fetch(origin+"/api/portal/simulation/administration",{method:"POST",headers:{Cookie:"__sites_local_auth=1",Origin:origin,"Content-Type":"application/json"},body:"{}"})).status,200);
function sql(command) {
  const r=spawnSync(process.execPath,["--import","./scripts/sites-env.mjs","./node_modules/wrangler/bin/wrangler.js","d1","execute","DB","--local","--config","./dist/server/wrangler.json","--persist-to",".wrangler/state","--command",command],{encoding:"utf8",timeout:30000});
  if(r.status!==0)throw new Error("No se pudo preparar la prueba local: "+r.stderr);
}
const id=crypto.randomUUID(),owner="qa-foreign-"+id;
const content=JSON.stringify({name:"Cuenta ficticia ajena",reason:"Solicitud ficticia para probar aislamiento."});
sql(`INSERT INTO users (id,email,name,role,profile,created) VALUES ('${owner}','foreign@example.test','Cuenta ficticia ajena','student','{}','2026-10-02'); INSERT INTO requests (id,code,owner,content,status,office,last_op,created,updated) VALUES ('${id}','QA-${id}','${owner}','${content}','received','Mesa de Partes','qa','2026-10-02','2026-10-02'); UPDATE users SET role='student' WHERE id='local_seedy';`);
let passed=0;
try {
  const headers={Cookie:"__sites_local_auth=1",Origin:origin,"Content-Type":"application/json"};
  const boot=await (await fetch(origin+"/api/portal/bootstrap",{headers})).json();
  assert.equal(boot.user.role,"student");assert.equal(boot.all.length,0);assert.equal(boot.users.length,0);assert.ok(!boot.mine.some(r=>r.id===id));passed+=4;
  assert.equal((await fetch(origin+"/api/portal/requests/"+id,{headers})).status,404);passed++;
  const own=boot.mine.find(r=>r.code);
  assert.equal((await fetch(origin+"/api/portal/requests/"+own.id,{method:"POST",headers,body:JSON.stringify({action:"review",revision:own.revision,message:"Intento no autorizado"})})).status,403);passed++;
  assert.equal((await fetch(origin+"/api/portal/users",{method:"POST",headers,body:JSON.stringify({id:"local_seedy",role:"admin"})})).status,404);passed++;
  assert.equal((await fetch(origin+"/api/portal/requests/"+id,{method:"POST",headers,body:JSON.stringify({action:"save",revision:1,content:{}})})).status,404);passed++;
  console.log(JSON.stringify({passed,scope:"Control de roles y aislamiento de cuentas. Solo datos ficticios locales."}));
} finally {
  sql(`UPDATE users SET role='admin' WHERE id='local_seedy'; DELETE FROM requests WHERE id='${id}' AND owner='${owner}'; DELETE FROM users WHERE id='${owner}';`);
}
