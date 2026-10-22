import { env } from "cloudflare:workers";
import { cookies } from "next/headers";

export const candidateStatuses = ["nouvelle", "à contacter", "rendez-vous pris", "dossier en cours", "terminée"] as const;
export type CandidateStatus = (typeof candidateStatuses)[number];

export const ADMIN_SESSION_COOKIE = "fransition_admin_session";
export const ADMIN_CSRF_COOKIE = "fransition_admin_csrf";
export const adminSessionDuration = 60 * 60 * 8;
const encoder = new TextEncoder();

function getAdminSecret() {
  return env.ADMIN_SESSION_SECRET?.trim() ?? "";
}

export function isAdminAuthConfigured() {
  return Boolean(env.ADMIN_PASSWORD?.trim() && getAdminSecret().length >= 32);
}

function base64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function fromBase64Url(value: string) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

function createCsrfToken() {
  return base64Url(crypto.getRandomValues(new Uint8Array(24)));
}

async function sessionKey() {
  return crypto.subtle.importKey("raw", encoder.encode(getAdminSecret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

async function sign(payload: string) {
  return base64Url(new Uint8Array(await crypto.subtle.sign("HMAC", await sessionKey(), encoder.encode(payload))));
}

export async function verifyAdminPassword(password: string) {
  if (!isAdminAuthConfigured()) return false;
  const expected = new Uint8Array(await crypto.subtle.sign("HMAC", await sessionKey(), encoder.encode(env.ADMIN_PASSWORD ?? "")));
  return crypto.subtle.verify("HMAC", await sessionKey(), expected, encoder.encode(password));
}

export async function createAdminSession() {
  const expiresAt = Math.floor(Date.now() / 1000) + adminSessionDuration;
  const csrfToken = createCsrfToken();
  const payload = `v2.${expiresAt}.${csrfToken}`;
  return { token: `${payload}.${await sign(payload)}`, csrfToken };
}

async function readAdminSession() {
  if (!isAdminAuthConfigured()) return null;
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;
  const [version, expiryValue, csrfToken, signature, ...rest] = token.split(".");
  const expiresAt = Number(expiryValue);
  if (version !== "v2" || rest.length > 0 || !csrfToken || !signature || !Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) return null;

  try {
    const valid = await crypto.subtle.verify("HMAC", await sessionKey(), fromBase64Url(signature), encoder.encode(`${version}.${expiryValue}.${csrfToken}`));
    return valid ? { csrfToken, expiresAt } : null;
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  return Boolean(await readAdminSession());
}

export async function requireAdminMutation(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) return false;
  const session = await readAdminSession();
  if (!session) return false;
  const cookieStore = await cookies();
  const csrfCookie = cookieStore.get(ADMIN_CSRF_COOKIE)?.value;
  const csrfHeader = request.headers.get("x-fransition-csrf");
  return Boolean(csrfCookie && csrfHeader && csrfCookie === session.csrfToken && csrfHeader === session.csrfToken);
}

export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  return Boolean(origin && origin === new URL(request.url).origin);
}
