import { cookies } from "next/headers";
import { readSession, signSession, type SessionPayload } from "./auth";

export const COOKIE = "ln_session";

export async function getSession() {
  const jar = await cookies();
  return readSession(jar.get(COOKIE)?.value);
}

export async function setSessionCookie(payload: SessionPayload) {
  const jar = await cookies();
  jar.set(COOKIE, signSession(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 14 * 24 * 60 * 60,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE);
}
