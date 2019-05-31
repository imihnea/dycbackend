console.log("Service Worker Loaded...");

self.addEventListener("push", async e => {
  const data = e.data.json();
  console.log(data);
  console.log("Push Recieved...");

  await self.registration.showNotification(data[0].title, {
    body: "Notified by Deal Your Crypto! https://www.google.com",
    icon: "/dist/img/rollo.png",
    tag:  "push-notification-tag",
    link: 'https://www.google.com',
    deeplink: 'https://www.google.com',
    actions: {
      'yes': 'https://www.google.com'
    },
    data: {
      url: 'https://www.google.com'
    }
  });
});
