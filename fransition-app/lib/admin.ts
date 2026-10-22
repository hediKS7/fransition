import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";

export const candidateStatuses = ["nouvelle", "à contacter", "rendez-vous pris", "dossier en cours", "terminée"] as const;
export type CandidateStatus = (typeof candidateStatuses)[number];

export function isAdminEmail(email: string) {
  const allowed = (env.ADMIN_EMAILS ?? "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
  return allowed.includes(email.trim().toLowerCase());
}

export async function requireAdmin() {
  const user = await getChatGPTUser();
  if (!user || !isAdminEmail(user.email)) return null;
  return user;
}
