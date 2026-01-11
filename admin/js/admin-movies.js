// ==============================
// ADMIN SESSION GUARD (FIRESTORE)
// ==============================
let currentUser = null;

document.addEventListener("DOMContentLoaded", () => {
  const panel = document.getElementById("panel");
  if (panel) panel.style.display = "none";

  auth.onAuthStateChanged(async user => {
    if (!user) {
      window.location.href = "admin-login.html";
      return;
    }

    const adminDoc = await db.collection("admins").doc(user.uid).get();

    if (!adminDoc.exists || adminDoc.data().enabled !== true) {
      await auth.signOut();
      window.location.href = "admin-login.html";
      return;
    }

    // ✅ ADMIN SESSION CONFIRMED
    currentUser = user;
    if (panel) panel.style.display = "block";

    loadAdminDashboard();
  });
});


// ==============================
// GLOBAL STATE
// ==============================
let allMovies = [];

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
// AUTH GUARD
// ==============================
auth.onAuthStateChanged(user => {
  currentUser = user;
  loadMovies();
});

// ==============================
// LOAD MOVIES
// ==============================
function loadMovies() {
  const list = document.getElementById("itemsList");
  if (!list) return;
  list.textContent = "Loading movies...";

  db.collection("movies")
    .where("category", "==", "Movies")
    .orderBy("timestamp", "desc")
    .onSnapshot(snapshot => {
      allMovies = [];
      snapshot.forEach(doc => allMovies.push({ id: doc.id, ...doc.data() }));
      renderMovies(allMovies);
    }, err => notify(err.message, "error"));
}

// ==============================
// RENDER MOVIES
// ==============================
function renderMovies(movies) {
  const list = document.getElementById("itemsList");
  if (!list) return;
  list.innerHTML = "";

  if (movies.length === 0) {
    list.textContent = "No movies found.";
    return;
  }

  movies.forEach(m => {
    const div = document.createElement("div");
    div.className = "admin-movie";

    div.innerHTML = `
      <img src="${m.thumbnail}" alt="${m.title}" style="width:100%;max-width:180px;border-radius:6px;">
      <h3>${m.title}</h3>
      ${m.featured ? `<span style="color:#e50914;font-weight:bold">FEATURED</span>` : ""}
      <div class="analytics">
        <span>👁 ${m.views || 0}</span>
        <span>⬇ ${m.downloads || 0}</span>
      </div>
      <button onclick="deleteMovie('${m.id}')">Delete</button>
    `;
    list.appendChild(div);
  });
}

// ==============================
// SEARCH MOVIES
// ==============================
const searchInput = document.getElementById("searchInput");
if (searchInput) {
  searchInput.addEventListener("input", e => {
    const q = e.target.value.toLowerCase().trim();
    const filtered = allMovies.filter(m => m.title.toLowerCase().includes(q));
    renderMovies(filtered);
  });
}

// ==============================
// DELETE MOVIE
// ==============================
function deleteMovie(id) {
  if (!confirm("Delete this movie permanently?")) return;

  db.collection("movies").doc(id).delete()
    .then(() => notify("Movie deleted", "success"))
    .catch(err => notify(err.message, "error"));
}
