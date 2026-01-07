const content = document.getElementById("content");
const searchInput = document.getElementById("quick-search");

// Determine page type
const PAGE_TYPE = window.location.pathname.includes("series") ? "Series" : "Movies";

// Notifications
function notify(msg, type = "info") {
  const n = document.createElement("div");
  n.className = `notification ${type}`;
  n.textContent = msg;
  document.body.appendChild(n);
  setTimeout(() => n.remove(), 3000);
}

// Render a single movie/series card
function renderCard(movie) {
  const thumbUrl = movie.thumbnail || movie.cloudinaryUrl
    ? `https://res.cloudinary.com/dagxhzebg/video/upload/f_jpg,c_fill,w_400/${movie.cloudinaryUrl?.split("/").pop().replace(".mp4", ".jpg")}`
    : "https://placehold.co/400x225?text=No+Thumbnail";

  return `
    <div class="card" data-title="${movie.title}" onclick="openMovie('${movie.id}')">
      <img src="${thumbUrl}" alt="${movie.title}" loading="lazy"/>
    </div>
  `;
}

// Open movie/series page
function openMovie(id) {
  window.location.href = `movie.html?id=${id}`;
}

// Load movies/series from Firestore in real-time
db.collection("movies")
  .orderBy("timestamp", "desc")
  .onSnapshot(snapshot => {
    const filtered = [];
    snapshot.forEach(doc => {
      const movie = doc.data();
      movie.id = doc.id;
      if (movie.category === PAGE_TYPE) filtered.push(movie);
    });

    // Clear content
    content.innerHTML = "";

    if (!filtered.length) {
      content.innerHTML = `<p style="padding:30px; font-size:18px; color:#bbb;">No ${PAGE_TYPE.toLowerCase()} uploaded yet.</p>`;
      return;
    }

    // Create 4x2 grid (8 per page)
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `<h2>${PAGE_TYPE}</h2><div class="grid"></div>`;
    const grid = row.querySelector(".grid");

    filtered.forEach(movie => grid.innerHTML += renderCard(movie));

    content.appendChild(row);
  });

// Quick search
searchInput.addEventListener("input", () => {
  const filter = searchInput.value.toLowerCase();
  document.querySelectorAll(".card").forEach(card => {
    const title = card.getAttribute("data-title").toLowerCase();
    card.style.display = title.includes(filter) ? "block" : "none";
  });
});
