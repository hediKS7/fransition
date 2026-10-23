import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { candidates } from "@/db/schema";
import { candidateStatuses, requireAdmin, requireAdminMutation } from "@/lib/admin";

export async function GET() {
  if (!await requireAdmin()) return Response.json({ error: "Accès non autorisé." }, { status: 403 });
  try { return Response.json({ candidates: await getDb().select().from(candidates).orderBy(desc(candidates.createdAt), desc(candidates.id)) }); }
  catch (error) { console.error("Candidate list failed", error); return Response.json({ error: "Impossible de charger les candidatures." }, { status: 500 }); }
}

export async function PATCH(request: Request) {
  if (!await requireAdminMutation(request)) return Response.json({ error: "Accès non autorisé." }, { status: 403 });
  try {
    const payload = await request.json() as { id?: unknown; status?: unknown; adminNotes?: unknown };
    const id = typeof payload.id === "number" ? payload.id : Number(payload.id);
    const status = typeof payload.status === "string" ? payload.status : "";
    const adminNotes = typeof payload.adminNotes === "string" ? payload.adminNotes.trim().slice(0, 4000) : "";
    if (!Number.isInteger(id) || !candidateStatuses.includes(status as typeof candidateStatuses[number])) return Response.json({ error: "Mise à jour invalide." }, { status: 400 });
    await getDb().update(candidates).set({ status, adminNotes, updatedAt: sql`CURRENT_TIMESTAMP` }).where(eq(candidates.id, id));
    return Response.json({ ok: true });
  } catch (error) { console.error("Candidate update failed", error); return Response.json({ error: "Impossible d’enregistrer la mise à jour." }, { status: 500 }); }
}

export async function DELETE(request: Request) {
  if (!await requireAdminMutation(request)) return Response.json({ error: "Accès non autorisé." }, { status: 403 });
  try {
    const payload = await request.json() as { id?: unknown; confirmation?: unknown };
    const id = typeof payload.id === "number" ? payload.id : Number(payload.id);
    const confirmation = typeof payload.confirmation === "string" ? payload.confirmation : "";
    if (!Number.isInteger(id) || confirmation !== "SUPPRIMER") {
      return Response.json({ error: "Confirmation de suppression invalide." }, { status: 400 });
    }

    const deleted = await getDb().delete(candidates).where(eq(candidates.id, id)).returning({ id: candidates.id });
    if (!deleted.length) return Response.json({ error: "Cette candidature n’existe plus." }, { status: 404 });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Candidate deletion failed", error);
    return Response.json({ error: "Impossible de supprimer cette candidature." }, { status: 500 });
  }
}
