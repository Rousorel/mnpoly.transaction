// js/firebase-config.js
const firebaseConfig = {
  apiKey: "AIzaSyBvC8wNcj6FuJFWsE25rlk3y5t4buPloo0",
  authDomain: "handheld-9aff4.firebaseapp.com",
  databaseURL: "https://handheld-9aff4-default-rtdb.firebaseio.com",
  projectId: "handheld-9aff4",
  storageBucket: "handheld-9aff4.firebasestorage.app",
  messagingSenderId: "431415504511",
  appId: "1:431415504511:web:71e7c9bde2f18b598b194a",
  measurementId: "G-7MXZX6NVN4"
};

// Initialize Firebase (compatibility with Firebase JS v8 loaded in HTML)
// Using the namespaced API intentionally so other scripts (bank.js, player.js, auth.js)
// can reference `db` and `auth` as globals.
firebase.initializeApp(firebaseConfig);

// Expose commonly used services as globals for the other scripts
window.db = firebase.firestore();
window.auth = firebase.auth();

// If you plan to use Realtime Database or Analytics, add the corresponding SDK scripts
// and initialize them here (e.g. firebase.database(), firebase.analytics()).