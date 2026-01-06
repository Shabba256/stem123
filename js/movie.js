// ==============================
// GET MOVIE ID
// ==============================
const params = new URLSearchParams(window.location.search);
const movieId = params.get("id");

if (!movieId) {
  window.location.href = "index.html";
}

// ==============================
// ELEMENTS
// ==============================
const titleEl = document.getElementById("movie-title");
const descEl = document.getElementById("movie-desc");
const playBtn = document.getElementById("play-btn");
const downloadBtn = document.getElementById("download-btn");
const overlay = document.querySelector(".overlay");

// ==============================
// LOAD MOVIE
// ==============================
db.collection("movies").doc(movieId).get()
.then(doc => {
  if (!doc.exists) {
    window.location.href = "index.html";
    return;
  }

  const movie = doc.data();

  titleEl.textContent = movie.title;
  descEl.textContent = movie.description || "Watch now";

  // ==============================
  // SOURCE URL
  // ==============================
  const movieUrl =
    movie.source === "cloudinary" || movie.source === "both"
      ? movie.cloudinaryUrl
      : movie.teraboxUrl;

  if (!movieUrl) {
    playBtn.style.display = "none";
    downloadBtn.style.display = "none";
    return;
  }


  // ==============================
  // BACKGROUND (FALLBACK LOGIC)
  // ==============================
  if (movie.thumbnail) {
    overlay.style.backgroundImage = `url("${movie.thumbnail}")`;
  } else if (movie.cloudinaryUrl) {
    const fileName = movie.cloudinaryUrl.split("/").pop();
    overlay.style.backgroundImage =
      `url("https://res.cloudinary.com/dagxhzebg/video/upload/so_1,w_1280/${fileName.replace(".mp4",".jpg")}")`;
  } else {
    overlay.style.backgroundImage =
      `url("https://placehold.co/1280x720?text=No+Preview")`;
  }

  // ==============================
  // PLAY
  // ==============================
  playBtn.onclick = () => {
    window.open(movieUrl, "_blank");
    db.collection("movies").doc(movieId).update({
      views: firebase.firestore.FieldValue.increment(1)
    });
  };

  // ==============================
  // DOWNLOAD
  // ==============================
  downloadBtn.href = movieUrl;
  downloadBtn.onclick = () => {
    db.collection("movies").doc(movieId).update({
      downloads: firebase.firestore.FieldValue.increment(1)
    });
  };
})
.catch(() => window.location.href = "index.html");
