const publicVapidKey = 'BHmUkXG3_l9NeLEw_ZvaJ443OplBi_5sZsE8c5QbpoKe1noLS6Ecf4RM8gFoALzbtUanEIrlIL0ev5CecMBh2vY';

// Check for service worker
if ("serviceWorker" in navigator) {
  send().catch(err => console.error(err));
}

// Register SW, Register Push, Send Push
async function send() {
  // Register Service Worker
  console.log("Registering service worker...");
  const register = await navigator.serviceWorker.register("/dist/js/worker.js", {
    scope: "/"
  });
  console.log("Service Worker Registered...");

  // Register Push
  console.log("Registering Push...");
  const subscription = await register.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
  });
  console.log(subscription);
  console.log("Push Registered...");
  const user = document.getElementById('userid');
  // Send Push Notification
  console.log("Sending Push...");
  await fetch("https://dyc.herokuapp.com/subscribe", {
    method: "POST",
    body: [JSON.stringify(subscription), user.innerText],
    headers: {
      "content-type": "application/json",
    }
  });
  console.log("Push Sent...");
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
