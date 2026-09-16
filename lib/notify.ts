const TAG = "liga-ready";

export async function enableNotifications(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const res = await Notification.requestPermission();
  return res === "granted";
}

export function notifyReady(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  const key = `${title}:${body}`;
  try {
    if (sessionStorage.getItem(TAG) === key) return;
    sessionStorage.setItem(TAG, key);
  } catch {
    /* ignore */
  }
  if (navigator.serviceWorker?.controller) {
    void navigator.serviceWorker.ready.then((reg) => reg.showNotification(title, { body, tag: TAG }));
    return;
  }
  try {
    new Notification(title, { body, tag: TAG });
  } catch {
    /* ignore */
  }
}
