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
let allSeries = [];

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
  if (!user || user.uid !== ADMIN_UID) {
    window.location.href = "/admin/admin.html";
    return;
  }

  currentUser = user;
  loadSeries();
});

// ==============================
// LOAD SERIES
// ==============================
function loadSeries() {
  const list = document.getElementById("itemsList");
  if (!list) return;
  list.textContent = "Loading series...";

  db.collection("movies")
    .where("category", "==", "Series")
    .orderBy("timestamp", "desc")
    .onSnapshot(snapshot => {
      allSeries = [];
      snapshot.forEach(doc => allSeries.push({ id: doc.id, ...doc.data() }));
      renderSeries(allSeries);
    }, err => notify(err.message, "error"));
}

// ==============================
// RENDER SERIES
// ==============================
function renderSeries(seriesArray) {
  const list = document.getElementById("itemsList");
  if (!list) return;
  list.innerHTML = "";

  if (seriesArray.length === 0) {
    list.textContent = "No series found.";
    return;
  }

  seriesArray.forEach(s => {
    const div = document.createElement("div");
    div.className = "admin-movie"; // reuse CSS
    div.innerHTML = `
      <strong>${s.title}</strong>
      <span style="opacity:.6">(${s.source || "Unknown"})</span>
      <button onclick="deleteSeries('${s.id}')">Delete</button>
    `;
    list.appendChild(div);
  });
}

// ==============================
// SEARCH SERIES
// ==============================
const searchInput = document.getElementById("searchInput");
if (searchInput) {
  searchInput.addEventListener("input", e => {
    const q = e.target.value.toLowerCase().trim();
    const filtered = allSeries.filter(s => s.title.toLowerCase().includes(q));
    renderSeries(filtered);
  });
}

// ==============================
// DELETE SERIES
// ==============================
function deleteSeries(id) {
  if (!confirm("Delete this series permanently?")) return;

  db.collection("movies").doc(id).delete()
    .then(() => notify("Series deleted", "success"))
    .catch(err => notify(err.message, "error"));
}
