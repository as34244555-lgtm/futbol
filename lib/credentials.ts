const PASS_KEY = "ml-pass";
const LAST_USER_KEY = "ml-last-user";

export function rememberPassword(name: string, password: string) {
  try {
    const saved = JSON.parse(localStorage.getItem(PASS_KEY) || "{}") as Record<string, string>;
    const key = name.trim().toLowerCase();
    saved[key] = password;
    localStorage.setItem(PASS_KEY, JSON.stringify(saved));
    localStorage.setItem(LAST_USER_KEY, key);
  } catch {
    /* ignore */
  }
}

export function savedPassword(name: string): string | null {
  try {
    const saved = JSON.parse(localStorage.getItem(PASS_KEY) || "{}") as Record<string, string>;
    return saved[name.trim().toLowerCase()] ?? null;
  } catch {
    return null;
  }
}

export function lastSavedUser(): string | null {
  try {
    return localStorage.getItem(LAST_USER_KEY);
  } catch {
    return null;
  }
}
