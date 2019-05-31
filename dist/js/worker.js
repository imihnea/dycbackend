console.log("Service Worker Loaded...");

self.addEventListener("push", async e => {
  console.log(e);
  console.log('kappa');
  const data = e.data.json();
  console.log("Push Recieved...");
  await self.registration.showNotification(data.title, {
    body: "Notified by Deal Your Crypto!",
    icon: "/dist/img/rollo.png"
  });
  console.log('krappa');
});
