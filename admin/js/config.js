// --- Cloudinary ---
const CLOUD_NAME = "dagxhzebg";
const UPLOAD_PRESET = "cornflakes_upload";

// --- Firebase ---
const firebaseConfig = {
  apiKey: "AIzaSyAz9xpQdNdfEBUjPAtcAONaqHJcvjKnIgE",
  authDomain: "cornflakes-2907e.firebaseapp.com",
  projectId: "cornflakes-2907e",
  storageBucket: "cornflakes-2907e.appspot.com",
  messagingSenderId: "526969299818",
  appId: "1:526969299818:web:d30558b2cb16cb9d2afb13"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Services
const db = firebase.firestore();
const auth = firebase.auth();

// Admin UID
const ADMIN_UID = "L5DXIJbw78UUb6eXBEJ8MPvFmIf1";
