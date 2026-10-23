"use client";

import { FormEvent, useState } from "react";
import styles from "./admin-login.module.css";

export default function AdminLogin({ configured }: { configured: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Connexion impossible.");
      window.location.assign("/admin");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Connexion impossible.");
    } finally {
      setLoading(false);
    }
  }

  return <main className="admin-access"><section>
    <p className="section-label">Espace Fransition</p>
    <h1>Connexion admin</h1>
    {configured ? <><p>Cet espace est réservé aux deux membres autorisés de l’équipe Fransition.</p><form className={styles.form} onSubmit={submit}><label>Adresse e-mail<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" placeholder="nom@exemple.com" required /></label><label>Mot de passe<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label>{message && <p className="form-error" role="alert">{message}</p>}<button className="primary-button" type="submit" disabled={loading}>{loading ? "Connexion…" : "Accéder à l’espace admin"}</button></form></> : <p className="form-error">L’accès admin n’est pas encore configuré. Ajoute les secrets <code>ADMIN_PASSWORD</code> et <code>ADMIN_SESSION_SECRET</code> dans Cloudflare, puis redéploie le site.</p>}
  </section></main>;
}
