import {initializeApp} from "firebase/app"
import {getMessaging, getToken, onMessage} from "firebase/messaging"
import {firebaseConfig, firebaseVapidKey} from './fcmConfig'

/**
 * Initializes Firebase Cloud Messaging (FCM) and requests a registration token.
 * This function also listens for incoming messages when the web app is in the foreground.
 *
 * @param {function} onPush - Callback function to handle incoming push messages when the app is in the foreground.
 * @returns {Promise<string | null>} - A promise that resolves to the FCM registration token, or null if permission is denied or an error occurs.
 */
export const initFcm = async (onPush: (payload: Record<string,string>) => void): Promise<string | null> => {
  // Initialize Firebase app with the provided configuration
  const firebaseApp = initializeApp(firebaseConfig);

  // Get the messaging instance from the initialized Firebase app
  const messaging = getMessaging(firebaseApp);

  // Set up an onMessage handler to listen for messages when the app is in the foreground
  onMessage(messaging, (payload) => {
    console.info('Message received. ', payload);
    onPush(payload.data ?? {}); // Invoke the provided callback with the received data
  });

  // Wait for the service worker to be ready
  const serviceWorkerRegistration = await navigator.serviceWorker.ready;

  let token: string | null = null;
  try {
    // Request notification permission from the user
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      // If permission is granted, register the FCM subscription and retrieve the token
      console.info('Notification permission granted, registering FCM subscription');
      console.log('vapid',firebaseVapidKey)
      token = await getToken(messaging, {
        serviceWorkerRegistration, // Associate the token with the service worker
        vapidKey: firebaseVapidKey, // Provide the VAPID key for web push protocol
      });
    } else {
      // If permission is denied, log a warning
      console.warn('No notification permission');
    }
  } catch (err) {
    console.error('An error occurred while retrieving token. ', err);
  }

  if (token) {
    // If a token was successfully retrieved, log it and return it
    console.info(`Token: ${token}`);
    return token;
  } else {
    // If no token is available, log a warning and return null
    console.warn('No registration token available.');
  }

  return null;
}
