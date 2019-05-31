console.log("Service Worker Loaded...");

self.addEventListener("push", e => {
  console.log(e);
  const data = e.data.json();
  console.log("Push Recieved...");
  self.registration.showNotification(data.title, {
    body: "Notified by Deal Your Crypto!",
    icon: "/dist/img/rollo.png"
  });
});
