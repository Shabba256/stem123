const content = document.getElementById("content");
const searchInput = document.getElementById("quick-search");

// Detect page type
const PAGE_TYPE = window.location.pathname.includes("series")
  ? "Series"
  : "Movies";

const PAGE_SIZE = 16;
let lastDoc = null;
let isEnd = false;

// ------------------------------
// NOTIFICATION
// ------------------------------
function notify(msg, type = "info") {
  const n = document.createElement("div");
  n.className = `notification ${type}`;
  n.textContent = msg;
  document.body.appendChild(n);
  setTimeout(() => n.remove(), 3000);
}

// ------------------------------
// RENDER CARD
// ------------------------------
function renderCard(movie) {
  let thumb = "https://placehold.co/400x600?text=No+Thumbnail";

  if (movie.thumbnail) {
    thumb = movie.thumbnail;
  } else if (movie.cloudinaryUrl) {
    const file = movie.cloudinaryUrl.split("/").pop();
    thumb = `https://res.cloudinary.com/dagxhzebg/video/upload/f_jpg,c_fill,w_400/${file.replace(".mp4", ".jpg")}`;
  }

  return `
    <div class="card" data-title="${movie.title}" onclick="openMovie('${movie.id}')">
      <img src="${thumb}" alt="${movie.title}" loading="lazy" />
    </div>
  `;
}

// ------------------------------
// OPEN MOVIE
// ------------------------------
function openMovie(id) {
  window.location.href = `movie.html?id=${id}`;
}

// ------------------------------
// LOAD MOVIES (PAGINATED)
// ------------------------------
async function loadMovies() {
  if (isEnd) return;

  let query = db
    .collection("movies")
    .where("category", "==", PAGE_TYPE)
    .orderBy("timestamp", "desc")
    .limit(PAGE_SIZE);

  if (lastDoc) {
    query = query.startAfter(lastDoc);
  }

  const snapshot = await query.get();

  if (snapshot.empty && !lastDoc) {
    content.innerHTML = `
      <p style="padding:30px; font-size:18px; color:#bbb;">
        No titles available yet.
      </p>
    `;
    return;
  }

  if (snapshot.size < PAGE_SIZE) {
    isEnd = true;
  }

  let grid = document.querySelector(".list");

  if (!grid) {
    content.innerHTML = `
      <div class="row">
        <h2>${PAGE_TYPE}</h2>
        <div class="list"></div>
        <div class="load-more-wrapper">
          <button id="loadMoreBtn">Load More</button>
        </div>
      </div>
    `;
    grid = document.querySelector(".list");
    document
      .getElementById("loadMoreBtn")
      .addEventListener("click", loadMovies);
  }

  snapshot.forEach(doc => {
    const movie = doc.data();
    movie.id = doc.id;
    grid.insertAdjacentHTML("beforeend", renderCard(movie));
  });

  lastDoc = snapshot.docs[snapshot.docs.length - 1];

  if (isEnd) {
    const btn = document.getElementById("loadMoreBtn");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "You’ve reached the end";
    }
  }
}

// ------------------------------
// SEARCH (CLIENT SIDE)
// ------------------------------
searchInput.addEventListener("input", () => {
  const filter = searchInput.value.toLowerCase();
  document.querySelectorAll(".card").forEach(card => {
    const title = card.getAttribute("data-title").toLowerCase();
    card.style.display = title.includes(filter) ? "block" : "none";
  });
});

// ------------------------------
// INIT
// ------------------------------
loadMovies();
