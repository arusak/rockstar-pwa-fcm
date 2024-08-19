/// <reference lib="webworker" />

// Import Workbox modules for pre-caching and handling service worker lifecycle
import {precacheAndRoute} from 'workbox-precaching'
import {clientsClaim} from 'workbox-core'

// Declare the global scope for the service worker
declare const self: ServiceWorkerGlobalScope

console.info(`Service worker build ${import.meta.env.VITE_BUILD || 'unknown'}`)

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
            message
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
 * Registers the service worker for push notifications.
 * @returns {Promise<PushSubscription | null>} - A promise that resolves with the push subscription object or null if registration fails.
 */
const registerPushSubscription = async (): Promise<PushSubscription | null> => {
    if ('pushManager' in self.registration && typeof self.registration.pushManager.subscribe === 'function') {
        await sendLog('Registering a push subscription')
        try {
            const subscription = await self.registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: import.meta.env.VITE_VAPID_KEY
            })
            await sendLog(`Subscribed successfully`)
            await send('SUB')
            return subscription
        } catch (e) {
            await sendLog(`Unable to subscribe. ${e}`)
        }
    }
    return null
}

/**
 * Shows a local notification using the service worker's showNotification method.
 * Logs a message if permission is not granted or if an error occurs.
 */
const showNotification = async () => {
    if (Notification.permission !== 'granted') {
        sendLog('No permission to show notifications')
        return
    }

    try {
        await self.registration.showNotification('Local Notification', {
            body: 'This was sent from service worker, without using Push API',
            icon: './icon-192.png'
        })
        sendLog('Local notification is sent successfully')
    } catch (e) {
        sendLog(`Error sending local notification: ${e}`)
    }
}

/**
 * Sends a push notification request to the server with the subscription details.
 * @param {PushSubscription} subscription - The push subscription object.
 */
const requestPush = async (subscription: PushSubscription) => {
    const result = await fetch(import.meta.env.VITE_PUSH_URL, {
        method: 'post',
        body: JSON.stringify(subscription, null, 2),
        headers: {
            'Content-Type': 'application/json'
        }
    })
    const message = await result.text()
    await sendLog(`Push request result: ${message}`)
}

/** INSTALLATION **/

// Force the waiting service worker to become the active service worker immediately
self.skipWaiting()

// Claim any clients immediately after activation, so that the service worker takes control of all open clients
clientsClaim()

// Precache the files listed in the manifest generated during the build process
// self.__WB_MANIFEST is injected by Workbox at build time
precacheAndRoute(self.__WB_MANIFEST)

/** VARIABLES **/

// Variable to hold the push subscription object
let subscription: PushSubscription | null = null

/** STARTUP **/

// Event listener for when the service worker is activated
self.addEventListener('activate', async () => {
    sendLog('Service worker is running')
    subscription = await registerPushSubscription()
})

/** EVENT HANDLERS **/

// Event listener for messages from clients
self.addEventListener('message', (event) => {
    if (event.data?.type === 'SEND_NOTIFICATION') {
        const promises: Promise<unknown>[] = []

        // Show a local notification
        promises.push(showNotification())

        // Set the app badge if supported
        if ('setAppBadge' in self.navigator) {
            promises.push(self.navigator.setAppBadge(1))
        }

        // Wait until all promises are resolved before allowing the service worker to terminate
        event.waitUntil(Promise.all(promises))
    }

    if (event.data?.type === 'REQUEST_PUSH') {
        // Send a push request if the service worker is subscribed
        if (subscription) {
            event.waitUntil(requestPush(subscription))
        } else {
            event.waitUntil(sendLog('Unable to request a push: no subscription'))
        }
    }

    if (event.data?.type === 'APP_OPEN') {
        // Clear the app badge when the app is opened, if supported
        if ('clearAppBadge' in self.navigator) {
            event.waitUntil(self.navigator.clearAppBadge())
        }
    }
})

// Event listener for push events
self.addEventListener('push', (event) => {
    sendLog('Received a push message')

    const promises: Promise<unknown>[] = []

    // Display a badge with count 1
    const badgePromise = showBadge(1)
    promises.push(badgePromise)

    // Show a notification with the data received in the push message
    const {title = 'Empty message', body = 'Empty message'} = event.data?.json() || {}
    const notificationPromise = self.registration.showNotification(title, {body})
    promises.push(notificationPromise)

    // Wait until all promises are resolved before allowing the service worker to terminate
    const all = Promise.all(promises).catch(e => sendLog(`Push processing failed. ${e}`))

    event.waitUntil(all)
})
