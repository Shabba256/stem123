// ==============================
// GET MOVIE ID
// ==============================
const params = new URLSearchParams(window.location.search);
const movieId = params.get("id");
if (!movieId) window.location.href = "index.html";

// ==============================
// ELEMENTS
// ==============================
const titleEl = document.getElementById("movie-title");
const descEl = document.getElementById("movie-desc");
const playBtn = document.getElementById("play-btn");
const downloadBtn = document.getElementById("download-btn");
const overlay = document.querySelector(".overlay");
const teraboxAlert = document.getElementById("teraboxAlert");

// ==============================
// LOAD MOVIE
// ==============================
db.collection("movies").doc(movieId).get()
.then(doc => {
  if (!doc.exists) return window.location.href = "index.html";

  const movie = doc.data();
  titleEl.textContent = movie.title;
  descEl.textContent = movie.description || "Watch now";

  if (movie.source === "terabox" || movie.source === "both") {
    teraboxAlert.classList.remove("hidden");
  }

  if (!movie.thumbnail) return; // skip corrupted

  overlay.style.backgroundImage = `url("${movie.thumbnail}")`;

  const movieUrl = movie.source === "cloudinary" || movie.source === "both"
    ? movie.cloudinaryUrl
    : movie.teraboxUrl;

  if (!movieUrl) {
    playBtn.style.display = "none";
    downloadBtn.style.display = "none";
    return;
  }

  playBtn.onclick = () => {
    window.open(movieUrl, "_blank");
    db.collection("movies").doc(movieId).update({
      views: firebase.firestore.FieldValue.increment(1)
    });
  };

  downloadBtn.onclick = () => {
    db.collection("movies").doc(movieId).update({
      downloads: firebase.firestore.FieldValue.increment(1)
    });

    const url = movie.teraboxDirectLink || movie.teraboxUrl;
    if (url) window.open(`terabx.html?url=${encodeURIComponent(url)}`, "_blank");
  };

})
.catch(() => window.location.href = "index.html");
