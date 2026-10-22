import { env } from "cloudflare:workers";
import { cookies } from "next/headers";

export const candidateStatuses = ["nouvelle", "à contacter", "rendez-vous pris", "dossier en cours", "terminée"] as const;
export type CandidateStatus = (typeof candidateStatuses)[number];

export const ADMIN_SESSION_COOKIE = "fransition_admin_session";
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
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function sessionKey() {
  return crypto.subtle.importKey("raw", encoder.encode(getAdminSecret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

async function sign(payload: string) {
  return base64Url(new Uint8Array(await crypto.subtle.sign("HMAC", await sessionKey(), encoder.encode(payload))));
}

export async function verifyAdminPassword(password: string) {
  return isAdminAuthConfigured() && password === env.ADMIN_PASSWORD;
}

export async function createAdminSession() {
  const expiresAt = Math.floor(Date.now() / 1000) + adminSessionDuration;
  const payload = `v1.${expiresAt}`;
  return `${payload}.${await sign(payload)}`;
}

async function isValidAdminSession(session: string) {
  const [version, expiryValue, signature, ...rest] = session.split(".");
  const expiresAt = Number(expiryValue);
  if (version !== "v1" || rest.length > 0 || !signature || !Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) return false;

  try {
    return crypto.subtle.verify("HMAC", await sessionKey(), fromBase64Url(signature), encoder.encode(`${version}.${expiryValue}`));
  } catch {
    return false;
  }
}

export async function requireAdmin() {
  if (!isAdminAuthConfigured()) return false;
  const session = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  return Boolean(session && await isValidAdminSession(session));
}
