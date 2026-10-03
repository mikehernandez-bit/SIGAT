# Implementación y verificación

Nombre del proyecto: SIGET-UNS, Sistema Integral de Gestión de Trámites de la Universidad Nacional del Santa. Se mantiene como propuesta académica no oficial.

Para distribuir y ejecutar la demo local: `Dockerfile`, `compose.yaml` y los auxiliares `docker/`. El README contiene el inicio rápido, las tecnologías y las restricciones. Se usa un volumen nuevo e independiente de la base de Sites y de la base de desarrollo nativa. El arranque aplica las migraciones pendientes mediante Wrangler, sin editar los SQL históricos.

## Arquitectura

- Clean Architecture: dominio independiente, casos de uso por puertos, adaptadores D1/R2/identidad y composición por inyección de dependencias.
- MVC en presentación: modelos del negocio, vistas React sin peticiones y controladores HTTP/de pantalla. Ver [arquitectura y estructura de carpetas](ARQUITECTURA.md).
- React 19 + TypeScript + vinext sobre Cloudflare Workers.
- Base SQLite/D1 para cuentas, perfiles, solicitudes, estados, versiones enviadas del FUT, eventos y notificaciones.
- R2 para documentos; la base de datos conserva sus metadatos.
- API protegida por la identidad ChatGPT del sitio privado, con perfiles internos de estudiante institucional o persona externa para simular el acceso solicitado.
- Interfaz responsive con componentes accesibles de navegación, tablas, selección y confirmación.
- PDF de FUT y constancia mediante pdf-lib; reportes CSV.

Las solicitudes no se almacenan en localStorage. Los cambios aún no guardados permanecen en pantalla y se advierte antes de recargar o salir.

La inicialización administrativa se limita al primer propietario del despliegue privado. No debe mantenerse si el sitio se abre a una audiencia institucional. Los demás usuarios se registran como estudiantes y el servidor controla sus permisos.

## Modelo de datos

- settings: propietario del entorno privado.
- users: identidad, rol y datos reutilizables.
- requests: FUT, correlativo, estado, dependencia, respuesta y revisión.
- events: fecha, autor, mensaje y copia de las versiones enviadas.
- files: metadatos y ubicación privada de los documentos; retiro lógico de adjuntos.
- notifications: mensajes internos y estado de lectura.
- simulated_accounts: perfiles ficticios, tipo de cuenta y propietario privado.
- simulation_sessions: selección activa del perfil para ese propietario; no es una sesión Microsoft.

La aplicación usa sentencias preparadas. Las operaciones de estado e historial se ejecutan en lote con control optimista de revisión para evitar sobrescrituras y envíos duplicados. Las migraciones en drizzle son las únicas responsables del esquema.

## Desarrollo local

Requiere Node >= 22.13.0 y npm. Instala con npm run install:ci. Ejecuta npm run dev y abre la URL local que imprime.

Para inicializar la base de datos: genera las migraciones con npm run db:generate, compila con npm run build y aplica solo las migraciones pendientes con Wrangler D1 --local, --config dist/server/wrangler.json y --persist-to .wrangler/state. No vuelvas a aplicar una migración ya ejecutada.

El atajo de autenticación local de ChatGPT solo está habilitado durante desarrollo y no se incorpora al despliegue. El selector de perfiles ficticios sí forma parte de la demostración publicada, siempre detrás del acceso privado. No uses datos reales.

## Pruebas reproducibles

Con el servidor en 127.0.0.1:5173 y la base local inicializada:

1. node tests/api-workflow.mjs: realiza 48 comprobaciones del recorrido, sesión obligatoria, validación, adjuntos, snapshots, persistencia y notificaciones. Crea un expediente ficticio local.
2. node tests/access-control.mjs: realiza 8 comprobaciones de aislamiento de cuentas y roles. Sus fixtures se retiran al terminar y se restaura el rol local del propietario.
3. node --experimental-vm-modules tests/domain-architecture.mjs: realiza 78 comprobaciones de dependencias entre capas y reglas/casos de uso con adaptadores simulados, sin servidor.
4. node node_modules/typescript/bin/tsc --noEmit: verifica tipos.
5. npm run build: verifica salida Workers.
6. node tests/simulated-access.mjs: 66 comprobaciones de dominio de correo, sesión obligatoria, validación de la contraseña ficticia `123` y rechazo de valores distintos, vínculo cuenta/FUT, envío sin matrícula para externos, persistencia y aislamiento entre perfiles. Crea únicamente cuentas y solicitudes ficticias locales y cierra la sesión al terminar; administración requiere entrada explícita.
7. En Docker: `docker compose exec portal node tests/docker-smoke.mjs` realiza 12 comprobaciones de transporte, acceso, FUT y adjunto ficticio. Después de recrear el contenedor sin retirar el volumen, `docker compose exec portal node tests/docker-smoke.mjs --verify` realiza 5 comprobaciones de persistencia del expediente y su archivo.

No ejecutes los scripts de pruebas contra servicios institucionales. Los datos locales de prueba no se publican: se excluyen .wrangler, .sites-runtime y archivos de entorno.

## Seguridad y límites

Autenticación obligatoria en API, control de propiedad, rol servidor, origen de escrituras, revisión concurrente, validación de datos, formatos y tamaños. Los archivos se descargan como adjuntos autenticados, sin búsqueda pública y con cache deshabilitada.

La validación inicial de formatos comprueba extensión y firma de archivo; no sustituye un antivirus ni una validación estructural exhaustiva. La firma es una declaración de autoría, no certificado digital. No existe integración de pagos, correo, identidad o expediente institucional.

La revisión institucional, los permisos por dependencia, la protección de datos, copias de seguridad, pruebas de carga y análisis antimalware son necesarios antes de producción. Ver MANUAL.md y FUENTES.md.
