import { NextResponse } from "next/server";
import { ADMIN_CSRF_COOKIE, ADMIN_SESSION_COOKIE, requireAdminMutation } from "@/lib/admin";

export async function POST(request: Request) {
  if (!await requireAdminMutation(request)) return NextResponse.json({ error: "Accès non autorisé." }, { status: 403 });
  const response = NextResponse.json({ ok: true });
  response.headers.set("Cache-Control", "no-store");
  response.cookies.set({ name: ADMIN_SESSION_COOKIE, value: "", httpOnly: true, sameSite: "strict", secure: true, path: "/", maxAge: 0 });
  response.cookies.set({ name: ADMIN_CSRF_COOKIE, value: "", httpOnly: false, sameSite: "strict", secure: true, path: "/", maxAge: 0 });
  return response;
}
