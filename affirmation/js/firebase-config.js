// Firebase設定
const firebaseConfig = {
  apiKey: "AIzaSyB1Z5kXS----(本体はちゃんと入ってる)",
  authDomain: "affirmation-calendar-2975e.firebaseapp.com",
  projectId: "affirmation-calendar-2975e",
  storageBucket: "affirmation-calendar-2975e.firebasestorage.app",
  messagingSenderId: "157108172093",
  appId: "1:157108172093:web:f959a9a01ff4522e368154",
  measurementId: "G-FY4DEB884Q"
};

// Firebaseを初期化
let db, storage;

function initFirebase() {
  const app = window.initializeApp(firebaseConfig);
  db = window.getFirestore(app);
  storage = window.getStorage(app);
  return { db, storage };
}

// グローバルに公開
window.firebaseConfig = firebaseConfig;
window.initFirebase = initFirebase;