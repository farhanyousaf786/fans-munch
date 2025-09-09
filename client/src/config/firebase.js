// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
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

// Initialize Firebase services
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Initialize Firebase Cloud Messaging and get a reference to the service
let messaging = null;
try {
  messaging = getMessaging(app);
} catch (error) {
  console.warn('Firebase Messaging not supported in this environment::', error);
}

// Request permission for notifications and get FCM token
export const requestNotificationPermission = async () => {
  try {
    if (!messaging) {
      throw new Error('Firebase Messaging not supported');
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      
      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: 'YOUR_VAPID_KEY' // You'll need to generate this in Firebase Console
      });
      
      if (token) {
        console.log('FCM Token:', token);
        return token;
      } else {
        console.log('No registration token available.');
        return null;
      }
    } else {
      console.log('Unable to get permission to notify.');
      return null;
    }
  } catch (error) {
    console.error('An error occurred while retrieving token:', error);
    return null;
  }
};

// Listen for foreground messages
export const onMessageListener = () => {
  return new Promise((resolve) => {
    if (!messaging) {
      console.warn('Firebase Messaging not available');
      return;
    }

    onMessage(messaging, (payload) => {
      console.log('Message received in foreground:', payload);
      resolve(payload);
    });
  });
};

export { app, analytics, auth, db, messaging };
