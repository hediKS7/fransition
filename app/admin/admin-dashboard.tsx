"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./admin-dashboard.module.css";

type Candidate = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  studyYear: string;
  school: string;
  speciality: string;
  desiredProgram: string;
  desiredStart: string;
  motivation: string;
  processStage: string;
  helpTopics: string;
  helpDetails: string;
  appointmentPreference: string;
  status: string;
  adminNotes: string;
  createdAt: string;
};

const statuses = ["nouvelle", "à contacter", "rendez-vous pris", "dossier en cours", "terminée"];

export default function AdminDashboard({ adminName }: { adminName: string }) {
  const [items, setItems] = useState<Candidate[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [filter, setFilter] = useState("toutes");
  const [query, setQuery] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/candidatures")
      .then(async (response) => {
        const data = await response.json() as { candidates?: Candidate[]; error?: string };
        if (!response.ok) throw new Error(data.error);
        setItems(data.candidates ?? []);
      })
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Une erreur est survenue."))
      .finally(() => setLoading(false));
  }, []);

  const selected = useMemo(() => items.find((candidate) => candidate.id === selectedId) ?? null, [items, selectedId]);
  const filtered = useMemo(() => {
    const search = query.trim().toLocaleLowerCase("fr");
    return items.filter((candidate) => {
      const matchesStatus = filter === "toutes" || candidate.status === filter;
      const searchable = [candidate.firstName, candidate.lastName, candidate.email, candidate.city, candidate.school, candidate.desiredProgram, candidate.speciality].join(" ").toLocaleLowerCase("fr");
      return matchesStatus && (!search || searchable.includes(search));
    });
  }, [filter, items, query]);
  const metrics = useMemo(() => ({
    total: items.length,
    new: items.filter((item) => item.status === "nouvelle").length,
    active: items.filter((item) => ["à contacter", "dossier en cours"].includes(item.status)).length,
    meetings: items.filter((item) => item.status === "rendez-vous pris").length,
    complete: items.filter((item) => item.status === "terminée").length,
  }), [items]);

  function selectCandidate(candidate: Candidate) {
    setSelectedId(candidate.id);
    setNotes(candidate.adminNotes);
    setMessage("");
  }

  async function persist(next: Candidate, successMessage: string) {
    if (saving) return;
    const previous = items;
    setSaving(true);
    setMessage("");
    setItems((current) => current.map((item) => item.id === next.id ? next : item));
    try {
      const response = await fetch("/api/admin/candidatures", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...adminMutationHeaders() },
        body: JSON.stringify({ id: next.id, status: next.status, adminNotes: next.adminNotes }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Impossible d’enregistrer.");
      setMessage(successMessage);
    } catch (error) {
      setItems(previous);
      setMessage(error instanceof Error ? error.message : "Impossible d’enregistrer.");
    } finally {
      setSaving(false);
    }
  }

  function changeStatus(status: string) {
    if (!selected || status === selected.status) return;
    void persist({ ...selected, status }, "Statut mis à jour.");
  }

  function saveNotes() {
    if (!selected) return;
    void persist({ ...selected, adminNotes: notes }, "Notes enregistrées.");
  }

  function exportCsv() {
    const headers = ["ID", "Prénom", "Nom", "E-mail", "Téléphone", "Ville", "Établissement", "Spécialité", "Formation visée", "Statut", "Préférence de rendez-vous", "Date"];
    const rows = filtered.map((candidate) => [candidate.id, candidate.firstName, candidate.lastName, candidate.email, candidate.phone, candidate.city, candidate.school, candidate.speciality, candidate.desiredProgram, candidate.status, candidate.appointmentPreference, formatDate(candidate.createdAt)]);
    const quote = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const csv = [headers, ...rows].map((row) => row.map(quote).join(";")).join("\n");
    const href = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = href;
    link.download = `candidatures-fransition-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(href);
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST", headers: adminMutationHeaders() });
    window.location.assign("/admin");
  }

  return <main className={styles.page}>
    <header className={styles.header}>
      <a className="brand brand-compact" href="/"><span><b>fran</b>sition</span></a>
      <div className={styles.headerActions}><span className={styles.user}><i />{adminName}</span><a href="/">Voir le site</a><button type="button" onClick={logout}>Déconnexion</button></div>
    </header>

    <section className={styles.shell}>
      <div className={styles.topline}>
        <div><p className="section-label">Tableau de bord</p><h1>Les projets reçus</h1><p>Pilote chaque parcours, de la première demande au départ.</p></div>
        <button type="button" className={styles.exportButton} onClick={exportCsv} disabled={!filtered.length}>↓ Exporter <span>CSV</span></button>
      </div>

      <section className={styles.metrics} aria-label="Indicateurs des candidatures">
        <Metric label="Candidatures" value={metrics.total} tone="blue" active={filter === "toutes"} onClick={() => setFilter("toutes")} />
        <Metric label="Nouvelles" value={metrics.new} tone="coral" active={filter === "nouvelle"} onClick={() => setFilter("nouvelle")} />
        <Metric label="À suivre" value={metrics.active} tone="yellow" active={filter === "à contacter" || filter === "dossier en cours"} onClick={() => setFilter("à contacter")} />
        <Metric label="Rendez-vous" value={metrics.meetings} tone="purple" active={filter === "rendez-vous pris"} onClick={() => setFilter("rendez-vous pris")} />
      </section>

      <section className={styles.pipeline}>
        <div><span>Parcours en cours</span><b>{metrics.total ? Math.round(((metrics.active + metrics.meetings + metrics.complete) / metrics.total) * 100) : 0}%</b></div>
        <div className={styles.pipelineTrack}><i style={{ width: `${metrics.total ? ((metrics.active + metrics.meetings + metrics.complete) / metrics.total) * 100 : 0}%` }} /></div>
        <small>{metrics.complete} parcours terminé{metrics.complete > 1 ? "s" : ""} · {metrics.new} nouveau{metrics.new > 1 ? "x" : ""} à découvrir</small>
      </section>

      <div className={styles.controls}>
        <label className={styles.search}><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un étudiant, une ville, une formation…" /></label>
        <label className={styles.filter}>Statut<select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="toutes">Tous les statuts</option>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
      </div>

      {message && <p className={`${styles.message} ${message.includes("Impossible") || message.includes("erreur") ? styles.messageError : ""}`} role="status">{message}</p>}
      {loading ? <p className={styles.empty}>Chargement des candidatures…</p> : <div className={styles.content}>
        <section className={styles.list} aria-label="Liste des candidatures">
          <div className={styles.listHeading}><span>{filtered.length} résultat{filtered.length > 1 ? "s" : ""}</span><small>{query ? "Résultats de la recherche" : "Du plus récent au plus ancien"}</small></div>
          {filtered.length === 0 ? <div className={styles.empty}><b>Aucune candidature ici.</b><span>Modifie ta recherche ou ton filtre pour voir les profils.</span></div> : filtered.map((candidate, index) => <button type="button" onClick={() => selectCandidate(candidate)} className={`${styles.row} ${selected?.id === candidate.id ? styles.rowSelected : ""}`} key={candidate.id} style={{ animationDelay: `${Math.min(index * 35, 280)}ms` }}>
            <span className={styles.initials}>{initials(candidate)}</span><span className={styles.rowBody}><b>{candidate.firstName} {candidate.lastName}</b><small>{candidate.desiredProgram || candidate.speciality || "Projet à préciser"}</small><em>{candidate.city || "Tunisie"} · {formatShortDate(candidate.createdAt)}</em></span><span className={`${styles.status} ${statusClass(candidate.status)}`}>{candidate.status}</span>
          </button>)}
        </section>

        <section className={styles.detail} aria-live="polite">
          {selected ? <>
            <div className={styles.detailTop}>
              <div><p className="section-label">Candidature #{selected.id}</p><h2>{selected.firstName} {selected.lastName}</h2><p>Reçue le {formatDate(selected.createdAt)}</p></div>
              <span className={`${styles.status} ${statusClass(selected.status)}`}>{selected.status}</span>
            </div>
            <div className={styles.quickActions}><span>Faire avancer le dossier</span><div>{statuses.slice(1).map((status) => <button type="button" key={status} className={selected.status === status ? styles.actionSelected : ""} onClick={() => changeStatus(status)} disabled={saving}>{status}</button>)}</div></div>
            <div className={styles.contact}><a href={`mailto:${selected.email}`}>✉ <span>{selected.email}</span></a><a href={`tel:${selected.phone.replace(/\s/g, "")}`}>☏ <span>{selected.phone}</span></a></div>
            <div className={styles.detailGrid}><Info label="Parcours" value={`${selected.studyYear} · ${selected.speciality}`} /><Info label="Établissement" value={selected.school} /><Info label="Formation visée" value={`${selected.desiredProgram} · ${selected.desiredStart}`} /><Info label="Étape actuelle" value={selected.processStage} /><Info label="Motivation" value={selected.motivation} full /><Info label="Besoin d’aide" value={[...safeTopics(selected.helpTopics), selected.helpDetails].filter(Boolean).join(" — ") || "Non renseigné"} full /><Info label="Préférence de rendez-vous" value={selected.appointmentPreference || "Non renseignée"} full /></div>
            <label className={styles.notes}>Notes internes<textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Ajoute une note, une date d’appel ou la prochaine action…" /><small>Ces notes ne sont visibles que dans cet espace admin.</small></label>
            <div className={styles.detailFooter}><span>{saving ? "Enregistrement…" : "Les modifications sont sauvegardées dans la candidature."}</span><button className="primary-button" type="button" onClick={saveNotes} disabled={saving}>Enregistrer les notes</button></div>
          </> : <div className={styles.noSelection}><span>✦</span><h2>Sélectionne une candidature</h2><p>Choisis un profil à gauche pour voir son parcours et gérer son suivi.</p></div>}
        </section>
      </div>}
    </section>
  </main>;
}

function Metric({ label, value, tone, active, onClick }: { label: string; value: number; tone: string; active: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`${styles.metric} ${styles[`metric${tone[0].toUpperCase()}${tone.slice(1)}`]} ${active ? styles.metricActive : ""}`}><span>{label}</span><b>{value}</b><i>Voir</i></button>;
}

function Info({ label, value, full = false }: { label: string; value: string; full?: boolean }) {
  return <div className={full ? `${styles.info} ${styles.infoFull}` : styles.info}><span>{label}</span><p>{value || "Non renseigné"}</p></div>;
}

function initials(candidate: Candidate) { return `${candidate.firstName?.[0] ?? "?"}${candidate.lastName?.[0] ?? ""}`.toUpperCase(); }
function safeTopics(value: string) { try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : []; } catch { return []; } }
function formatDate(value: string) { const date = new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("fr-TN", { dateStyle: "long", timeStyle: "short" }).format(date); }
function formatShortDate(value: string) { const date = new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("fr-TN", { day: "numeric", month: "short" }).format(date); }
function statusClass(status: string) { return ({ "nouvelle": styles.statusNew, "à contacter": styles.statusContact, "rendez-vous pris": styles.statusMeeting, "dossier en cours": styles.statusProgress, "terminée": styles.statusDone } as Record<string, string>)[status] ?? styles.statusNew; }
function adminMutationHeaders() { const value = document.cookie.split("; ").find((cookie) => cookie.startsWith("fransition_admin_csrf="))?.split("=")[1]; return value ? { "X-Fransition-CSRF": decodeURIComponent(value) } : {}; }
