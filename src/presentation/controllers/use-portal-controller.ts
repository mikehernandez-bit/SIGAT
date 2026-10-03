"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { blankFut, catalog, offices, type Fut, type Service } from "../../domain/catalog";
import type { Bootstrap, Detail, RequestRecord, Attachment, Notice } from "../../domain/models";
import type { PortalClient } from "../ports/portal-client";
/** Controlador de pantalla: estado y acciones, sin JSX ni acceso directo a proveedores. */
export function usePortalController(client: PortalClient) {
  const [view, setView] = useState("inicio"),
    [mode, setMode] = useState("student"),
    [boot, setBoot] = useState<Bootstrap | null>(null),
    [loading, setLoading] = useState(true),
    [loadError, setLoadError] = useState(""),
    [busy, setBusy] = useState(false);
  const [fut, setFut] = useState<Fut>(blankFut),
    [current, setCurrent] = useState<Detail | null>(null),
    [step, setStep] = useState(0),
    [dirty, setDirty] = useState(false),
    [selected, setSelected] = useState<Detail | null>(null),
    [originView, setOriginView] = useState("solicitudes");
  const [profileFut, setProfileFut] = useState<Fut>(blankFut);
  const [profileDirty, setProfileDirty] = useState(false);
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState("Todos"),
    [filter, setFilter] = useState("todos"),
    [officeFilter, setOfficeFilter] = useState("Todas"),
    [year, setYear] = useState(String(new Date().getFullYear())),
    [trackCode, setTrackCode] = useState(""),
    [tracked, setTracked] = useState<RequestRecord | null>(null),
    [trackDone, setTrackDone] = useState(false);
  const [confirm, setConfirm] = useState<{
      title: string;
      description: string;
      run: () => void;
    } | null>(null),
    [action, setAction] = useState("review"),
    [message, setMessage] = useState(""),
    [destination, setDestination] = useState(offices[0]),
    [formError, setFormError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [accessKind, setAccessKind] = useState<"institutional" | "external">("institutional");
  const [accessPassword, setAccessPassword] = useState("");
  const [accessEmail, setAccessEmail] = useState("");
  const [accessStatus, setAccessStatus] = useState({available:false, canAdmin:false});
  const linkedAccount = boot?.user.accountKind === "institutional" || boot?.user.accountKind === "external";
  const external = boot?.user.accountKind === "external";
  const staff = boot?.user.role === "staff" || boot?.user.role === "admin";
  const admin = mode === "staff" && staff;
  const notices = boot?.notifications.filter((n) => !n.read).length || 0;
  const refresh = useCallback(async () => {
    setLoadError("");
    try {
      setAccessStatus(await client.api<{available:boolean;canAdmin:boolean}>("simulation/status"));
      const value = await client.api<Bootstrap>("bootstrap");
      setBoot(value);
      return value;
    } catch (e: any) {
      if (e.status === 401) setBoot(null);
      else { setBoot(null); setLoadError(e.message); }
      return null;
    } finally {
      setLoading(false);
    }
  }, [client]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    if (boot && !profileDirty) setProfileFut({ ...blankFut, ...boot.user.profile,
      ...((boot.user.accountKind === "institutional" || boot.user.accountKind === "external") ? {name: boot.user.name, email: boot.user.email, signature: boot.user.name} : {}),
      ...(boot.user.accountKind === "external" ? {faculty: "", school: "", code: ""} : {}) });
  }, [boot, profileDirty]);
  useEffect(() => {
    if (!dirty && !profileDirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, profileDirty]);
  useEffect(() => {
    const context = (document as any).modelContext;
    if (!boot) return;
    if (!context?.registerTool) return;
    const name = "consultar_catalogo_uns";
    const lifecycle = new AbortController();
    try { void Promise.resolve(context.registerTool({
      name,
      description:
        "Consulta los servicios del FUT digital UNS y sus categorías. Solo lectura; no presenta solicitudes.",
      inputSchema: {
        type: "object",
        properties: { busqueda: { type: "string" } },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: async (input: unknown) => {
        if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Entrada inválida.");
        const values = input as Record<string, unknown>;
        if (Object.keys(values).some(k=>k!=="busqueda") || (values.busqueda!==undefined && (typeof values.busqueda!=="string" || values.busqueda.length>200))) throw new Error("Búsqueda inválida.");
        setQuery((values.busqueda as string)||"");
        setCategory("Todos");
        setView("catalogo");
        return ({
        content: [
          {
            type: "text",
            text: JSON.stringify(
              catalog
                .filter((s) =>
                  s.name
                    .toLowerCase()
                    .includes(((values.busqueda as string) || "").toLowerCase()),
                )
                .map(({ id, name, category, documents }) => ({
                  id,
                  name,
                  category,
                  documents,
                })),
            ),
          },
        ],
      }); },
    }, { signal: lifecycle.signal })).catch(()=>{}); } catch { /* Browser support is optional. */ }
    return () => {
      lifecycle.abort();
    };
  }, [boot?.user.id]);
  const fail = (e: any) => {
    setFormError(e.message);
    toast.error(e.message);
  };
  const update = (k: keyof Fut, v: any) => {
    setFut((f) => ({ ...f, [k]: v }));
    setDirty(true);
    setFormError("");
  };
  function nav(to: string) {
    if (!boot && to !== "acceso") { setView("acceso"); return; }
    if (to !== "detalle") setSelected(null);
    setView(to);
    setQuery("");
    setFilter("todos");
    setFormError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function requireLogin() {
    if (!boot) {
      toast.info(
        "Ingresa al entorno privado para crear y guardar solicitudes.",
      );
      nav("acceso");
      return false;
    }
    return true;
  }
  function start(s?: Service) {
    if (!requireLogin()) return;
    const run = () => {
      setFut({
        ...blankFut,
        ...boot!.user.profile,
        ...(linkedAccount ? { name: boot!.user.name, email: boot!.user.email, signature: boot!.user.name } : {}),
        ...(external ? { faculty: "", school: "", code: "" } : {}),
        serviceId: s?.id || "",
        reason: s?.template || "",
      });
      setCurrent(null);
      setStep(0);
      setDirty(false);
      setView("nuevo");
      setFormError("");
      window.scrollTo(0, 0);
    };
    if (dirty)
      setConfirm({
        title: "¿Crear un nuevo FUT?",
        description:
          "El formulario actual tiene cambios sin guardar. Puedes cancelar y guardarlos como borrador.",
        run,
      });
    else run();
  }
  async function open(r: RequestRecord) {
    setBusy(true);
    try {
      const d = await client.api("requests/" + r.id);
      setSelected(d);
      setOriginView(view);
      setView("detalle");
      setMessage("");
      window.scrollTo(0, 0);
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }
  async function save(silent = false): Promise<Detail | null> {
    if (!requireLogin()) return null;
    const d = current
      ? await client.api("requests/" + current.id, {
          action: "save",
          revision: current.revision,
          content: fut,
        })
      : await client.api("draft", { content: fut });
    setCurrent(d);
    setDirty(false);
    if (!silent) toast.success("Borrador guardado. Puedes continuar después.");
    await refresh();
    return d;
  }
  async function doSave() {
    setBusy(true);
    try {
      await save();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }
  async function send() {
    setBusy(true);
    setFormError("");
    try {
      const d = await save(true);
      if (!d) return;
      const submitted = await client.api("requests/" + d.id, {
        action: d.status === "observed" ? "correct" : "submit",
        revision: d.revision,
        content: fut,
      });
      setDirty(false);
      setCurrent(null);
      setSelected(submitted);
      setView("detalle");
      setOriginView("solicitudes");
      await refresh();
      toast.success(
        d.status === "observed"
          ? "Subsanación enviada."
          : "Solicitud recibida. Tu constancia ya está disponible.",
      );
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }
  async function uploadFiles(list: FileList | File[], response = false) {
    if (!list.length) return;
    setBusy(true);
    try {
      const starting = response ? selected : await save(true);
      if (!starting) return;
      let d: Detail = starting;
      for (const file of Array.from(list)) {
        d = await client.uploadFile(d.id, file, response ? "response" : "evidence", d.revision);
        if (response) setSelected(d);
        else setCurrent(d);
      }
      await refresh();
      toast.success("Documentos adjuntados.");
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }
  async function removeFile(file: Attachment) {
    if (!current) return;
    setBusy(true);
    try {
      setCurrent(
        await client.api("requests/" + current.id, {
          action: "retireFile",
          fileId: file.id,
          revision: current.revision,
        }),
      );
      toast.success("El adjunto se retiró del envío actual.");
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }
  async function attend() {
    if (!selected) return;
    setBusy(true);
    try {
      setSelected(
        await client.api("requests/" + selected.id, {
          action,
          message,
          office: destination,
          revision: selected.revision,
        }),
      );
      setMessage("");
      await refresh();
      toast.success("Expediente actualizado. Se notificó al solicitante.");
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }
  async function cancel(r: Detail) {
    setBusy(true);
    try {
      const d = await client.api("requests/" + r.id, {
        action: "cancel",
        revision: r.revision,
      });
      setSelected(d);
      await refresh();
      toast.success("Solicitud cancelada. El historial se conserva.");
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }
  function edit(r: Detail) {
    const run = () => {
      setFut(r.content);
      setCurrent(r);
      setDirty(false);
      setStep(1);
      setView("nuevo");
      setFormError("");
    };
    if (dirty)
      setConfirm({
        title: "¿Abrir este FUT?",
        description:
          "Tienes cambios sin guardar en otro formulario. Cancela para guardarlos primero.",
        run,
      });
    else run();
  }
  async function download(r: RequestRecord, kind: "fut" | "receipt") {
    setBusy(true);
    try {
      await client.exportPdf(r, kind);
      toast.success("PDF descargado.");
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }
  const records = (admin ? boot?.all : boot?.mine) || [];
  const active = records.filter(
    (r) => !["draft", "resolved", "rejected", "cancelled"].includes(r.status),
  );

  function updateProfileField(key: keyof Fut, value: string) {
    setProfileFut(f => ({ ...f, [key]: value }));
    setProfileDirty(true);
  }
  function track() {
    const record = boot?.mine.find(r => r.code?.toUpperCase() === trackCode.trim().toUpperCase() && r.code?.split("-")[1] === year);
    setTracked(record || null); setTrackDone(true);
  }
  async function markAllRead() {
    setBusy(true);
    try { await client.api("notifications", {}); await refresh(); toast.success("Todas las notificaciones fueron marcadas como leídas."); }
    catch(error) { fail(error); } finally { setBusy(false); }
  }
  async function openNotice(notice: Notice) {
    const record = boot?.mine.find(r => r.id === notice.request);
    if (record) await open(record);
    try { await client.api("notifications", { id: notice.id }); await refresh(); } catch(error) { fail(error); }
  }
  async function saveProfile() {
    if (!requireLogin()) return;
    setBusy(true);
    try { await client.api("profile", { content: profileFut }); setProfileDirty(false); await refresh(); toast.success("Tus datos fueron guardados."); }
    catch(error) { fail(error); } finally { setBusy(false); }
  }
  async function exportReport() {
    try {
      await client.exportCsv(records.filter(r => (filter === "todos" || r.status === filter) && (officeFilter === "Todas" || r.office === officeFilter)));
      toast.success("Reporte CSV descargado.");
    } catch(error) { fail(error); }
  }
  async function changeRole(id: string, role: string) {
    setBusy(true);
    try { await client.api("users", { id, role }); await refresh(); toast.success("Rol actualizado."); }
    catch(error) { fail(error); } finally { setBusy(false); }
  }


  function changeAccount(kind: "institutional" | "external") {
    setAccessKind(kind); setAccessEmail(""); setAccessPassword(""); setFormError("");
  }
  function accessTransition(run: () => void) {
    if (dirty || profileDirty) setConfirm({ title: "¿Cambiar de cuenta?", description: "Hay cambios sin guardar. Cancela para guardarlos antes de cambiar de perfil.", run });
    else run();
  }
  function clearAccountScreen() {
    setCurrent(null); setSelected(null); setTracked(null); setTrackDone(false);
    setFut(blankFut); setDirty(false); setProfileDirty(false); setProfileFut(blankFut);
    setQuery(""); setFilter("todos"); setMode("student"); setStep(0);
  }
  async function signInAccount() {
    if (!accessStatus.available) { setFormError("Primero habilita el entorno de demostración."); return; }
    accessTransition(() => { void (async () => {
      setBusy(true); setFormError("");
      try {
        await client.api("simulation/signin", { kind: accessKind, email: accessEmail, password: accessPassword });
        setAccessPassword("");
        clearAccountScreen(); setBoot(null); setView("acceso");
        const next = await refresh(); if (!next) return;
        setView(next.user.profile.dni ? "inicio" : "perfil");
        toast.success("Cuenta simulada activa. Tus trámites quedan asociados a este perfil.");
      } catch(error) { fail(error); } finally { setBusy(false); }
    })(); });
  }
  async function signInAdministration() {
    setBusy(true); setFormError("");
    try {
      await client.api("simulation/administration", {});
      clearAccountScreen(); setBoot(null);
      const next = await refresh(); if (!next) return;
      setMode("staff"); setView("inicio");
    } catch(error) { fail(error); } finally {setBusy(false);}
  }
  function signOutAccount() {
    accessTransition(() => { void (async () => {
      setBusy(true);
      try { await client.api("simulation/signout", {}); clearAccountScreen(); setBoot(null); setAccessPassword(""); setAccessEmail(""); setView("inicio"); await refresh(); toast.success("Sesión cerrada. Tus solicitudes se conservan."); }
      catch(error) { fail(error); } finally { setBusy(false); }
    })(); });
  }
  return { accessStatus, linkedAccount, signInAdministration, accessKind, accessPassword, accessEmail, setAccessPassword, setAccessEmail, changeAccount, signInAccount, signOutAccount, external, view, setView, mode, setMode, boot, loading, loadError, busy, fut, current, step, setStep, dirty, selected, originView, profileFut, query, setQuery, category, setCategory, filter, setFilter, officeFilter, setOfficeFilter, year, setYear, trackCode, setTrackCode, tracked, trackDone, confirm, setConfirm, action, setAction, message, setMessage, destination, setDestination, formError, inputRef, staff, admin, notices, refresh, update, nav, start, open, doSave, send, uploadFiles, removeFile, attend, cancel, edit, download, records, active, updateProfileField, track, markAllRead, openNotice, saveProfile, exportReport, changeRole };
}
export type PortalController = ReturnType<typeof usePortalController>;
