// ==============================
// GLOBAL STATE
// ==============================
let currentUser = null;

// ==============================
// ADMIN LOGIN
// ==============================
function adminLogin() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("Enter email and password");
    return;
  }

  auth.signInWithEmailAndPassword(email, password)
    .then(({ user }) => {
      // 🔒 HARD ADMIN CHECK
      if (user.uid !== ADMIN_UID) {
        alert("Not authorized as admin");
        auth.signOut();
        return;
      }

      currentUser = user;
      document.getElementById("panel").classList.remove("hidden");
      document.getElementById("login").style.display = "none";

      loadAdminMovies();
    })
    .catch(err => alert("Login failed: " + err.message));
}

// ==============================
// UPLOAD VIDEO (WITH PROGRESS)
// ==============================
function uploadVideo() {
  if (!currentUser) {
    alert("Admin not logged in");
    return;
  }

  const file = document.getElementById("videoFile").files[0];
  const title = document.getElementById("title").value.trim();
  const category = document.getElementById("category").value.trim();
  const description =
    document.getElementById("description")?.value.trim() ||
    "Watch the latest release now";
  const featured = document.getElementById("featured").checked;

  if (!file || !title || !category) {
    alert("Please fill all required fields");
    return;
  }

  // Progress UI
  const progressBox = document.getElementById("progress-container");
  const progressBar = document.getElementById("progress-bar");
  const progressText = document.getElementById("progress-text");

  progressBox.classList.remove("hidden");
  progressBar.style.width = "0%";
  progressText.textContent = "Uploading 0%";

  const data = new FormData();
  data.append("file", file);
  data.append("upload_preset", UPLOAD_PRESET);

  const xhr = new XMLHttpRequest();
  xhr.open(
    "POST",
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`
  );

  // 📊 Upload progress
  xhr.upload.onprogress = e => {
    if (e.lengthComputable) {
      const percent = Math.round((e.loaded / e.total) * 100);
      progressBar.style.width = percent + "%";
      progressText.textContent = `Uploading ${percent}%`;
    }
  };

  xhr.onload = () => {
    if (xhr.status !== 200) {
      alert("Upload failed");
      return;
    }

    const result = JSON.parse(xhr.responseText);
    if (!result.secure_url) {
      alert("Invalid Cloudinary response");
      return;
    }

    db.collection("movies")
      .add({
        title,
        category,
        description,
        url: result.secure_url,
        featured,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      })
      .then(() => {
        progressBar.style.width = "100%";
        progressText.textContent = "Upload complete ✅";

        document.getElementById("videoFile").value = "";
        document.getElementById("title").value = "";
        document.getElementById("category").value = "";
        if (document.getElementById("description"))
          document.getElementById("description").value = "";
        document.getElementById("featured").checked = false;
      })
      .catch(err => alert("Firestore error"));
  };

  xhr.onerror = () => alert("Network error");
  xhr.send(data);
}

// ==============================
// ADMIN MOVIE LIST
// ==============================
function loadAdminMovies() {
  const list = document.getElementById("movieList");
  list.innerHTML = "Loading...";

  db.collection("movies")
    .orderBy("timestamp", "desc")
    .onSnapshot(snapshot => {
      list.innerHTML = "";

      snapshot.forEach(doc => {
        const movie = doc.data();
        const id = doc.id;

        const item = document.createElement("div");
        item.className = "admin-movie";

        item.innerHTML = `
          <strong>${movie.title}</strong>
          <small>(${movie.category})</small>

          <label>
            <input type="checkbox" ${movie.featured ? "checked" : ""}>
            Featured
          </label>

          <button class="delete-btn">Delete</button>
        `;

        // FEATURE TOGGLE
        item.querySelector("input").onchange = e =>
          toggleFeatured(id, e.target.checked);

        // DELETE
        item.querySelector(".delete-btn").onclick = () => {
          if (confirm("Delete this movie?")) {
            db.collection("movies").doc(id).delete();
          }
        };

        list.appendChild(item);
      });
    });
}

// ==============================
// FEATURED TOGGLE (SINGLE HERO)
// ==============================
function toggleFeatured(movieId, value) {
  if (!value) {
    db.collection("movies").doc(movieId).update({ featured: false });
    return;
  }

  db.collection("movies")
    .where("featured", "==", true)
    .get()
    .then(snapshot => {
      const batch = db.batch();

      snapshot.forEach(doc => {
        batch.update(doc.ref, { featured: false });
      });

      batch.update(db.collection("movies").doc(movieId), { featured: true });
      return batch.commit();
    });
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
