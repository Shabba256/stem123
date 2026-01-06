// ==============================
// MOVIE DETAIL LOGIC
// ==============================

// Elements
const params = new URLSearchParams(window.location.search);
const movieId = params.get("id");
const titleEl = document.getElementById("movie-title");
const descEl = document.getElementById("movie-desc");
const videoPlayer = document.getElementById("video-player");
const downloadBtn = document.getElementById("download-btn");

if (!movieId) {
  alert("No movie selected!");
  window.location.href = "index.html";
}

// Load movie from Firestore
db.collection("movies").doc(movieId).get()
  .then(doc => {
    if (!doc.exists) throw new Error("Movie not found");
    const movie = doc.data();

    // Decide playable URL
    const movieUrl = (movie.source === "cloudinary" || movie.source === "both")
      ? movie.cloudinaryUrl
      : movie.teraboxUrl;

    if (!movieUrl) throw new Error("No playable video URL");

    // Set title & description
    titleEl.textContent = movie.title;
    descEl.textContent = movie.description || "Watch now";

    // Set video src
    videoPlayer.src = movieUrl;

    // Poster image
    const posterUrl = movie.thumbnail
      ? movie.thumbnail
      : movie.cloudinaryUrl
      ? `https://res.cloudinary.com/dagxhzebg/video/upload/so_1,w_1280/${movie.cloudinaryUrl.split("/").pop().replace(".mp4",".jpg")}`
      : "https://placehold.co/1280x720?text=No+Thumbnail";
    videoPlayer.poster = posterUrl;

    // Increment views on play
    videoPlayer.onplay = () => {
      db.collection("movies").doc(movieId).update({
        views: firebase.firestore.FieldValue.increment(1)
      }).catch(() => console.warn("Failed to increment views"));
    };

    // Set download link
    downloadBtn.href = movie.teraboxUrl || movie.cloudinaryUrl;
    downloadBtn.onclick = () => {
      db.collection("movies").doc(movieId).update({
        downloads: firebase.firestore.FieldValue.increment(1)
      }).catch(() => console.warn("Failed to increment downloads"));
    };

  })
  .catch(err => {
    console.error(err);
    alert("Failed to load movie: " + err.message);
    window.location.href = "index.html";
  });
