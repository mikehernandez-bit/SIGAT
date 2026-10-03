"use client";
import type { ReactNode } from "react";
import { AccountAccessView } from "./account-access-view";
import type { PortalController } from "../controllers/use-portal-controller";
import {
  ArrowRight,
  ArrowLeft,
  FilePlus2,
  LayoutDashboard,
  FolderOpen,
  Search,
  Bell,
  BookOpen,
  CircleHelp,
  ShieldCheck,
  GraduationCap,
  Inbox,
  Settings,
  UserRound,
  LogOut,
  Upload,
  FileText,
  Download,
  Check,
  Clock3,
  AlertCircle,
  CheckCircle2,
  Save,
  Send,
  RefreshCw,
  X,
  Mail,
  ExternalLink,
  Building2,
  Loader2,
  ChevronRight,
} from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Toaster } from "@/components/ui/sonner";
import {
  catalog,
  categories,
  faculties,
  offices,
  states,
  type Fut,
  type Service,
} from "../../domain/catalog";
import type { Detail, RequestRecord, Attachment } from "../../domain/models";
const date = (v: string | null) =>
  v
    ? new Date(v).toLocaleString("es-PE", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "America/Lima",
      })
    : "Sin enviar";
const service = (id: string) => catalog.find((s) => s.id === id);
function State({ value }: { value: string }) {
  return (
    <span className={"status status-" + value}>
      <span />
      {states[value] || value}
    </span>
  );
}
function Field({
  label,
  required,
  children,
  wide = false,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={"field" + (wide ? " field-wide" : "")}>
      <label>
        {label}
        {required && <span aria-label="obligatorio"> *</span>}
      </label>
      {children}
    </div>
  );
}
function Choice({
  value,
  items,
  onChange,
  label,
}: {
  value: string;
  items: string[];
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className="w-full">
        <SelectValue placeholder="Selecciona una opción" />
      </SelectTrigger>
      <SelectContent>
        {items.map((i) => (
          <SelectItem value={i} key={i}>
            {i}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
function Empty({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <FolderOpen size={35} />
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export default function PortalView({ controller }: { controller: PortalController }) {
  const { signOutAccount, external, view, setView, mode, setMode, boot, loading, loadError, busy, fut, current, step, setStep, dirty, selected, originView, profileFut, query, setQuery, category, setCategory, filter, setFilter, officeFilter, setOfficeFilter, year, setYear, trackCode, setTrackCode, tracked, trackDone, confirm, setConfirm, action, setAction, message, setMessage, destination, setDestination, formError, inputRef, staff, admin, notices, refresh, update, nav, start, open, doSave, send, uploadFiles, removeFile, attend, cancel, edit, download, records, active, updateProfileField, track, markAllRead, openNotice, saveProfile, exportReport, changeRole } = controller;
  const navItems = admin
    ? [
        ["inicio", "Resumen", LayoutDashboard],
        ["bandeja", "Bandeja de atención", Inbox],
        ["reportes", "Reportes", FileText],
        ["catalogo", "Catálogo de trámites", BookOpen],
        ["usuarios", "Accesos y roles", Settings],
        ["ayuda", "Guía de atención", CircleHelp],
      ]
    : [
        ["inicio", "Inicio", LayoutDashboard],
        ["nuevo", "Nuevo trámite", FilePlus2],
        ["solicitudes", "Mis solicitudes", FolderOpen],
        ["seguimiento", "Seguimiento", Search],
        ["notificaciones", "Notificaciones", Bell],
        ["catalogo", "Catálogo de trámites", BookOpen],
        ["perfil", "Mis datos", UserRound],
        ["ayuda", "Ayuda y orientación", CircleHelp],
      ];
  const titles: Record<string, string> = {
    inicio: admin
      ? "Cada expediente, una atención oportuna."
      : "Tus trámites, sin ir de oficina en oficina.",
    nuevo:
      current?.status === "observed"
        ? "Subsanar mi solicitud"
        : "Crear una solicitud",
    solicitudes: "Mis solicitudes",
    seguimiento: "Sigue tu expediente",
    notificaciones: "Tu centro de notificaciones",
    catalogo: "¿Qué necesitas solicitar?",
    ayuda: "Estamos para orientarte",
    perfil: "Tus datos, siempre a la mano",
    bandeja: "Bandeja de atención",
    reportes: "Una mirada a la gestión",
    usuarios: "Accesos y roles",
    acceso: "Elige tu acceso",
    detalle: selected?.code || "Borrador de solicitud",
  };
  function serviceCards(items: Service[]) {
    return (
      <div className="service-grid">
        {items.map((s) => (
          <button className="service-card" key={s.id} onClick={() => start(s)}>
            <span className="service-icon">
              {s.category === "Grados y títulos" ? (
                <GraduationCap size={23} />
              ) : (
                <FileText size={23} />
              )}
            </span>
            <small>{s.category}</small>
            <strong>{s.name}</strong>
            <p>{s.description}</p>
            <span className="card-action">
              Crear solicitud <ArrowRight size={16} />
            </span>
          </button>
        ))}
      </div>
    );
  }
  function requestTable(items: RequestRecord[]) {
    return items.length ? (
      <div className="table-wrap">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Expediente / solicitud</TableHead>
              {admin && <TableHead>Solicitante</TableHead>}
              <TableHead>Estado</TableHead>
              <TableHead>Dependencia</TableHead>
              <TableHead>Última actualización</TableHead>
              <TableHead>
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <button className="request-name" onClick={() => open(r)}>
                    {r.code || "Borrador"}
                    <span>
                      {service(r.content.serviceId)?.name ||
                        "Trámite sin seleccionar"}
                    </span>
                  </button>
                </TableCell>
                {admin && (
                  <TableCell>
                    {r.content.name}
                    <small className="block">{r.content.school}</small>
                  </TableCell>
                )}
                <TableCell>
                  <State value={r.status} />
                </TableCell>
                <TableCell>{r.office}</TableCell>
                <TableCell>{date(r.updated)}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={"Ver " + (r.code || "borrador")}
                    onClick={() => open(r)}
                    disabled={busy}
                  >
                    <ChevronRight size={18} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    ) : (
      <Empty
        title="Todavía no hay solicitudes"
        description={
          admin
            ? "Las solicitudes enviadas aparecerán aquí para su atención."
            : "Empieza tu primer trámite. Los borradores también se guardan aquí."
        }
        action={
          !admin && (
            <Button onClick={() => start()}>
              Crear mi primer FUT <FilePlus2 />
            </Button>
          )
        }
      />
    );
  }
  const requestFut = fut;
  const updateRequestFut = update;
  function personFields() {
    const fut = view === "perfil" ? profileFut : requestFut;
    const update = (key: keyof Fut, value: string) => {
      if (view === "perfil") {
        updateProfileField(key, value);
      } else updateRequestFut(key, value);
    };
    return (
      <div className="form-grid">
        <Field label="Nombres y apellidos" required>
          <Input
            aria-label="Nombres y apellidos"
            value={fut.name}
            readOnly={controller.linkedAccount}
            maxLength={160}
            onChange={(e) => update("name", e.target.value)}
            autoComplete="name"
          />
        </Field>
        <Field label="DNI" required>
          <Input
            aria-label="DNI"
            value={fut.dni}
            maxLength={8}
            inputMode="numeric"
            onChange={(e) => update("dni", e.target.value.replace(/\D/g, ""))}
          />
        </Field>
        {!external && <>
        <Field label="Facultad" required>
          <Choice
            label="Facultad"
            value={fut.faculty}
            items={Object.keys(faculties)}
            onChange={(v) => {
              update("faculty", v);
              update("school", faculties[v][0]);
            }}
          />
        </Field>
        <Field label="Escuela profesional" required>
          <Choice
            label="Escuela profesional"
            value={fut.school}
            items={faculties[fut.faculty] || []}
            onChange={(v) => update("school", v)}
          />
        </Field>
        <Field label="Código de estudiante" required>
          <Input
            aria-label="Código de estudiante"
            value={fut.code}
            maxLength={30}
            onChange={(e) => update("code", e.target.value)}
          />
        </Field>
        </>}
        <Field label="Correo de contacto" required>
          <Input
            aria-label="Correo de contacto"
            type="email"
            value={fut.email}
            readOnly={controller.linkedAccount}
            maxLength={200}
            onChange={(e) => update("email", e.target.value)}
            autoComplete="email"
          />
        </Field>
        <Field label="Teléfono" required>
          <Input
            aria-label="Teléfono"
            type="tel"
            value={fut.phone}
            maxLength={9}
            onChange={(e) => update("phone", e.target.value.replace(/\D/g, ""))}
            autoComplete="tel"
          />
        </Field>
        <Field label="Domicilio" required>
          <Input
            aria-label="Domicilio"
            value={fut.address}
            maxLength={240}
            onChange={(e) => update("address", e.target.value)}
            autoComplete="street-address"
          />
        </Field>
      </div>
    );
  }
  function fileList(files: Attachment[], editable = false) {
    return (
      <div className="files">
        {files
          .filter((f) => !f.retired)
          .map((f) => (
            <div className="file-row" key={f.id}>
              <FileText size={22} />
              <div>
                <a href={"/api/portal/files/" + f.id}>{f.name}</a>
                <small>
                  {(f.size / 1024 / 1024).toFixed(2)} MB ·{" "}
                  {f.kind === "response"
                    ? "Respuesta de secretaría"
                    : "Documento de sustento"}
                </small>
              </div>
              <a
                className="icon-link"
                aria-label={"Descargar " + f.name}
                href={"/api/portal/files/" + f.id}
              >
                <Download size={17} />
              </a>
              {editable && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={"Retirar " + f.name}
                  disabled={busy}
                  onClick={() =>
                    setConfirm({
                      title: "¿Retirar este adjunto?",
                      description:
                        "No se incluirá en el envío actual. Se conservará una copia en el historial para la trazabilidad del expediente.",
                      run: () => void removeFile(f),
                    })
                  }
                >
                  <X size={17} />
                </Button>
              )}
            </div>
          ))}
      </div>
    );
  }
  if (!boot || loading) return (
    <main className="login-shell">
      <Toaster richColors position="top-right" />
      <header className="login-brand"><img src="/uns-logo.png" alt="Universidad Nacional del Santa" /><span>SIGET-UNS<small>Gestión de trámites universitarios</small></span></header>
      {loading ? <div className="panel access" role="status"><Loader2 className="animate-spin mx-auto" /><p>Verificando sesión…</p></div> : <AccountAccessView controller={controller} />}
      <footer>Proyecto académico · Pasantía Nacional 2026 · Entorno de prueba</footer>
    </main>
  );
  return (
    <SidebarProvider>
      <Toaster richColors position="top-right" />
      <Sidebar>
        <SidebarHeader className="brand">
          <img src="/uns-logo.png" alt="Universidad Nacional del Santa" />
          <span>SIGET-UNS</span>
        </SidebarHeader>
        <SidebarContent>
          <p className="nav-label">
            {admin ? "GESTIÓN DOCUMENTARIA" : "MI PORTAL"}
          </p>
          <SidebarMenu>
            {navItems.map(([id, label, Icon]: any) => (
              <SidebarMenuItem key={id}>
                <SidebarMenuButton
                  isActive={view === id}
                  onClick={() =>
                    id === "nuevo"
                      ? current || dirty
                        ? setView("nuevo")
                        : start()
                      : nav(id)
                  }
                >
                  <Icon />
                  <span>{label}</span>
                  {id === "notificaciones" && notices > 0 && (
                    <span className="nav-count">{notices}</span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
          {staff && (
            <div className="mode-switch">
              <p className="nav-label">ESPACIO DE TRABAJO</p>
              <Tabs
                value={mode}
                onValueChange={(v) => {
                  setMode(v);
                  nav("inicio");
                }}
              >
                <TabsList className="w-full">
                  <TabsTrigger value="student">Estudiante</TabsTrigger>
                  <TabsTrigger value="staff">Secretaría</TabsTrigger>
                </TabsList>
              </Tabs>
              <small>Vistas disponibles según tu rol.</small>
            </div>
          )}
        </SidebarContent>
        <SidebarFooter>
          <div className="campus">
            <GraduationCap size={20} />
            <div>
              Universidad Nacional del Santa
              <small>Nuevo Chimbote · Áncash</small>
            </div>
          </div>
          <p className="prototype">
            Proyecto de pasantía 2026
            <br />
            Entorno de prueba, no oficial
          </p>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="topbar">
          <SidebarTrigger aria-label="Abrir o cerrar menú" />
          <span>
            {admin
              ? "Gestión documentaria"
              : "Servicios académicos y administrativos"}
          </span>
          <div className="top-actions">
            {boot ? (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Ver notificaciones"
                  onClick={() => {
                    setMode("student");
                    nav("notificaciones");
                  }}
                >
                  <Bell size={19} />
                  {notices > 0 && <span className="notification-dot" />}
                </Button>
                <button
                  className="account"
                  onClick={() => {
                    nav("perfil");
                  }}
                >
                  <span className="avatar">
                    {(boot.user.profile.name || boot.user.name)
                      .slice(0, 1)
                      .toUpperCase()}
                  </span>
                  <span>
                    {boot.user.accountKind === "administration" ? "Administración de demo" : boot.user.profile.name || boot.user.name}
                    <small>
                      {boot.user.accountKind === "administration" ? "Sesión administrativa" : external ? "Persona externa · simulación" : "Estudiante UNS · simulación"}
                    </small>
                  </span>
                </button>
                {boot.user.accountKind ? <Button variant="ghost" size="icon" aria-label="Cerrar cuenta simulada" disabled={busy} onClick={signOutAccount}><LogOut size={17} /></Button> : (
                <a
                  href="/signout-with-chatgpt?return_to=%2F"
                  aria-label="Cerrar sesión"
                  className="icon-link"
                >
                  <LogOut size={17} />
                </a>
                )}
              </>
            ) : (
              <a
                href="/signin-with-chatgpt?return_to=%2F"
                className="login-link"
              >
                <ShieldCheck size={16} /> Ingresar al portal
              </a>
            )}
          </div>
        </header>
        <main className="workspace" aria-busy={busy}>
          <div className="breadcrumb">
            Portal UNS <ChevronRight size={13} />
            <span>{admin ? "Secretaría" : external ? "Persona externa" : "Estudiante"}</span>
            {view !== "inicio" && (
              <>
                <ChevronRight size={13} />
                <span>{titles[view]}</span>
              </>
            )}
          </div>
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                {view === "inicio"
                  ? "UNIVERSIDAD NACIONAL DEL SANTA"
                  : "TRÁMITE DIGITAL"}
              </div>
              <h1>{titles[view]}</h1>
            </div>
            {["inicio", "solicitudes", "bandeja", "reportes"].includes(
              view,
            ) && (
              <Button
                variant="outline"
                onClick={() => void refresh()}
                disabled={loading || busy}
                aria-label="Actualizar datos"
              >
                <RefreshCw size={16} />
                <span className="hide-mobile">Actualizar</span>
              </Button>
            )}
          </div>
          {loadError && (
            <div role="alert" className="error-box">
              {loadError}
              <Button variant="outline" onClick={() => void refresh()}>
                Reintentar
              </Button>
            </div>
          )}
          {formError && (
            <div role="alert" className="error-box">
              <AlertCircle size={18} />
              {formError}
            </div>
          )}
          {view === "inicio" && (
            <>
              <p className="lead">
                {admin
                  ? "Organiza las solicitudes, comunica observaciones y registra cada respuesta."
                  : "Completa tu FUT en línea, adjunta tus documentos y acompaña cada paso de tu solicitud."}
              </p>
              {!admin && (
                <div className="welcome">
                  <div>
                    <span className="eyebrow">MÁS CERCA DE TI</span>
                    <h2>
                      Una solicitud.
                      <br />
                      Todo el recorrido.
                    </h2>
                    <p>
                      Tu información, tus documentos y la respuesta de tu
                      escuela en un mismo expediente.
                    </p>
                    <Button onClick={() => start()}>
                      Iniciar un trámite <ArrowRight />
                    </Button>
                  </div>
                  <div className="document-art" aria-hidden="true">
                    <FilePlus2 size={40} />
                    <span>
                      FORMATO ÚNICO
                      <br />
                      DE TRÁMITE
                    </span>
                    <i />
                    <i />
                    <i />
                    <div>
                      FUT DIGITAL <ShieldCheck size={16} />
                    </div>
                  </div>
                </div>
              )}
              <div className="stats">
                {[
                  [
                    records.filter((r) => r.status !== "draft").length,
                    "Solicitudes registradas",
                    FolderOpen,
                    "neutral",
                  ],
                  [active.length, "En atención", Clock3, "blue"],
                  [
                    records.filter((r) => r.status === "observed").length,
                    "Por subsanar",
                    AlertCircle,
                    "amber",
                  ],
                  [
                    records.filter((r) => r.status === "resolved").length,
                    "Atendidas",
                    CheckCircle2,
                    "green",
                  ],
                ].map(([n, label, Icon, color]: any) => (
                  <div className="stat" key={label}>
                    <span className={"stat-icon " + color}>
                      <Icon size={21} />
                    </span>
                    <div>
                      <strong>{loading ? "—" : n}</strong>
                      <span>{label}</span>
                    </div>
                  </div>
                ))}
              </div>
              {records.length > 0 && (
                <>
                  <div className="section-head">
                    <h2>
                      {admin
                        ? "Últimos expedientes"
                        : "Tus últimas solicitudes"}
                    </h2>
                    <button
                      onClick={() => nav(admin ? "bandeja" : "solicitudes")}
                    >
                      Ver todas <ArrowRight size={16} />
                    </button>
                  </div>
                  {requestTable(records.slice(0, 4))}
                </>
              )}
              {!admin && (
                <>
                  <div className="section-head">
                    <h2>¿Qué necesitas solicitar?</h2>
                    <button onClick={() => nav("catalogo")}>
                      Ver catálogo <ArrowRight size={16} />
                    </button>
                  </div>
                  {serviceCards(
                    catalog.filter((x) =>
                      [
                        "fut-1-1",
                        "fut-1-6",
                        "fut-2-7",
                        "justificacion-medica",
                      ].includes(x.id),
                    ),
                  )}
                  <div className="info-note">
                    <ShieldCheck />
                    <p>
                      <strong>Un FUT realmente digital.</strong> Redacta y edita
                      tu solicitud aquí. No necesitas imprimir el formato ni
                      tomarle una fotografía.
                    </p>
                  </div>
                </>
              )}
              {admin && !records.length && requestTable([])}
            </>
          )}
          {view === "acceso" && <AccountAccessView controller={controller} />}
          {view === "catalogo" && (
            <>
              <p className="lead">
                Servicios basados en el FUT de la UNS. Selecciona uno para
                preparar tu solicitud digital.
              </p>
              <div className="filters">
                <div className="search-input">
                  <Search size={18} />
                  <Input
                    aria-label="Buscar un trámite"
                    placeholder="Busca certificados, matrícula, tesis..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <Choice
                  label="Filtrar por categoría"
                  value={category}
                  items={["Todos", ...categories]}
                  onChange={setCategory}
                />
                <span>
                  {
                    catalog.filter(
                      (s) =>
                        (category === "Todos" || s.category === category) &&
                        s.name.toLowerCase().includes(query.toLowerCase()),
                    ).length
                  }{" "}
                  servicios
                </span>
              </div>
              {serviceCards(
                catalog.filter(
                  (s) =>
                    (category === "Todos" || s.category === category) &&
                    s.name.toLowerCase().includes(query.toLowerCase()),
                ),
              )}
              {!catalog.some(
                (s) =>
                  (category === "Todos" || s.category === category) &&
                  s.name.toLowerCase().includes(query.toLowerCase()),
              ) && (
                <Empty
                  title="No encontramos ese trámite"
                  description="Prueba otra palabra o elige «Otros» para describir tu solicitud."
                  action={
                    <Button
                      onClick={() => {
                        setQuery("");
                        setCategory("Todos");
                      }}
                    >
                      Restablecer búsqueda
                    </Button>
                  }
                />
              )}
              <div className="info-note">
                <BookOpen />
                <p>
                  El catálogo no sustituye al TUPA / TUSNE vigente. La
                  matrícula, los títulos y otros procedimientos pueden tener
                  requisitos, pagos o etapas presenciales que debe confirmar la
                  UNS.
                </p>
              </div>
            </>
          )}
          {view === "nuevo" && (
            <>
              <p className="lead">
                Llena el formato en línea. Puedes guardar un borrador y
                continuar después.
              </p>
              <div className="stepper">
                {[
                  "Trámite y datos",
                  "Fundamento",
                  "Documentos",
                  "Revisar y enviar",
                ].map((name, i) => (
                  <button
                    key={name}
                    className={step === i ? "active" : step > i ? "done" : ""}
                    onClick={() => setStep(i)}
                  >
                    <span>{step > i ? <Check size={15} /> : i + 1}</span>
                    <div>{name}</div>
                  </button>
                ))}
              </div>
              <div className="form-layout">
                <section className="panel form-panel">
                  {step === 0 && (
                    <>
                      <div className="panel-title">
                        <FilePlus2 size={20} />
                        <h2>Tu solicitud comienza aquí</h2>
                      </div>
                      <Field
                        label="¿Qué trámite deseas realizar?"
                        required
                        wide
                      >
                        <Select
                          value={fut.serviceId || undefined}
                          onValueChange={(v) => {
                            update("serviceId", v);
                            if (!fut.reason)
                              update("reason", service(v)?.template || "");
                          }}
                        >
                          <SelectTrigger
                            aria-label="Tipo de trámite"
                            className="w-full"
                          >
                            <SelectValue placeholder="Selecciona un trámite" />
                          </SelectTrigger>
                          <SelectContent>
                            {catalog.map((s) => (
                              <SelectItem value={s.id} key={s.id}>
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                      {fut.serviceId === "fut-6-3" && (
                        <Field label="Especifica tu trámite" required>
                          <Input
                            aria-label="Especifica tu trámite"
                            value={fut.other}
                            maxLength={240}
                            onChange={(e) => update("other", e.target.value)}
                          />
                        </Field>
                      )}
                      <div className="subsection">
                        <h3>Datos del solicitante</h3>
                        <span>
                          Los campos con * son obligatorios para enviar.
                        </span>
                      </div>
                      {personFields()}
                    </>
                  )}
                  {step === 1 && (
                    <>
                      <div className="panel-title">
                        <FileText size={20} />
                        <h2>Redacta tu FUT</h2>
                      </div>
                      <div className="form-grid">
                        <Field label="Señor(a) / destinatario" required>
                          <Input
                            aria-label="Destinatario"
                            value={fut.recipient}
                            maxLength={160}
                            onChange={(e) =>
                              update("recipient", e.target.value)
                            }
                          />
                        </Field>
                        <Field label="Cargo" required>
                          <Input
                            aria-label="Cargo"
                            value={fut.role}
                            maxLength={100}
                            onChange={(e) => update("role", e.target.value)}
                          />
                        </Field>
                      </div>
                      <div className="editor-toolbar">
                        <span>Fundamento de la solicitud *</span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!fut.serviceId}
                          onClick={() =>
                            setConfirm({
                              title: "¿Usar la plantilla de este trámite?",
                              description:
                                "Reemplazará el fundamento actual. Después podrás editar cada frase y completar los textos entre corchetes.",
                              run: () =>
                                update(
                                  "reason",
                                  service(fut.serviceId)?.template || "",
                                ),
                            })
                          }
                        >
                          <FileText size={15} /> Usar plantilla
                        </Button>
                      </div>
                      <Textarea
                        aria-label="Fundamento de la solicitud"
                        className="fut-editor"
                        value={fut.reason}
                        maxLength={12000}
                        onChange={(e) => update("reason", e.target.value)}
                        placeholder="Explica qué solicitas, por qué lo necesitas y los datos necesarios para evaluar tu pedido."
                      />
                      <div className="editor-footer">
                        <span>
                          Reemplaza los textos entre [corchetes] antes de
                          enviar.
                        </span>
                        <span>
                          {fut.reason.length.toLocaleString("es-PE")} / 12 000
                        </span>
                      </div>
                      <div className="info-note">
                        <ShieldCheck size={20} />
                        <p>
                          Comparte solo información pertinente. Si se trata de
                          salud, incluye el sustento necesario sin describir
                          datos médicos ajenos a tu solicitud.
                        </p>
                      </div>
                    </>
                  )}
                  {step === 2 && (
                    <>
                      <div className="panel-title">
                        <Upload size={20} />
                        <h2>Documentos que sustentan tu solicitud</h2>
                      </div>
                      <p className="muted">
                        {service(fut.serviceId)?.documents ||
                          "Selecciona primero un trámite."}
                      </p>
                      <div
                        className="upload-zone"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (!busy) void uploadFiles(e.dataTransfer.files);
                        }}
                      >
                        <Upload size={31} />
                        <h3>Adjunta tus documentos digitales</h3>
                        <p>Arrastra tus archivos aquí o selecciónalos.</p>
                        <label className="upload-button">
                          Seleccionar archivos
                          <input
                            ref={inputRef}
                            type="file"
                            disabled={busy}
                            accept=".pdf,.docx,.jpg,.jpeg,.png"
                            multiple
                            onChange={(e) =>
                              e.target.files && void uploadFiles(e.target.files)
                            }
                          />
                        </label>
                        <small>
                          PDF, DOCX, JPG y PNG · 25 MB por archivo · 50 MB en
                          total · hasta 10 archivos
                        </small>
                      </div>
                      {fileList(current?.files || [], true)}
                      <p className="footnote">
                        No subas una foto del FUT. Este formulario genera el
                        documento. Los archivos son únicamente evidencias o
                        requisitos.
                      </p>
                    </>
                  )}
                  {step === 3 && (
                    <>
                      <div className="panel-title">
                        <ShieldCheck size={20} />
                        <h2>Revisa antes de enviar</h2>
                      </div>
                      <div className="fut-preview">
                        <div className="fut-preview-head">
                          <img src="/uns-logo.png" alt="UNS" />
                          <div>
                            <strong>FORMATO ÚNICO DE TRÁMITE</strong>
                            <span>
                              Solicitud digital · proyecto de pasantía
                            </span>
                          </div>
                        </div>
                        <dl>
                          <dt>Solicito</dt>
                          <dd>
                            {service(fut.serviceId)?.name || "Sin seleccionar"}
                            {fut.other && " · " + fut.other}
                          </dd>
                          <dt>Dirigido a</dt>
                          <dd>
                            {fut.recipient} · {fut.role}
                          </dd>
                          <dt>Solicitante</dt>
                          <dd>
                            {fut.name || "Pendiente"} · DNI{" "}
                            {fut.dni || "pendiente"}
                          </dd>
                          <dt>Escuela</dt>
                          <dd>
                            {external ? "No aplica — persona externa" : `${fut.school} · Código ${fut.code || "pendiente"}`}
                          </dd>
                          <dt>Contacto</dt>
                          <dd>
                            {fut.email || "Pendiente"} ·{" "}
                            {fut.phone || "pendiente"}
                          </dd>
                          <dt>Domicilio</dt>
                          <dd>{fut.address || "Pendiente"}</dd>
                        </dl>
                        <h4>Fundamento de la solicitud</h4>
                        <p className="preserve">
                          {fut.reason || "Pendiente de redactar"}
                        </p>
                        <h4>Documentos adjuntos</h4>
                        <p>
                          {current?.files
                            .filter((f) => !f.retired && f.kind === "evidence")
                            .map((f) => f.name)
                            .join(", ") || "Sin documentos adjuntos"}
                        </p>
                      </div>
                      {controller.linkedAccount ? <div className="panel"><h4>Solicitud vinculada a tu cuenta</h4><p>{boot.user.name}<br />{boot.user.email}</p><small>El nombre y correo se toman automáticamente de esta cuenta simulada.</small></div> : (
                      <Field
                        label="Declaración de autoría: escribe tu nombre completo"
                        required
                      >
                        <Input
                          aria-label="Declaración de autoría"
                          value={fut.signature}
                          maxLength={160}
                          placeholder="Debe coincidir con nombres y apellidos"
                          onChange={(e) => update("signature", e.target.value)}
                        />
                      </Field>
                      )}
                      <div className="consent">
                        <Checkbox
                          id="veracidad"
                          checked={fut.consent}
                          onCheckedChange={(v) => update("consent", v === true)}
                        />
                        <label htmlFor="veracidad">
                          Confirmo que los datos y documentos que presento son veraces.
                        </label>
                      </div>
                      <p className="footnote">
                        La declaración de autoría no equivale a una firma
                        digital certificada. Este portal de prueba no presenta
                        trámites ante la UNS.
                      </p>
                    </>
                  )}
                  <div className="form-actions">
                    <Button variant="outline" onClick={doSave} disabled={busy}>
                      <Save size={17} />
                      {busy ? "Guardando..." : "Guardar borrador"}
                    </Button>
                    <div>
                      {step > 0 && (
                        <Button
                          variant="ghost"
                          onClick={() => setStep((s) => s - 1)}
                          disabled={busy}
                        >
                          <ArrowLeft size={16} /> Atrás
                        </Button>
                      )}
                      {step < 3 ? (
                        <Button
                          disabled={busy || !fut.serviceId}
                          onClick={() => setStep((s) => s + 1)}
                        >
                          Continuar <ArrowRight size={16} />
                        </Button>
                      ) : (
                        <Button
                          disabled={busy || !fut.consent}
                          onClick={() =>
                            setConfirm({
                              title:
                                current?.status === "observed"
                                  ? "¿Enviar la subsanación?"
                                  : "¿Enviar tu solicitud?",
                              description:
                                "El FUT quedará registrado con número de expediente y constancia. Solo podrás editarlo nuevamente si secretaría solicita una subsanación. Es un envío dentro del portal de prueba.",
                              run: () => void send(),
                            })
                          }
                        >
                          {busy ? (
                            <Loader2 className="animate-spin" />
                          ) : (
                            <Send size={17} />
                          )}{" "}
                          {current?.status === "observed"
                            ? "Enviar subsanación"
                            : "Enviar solicitud"}
                        </Button>
                      )}
                    </div>
                  </div>
                </section>
                <aside className="form-aside">
                  <div className="panel">
                    <span className="eyebrow">TU FUT DIGITAL</span>
                    <h3>
                      {service(fut.serviceId)?.name || "Selecciona un trámite"}
                    </h3>
                    <p>
                      Una vez enviado, encontrarás tu expediente y constancia en
                      «Mis solicitudes».
                    </p>
                    <ol>
                      <li>Completa tus datos.</li>
                      <li>Describe tu pedido.</li>
                      <li>Adjunta el sustento.</li>
                      <li>Revisa y envía.</li>
                    </ol>
                    <div className="saved-state">
                      {dirty ? (
                        <>
                          <Clock3 size={15} /> Cambios sin guardar
                        </>
                      ) : current ? (
                        <>
                          <CheckCircle2 size={15} /> Guardado ·{" "}
                          {date(current.updated)}
                        </>
                      ) : (
                        <>
                          <FileText size={15} /> Nuevo formulario
                        </>
                      )}
                    </div>
                  </div>
                  <div className="help-note">
                    <CircleHelp size={20} />
                    <p>
                      ¿Tienes dudas sobre los requisitos?
                      <a
                        href="https://www.uns.edu.pe/mesadepartes/"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Consulta Mesa de Partes de la UNS{" "}
                        <ExternalLink size={13} />
                      </a>
                    </p>
                  </div>
                </aside>
              </div>
            </>
          )}
          {(view === "solicitudes" || view === "bandeja") && (
            <>
              <p className="lead">
                {admin
                  ? "Revisa, deriva y responde solicitudes. Cada acción queda en el historial."
                  : "Encuentra tus borradores, tus expedientes y las respuestas de tu escuela."}
              </p>
              <div className="filters">
                <div className="search-input">
                  <Search size={18} />
                  <Input
                    aria-label="Buscar solicitudes"
                    placeholder={
                      admin
                        ? "Expediente, solicitante o trámite..."
                        : "Busca por expediente o trámite..."
                    }
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger aria-label="Filtrar por estado">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los estados</SelectItem>
                    {Object.entries(states)
                      .filter(([key]) => !admin || key !== "draft")
                      .map(([key, label]) => (
                        <SelectItem value={key} key={key}>
                          {label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {admin && (
                  <Choice
                    label="Filtrar por dependencia"
                    value={officeFilter}
                    items={["Todas", ...offices]}
                    onChange={setOfficeFilter}
                  />
                )}
                <Button onClick={() => (admin ? void refresh() : start())}>
                  {admin ? <RefreshCw size={17} /> : <FilePlus2 size={17} />}{" "}
                  {admin ? "Actualizar" : "Nuevo trámite"}
                </Button>
              </div>
              {requestTable(
                records.filter(
                  (r) =>
                    (filter === "todos" || r.status === filter) &&
                    (!admin ||
                      officeFilter === "Todas" ||
                      r.office === officeFilter) &&
                    [
                      r.code,
                      service(r.content.serviceId)?.name,
                      admin ? r.content.name : "",
                    ]
                      .join(" ")
                      .toLowerCase()
                      .includes(query.toLowerCase()),
                ),
              )}
            </>
          )}
          {view === "seguimiento" && (
            <>
              <p className="lead">
                Consulta el estado y el recorrido de tus propias solicitudes. Tu
                información no es pública.
              </p>
              <form
                className="panel tracking-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  track();
                }}
              >
                <Field label="Año">
                  <Input
                    aria-label="Año del expediente"
                    inputMode="numeric"
                    maxLength={4}
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                  />
                </Field>
                <Field label="Número de expediente">
                  <Input
                    aria-label="Número de expediente"
                    placeholder="UNS-2026-000001"
                    value={trackCode}
                    onChange={(e) => setTrackCode(e.target.value)}
                  />
                </Field>
                <Button type="submit" disabled={loading}>
                  <Search size={17} /> Consultar
                </Button>
              </form>
              {tracked ? (
                <div className="panel tracking-result">
                  <div>
                    <State value={tracked.status} />
                    <h2>{tracked.code}</h2>
                    <p>{service(tracked.content.serviceId)?.name}</p>
                    <small>Dependencia actual: {tracked.office}</small>
                  </div>
                  <Button onClick={() => open(tracked)}>
                    Ver recorrido <ArrowRight size={17} />
                  </Button>
                </div>
              ) : trackDone ? (
                <Empty
                  title="No se encontró un expediente en tu cuenta"
                  description="Revisa el año y el número completo. Solo puedes consultar tus propios expedientes."
                />
              ) : (
                <div className="info-note">
                  <ShieldCheck />
                  <p>
                    El número aparece en tu constancia de recepción y en «Mis
                    solicitudes».
                  </p>
                </div>
              )}
            </>
          )}
          {view === "notificaciones" && (
            <>
              <div className="section-head">
                <p className="muted">
                  Actualizaciones y observaciones de tus expedientes.
                </p>
                <Button
                  variant="outline"
                  disabled={busy || !notices}
                  onClick={() => void markAllRead()}
                >
                  <Check size={16} /> Marcar todas como leídas
                </Button>
              </div>
              {boot?.notifications.length ? (
                <div className="notice-list">
                  {boot.notifications.map((n) => (
                    <button
                      className={"notice" + (!n.read ? " unread" : "")}
                      key={n.id}
                      onClick={() => void openNotice(n)}
                    >
                      <span className="service-icon">
                        <Bell size={21} />
                      </span>
                      <div>
                        <strong>{n.message}</strong>
                        <small>{date(n.created)}</small>
                      </div>
                      {!n.read && <span className="unread-badge">Nuevo</span>}
                      <ChevronRight size={18} />
                    </button>
                  ))}
                </div>
              ) : (
                <Empty
                  title="Estás al día"
                  description="Aquí verás avisos de recepción, derivaciones, observaciones y respuestas."
                />
              )}
              <p className="footnote">
                Estas notificaciones son internas. No se envían correos ni SMS
                en la versión de prueba.
              </p>
            </>
          )}
          {view === "detalle" && selected && (
            <>
              <div className="detail-toolbar">
                <Button variant="outline" onClick={() => nav(originView)}>
                  <ArrowLeft size={16} /> Volver
                </Button>
                <State value={selected.status} />
                <div>
                  {selected.code && (
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() => download(selected, "receipt")}
                    >
                      <Download size={16} /> Constancia PDF
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() => download(selected, "fut")}
                  >
                    <FileText size={16} /> FUT PDF
                  </Button>
                </div>
              </div>
              <div className="detail-layout">
                <div>
                  <section className="panel">
                    <div className="panel-title">
                      <FileText size={20} />
                      <h2>
                        {service(selected.content.serviceId)?.name ||
                          "Solicitud en preparación"}
                      </h2>
                    </div>
                    <dl className="detail-data">
                      <dt>Solicitante</dt>
                      <dd>{selected.content.name || "Pendiente"}</dd>
                      <dt>Escuela / código</dt>
                      <dd>
                        {selected.content.school} · {selected.content.code}
                      </dd>
                      <dt>Destinatario</dt>
                      <dd>
                        {selected.content.recipient} · {selected.content.role}
                      </dd>
                      <dt>Contacto</dt>
                      <dd>
                        {selected.content.email} · {selected.content.phone}
                      </dd>
                      <dt>Dependencia actual</dt>
                      <dd>{selected.office}</dd>
                      <dt>Fecha de recepción</dt>
                      <dd>{date(selected.submitted)}</dd>
                    </dl>
                    <h3 className="subheading">Fundamento</h3>
                    <p className="preserve">
                      {selected.content.reason || "Sin fundamento."}
                    </p>
                    {selected.response && (
                      <div className="response-box">
                        <CheckCircle2 size={22} />
                        <div>
                          <h3>Respuesta de la dependencia</h3>
                          <p className="preserve">{selected.response}</p>
                        </div>
                      </div>
                    )}
                    <h3 className="subheading">Documentos del expediente</h3>
                    {fileList(selected.files)}
                    {!selected.files.some((f) => !f.retired) && (
                      <p className="muted">No se adjuntaron documentos.</p>
                    )}
                    {admin && selected.files.some((f) => f.retired) && (
                      <details className="archived-files">
                        <summary>Adjuntos retirados del envío actual</summary>
                        {selected.files
                          .filter((f) => f.retired)
                          .map((f) => (
                            <p key={f.id}>
                              <a href={"/api/portal/files/" + f.id}>{f.name}</a>{" "}
                              · conservado para trazabilidad
                            </p>
                          ))}
                      </details>
                    )}
                    {!admin &&
                      selected.owner === boot?.user.id &&
                      ["draft", "observed"].includes(selected.status) && (
                        <Button onClick={() => edit(selected)} disabled={busy}>
                          <FilePlus2 size={17} />
                          {selected.status === "observed"
                            ? "Subsanar solicitud"
                            : "Continuar borrador"}
                        </Button>
                      )}
                    {!admin &&
                      selected.owner === boot?.user.id &&
                      ["draft", "received", "observed"].includes(
                        selected.status,
                      ) && (
                        <Button
                          variant="ghost"
                          className="danger-link"
                          disabled={busy}
                          onClick={() =>
                            setConfirm({
                              title: "¿Cancelar esta solicitud?",
                              description:
                                "No continuará su atención. El expediente y el historial permanecerán disponibles para consulta.",
                              run: () => void cancel(selected),
                            })
                          }
                        >
                          Cancelar solicitud
                        </Button>
                      )}
                  </section>
                  {admin &&
                    staff &&
                    !["draft", "resolved", "rejected", "cancelled"].includes(
                      selected.status,
                    ) && (
                      <section className="panel attention-panel">
                        <div className="panel-title">
                          <Inbox size={20} />
                          <h2>Atender expediente</h2>
                        </div>
                        <div className="form-grid">
                          <Field label="Acción">
                            <Select value={action} onValueChange={setAction}>
                              <SelectTrigger aria-label="Acción de atención">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {[
                                  ["review", "Iniciar evaluación"],
                                  ["observe", "Solicitar subsanación"],
                                  ["refer", "Derivar a dependencia"],
                                  ["resolve", "Atender y responder"],
                                  ["reject", "Declarar no procedente"],
                                ].map(([v, l]) => (
                                  <SelectItem key={v} value={v}>
                                    {l}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </Field>
                          {action === "refer" && (
                            <Field label="Dependencia de destino">
                              <Choice
                                label="Dependencia de destino"
                                value={destination}
                                items={offices}
                                onChange={setDestination}
                              />
                            </Field>
                          )}
                        </div>
                        <Field label="Mensaje para el solicitante" required>
                          <Textarea
                            aria-label="Mensaje para el solicitante"
                            value={message}
                            maxLength={6000}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Explica la acción, qué debe corregirse o la respuesta de la dependencia."
                          />
                        </Field>
                        <div className="attention-actions">
                          <label className="secondary-upload">
                            <Upload size={16} /> Adjuntar respuesta
                            <input
                              type="file"
                              accept=".pdf,.docx,.jpg,.jpeg,.png"
                              disabled={busy}
                              onChange={(e) =>
                                e.target.files &&
                                void uploadFiles(e.target.files, true)
                              }
                            />
                          </label>
                          <Button
                            disabled={busy || message.trim().length < 5}
                            onClick={() =>
                              setConfirm({
                                title: "¿Registrar esta acción?",
                                description:
                                  "Se actualizará el estado y se notificará al solicitante. La acción quedará en el historial de este entorno de prueba.",
                                run: () => void attend(),
                              })
                            }
                          >
                            <Send size={17} /> Registrar acción
                          </Button>
                        </div>
                      </section>
                    )}
                </div>
                <aside className="panel timeline-panel">
                  <h2>Recorrido del expediente</h2>
                  <p className="muted">Cada paso queda registrado.</p>
                  <ol className="timeline">
                    {selected.events.length ? (
                      selected.events.map((e) => (
                        <li key={e.id}>
                          <span className={"timeline-dot " + e.status} />
                          <div>
                            <strong>{e.title}</strong>
                            <small>{date(e.created)}</small>
                            <p>{e.message}</p>
                            <span className="actor">{e.actor}</span>
                          </div>
                        </li>
                      ))
                    ) : (
                      <li>
                        <span className="timeline-dot draft" />
                        <div>
                          <strong>Borrador creado</strong>
                          <small>{date(selected.created)}</small>
                          <p>Aún no ha sido enviado para atención.</p>
                        </div>
                      </li>
                    )}
                  </ol>
                </aside>
              </div>
            </>
          )}
          {view === "perfil" && (
            <>
              <p className="lead">
                Estos datos se utilizarán para completar tus futuros
                formularios. No cambian solicitudes ya enviadas.
              </p>
              <div className="panel profile-panel">
                {personFields()}
                <div className="form-actions">
                  <Button
                    disabled={busy}
                    onClick={() => void saveProfile()}
                  >
                    <Save size={17} /> Guardar mis datos
                  </Button>
                </div>
              </div>
            </>
          )}
          {view === "reportes" && admin && (
            <>
              <p className="lead">
                Indicadores de los expedientes registrados en este portal.
                Descarga la información filtrada para su análisis.
              </p>
              <div className="stats">
                {["received", "reviewing", "observed", "resolved"].map((s) => (
                  <div className="stat" key={s}>
                    <span className="stat-icon neutral">
                      <FolderOpen size={21} />
                    </span>
                    <div>
                      <strong>
                        {records.filter((r) => r.status === s).length}
                      </strong>
                      <span>{states[s]}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="filters">
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger aria-label="Estado del reporte">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los estados</SelectItem>
                    {Object.entries(states)
                      .filter(([s]) => s !== "draft")
                      .map(([s, l]) => (
                        <SelectItem key={s} value={s}>
                          {l}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Choice
                  label="Dependencia del reporte"
                  value={officeFilter}
                  items={["Todas", ...offices]}
                  onChange={setOfficeFilter}
                />
                <Button
                  onClick={() => void exportReport()}
                >
                  <Download size={17} /> Exportar CSV
                </Button>
              </div>
              {requestTable(
                records.filter(
                  (r) =>
                    (filter === "todos" || r.status === filter) &&
                    (officeFilter === "Todas" || r.office === officeFilter),
                ),
              )}
              <div className="info-note">
                <ShieldCheck />
                <p>
                  El reporte no incluye DNI, domicilio ni documentos de salud.
                  Acceso restringido a roles de atención.
                </p>
              </div>
            </>
          )}
          {view === "usuarios" && (
            <>
              <p className="lead">
                Los permisos se verifican en el servidor. El estudiante solo
                accede a sus propios expedientes.
              </p>
              {boot?.user.role === "admin" ? (
                <div className="panel">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cuenta</TableHead>
                        <TableHead>Permiso</TableHead>
                        <TableHead>Rol</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {boot.users.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell>
                            <strong>{u.name}</strong>
                            <small className="block">{u.email}</small>
                          </TableCell>
                          <TableCell>
                            {u.role === "student"
                              ? "Sus solicitudes"
                              : u.role === "staff"
                                ? "Atención de expedientes"
                                : "Atención y gestión de roles"}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={u.role}
                              disabled={busy || u.id === boot.user.id}
                              onValueChange={(role) =>
                                setConfirm({
                                  title: "¿Cambiar el rol de esta cuenta?",
                                  description: `${u.email} recibirá el permiso seleccionado. Secretaría y administración permiten consultar los documentos de todos los expedientes. No amplía por sí mismo el acceso al sitio privado.`,
                                  run: () => void changeRole(u.id, role),
                                })
                              }
                            >
                              <SelectTrigger aria-label={"Rol de " + u.name}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="student">
                                  Estudiante
                                </SelectItem>
                                <SelectItem value="staff">
                                  Secretaría
                                </SelectItem>
                                <SelectItem value="admin">
                                  Administrador
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <Empty
                  title="Acceso reservado"
                  description="Solo el administrador puede gestionar roles."
                />
              )}
              <div className="info-note">
                <ShieldCheck />
                <p>
                  El sitio es privado. El propietario inicial administra el
                  entorno de prueba. Una instalación institucional necesita
                  vincular identidades UNS y definir permisos por dependencia
                  antes de incorporar usuarios reales.
                </p>
              </div>
            </>
          )}
          {view === "ayuda" && (
            <>
              <p className="lead">
                El FUT digital reúne tu pedido, los documentos y su seguimiento.
              </p>
              <div className="help-grid">
                <section className="panel">
                  <h2>
                    {admin
                      ? "Cómo atender una solicitud"
                      : "Cómo presentar una solicitud"}
                  </h2>
                  {(admin
                    ? [
                        "Abre un expediente en la bandeja de atención.",
                        "Inicia la evaluación y revisa el FUT y sus evidencias.",
                        "Si faltan datos, solicita una subsanación con un mensaje claro.",
                        "Deriva a la dependencia que corresponda o registra una respuesta.",
                        "Adjunta el documento de respuesta antes de darlo por atendido.",
                      ]
                    : [
                        "Selecciona el trámite y completa tus datos.",
                        "Usa la plantilla, reemplaza los textos entre corchetes y redacta el fundamento.",
                        "Adjunta evidencias digitales. No necesitas imprimir ni fotografiar el FUT.",
                        "Revisa la solicitud, declara su veracidad y envíala.",
                        "Descarga la constancia y revisa el historial. Si hay una observación, corrige el FUT y envía la subsanación.",
                      ]
                  ).map((x, i) => (
                    <div className="help-step" key={x}>
                      <span>{i + 1}</span>
                      <p>{x}</p>
                    </div>
                  ))}
                </section>
                <section className="panel">
                  <h2>Canales oficiales de la UNS</h2>
                  <p className="muted">
                    Esta aplicación es un proyecto académico independiente, no
                    el canal oficial.
                  </p>
                  <a
                    className="resource"
                    href="https://www.uns.edu.pe/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Building2 size={20} />
                    <div>
                      Web institucional
                      <small>Universidad Nacional del Santa</small>
                    </div>
                    <ExternalLink size={16} />
                  </a>
                  <a
                    className="resource"
                    href="https://www.uns.edu.pe/mesadepartes/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Inbox size={20} />
                    <div>
                      Mesa de Partes Digital
                      <small>
                        Consulta el canal y los requisitos oficiales
                      </small>
                    </div>
                    <ExternalLink size={16} />
                  </a>
                  <a
                    className="resource"
                    href="https://www.uns.edu.pe/archivos/nuevos_formatos_sut_tupa_uns.pdf"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <BookOpen size={20} />
                    <div>
                      Documento TUPA de referencia
                      <small>
                        Comprueba la versión vigente con la universidad
                      </small>
                    </div>
                    <ExternalLink size={16} />
                  </a>
                  <a className="resource" href="mailto:mesadepartes@uns.edu.pe">
                    <Mail size={20} />
                    <div>
                      Mesa de Partes<small>mesadepartes@uns.edu.pe</small>
                    </div>
                    <ArrowRight size={16} />
                  </a>
                </section>
              </div>
              <div className="panel faq">
                <h2>Preguntas frecuentes</h2>
                {[
                  [
                    "¿El FUT se llena como una foto o un PDF?",
                    "No. Se completa directamente en el formulario web; puedes guardar borradores, editar el fundamento y generar el FUT en PDF.",
                  ],
                  [
                    "¿Qué significa «Observado»?",
                    "Secretaría necesita una corrección o un documento adicional. Revisa el mensaje en el historial, pulsa «Subsanar solicitud», guarda los cambios y envíalos.",
                  ],
                  [
                    "¿Se puede editar después de enviarlo?",
                    "No mientras esté en atención. Si secretaría observa el expediente, se habilita la corrección. El historial de las versiones enviadas se conserva.",
                  ],
                  [
                    "¿El trámite se presenta realmente ante la UNS?",
                    "No. Esta versión es un entorno privado de prueba para la pasantía 2026. No está integrada a los sistemas, pagos, firma digital ni correo institucional.",
                  ],
                  [
                    "¿Cuándo se atienden los trámites oficiales?",
                    "La web de Mesa de Partes de la UNS indica recepción digital las 24 horas y procesamiento en días hábiles de 07:30 a 15:30. Consulta allí los horarios y requisitos vigentes.",
                  ],
                  [
                    "¿Todos los procedimientos pueden ser totalmente virtuales?",
                    "La propuesta digitaliza la solicitud y su seguimiento. La UNS debe validar qué procedimientos pueden completarse a distancia y cuáles requieren otras etapas.",
                  ],
                  [
                    "¿Quién puede ver mis documentos?",
                    "El solicitante y los usuarios con rol de secretaría o administración. No se habilita búsqueda pública por número de expediente. Usa documentos ficticios para las pruebas.",
                  ],
                ].map(([q, a]) => (
                  <details key={q}>
                    <summary>{q}</summary>
                    <p>{a}</p>
                  </details>
                ))}
              </div>
            </>
          )}
          <footer className="page-footer">
            <span>SIGET-UNS · Gestión de trámites</span>
            <span>Proyecto académico · Pasantía Nacional 2026</span>
          </footer>
        </main>
      </SidebarInset>
      <Dialog open={!!confirm} onOpenChange={(v) => !v && setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirm?.title}</DialogTitle>
            <DialogDescription>{confirm?.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(null)}>
              Volver
            </Button>
            <Button
              onClick={() => {
                const run = confirm?.run;
                setConfirm(null);
                run?.();
              }}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
