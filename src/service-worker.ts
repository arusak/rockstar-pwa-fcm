/// <reference lib="webworker" />

import {initializeApp} from 'firebase/app'
import {getMessaging, onBackgroundMessage} from 'firebase/messaging/sw'
import {clientsClaim} from 'workbox-core'
import {createHandlerBoundToURL, precacheAndRoute} from 'workbox-precaching'
import {NavigationRoute, registerRoute} from 'workbox-routing'
import {firebaseConfig} from './fcmConfig'

// Declare the global scope for the service worker
declare const self: ServiceWorkerGlobalScope

console.info(`Service worker build ${import.meta.env.VITE_BUILD || 'unknown'}`)

/** FIREBASE SETUP **/
const firebaseApp = initializeApp(firebaseConfig)
const messaging = getMessaging(firebaseApp)

onBackgroundMessage(messaging, async (payload) => {
  console.log('[SW] Received background message ', payload);

  const promises: Promise<unknown>[] = [];

  // Display a badge with count 1
  const badgePromise = showBadge(4);
  promises.push(badgePromise);

  // Show a notification with the data received in the FCM message
  const title = payload.notification?.title || 'New Message';
  const body = payload.notification?.body || 'You have a new message';
  const notificationPromise = self.registration.showNotification(title, { body });
  promises.push(notificationPromise);

  try {
    return await Promise.all(promises)
  } catch (e) {
    return await sendLog(`FCM background message processing failed. ${e}`)
  }
});

/** METHODS **/
/**
 * Sends a message to all clients (open browser windows) connected to this service worker.
 * @param {string} type - The type of the message to send.
 * @param {string} [message] - The content of the message.
 */
const send = async (type: string, message?: string) => {
  const clients = await self.clients.matchAll({includeUncontrolled: true, type: 'window'})

  clients.forEach(client => {
    client.postMessage({
      type,
      message,
    })
  })
}

/**
 * Logs a message to the console and sends it to all clients.
 * @param {string} message - The message to log and send.
 */
const sendLog = (message: string) => {
  console.info(message)
  return send('LOG', message)
}

/**
 * Displays a badge with the specified count on the app icon if supported.
 * @param {number} count - The number to display on the badge.
 * @returns {Promise<void>} - A promise that resolves when the badge is set or logs an error if the Badge API is unavailable.
 */
const showBadge = (count: number): Promise<void> => {
  if ('setAppBadge' in self.navigator) {
    return self.navigator.setAppBadge(count).then(() => sendLog('Badge displayed'))
  }
  sendLog('Badge API is not available')
  return Promise.resolve()
}

/**
 * Shows a local notification using the service worker's showNotification method.
 * Logs a message if permission is not granted or if an error occurs.
 */
const showNotification = async (title: string, body: string) => {
  if (Notification.permission !== 'granted') {
    sendLog('No permission to show notifications')
    return
  }

  try {
    await self.registration.showNotification(title, {
      body,
      icon: './icon-192.png',
    })
    sendLog('Notification is shown successfully')
  } catch (e) {
    sendLog(`Error showing notification: ${e}`)
  }
}

/** INSTALLATION **/

// Force the waiting service worker to become the active service worker immediately
self.skipWaiting()

// Claim any clients immediately after activation, so that the service worker takes control of all open clients
clientsClaim()

/** PRE-CACHE (APP SHELL TO WORK OFFLINE) **/

// Precache the files listed in the manifest generated during the build process
// self.__WB_MANIFEST is injected by Workbox at build time
precacheAndRoute(self.__WB_MANIFEST)

registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html')))

/** STARTUP **/

// Event listener for when the service worker is activated
self.addEventListener('activate', async () => {
  sendLog('Service worker is running')
})

/** EVENT HANDLERS **/
// Event listener for messages from clients
self.addEventListener('message', (event) => {
  sendLog('Got message ' + JSON.stringify(event.data))

  if (event.data?.type === 'SHOW_LOCAL_NOTIFICATION') {
    const promises: Promise<unknown>[] = []

    // Show a local notification
    promises.push(showNotification('Local Notification', 'This was sent from service worker, without using Push API'))

    // Set the app badge if supported
    if ('setAppBadge' in self.navigator) {
      promises.push(self.navigator.setAppBadge(1))
    }

    // Wait until all promises are resolved before allowing the service worker to terminate
    event.waitUntil(Promise.all(promises))
  }

  if (event.data?.type === 'SHOW_NOTIFICATION') {
    event.waitUntil(showNotification(event.data.title ?? '', event.data.body ?? ''))
  }

  if (event.data?.type === 'APP_OPEN') {
    // Clear the app badge when the app is opened, if supported
    if ('clearAppBadge' in self.navigator) {
      event.waitUntil(self.navigator.clearAppBadge())
    }
  }
})
