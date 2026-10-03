import assert from "node:assert/strict";
import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
import {PDFDocument} from "pdf-lib";
const origin = process.env.SIGET_TEST_URL || "http://127.0.0.1:3000";
const stateFile = ".sites-runtime/docker-qa.json";
let checks = 0;
async function call(path,data,expected=200,headers={}) {
  const response = await fetch(origin+"/api/portal/"+path,{method:data===undefined?"GET":"POST",headers:{Cookie:"__sites_local_auth=1",...(data===undefined?{}:{Origin:origin,"Content-Type":"application/json"}),...headers},body:data===undefined?undefined:JSON.stringify(data)});
  const raw=await response.text();let value;try{value=JSON.parse(raw);}catch{value={error:raw};}
  assert.equal(response.status,expected,`${path}: ${raw}`);checks++;return value;
}
const check = condition => {assert.ok(condition);checks++;};
if (process.argv.includes("--verify")) {
  const saved = JSON.parse(readFileSync(stateFile,"utf8"));
  await call("simulation/signin",saved.account);
  const d=await call("requests/"+saved.id);
  check(d.status==="received" && d.code===saved.code && d.content.email===saved.account.email);
  const file=await fetch(origin+"/api/portal/files/"+saved.file,{headers:{Cookie:"__sites_local_auth=1"}});
  check(file.status===200 && (await file.arrayBuffer()).byteLength===saved.size);
  await call("simulation/signout",{});
  console.log(JSON.stringify({passed:checks,persistence:"Expediente y adjunto conservados tras recrear el contenedor."}));
} else {
  const html=await fetch(origin+"/");check(html.status===200 && (await html.text()).includes("SIGET-UNS"));
  const login=await fetch(origin+"/signin-with-chatgpt?return_to=%2F",{redirect:"manual"});
  check(login.status===302 && login.headers.get("set-cookie").includes("__sites_local_auth=1"));
  await call("bootstrap",undefined,401,{Cookie:"","oai-authenticated-user-id":"spoof","oai-authenticated-user-email":"spoof@example.test"});
  await call("simulation/signin",{},403,{Origin:"https://foreign.example"});
  await call("simulation/signout",{});
  const account={kind:"institutional",password:"123",email:`docker${Date.now()}@uns.edu.pe`};
  await call("simulation/signin",account);
  let d=await call("draft",{});
  const content={...d.content,dni:"12345678",code:"QA-DOCKER",phone:"999000111",address:"Domicilio ficticio Docker",serviceId:"justificacion-medica",reason:"Solicitud ficticia para verificar Docker y la persistencia; no es una situación médica real.",consent:true};
  d=await call("requests/"+d.id,{action:"save",revision:d.revision,content});
  const pdf=await PDFDocument.create();pdf.addPage();const bytes=await pdf.save();
  const form=new FormData();form.append("file",new File([bytes],"prueba-docker-ficticia.pdf",{type:"application/pdf"}));form.append("kind","evidence");form.append("revision",String(d.revision));
  const upload=await fetch(origin+"/api/portal/files/"+d.id,{method:"POST",headers:{Cookie:"__sites_local_auth=1",Origin:origin},body:form});check(upload.status===200);d=await upload.json();
  d=await call("requests/"+d.id,{action:"submit",revision:d.revision,content});check(d.status==="received");
  const saved={account,id:d.id,code:d.code,file:d.files[0].id,size:bytes.length};
  mkdirSync(".sites-runtime",{recursive:true});writeFileSync(stateFile,JSON.stringify(saved));
  await call("simulation/signout",{});
  console.log(JSON.stringify({passed:checks,scope:"Docker local: transporte, acceso, FUT y adjunto ficticio",fixture:saved.id}));
}
