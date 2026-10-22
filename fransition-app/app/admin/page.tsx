/* eslint-disable @next/next/no-html-link-for-pages */

import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { isAdminEmail } from "@/lib/admin";
import AdminDashboard from "./admin-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireChatGPTUser("/admin");
  if (!isAdminEmail(user.email)) {
    return <main className="admin-access"><section><p className="section-label">Espace Fransition</p><h1>Accès réservé.</h1><p>Ton compte est connecté, mais il n’est pas encore autorisé à consulter les candidatures. Demande à l’administrateur du site de t’ajouter.</p><a className="primary-button" href="/">Retour à l’accueil</a></section></main>;
  }
  return <AdminDashboard adminName={user.fullName ?? user.email} />;
}
