// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, OAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB27nVr6lKWiTgj0lW0wQx5m1-lslhMipw",
  authDomain: "fans-food-stf.firebaseapp.com",
  projectId: "fans-food-stf",
  storageBucket: "fans-food-stf.firebasestorage.app",
  messagingSenderId: "267118373830",
  appId: "1:267118373830:web:dbec72cb78e58940fc60c7",
  measurementId: "G-0J0Q8GCTX4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services with error handling
let analytics = null;
// Initialize Analytics only when supported and online to avoid
// "Installations: Application offline" noisy errors (e.g., Brave, offline)
(async () => {
  try {
    const isBrowser = typeof window !== 'undefined';
    const isOnline = isBrowser ? navigator.onLine : false;
    const supported = isBrowser ? await isAnalyticsSupported().catch(() => false) : false;
    const httpsOrLocalhost = isBrowser && (window.location.protocol === 'https:' || window.location.hostname === 'localhost');
    if (isBrowser && isOnline && supported && httpsOrLocalhost && firebaseConfig.measurementId) {
      analytics = getAnalytics(app);
    } else {
      console.warn('Analytics not initialized (supported:', supported, 'online:', isOnline, 'https/local:', httpsOrLocalhost, ')');
    }
  } catch (error) {
    console.warn('Firebase Analytics not supported in this environment:', error);
  }
})();

const auth = getAuth(app);
const db = getFirestore(app);

// Initialize social auth providers
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

// Initialize Firebase Cloud Messaging lazily to avoid startup errors
let messaging = null;
let messagingInitialized = false;

const initializeMessaging = () => {
  if (messagingInitialized) return messaging;
  
  try {
    // Check if all required APIs are supported
    const hasServiceWorker = typeof window !== 'undefined' && 'serviceWorker' in navigator;
    const hasPushManager = typeof window !== 'undefined' && 'PushManager' in window;
    const hasNotification = typeof window !== 'undefined' && 'Notification' in window;
    const isSecureContext = typeof window !== 'undefined' && window.isSecureContext;
    
    if (hasServiceWorker && hasPushManager && hasNotification && isSecureContext) {
      messaging = getMessaging(app);
      console.log('Firebase Messaging initialized successfully');
    } else {
      console.warn('Firebase Messaging not supported in this environment');
      messaging = null;
    }
  } catch (error) {
    console.warn('Firebase Messaging initialization failed:', error.message || error);
    messaging = null;
  }
  
  messagingInitialized = true;
  return messaging;
};

// Don't initialize messaging on module load - only when explicitly called
// This prevents the "unsupported-browser" error from crashing the app

// Request permission for notifications and get FCM token
export const requestNotificationPermission = async () => {
  try {
    const msg = initializeMessaging();
    if (!msg) {
      throw new Error('Firebase Messaging not supported');
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      return 'granted';
    } else {
      console.log('Notification permission denied.');
      return null;
    }
  } catch (error) {
    console.error('An error occurred while requesting permission:', error);
    return null;
  }
};

// Listen for foreground messages
export const onMessageListener = () => {
  return new Promise((resolve, reject) => {
    const msg = initializeMessaging();
    if (!msg) {
      console.warn('Firebase Messaging not available');
      reject(new Error('Messaging not supported'));
      return;
    }

    try {
      onMessage(msg, (payload) => {
        console.log('Message received in foreground:', payload);
        resolve(payload);
      });
    } catch (error) {
      console.warn('Error setting up message listener:', error);
      reject(error);
    }
  });
};

// Export messaging getter function for backwards compatibility
export const getMessagingInstance = () => initializeMessaging();

export { app, analytics, auth, db, initializeMessaging, googleProvider, appleProvider };
