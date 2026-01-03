// ==============================
// GLOBAL STATE
// ==============================
let currentUser = null;

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

  if (!email || !password) { notify("Enter email and password", "error"); return; }

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
    .catch(err => notify("Login failed: " + err.message, "error"));
}

// ==============================
// UPLOAD VIDEO (WITH PROGRESS)
// ==============================
function uploadVideo() {
  if (!currentUser) { notify("Admin not logged in", "error"); return; }

  const file = document.getElementById("videoFile").files[0];
  const title = document.getElementById("title").value.trim();
  const category = document.getElementById("category").value.trim();
  const description = document.getElementById("description").value.trim() || "Watch the latest release now";
  const featured = document.getElementById("featured").checked;

  if (!file || !title || !category) { notify("Fill all fields", "error"); return; }

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
  xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`);

  xhr.upload.onprogress = e => {
    if (e.lengthComputable) {
      const percent = Math.round((e.loaded / e.total) * 100);
      progressBar.style.width = percent + "%";
      progressText.textContent = `Uploading ${percent}%`;
    }
  };

  xhr.onload = () => {
    if (xhr.status !== 200) { notify("Upload failed", "error"); return; }
    const result = JSON.parse(xhr.responseText);
    if (!result.secure_url) { notify("Invalid Cloudinary response", "error"); return; }

    // Save to Firestore
    db.collection("movies")
      .add({
        title, category, description, url: result.secure_url,
        featured, timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        views: 0, downloads: 0
      })
      .then(() => {
        progressBar.style.width = "100%";
        progressText.textContent = "Upload complete ✅";
        document.getElementById("videoFile").value = "";
        document.getElementById("title").value = "";
        document.getElementById("category").value = "";
        document.getElementById("description").value = "";
        document.getElementById("featured").checked = false;
        notify("Movie uploaded successfully", "success");
      })
      .catch(err => notify("Firestore error: " + err.message, "error"));
  };

  xhr.onerror = () => notify("Network error", "error");
  xhr.send(data);
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
        const movie = doc.data();
        const id = doc.id;

        const item = document.createElement("div");
        item.className = "admin-movie";

        item.innerHTML = `
          <div class="movie-header">
            <span class="movie-title">${movie.title}</span>
            <div class="header-actions">
              <label>
                <input type="checkbox" ${movie.featured ? "checked" : ""}> Featured
              </label>
              <button class="toggle-details">▸</button>
              <button class="delete-btn">Delete</button>
            </div>
          </div>

          <div class="movie-details hidden">
            <input type="text" class="edit-title" value="${movie.title}">
            <input type="text" class="edit-category" value="${movie.category}">
            <textarea class="edit-description">${movie.description || ''}</textarea>
            <button class="save-btn">Save Changes</button>
            <div class="analytics">
              <span>Views: ${movie.views || 0}</span>
              <span>Downloads: ${movie.downloads || 0}</span>
            </div>
          </div>
        `;

        // Toggle details
        const toggleBtn = item.querySelector(".toggle-details");
        const details = item.querySelector(".movie-details");
        toggleBtn.onclick = () => details.classList.toggle("hidden");

        // Featured toggle
        item.querySelector("input[type=checkbox]").onchange = e => toggleFeatured(id, e.target.checked);

        // Save inline edits
        item.querySelector(".save-btn").onclick = () => {
          const updatedTitle = item.querySelector(".edit-title").value.trim();
          const updatedCategory = item.querySelector(".edit-category").value.trim();
          const updatedDescription = item.querySelector(".edit-description").value.trim();

          if (!updatedTitle || !updatedCategory) { notify("Title and category cannot be empty", "error"); return; }

          db.collection("movies").doc(id).update({
            title: updatedTitle,
            category: updatedCategory,
            description: updatedDescription
          }).then(() => notify("Movie updated ✅", "success"))
            .catch(err => notify("Update failed: " + err.message, "error"));
        };

        // Delete movie
        item.querySelector(".delete-btn").onclick = () => {
          if (confirm("Delete this movie?")) {
            db.collection("movies").doc(id).delete();
            notify("Movie deleted", "info");
          }
        };

        list.appendChild(item);
      });
    });
}

// ==============================
// FEATURED TOGGLE (ONLY ONE HERO)
// ==============================
function toggleFeatured(movieId, value) {
  if (!value) {
    db.collection("movies").doc(movieId).update({ featured: false });
    return;
  }

  db.collection("movies").where("featured", "==", true)
    .get()
    .then(snapshot => {
      const batch = db.batch();
      snapshot.forEach(doc => batch.update(doc.ref, { featured: false }));
      batch.update(db.collection("movies").doc(movieId), { featured: true });
      return batch.commit();
    }).then(() => notify("Featured movie updated", "success"));
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
