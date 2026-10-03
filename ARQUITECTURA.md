# Arquitectura del sistema UNS · Trámite digital

El sistema combina **Clean Architecture** para separar el negocio de la tecnología y **MVC** en su capa de presentación. No son alternativas: MVC organiza la interacción con el usuario; Clean Architecture define las dependencias de todo el sistema.

## Estructura implementada

```text
src/
├── domain/                         Modelos y reglas del negocio
│   ├── catalog.ts                  FUT, servicios y dependencias
│   ├── models.ts                   Solicitudes, usuarios, eventos y adjuntos
│   ├── fut-policy.ts               Validación del FUT y requisitos de envío
│   ├── request-policy.ts           Propiedad, permisos, revisión y edición
│   ├── file-policy.ts              Formatos, tamaños y cuotas
│   └── errors.ts                   Errores sin códigos HTTP
├── application/                    Casos de uso y contratos
│   ├── ports.ts                    Repositorio, archivos, identidad, reloj e IDs
│   └── portal-service.ts           Crear, guardar, enviar, subsanar y atender
├── infrastructure/                 Adaptadores tecnológicos reemplazables
│   ├── persistence/                Repositorio SQL D1
│   ├── storage/                    Almacenamiento R2
│   ├── auth/                       Identidad ChatGPT del entorno privado
│   └── exports/                    Generación de PDF y CSV
├── presentation/                   MVC y transporte
│   ├── views/portal-view.tsx       Vista React: renderiza datos y emite eventos
│   ├── controllers/               Controladores HTTP y de pantalla
│   ├── client/portal-api.ts        Adaptador de peticiones del navegador
│   ├── ports/portal-client.ts      Contrato del controlador de pantalla
│   └── portal.tsx                 Entrada del portal
└── composition/                    Inyección de las implementaciones reales
    ├── portal.ts                   Composición del servidor
    └── browser.ts                  Composición del cliente

app/page.tsx                        Entrada de página, sin negocio
app/api/portal/[...path]/route.ts    Rutas delegadas al controlador
db/schema.ts                        Esquema de persistencia
drizzle/                            Migraciones versionadas, sin cambios
```

## Regla de dependencias

El dominio no importa React, Next/vinext, Cloudflare, SQL, Zod ni HTTP. La aplicación solo depende del dominio y de sus propios puertos. La infraestructura implementa esos puertos; no decide el recorrido del trámite. El controlador HTTP adapta solicitudes y respuestas, autentica mediante el caso de uso y traduce los errores del negocio a códigos HTTP.

El composition root conecta las dependencias mediante constructores. `PortalService` recibe `PortalRepository`, `BlobStore`, `IdentityProvider`, `Clock` e `IdGenerator`, y puede ejecutarse con adaptadores de prueba sin arrancar el servidor. Los tipos D1 y R2 solo aparecen en infraestructura y composición.

El repositorio agrupa las operaciones del expediente porque deben conservar su atomicidad: solicitud, historial y notificación se actualizan en un mismo lote condicionado por la revisión. No se usa un repositorio CRUD genérico ni se exponen consultas SQL al caso de uso.

## Correspondencia MVC

| Parte | Implementación | Responsabilidad |
| --- | --- | --- |
| Modelo | `domain` y `application` | Datos, reglas, permisos y casos de uso del FUT y expediente. No equivale solamente a las tablas. |
| Vista | `presentation/views` | Campos, tablas, estados visibles y confirmaciones. No consulta la base de datos ni hace peticiones HTTP. |
| Controlador | `PortalHttpController` | Convierte HTTP en comandos, invoca casos de uso y construye respuestas. |
| Controlador de pantalla | `usePortalController` | Estado de interacción, navegación y acciones del navegador. Recibe un cliente por contrato y no contiene JSX. |

React actualiza la vista de forma declarativa cuando cambia el estado del controlador; es una adaptación de MVC a la interfaz web, no un MVC de plantillas renderizadas exclusivamente en servidor.

## Ejemplo: enviar un FUT

1. La vista recoge el formulario digital y dispara `send` del controlador de pantalla.
2. El controlador usa el cliente inyectado para guardar el borrador y solicitar el envío.
3. El controlador HTTP comprueba el origen, obtiene la identidad y construye el comando.
4. `PortalService.act` controla propiedad, estado, revisión, campos obligatorios y sustento médico cuando corresponda.
5. El repositorio D1 persiste el cambio, la versión enviada y la notificación de manera atómica.
6. El resultado vuelve a la vista con el correlativo y el estado recibido.

Los archivos pasan por `BlobStore`: R2 conserva los bytes y D1 los metadatos. Si falla la escritura de los metadatos, el caso de uso retira únicamente el objeto nuevo de esa operación. Las versiones históricas y los adjuntos retirados se conservan según el comportamiento previo.

## Comprobación y mantenimiento

```sh
node --experimental-vm-modules tests/domain-architecture.mjs
node node_modules/typescript/bin/tsc --noEmit
```

La primera prueba verifica las dependencias y ejecuta reglas y casos de uso con puertos simulados. No necesita Cloudflare, base de datos ni servidor. Las pruebas `api-workflow.mjs` y `access-control.mjs` comprueban además el recorrido real contra el servidor local; consulta `IMPLEMENTACION.md`.

Para añadir un trámite: actualizar el catálogo y las políticas necesarias, añadir el caso de uso si cambia el recorrido y enlazarlo mediante un controlador. Para cambiar almacenamiento o identidad: implementar el puerto correspondiente y modificar composición, sin introducir dependencias tecnológicas en el dominio.

La arquitectura no convierte este prototipo en un servicio institucional aprobado. Se mantienen el acceso privado, la identificación ChatGPT y las limitaciones descritas en el manual.
# Accesos simulados dentro del entorno privado

La sesión SIGET-UNS es obligatoria y distinta del acceso privado del operador. `SimulatedIdentityProvider` devuelve `null` cuando no hay selección activa: la API responde 401 y la vista solo muestra la pantalla independiente de inicio de sesión. El endpoint de estado informa disponibilidad y posibilidad de entrada administrativa sin exponer nombre, correo, perfiles o expedientes. Administración requiere una acción explícita y autorización de rol en el servidor; se reutiliza la tabla de selección, sin modificar migraciones históricas.

La identidad del entorno sigue siendo la puerta de acceso. `AccountSimulationService` selecciona un perfil de demostración mediante el puerto `SimulationRepository`; `SimulatedIdentityProvider` adapta esa selección al puerto de identidad existente. La política de dominio admite estudiantes con `@uns.edu.pe` y externos con correo personal, comprueba la contraseña ficticia `123` y rechaza campos adicionales. La contraseña no se almacena y no acredita identidad. El nombre inicial es un alias derivado del correo; el usuario completa su nombre en «Mis datos» y el servidor lo vincula con los futuros FUT.

El adaptador D1 conserva perfiles y la selección activa en dos tablas nuevas, incorporadas con la migración `0001_unknown_jean_grey.sql`. Cada perfil está separado por propietario privado y dirección normalizada; las cuentas nuevas reciben únicamente rol solicitante. No se modifica la migración anterior ni se sustituye la autenticación nativa por un sistema OAuth propio.

El caso de uso vincula nombre, correo y autoría del FUT en el servidor. El nombre se completa o edita en «Mis datos»; el correo permanece bloqueado también en ese perfil. En el FUT, nombre, correo y autoría se obtienen del perfil y no se editan. Para externos elimina facultad, escuela y código y ajusta la validación de envío. Se mantiene el consentimiento. Es una simulación de experiencia, no una identidad verificada ni una firma certificada.
