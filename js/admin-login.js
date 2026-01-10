// ==============================
// GLOBAL STATE
// ==============================
let currentUser = null;

// ==============================
// NOTIFICATIONS (REUSE STYLE)
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
      notify("Login successful ✅ Redirecting...", "success");

      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = "admin.html";
      }, 800);
    })
    .catch(err => notify(err.message, "error"));
}

// ==============================
// AUTO REDIRECT IF ALREADY LOGGED IN
// ==============================
auth.onAuthStateChanged(user => {
  if (user && user.uid === ADMIN_UID) {
    currentUser = user;
    window.location.href = "admin.html"; // already logged in
  }
});
