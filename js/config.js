// --- Cloudinary ---
const CLOUD_NAME = "YOUR_CLOUD_NAME";
const UPLOAD_PRESET = "github_pages_upload";

// --- Firebase ---
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "XXXX",
  appId: "YOUR_APP_ID"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// --- Admin UID from Firebase Authentication ---
const ADMIN_UID = "YOUR_ADMIN_UID";