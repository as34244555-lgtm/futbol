self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow("/match"));
});
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : { title: "Managers League", body: "Rival is ready." };
  event.waitUntil(self.registration.showNotification(data.title || "Managers League", { body: data.body, tag: data.tag || "liga" }));
});
