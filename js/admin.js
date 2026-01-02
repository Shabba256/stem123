let currentUser = null;

// Admin login using Firebase Auth
function adminLogin() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(email, password)
    .then(userCredential => {
      const user = userCredential.user;
      if(user.uid === ADMIN_UID){
        currentUser = user;
        document.getElementById("panel").classList.remove("hidden");
        document.getElementById("login").style.display = "none";
        alert("Admin logged in!");
      } else {
        alert("Not authorized");
        auth.signOut();
      }
    })
    .catch(err => alert("Login failed: " + err.message));
}

// Upload video to Cloudinary + metadata to Firestore
function uploadVideo() {
  if(!currentUser){
    alert("You must be logged in as admin!");
    return;
  }

  const file = document.getElementById("videoFile").files[0];
  const title = document.getElementById("title").value;
  const category = document.getElementById("category").value;

  if(!file || !title || !category){
    alert("Fill all fields");
    return;
  }

  const data = new FormData();
  data.append("file", file);
  data.append("upload_preset", UPLOAD_PRESET);

  fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
    method: "POST",
    body: data
  })
  .then(res => res.json())
  .then(result => {
    db.collection("movies").add({
      title,
      category,
      url: result.secure_url,
      description: "Watch the latest release now",
      featured: true,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
  })
    .then(() => alert("Upload successful!"))
    .catch(err => alert("Firestore error: " + err));
  })
  .catch(err => alert("Cloudinary upload failed: " + err));
}