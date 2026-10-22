import { getDb } from "@/db";
import { candidates } from "@/db/schema";

type CandidatePayload = { firstName?: unknown; lastName?: unknown; email?: unknown; phone?: unknown; city?: unknown; studyYear?: unknown; school?: unknown; speciality?: unknown; desiredProgram?: unknown; desiredStart?: unknown; motivation?: unknown; processStage?: unknown; helpTopics?: unknown; helpDetails?: unknown; appointmentPreference?: unknown; consent?: unknown; };
const asText = (value: unknown) => typeof value === "string" ? value.trim() : "";

export async function POST(request: Request) {
  try {
    const payload = await request.json() as CandidatePayload;
    const required = ["firstName", "lastName", "email", "phone", "studyYear", "school", "speciality", "desiredProgram", "desiredStart", "motivation", "processStage"] as const;
    if (required.some((field) => !asText(payload[field]))) return Response.json({ error: "Certains champs obligatoires sont manquants." }, { status: 400 });
    if (!asText(payload.email).includes("@")) return Response.json({ error: "Saisis une adresse e-mail valide." }, { status: 400 });
    if (payload.consent !== true) return Response.json({ error: "Ton consentement est nécessaire pour envoyer ce formulaire." }, { status: 400 });
    const helpTopics = Array.isArray(payload.helpTopics) ? payload.helpTopics.filter((item): item is string => typeof item === "string").slice(0, 8) : [];
    const db = getDb();
    const [candidate] = await db.insert(candidates).values({ firstName: asText(payload.firstName), lastName: asText(payload.lastName), email: asText(payload.email).toLowerCase(), phone: asText(payload.phone), city: asText(payload.city), studyYear: asText(payload.studyYear), school: asText(payload.school), speciality: asText(payload.speciality), desiredProgram: asText(payload.desiredProgram), desiredStart: asText(payload.desiredStart), motivation: asText(payload.motivation), processStage: asText(payload.processStage), helpTopics: JSON.stringify(helpTopics), helpDetails: asText(payload.helpDetails), appointmentPreference: asText(payload.appointmentPreference), consent: true }).returning({ id: candidates.id });
    return Response.json({ id: candidate.id }, { status: 201 });
  } catch (error) {
    console.error("Candidate submission failed", error);
    return Response.json({ error: "Impossible d’enregistrer ta demande pour le moment. Réessaie dans quelques instants." }, { status: 500 });
  }
}
