import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, adminSessionDuration, createAdminSession, isAdminAuthConfigured, verifyAdminPassword } from "@/lib/admin";

export async function POST(request: Request) {
  if (!isAdminAuthConfigured()) return NextResponse.json({ error: "L’accès admin n’est pas configuré." }, { status: 503 });

  try {
    const payload = await request.json() as { password?: unknown };
    const password = typeof payload.password === "string" ? payload.password : "";
    if (!await verifyAdminPassword(password)) return NextResponse.json({ error: "Mot de passe incorrect." }, { status: 401 });

    const response = NextResponse.json({ ok: true });
    response.cookies.set({ name: ADMIN_SESSION_COOKIE, value: await createAdminSession(), httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: adminSessionDuration });
    return response;
  } catch {
    return NextResponse.json({ error: "Requête de connexion invalide." }, { status: 400 });
  }
}
