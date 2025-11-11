// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyApLUwHsuj8KjqpxoNn3qSlqoOIITfqIbA",
  authDomain: "final-year-f92ad.firebaseapp.com",
  projectId: "final-year-f92ad",
  storageBucket: "final-year-f92ad.firebasestorage.app",
  messagingSenderId: "371358365112",
  appId: "1:371358365112:web:a9c416d732291b8c024b4d",
};
const employeeConfig = {
  apiKey: "AIzaSyBP8y_lZGWcBhxddVzKgIXyc9UHYWIWDZU",
  authDomain: "employee-7e5c3.firebaseapp.com",
  projectId: "employee-7e5c3",
  storageBucket: "employee-7e5c3.firebasestorage.app",
  messagingSenderId: "794594600613",
  appId: "1:794594600613:web:59a0f8b5caae16b9accf4c",
};

const publicUserConfig = {
  apiKey: "AIzaSyC5rm-o5zZESsEpMZEyoyKJreMWlHbLWy4",
  authDomain: "public-user-31e95.firebaseapp.com",
  projectId: "public-user-31e95",
  storageBucket: "public-user-31e95.firebasestorage.app",
  messagingSenderId: "407702985248",
  appId: "1:407702985248:web:89ab8bb08a0b16f3b43a45",
};
const chatConfig = {
  apiKey: "AIzaSyAL6vKr_-FukRryQ9VxultcoL6jI31INdQ",
  authDomain: "chat-6fa4c.firebaseapp.com",
  projectId: "chat-6fa4c",
  storageBucket: "chat-6fa4c.firebasestorage.app",
  messagingSenderId: "122066597602",
  appId: "1:122066597602:web:e8e697fa1eaf9d1ec950bb",
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const employeeApp = initializeApp(employeeConfig, "secondary");
const publicUserApp = initializeApp(publicUserConfig, "third");
const chatApp = initializeApp(chatConfig, "fourth");
const auth = getAuth(app);
const employeeAuth = getAuth(employeeApp);
const publicUserAuth = getAuth(publicUserApp);
const publicUserStorage = getStorage(employeeApp);
const chatStore = getFirestore(chatApp);
export {
  auth,
  employeeAuth,
  publicUserAuth,
  publicUserStorage,
  chatStore,
  chatApp,
};
