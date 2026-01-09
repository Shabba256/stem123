// ==============================
// GLOBAL STATE
// ==============================
let currentUser = null;

// ==============================
// CATEGORY VALIDATION (LOCKED)
// ==============================
const ALLOWED_CATEGORIES = ["Movies", "Series"];

function isValidCategory(cat) {
  return ALLOWED_CATEGORIES.includes(cat);
}

// ==============================
// NOTIFICATIONS
// ==============================
function notify(message, type = "info") {
  const n = document.createElement("div");
  n.className = `notification ${type}`;
  n.textContent = message;
  document.body.appendChild(n);
  setTimeout(() => n.remove(), 3000);
}

// ==============================
// ADMIN LOGIN
// ==============================
function adminLogin() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    notify("Enter email and password", "error");
    return;
  }

  auth.signInWithEmailAndPassword(email, password)
    .then(({ user }) => {
      if (user.uid !== ADMIN_UID) {
        notify("Not authorized as admin", "error");
        auth.signOut();
        return;
      }
      currentUser = user;
      document.getElementById("panel").classList.remove("hidden");
      document.getElementById("login").style.display = "none";
      loadAdminMovies();
      notify("Admin logged in ✅", "success");
    })
    .catch(err => notify(err.message, "error"));
}

// ==============================
// UPLOAD MOVIE (POSTER REQUIRED)
// ==============================
function uploadVideo() {
  if (!currentUser) {
    notify("Admin not logged in", "error");
    return;
  }

  const source = document.getElementById("source").value;
  const title = document.getElementById("title").value.trim();
  const category = document.getElementById("category").value.trim();
  const description = document.getElementById("description").value.trim() || "Watch now";
  const featured = document.getElementById("featured").checked;

  const videoFile = document.getElementById("videoFile").files[0];
  const thumbnailFile = document.getElementById("thumbnailFile").files[0];

  const teraboxUrl = document.getElementById("teraboxUrl").value.trim();
  const teraboxDirectLink = document.getElementById("teraboxDirectLink").value.trim();

  // ---------------- VALIDATION ----------------
  if (!title || !category) {
    notify("Title and category required", "error");
    return;
  }

  if (!isValidCategory(category)) {
    notify("Category must be Movies or Series", "error");
    return;
  }

  // 🔴 POSTER IS MANDATORY
  if (!thumbnailFile) {
    notify("Poster image is REQUIRED", "error");
    return;
  }

  if ((source === "cloudinary" || source === "both") && !videoFile) {
    notify("Video file required", "error");
    return;
  }

  if ((source === "terabox" || source === "both") && (!teraboxUrl || !teraboxDirectLink)) {
    notify("Terabox links required", "error");
    return;
  }

  // ---------------- PROGRESS ----------------
  const box = document.getElementById("progress-container");
  const bar = document.getElementById("progress-bar");
  const text = document.getElementById("progress-text");

  box.classList.remove("hidden");
  bar.style.width = "0%";
  text.textContent = "Uploading poster...";

  // ==============================
  // 1️⃣ UPLOAD POSTER FIRST (IMAGE PRESET)
  // ==============================
  const posterData = new FormData();
  posterData.append("file", thumbnailFile);
  posterData.append("upload_preset", "cornflakes_images");

  const posterXhr = new XMLHttpRequest();
  posterXhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);

  posterXhr.onload = () => {
    if (posterXhr.status !== 200) {
      notify("Poster upload failed", "error");
      box.classList.add("hidden");
      return;
    }

    const posterRes = JSON.parse(posterXhr.responseText);
    if (!posterRes.secure_url) {
      notify("Invalid poster response", "error");
      return;
    }

    const posterUrl = posterRes.secure_url;

    // ==============================
    // 2️⃣ TERABOX ONLY → SAVE NOW
    // ==============================
    if (source === "terabox") {
      saveMovie(
        title,
        category,
        description,
        featured,
        null,
        posterUrl,
        teraboxUrl,
        teraboxDirectLink,
        source
      );
      return;
    }

    // ==============================
    // 3️⃣ UPLOAD VIDEO (VIDEO PRESET)
    // ==============================
    text.textContent = "Uploading video...";

    const videoData = new FormData();
    videoData.append("file", videoFile);
    videoData.append("upload_preset", "cornflakes_upload");

    const videoXhr = new XMLHttpRequest();
    videoXhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`);

    videoXhr.upload.onprogress = e => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        bar.style.width = percent + "%";
        text.textContent = `Uploading video ${percent}%`;
      }
    };

    videoXhr.onload = () => {
      if (videoXhr.status !== 200) {
        notify("Video upload failed", "error");
        return;
      }

      const videoRes = JSON.parse(videoXhr.responseText);
      if (!videoRes.secure_url) {
        notify("Invalid video response", "error");
        return;
      }

      saveMovie(
        title,
        category,
        description,
        featured,
        videoRes.secure_url,
        posterUrl,
        teraboxUrl,
        teraboxDirectLink,
        source
      );
    };

    videoXhr.onerror = () => notify("Video upload error", "error");
    videoXhr.send(videoData);
  };

  posterXhr.onerror = () => notify("Poster upload error", "error");
  posterXhr.send(posterData);
}

// ==============================
// SAVE TO FIRESTORE
// ==============================
function saveMovie(
  title,
  category,
  description,
  featured,
  cloudinaryUrl,
  thumbnail,
  teraboxUrl,
  teraboxDirectLink,
  source
) {
  db.collection("movies").add({
    title,
    category,
    description,
    source,
    cloudinaryUrl: cloudinaryUrl || null,
    thumbnail,
    teraboxUrl: teraboxUrl || null,
    teraboxDirectLink: teraboxDirectLink || null,
    featured,
    views: 0,
    downloads: 0,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    document.getElementById("progress-container").classList.add("hidden");
    document.querySelectorAll("#panel input, #panel textarea").forEach(i => i.value = "");
    document.getElementById("featured").checked = false;
    notify("Upload successful ✅", "success");
  }).catch(err => notify(err.message, "error"));
}

// ==============================
// LOAD ADMIN MOVIES
// ==============================
function loadAdminMovies() {
  const list = document.getElementById("movieList");
  list.innerHTML = "Loading...";

  db.collection("movies").orderBy("timestamp", "desc")
    .onSnapshot(snapshot => {
      list.innerHTML = "";
      snapshot.forEach(doc => {
        const m = doc.data();
        const div = document.createElement("div");
        div.className = "admin-movie";
        div.innerHTML = `
          <strong>${m.title}</strong>
          <span style="opacity:.6">(${m.category})</span>
          <button onclick="deleteMovie('${doc.id}')">Delete</button>
        `;
        list.appendChild(div);
      });
    });
}

function deleteMovie(id) {
  if (!confirm("Delete movie?")) return;
  db.collection("movies").doc(id).delete();
  notify("Movie deleted", "info");
}

// ==============================
// AUTH STATE
// ==============================
auth.onAuthStateChanged(user => {
  if (user && user.uid === ADMIN_UID) {
    currentUser = user;
    loadAdminMovies();
  }
});
