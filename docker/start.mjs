import {spawn, spawnSync} from "node:child_process";
import {mkdirSync, readFileSync, writeFileSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {createLocalProxy} from "./local-proxy.mjs";
const root = fileURLToPath(new URL("../", import.meta.url));
process.chdir(root);
mkdirSync(".sites-runtime", {recursive:true}); mkdirSync(".wrangler/state", {recursive:true});
const built = JSON.parse(readFileSync("dist/server/wrangler.json", "utf8"));
const config = path.join(root, ".sites-runtime/wrangler.docker.json");
writeFileSync(config, JSON.stringify({name:"siget-uns-local-migrations",compatibility_date:built.compatibility_date,d1_databases:built.d1_databases.map(binding => ({...binding,migrations_dir:path.join(root,"drizzle")}))}));
// El historial de Wrangler impide repetir las migraciones en cada reinicio.
const migration = spawnSync(process.execPath, ["--import","./scripts/sites-env.mjs","./node_modules/wrangler/bin/wrangler.js","d1","migrations","apply","DB","--local","--config",config,"--persist-to",".wrangler/state"], {stdio:"inherit",env:{...process.env,CI:"true"}});
if (migration.error || migration.status !== 0) { console.error("No se pudo inicializar la base local."); process.exit(1); }
const child = spawn(process.execPath, ["scripts/run-framework.mjs","dev","--hostname","127.0.0.1"], {stdio:"inherit"});
const proxy = createLocalProxy();
proxy.listen(3000, "0.0.0.0", () => console.log("SIGET-UNS · demostración local en http://localhost:3000. Espera a que el estado sea healthy."));
let stopping = false;
function stop(signal) { if (stopping) return; stopping = true; proxy.close(); child.kill(signal); }
process.on("SIGTERM", () => stop("SIGTERM")); process.on("SIGINT", () => stop("SIGINT"));
child.on("error", error => { console.error(error.message); proxy.close(); process.exitCode = 1; });
child.on("exit", code => { proxy.close(); process.exitCode = stopping ? 0 : (code ?? 1); });
proxy.on("error", error => { console.error(error.message); stop("SIGTERM"); process.exitCode = 1; });
