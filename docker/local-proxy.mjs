import http from "node:http";
const upstream = "http://127.0.0.1:5173";
const allowedHosts = new Set(["localhost", "127.0.0.1"]);
// Solo adapta el transporte de Docker al mock de desarrollo que ya existe.
// No inyecta identidades y no se importa desde el Worker de producción.
export function forwardHeaders(request) {
  const authority = new URL(`http://${request.headers.host}`);
  if (!allowedHosts.has(authority.hostname) || (request.headers.origin && request.headers.origin !== authority.origin) || request.headers["sec-fetch-site"] === "cross-site") throw new Error("Origen no permitido");
  const headers = {...request.headers, host: new URL(upstream).host};
  for (const key of Object.keys(headers)) {
    if (key.startsWith("oai-authenticated-user-") || key.startsWith("x-forwarded-") || key === "forwarded") delete headers[key];
  }
  if (headers.origin) headers.origin = upstream;
  return headers;
}
export function createLocalProxy() {
  const server = http.createServer(async (request, response) => {
    let headers;
    try { headers = forwardHeaders(request); } catch { response.writeHead(403); response.end("Acceso permitido solo desde localhost."); return; }
    if (request.url === "/healthz") {
      try {
        const ready = await fetch(upstream + "/", {signal: AbortSignal.timeout(7000)});
        response.writeHead(ready.ok ? 200 : 503); response.end(ready.ok ? "SIGET-UNS listo" : "Iniciando");
      } catch { response.writeHead(503); response.end("Iniciando"); }
      return;
    }
    const proxy = http.request(upstream + (request.url || "/"), {method:request.method,headers}, result => {
      // Preparar solo el operador ficticio del transporte local, nunca una sesión SIGET.
      if (request.method === "GET" && request.url === "/" && !(request.headers.cookie || "").split(";").some(c => c.trim() === "__sites_local_auth=1")) {
        result.headers["set-cookie"] = [...(result.headers["set-cookie"] || []), "__sites_local_auth=1; Path=/; HttpOnly; SameSite=Lax"];
      }
      response.writeHead(result.statusCode || 502, result.headers); result.pipe(response);
    });
    proxy.on("error", () => { if (!response.headersSent) response.writeHead(503); response.end("SIGET-UNS está iniciando. Vuelve a cargar en unos segundos."); });
    request.on("aborted", () => proxy.destroy()); request.pipe(proxy);
  });
  // HMR opcional del servidor local, manteniendo los mismos controles de origen.
  server.on("upgrade", (request, socket, head) => {
    let headers; try { headers = forwardHeaders(request); } catch { socket.end("HTTP/1.1 403 Forbidden\r\n\r\n"); return; }
    const proxy = http.request(upstream + (request.url || "/"), {method:request.method,headers});
    proxy.on("upgrade", (result, target, targetHead) => {
      socket.write(`HTTP/1.1 ${result.statusCode} Switching Protocols\r\n` + Object.entries(result.headers).map(([key,value]) => `${key}: ${value}`).join("\r\n") + "\r\n\r\n");
      if (head.length) target.write(head); if (targetHead.length) socket.write(targetHead);
      target.on("error", () => socket.destroy()); socket.on("error", () => target.destroy());
      target.pipe(socket); socket.pipe(target);
    });
    proxy.on("response", () => { proxy.destroy(); socket.destroy(); });
    proxy.on("error", () => socket.destroy()); proxy.end();
  });
  return server;
}
