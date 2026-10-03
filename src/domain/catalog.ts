export type Service = {
  id: string;
  name: string;
  category: string;
  description: string;
  documents: string;
  template: string;
};
const groups: Record<string, string[]> = {
  "Certificados y constancias": [
    "Certificado de estudios",
    "Certificado de notas por nivel",
    "Constancia de adeudo de asignatura",
    "Constancia de aprobación de tesis",
    "Constancia de conducta",
    "Constancia de egresado",
    "Constancia de expedito",
    "Constancia de grados y títulos",
    "Constancia de horas teóricas y prácticas",
    "Constancia de ingreso",
    "Constancia de matrícula",
    "Constancia de no adeudo a la UNS",
    "Constancia de no adeudo de asignatura",
    "Constancia de no estar sometido a proceso disciplinario",
    "Constancia de notas",
    "Constancia de orden de mérito",
    "Constancia de prácticas preprofesionales",
    "Constancia de tercio superior",
    "Constancia de promedio ponderado",
    "Récord académico",
    "Fotocopia de certificado de estudios",
  ],
  "Matrícula y estudios": [
    "Convalidación de asignaturas",
    "Cursos de nivelación y avance",
    "Matrícula especial / examen de suficiencia",
    "Matrícula extemporánea",
    "Nivelación y afianzamiento",
    "Reanudación de estudios",
    "Reserva de matrícula",
    "Rectificación de nombres y apellidos",
  ],
  "Grados y títulos": [
    "Entrega de grado o título por Mesa de Partes",
    "Nombramiento de asesor / jurado",
    "Sustentación de tesis",
    "Examen de experiencia profesional",
    "Examen de suficiencia profesional",
  ],
  Evaluaciones: [
    "Examen de aplazados",
    "Examen de ubicación",
    "Examen extemporáneo / exposición",
  ],
  "Bienestar y servicios": [
    "Seguro estudiantil",
    "Bolsa de trabajo",
    "Comedor universitario",
    "Duplicado de carné de postulante",
    "Duplicado de carné universitario",
    "Duplicado de carné de biblioteca",
    "Duplicado de constancia de ingreso",
  ],
  "Otros trámites": [
    "Acceso a la información",
    "Traslado CEE administrativo",
    "Otros",
  ],
};
export const catalog: Service[] = Object.entries(groups).flatMap(
  ([category, names], g) =>
    names.map((name, i) => ({
      id: `fut-${g + 1}-${i + 1}`,
      name,
      category,
      description:
        category === "Grados y títulos"
          ? "Gestiona tu solicitud de graduación y titulación."
          : category === "Matrícula y estudios"
            ? "Continúa tu trayectoria académica con una solicitud digital."
            : "Presenta tu solicitud y consulta su avance desde un solo lugar.",
      documents:
        "Adjunta los documentos que correspondan al procedimiento vigente. Confirma requisitos y pagos en el TUPA / TUSNE de la UNS.",
      template: `Solicito ${name.toLocaleLowerCase("es-PE")}, por el siguiente motivo: [explica tu situación].\n\nLa solicitud corresponde a [periodo académico, asignatura u otros datos relevantes]. Adjunto [indica los documentos de sustento].`,
    })),
);
catalog.push({
  id: "justificacion-medica",
  name: "Justificación de inasistencia por salud",
  category: "Otros trámites",
  description:
    "Solicita la evaluación de una inasistencia y adjunta el sustento médico.",
  documents:
    "Sustento médico pertinente y datos de asignatura, docente y fechas de inasistencia. Servicio propuesto dentro de «Otros» del FUT; sujeto a validación institucional.",
  template:
    "Solicito la justificación de mi inasistencia a [asignatura], a cargo de [docente], durante [fechas], por motivos de salud.\n\nExpongo lo siguiente: [describe brevemente la situación, sin incluir datos médicos innecesarios].\n\nAdjunto el sustento médico correspondiente para su evaluación.",
});
export const categories = Object.keys(groups);
export const faculties: Record<string, string[]> = {
  Ingeniería: [
    "Ingeniería de Sistemas e Informática",
    "Ingeniería Civil",
    "Ingeniería en Energía",
    "Ingeniería Agroindustrial",
    "Ingeniería Agrónoma",
    "Ingeniería Mecánica",
  ],
  Ciencias: [
    "Medicina Humana",
    "Enfermería",
    "Biología en Acuicultura",
    "Biotecnología",
  ],
  "Educación y Humanidades": [
    "Educación Inicial",
    "Educación Primaria",
    "Educación Secundaria",
    "Comunicación Social",
    "Derecho y Ciencias Políticas",
  ],
};
export const offices = [
  "Mesa de Partes",
  "Secretaría de Escuela",
  "Registro y Servicios Académicos",
  "Grados y Títulos",
  "Bienestar Universitario",
  "Decanato",
];
export const states: Record<string, string> = {
  draft: "Borrador",
  received: "Recibido",
  reviewing: "En evaluación",
  observed: "Observado",
  corrected: "Subsanado",
  referred: "Derivado",
  resolved: "Atendido",
  rejected: "No procedente",
  cancelled: "Cancelado",
};
/** Modelo del FUT independiente de React, HTTP y almacenamiento. */
export type Fut = {
  name: string;
  dni: string;
  faculty: string;
  school: string;
  code: string;
  email: string;
  phone: string;
  address: string;
  recipient: string;
  role: string;
  serviceId: string;
  other: string;
  reason: string;
  signature: string;
  consent: boolean;
};
export const blankFut: Fut = {
  name: "",
  dni: "",
  faculty: "Ingeniería",
  school: "Ingeniería de Sistemas e Informática",
  code: "",
  email: "",
  phone: "",
  address: "",
  recipient: "Secretaría de Escuela",
  role: "Secretaría",
  serviceId: "",
  other: "",
  reason: "",
  signature: "",
  consent: false,
};
