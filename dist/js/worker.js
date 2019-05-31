console.log("Service Worker Loaded...");

self.addEventListener("push", async e => {
  const data = e.data.json();
  console.log(data);
  console.log("Push Recieved...");

  await self.registration.showNotification(data[0].title, {
    body: "Notified by Deal Your Crypto! https://www.google.com",
    icon: "/dist/img/rollo.png",
    tag:  "push-notification-tag",
    data: {
      url: 'https://www.google.com'
    }
  });
});
