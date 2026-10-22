import { NextResponse } from "next/server";
import { ADMIN_CSRF_COOKIE, ADMIN_SESSION_COOKIE, adminSessionDuration, createAdminSession, isAdminAuthConfigured, isSameOriginRequest, verifyAdminPassword } from "@/lib/admin";

export async function POST(request: Request) {
  if (!isAdminAuthConfigured()) return NextResponse.json({ error: "L’accès admin n’est pas configuré." }, { status: 503 });
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Origine de requête invalide." }, { status: 403 });

  try {
    const payload = await request.json() as { password?: unknown };
    const password = typeof payload.password === "string" ? payload.password : "";
    if (!await verifyAdminPassword(password)) return NextResponse.json({ error: "Mot de passe incorrect." }, { status: 401 });

    const session = await createAdminSession();
    const response = NextResponse.json({ ok: true });
    response.headers.set("Cache-Control", "no-store");
    response.cookies.set({ name: ADMIN_SESSION_COOKIE, value: session.token, httpOnly: true, sameSite: "strict", secure: true, path: "/", maxAge: adminSessionDuration });
    response.cookies.set({ name: ADMIN_CSRF_COOKIE, value: session.csrfToken, httpOnly: false, sameSite: "strict", secure: true, path: "/", maxAge: adminSessionDuration });
    return response;
  } catch {
    return NextResponse.json({ error: "Requête de connexion invalide." }, { status: 400 });
  }
}
