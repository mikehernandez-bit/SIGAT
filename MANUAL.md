# SIGET-UNS · Gestión de trámites

Sistema funcional para el proyecto de Pasantía Nacional 2026. Acceso privado, independiente del sistema oficial de la Universidad Nacional del Santa. Usa datos ficticios para las pruebas.

## Estudiante

1. Abre la pantalla «Iniciar sesión». En Docker el entorno local se prepara automáticamente; en Sites el acceso privado se mantiene separado. Elige «Estudiante UNS» y la opción «Continuar con Microsoft · simulación» con un correo terminado en `@uns.edu.pe`, o «Persona externa» con un correo personal. Se solicita un nombre ficticio porque no existe conexión con el proveedor; nunca se solicitan contraseñas. No hay menú ni consultas de expedientes antes de iniciar sesión SIGET-UNS.
2. En «Mis datos», guarda la información que deseas reutilizar.
3. Selecciona «Nuevo trámite» o un servicio del catálogo.
4. Completa los datos; redacta el fundamento con ayuda de la plantilla. Reemplaza los textos entre corchetes.
5. Adjunta documentos PDF, DOCX, JPG o PNG: hasta 25 MB cada uno, 50 MB y 10 archivos por expediente.
6. Guarda un borrador si quieres continuar después. Lo encontrarás en «Mis solicitudes».
7. Revisa el FUT y confirma la veracidad. En los perfiles simulados, el nombre, correo y autoría se toman automáticamente de la cuenta; no tienes que volver a escribir tu nombre.
8. El servidor asigna un número UNS-año-correlativo. Descarga el FUT y la constancia en PDF.
9. Consulta el expediente y su historial en «Mis solicitudes» o «Seguimiento».
10. Si secretaría lo observa, abre «Subsanar solicitud», corrige los campos o adjuntos y envía la subsanación.

No es necesario imprimir, llenar a mano, fotografiar ni volver a subir el FUT. Los adjuntos son evidencias o requisitos. Una solicitud enviada solo es editable cuando está observada. La cancelación conserva el expediente.

## Secretaría

El operador autorizado puede verificar el recorrido completo. Para ingresar a administración, cierra la sesión y, en la pantalla inicial, despliega «Acceso de administración · demostración» y pulsa «Iniciar sesión administrativa». No se asigna automáticamente ese acceso al abrir la página.

## Persona externa y cuentas simuladas

Las personas externas completan DNI, teléfono, domicilio, destinatario y fundamento, pero no código de estudiante, facultad ni escuela. El catálogo es una referencia: que se pueda preparar una solicitud no acredita que el solicitante cumpla sus requisitos oficiales.

Cerrar sesión devuelve a la pantalla inicial y permite iniciar con otra cuenta. Cada dirección conserva su perfil y solicitudes dentro del entorno privado del operador; cerrar la cuenta no borra expedientes. La selección activa se comparte entre las pestañas de ese operador: no pruebes dos perfiles simultáneos en diferentes pestañas.

La opción Microsoft es únicamente una simulación. Ni el correo ni el nombre se verifican; no hay OAuth, entrega de correo, firma digital certificada ni presentación institucional. El portal permanece privado para su propietario, no se ha habilitado acceso público real para personas externas. La futura integración Microsoft requerirá configuración institucional y validación de identidades y permisos.

En «Bandeja de atención» puede filtrar por expediente, solicitante, trámite, estado o dependencia, abrir el FUT, descargar evidencias y:

- iniciar evaluación;
- solicitar una subsanación con un mensaje;
- derivar a una dependencia;
- adjuntar un documento de respuesta;
- atender y responder o declarar no procedente.

Cada acción se registra con fecha, autor y mensaje. Las versiones enviadas del FUT se conservan en el historial de la base de datos. Los documentos retirados quedan fuera del envío actual, pero su copia no se elimina: administración puede consultarla para trazabilidad.

«Reportes» exporta CSV sin DNI, domicilio o información médica. Las notificaciones son internas, no correo ni SMS.

## Administración

El rol se valida en el servidor. Estudiante solo accede a sus solicitudes; secretaría atiende los expedientes enviados; administrador también gestiona roles. El sitio continúa siendo privado del propietario: asignar un rol no comparte el sitio.

## Antes de un despliegue institucional

Esta versión está completa para probar el flujo propuesto, pero no es un sistema de producción aprobado por la UNS. Se requiere:

- acuerdo institucional y validación del catálogo, rutas, requisitos, tasas y plazos;
- identidad institucional y matrícula verificadas; eliminación del mecanismo de propietario inicial;
- permisos por dependencia y asignación responsable de expedientes;
- validación de firma y del valor administrativo de las constancias;
- integración autorizada con pagos, archivos, sistemas académicos y correo;
- políticas de privacidad, conservación y eliminación de documentos;
- análisis antimalware de archivos, auditoría institucional, copias de seguridad y pruebas de carga;
- revisión de accesibilidad y seguridad con usuarios reales y áreas responsables.

No se promete que todo trámite pueda concluir virtualmente: el proyecto digitaliza su presentación y seguimiento, mientras las etapas formales de cada procedimiento deben ser confirmadas por la universidad.
