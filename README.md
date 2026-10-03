# SIGET-UNS

**Sistema Integral de Gestión de Trámites de la Universidad Nacional del Santa.**

Título del proyecto: **«SIGET-UNS: Sistema web para la gestión integral de trámites documentarios y seguimiento de solicitudes académicas y administrativas en la Universidad Nacional del Santa»**.

Proyecto académico de Pasantía Nacional 2026. Permite completar el FUT en línea, guardar borradores, adjuntar evidencias, enviar solicitudes, subsanarlas y consultar su seguimiento. Secretaría puede evaluar, observar, derivar y responder; se conserva el historial y se generan PDF y reportes CSV.

El nombre identifica esta propuesta académica, no un producto oficial de la UNS. No presenta trámites reales, no verifica correos, no conecta con Microsoft y no genera firmas digitales certificadas. Usar únicamente datos y documentos ficticios.

## Inicio rápido para tus compañeros: Docker

### 1. Recibir el proyecto

Repositorio del equipo: [mikehernandez-bit/SIGAT](https://github.com/mikehernandez-bit/SIGAT).

Si tienes Git instalado, descarga el proyecto y entra a su carpeta:

```sh
git clone https://github.com/mikehernandez-bit/SIGAT.git
cd SIGAT
```

También puedes descargarlo desde GitHub con **Code → Download ZIP**, descomprimirlo y abrir una terminal dentro de la carpeta del proyecto.

Comparte el archivo `SIGET-UNS.zip` preparado con el código fuente. Cada compañero lo descomprime en su computadora y abre una terminal **dentro de la carpeta donde están `Dockerfile` y `compose.yaml`**. No ejecutar desde la carpeta superior.

También se puede compartir una copia del código por un repositorio al que el equipo tenga acceso. El repositorio privado de Sites no concede acceso automáticamente a tus compañeros. No compartas `.git`, `.env`, contraseñas, `node_modules`, `.wrangler` ni datos personales.

### 2. Instalar y abrir Docker

- Windows/macOS: instalar [Docker Desktop](https://docs.docker.com/desktop/) y abrirlo. En Windows usar contenedores Linux; completar la configuración de WSL 2 si Docker la solicita.
- Linux: instalar Docker Engine y Docker Compose v2.
- Tener Internet para descargar la imagen Node y los paquetes durante la primera construcción.

Verificar en la terminal:

```sh
docker version
docker compose version
```

`docker version` debe mostrar tanto **Client** como **Server**. Si aparece un error del motor, abrir Docker Desktop y esperar a que esté listo. No hace falta instalar Node, npm, SQLite ni tener una cuenta Cloudflare o ChatGPT para esta demostración local.

### 3. Construir y ejecutar

```sh
docker compose up --build -d
docker compose ps
```

La primera ejecución descarga dependencias y compila el proyecto; puede tardar varios minutos según la conexión y la computadora. El contenedor aplica automáticamente las migraciones pendientes antes de arrancar. Esperar a que aparezca **healthy**.

Abrir **[http://localhost:3000](http://localhost:3000)**. No abrir el puerto interno 5173.

### 4. Probar el sistema

1. Al abrir la página se muestra únicamente «Iniciar sesión»: no hay menú, datos de operador ni panel de trámites. Docker prepara en segundo plano el operador ficticio del entorno; **esto no inicia una sesión SIGET-UNS ni autentica con ChatGPT**.
2. Elegir «Estudiante UNS» con un correo ficticio terminado en `@uns.edu.pe`, o «Persona externa» con correo personal ficticio. Introducir la contraseña de demostración `123`; nunca la contraseña real del correo. El servidor comprueba ese valor sin guardarlo ni conectarse a Microsoft.
3. En el primer acceso completar «Mis datos», incluido el nombre completo de prueba, y crear un trámite. El FUT toma el nombre del perfil y el correo de la cuenta seleccionada; los externos no necesitan código, facultad ni escuela.
4. Guardar el borrador, adjuntar un documento ficticio y enviar. Revisar número de expediente, PDF e historial.
5. Para probar Secretaría: cerrar la **cuenta simulada**, desplegar «Acceso de administración · demostración» en la pantalla de inicio y pulsar «Iniciar sesión administrativa». Esa entrada exige que el operador tenga permiso de atención y administra únicamente esa instalación local.

El acceso institucional y el externo son obligatorios para mostrar las opciones del solicitante. El nombre del operador privado no se toma automáticamente como cuenta del estudiante. La API rechaza consultas, borradores y adjuntos sin sesión SIGET-UNS. Cerrar sesión devuelve a la pantalla inicial sin menú; una sesión SIGET ya iniciada puede recuperarse al recargar.

Cada correo conserva sus solicitudes y perfil dentro de esa instalación. La selección de perfil se comparte entre pestañas del mismo operador: no usar dos perfiles simultáneos en pestañas distintas. Cada compañero tendrá su propia base; sus cambios **no se sincronizan** con los demás ni con el portal publicado.

## Comandos habituales

```sh
# Ver el estado
docker compose ps

# Ver los mensajes del servidor
docker compose logs -f portal

# Detener sin borrar los datos
docker compose down

# Volver a iniciar
docker compose up -d

# Después de recibir cambios de código
docker compose up --build -d
```

Si el puerto 3000 está ocupado, cambiarlo con `SIGET_PORT`:

```powershell
# PowerShell
$env:SIGET_PORT = "3001"
docker compose up --build -d
```

```sh
# Linux/macOS
SIGET_PORT=3001 docker compose up --build -d
```

Después abrir `http://localhost:3001`. En PowerShell, mantener esa variable en los siguientes comandos o volver a establecerla al abrir otra terminal.

## Datos y seguridad en Docker

El volumen nombrado `datos-siget` conserva SQLite/D1 local y los adjuntos R2 locales en `/app/.wrangler/state`. Docker Compose antepone el nombre del proyecto al volumen. `docker compose down` no elimina ese volumen: se conservan los datos al recrear el contenedor. Esto no sustituye una copia de seguridad. [Referencia de volúmenes Docker](https://docs.docker.com/compose/gettingstarted/#step-5-persist-data-with-named-volumes).

**No usar `docker compose down -v`: borra el volumen y sus solicitudes y documentos.** No se incluye un reinicio destructivo en el flujo habitual.

Solo se publica `127.0.0.1:3000`: el portal es para la computadora que lo ejecuta, no para Internet ni la red del campus. El proxy local mantiene el servidor de desarrollo en loopback y rechaza orígenes ajenos. No cambies esta restricción para compartir una demo pública: la autenticación es ficticia. [Referencia de publicación de puertos](https://docs.docker.com/engine/network/port-publishing/).

Docker ejecuta un **entorno de demostración/desarrollo**, no un servidor institucional de producción. Aunque la imagen valida la compilación, el proceso que sirve la demo es Vinext/Vite en modo desarrollo para reutilizar su simulación local de acceso. El acceso real del sitio publicado se mantiene separado y protegido por Sites.

## Tecnologías utilizadas

Las versiones exactas reproducibles están fijadas en `package-lock.json`; no borrar el archivo.

| Parte | Tecnología | Uso |
| --- | --- | --- |
| Contenedor local | Docker + Docker Compose v2, Debian Bookworm, Node.js 24 | Instalación, arranque y volumen persistente |
| Interfaz | React 19.2.6 + TypeScript 5.9.3 | Formularios, paneles y tipado |
| Framework/runtime | Vinext 1.0.0-beta.5 + Vite 8.0.13 | Rutas App Router compatibles con Next.js, SSR y desarrollo; no es un servidor Next.js convencional |
| Componentes y estilo | Tailwind CSS 4.2.1, componentes shadcn/Radix, Lucide, Sonner | Interfaz accesible, iconos y avisos |
| Persistencia | SQLite mediante Cloudflare D1 | Usuarios, perfiles, FUT, estados, eventos y notificaciones |
| Adjuntos | Cloudflare R2 | Evidencias y respuestas; almacenamiento local simulado en Docker |
| Migraciones | Drizzle ORM 0.45.2 + Drizzle Kit 0.31.10; Wrangler 4.92.0 | Esquema y aplicación ordenada de SQL; consultas preparadas D1 en los repositorios |
| Emulación local | Wrangler/Miniflare y Workerd | API D1/R2 sin cuenta Cloudflare |
| Exportaciones | pdf-lib 1.17.1 y CSV | FUT, constancia y reportes |
| Sitio publicado | Cloudflare Workers mediante Sites | Publicación privada y acceso real ChatGPT del entorno |

No usa MySQL, PostgreSQL, Laravel ni un backend Express. Microsoft es una **opción simulada**, no una integración OAuth ya implementada.

## Arquitectura Clean Architecture + MVC

```text
src/domain/           Modelos, catálogo y reglas sin dependencias de plataforma
src/application/      Casos de uso y puertos (repositorio, archivos, identidad)
src/infrastructure/   Adaptadores D1, R2, identidad y exportaciones
src/composition/      Ensamblaje e inyección de dependencias
src/presentation/     Controladores HTTP/de pantalla y vistas React
app/                  Entradas del framework y rutas
db/                   Esquema
drizzle/              Migraciones versionadas
docker/               Arranque, salud y transporte exclusivo de la demo local
```

MVC se aplica a la presentación; las reglas del negocio permanecen en dominio y aplicación. Docker no cambia esta arquitectura ni reemplaza el backend. Ver [ARQUITECTURA.md](ARQUITECTURA.md).

## Qué incluyen los archivos Docker

- `Dockerfile`: instala con el lockfile, compila y ejecuta como usuario `node`, no root.
- `compose.yaml`: crea el servicio, limita el puerto a localhost, configura salud y conserva el volumen.
- `.dockerignore`: excluye credenciales, dependencias y datos locales de la imagen.
- `docker/start.mjs`: aplica solo migraciones pendientes usando el historial de Wrangler; inicia el servidor y el proxy local.
- `docker/local-proxy.mjs`: adapta Host/Origin para reutilizar el acceso ficticio de desarrollo en el contenedor; descarta cabeceras de identidad proporcionadas por clientes. No se importa en el Worker publicado.
- `docker/healthcheck.mjs`: comprueba la disponibilidad de la página.

El código de Microsoft/perfil sigue marcado como simulación. Para producción se necesitaría integración institucional de identidades, permisos por dependencia, reglas de procedimientos, seguridad, respaldo, firma y validación de la UNS.

## Pruebas dentro del contenedor

Con `docker compose up -d` y estado healthy:

```sh
docker compose exec portal node --experimental-vm-modules tests/domain-architecture.mjs
docker compose exec portal node tests/api-workflow.mjs
docker compose exec portal node tests/simulated-access.mjs
docker compose exec portal node node_modules/typescript/bin/tsc --noEmit
```

Las pruebas API crean datos ficticios locales. No ejecutarlas mientras estés trabajando en otro perfil en el navegador: cambian la selección simulada y finalmente la cierran. El test de roles `tests/access-control.mjs` se ejecuta desde el desarrollo nativo y requiere su entorno de herramientas; no es requisito para iniciar Docker.

## Desarrollo sin Docker y publicación

Para desarrollo nativo se necesita Node >=22.13.0, npm y aplicar las migraciones locales. Las instrucciones originales del runtime, autenticación de Sites y publicación se conservan en [docs/SITES.md](docs/SITES.md). Docker no publica, no modifica la base remota y no concede acceso al sitio privado.

Documentación adicional: [MANUAL.md](MANUAL.md), [IMPLEMENTACION.md](IMPLEMENTACION.md), [FUENTES.md](FUENTES.md).
