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
// ADMIN LOGIN (FIRESTORE-VERIFIED)
// ==============================
function adminLogin() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    notify("Enter email and password", "error");
    return;
  }

  auth.signInWithEmailAndPassword(email, password)
    .then(async ({ user }) => {
      // 🔐 Verify admin from Firestore
      const adminDoc = await db.collection("admins").doc(user.uid).get();

      if (!adminDoc.exists || adminDoc.data().enabled !== true) {
        notify("Access denied: not an admin", "error");
        await auth.signOut();
        return;
      }

      notify("Admin verified ✅ Redirecting...", "success");

      setTimeout(() => {
        window.location.href = "admin.html";
      }, 800);
    })
    .catch(err => notify(err.message, "error"));
}

