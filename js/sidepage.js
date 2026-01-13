// ==============================
// GLOBAL ELEMENTS
// ==============================
const content = document.getElementById("content");
const searchInput = document.getElementById("quick-search");

// Determine page type dynamically
const PAGE_TYPE = window.location.pathname.includes("series") ? "Series" : "Movies";
const PAGE_SIZE = 16;       // number of items per load
let lastDoc = null;
let isEnd = false;

// ==============================
// NOTIFICATIONS
// ==============================
function notify(msg, type = "info") {
  const n = document.createElement("div");
  n.className = `notification ${type}`;
  n.textContent = msg;
  document.body.appendChild(n);
  setTimeout(() => n.remove(), 3000);
}

// ==============================
// OPEN MOVIE/SERIES PAGE
// ==============================
function openMovie(id) {
  window.location.href = `movie.html?id=${id}`;
}

// ==============================
// RENDER CARD (MODULAR)
// ==============================
function createCard(movie) {
  if (!movie.thumbnail) return null; // skip if no poster

  // Create card container
  const card = document.createElement("div");
  card.className = "card";
  card.setAttribute("data-title", movie.title);
  card.addEventListener("click", () => openMovie(movie.id));

  // Poster wrapper
  const posterWrap = document.createElement("div");
  posterWrap.className = "poster-wrap";

  const img = document.createElement("img");
  img.src = movie.thumbnail;
  img.alt = movie.title;
  img.loading = "lazy";

  posterWrap.appendChild(img);
  card.appendChild(posterWrap);

  return card;
}

// ==============================
// LOAD MOVIES/SERIES
// ==============================
async function loadMovies() {
  if (isEnd) return;

  let query = db.collection("movies")
    .where("category", "==", PAGE_TYPE)
    .orderBy("timestamp", "desc")
    .limit(PAGE_SIZE);

  if (lastDoc) query = query.startAfter(lastDoc);

  try {
    const snapshot = await query.get();

    if (snapshot.empty && !lastDoc) {
      content.innerHTML = `<p style="padding:30px; font-size:18px; color:#bbb;">No titles available yet.</p>`;
      return;
    }

    if (snapshot.size < PAGE_SIZE) isEnd = true;

    // Create row & grid if not exists
    let grid = document.querySelector(".list");
    if (!grid) {
      const row = document.createElement("div");
      row.className = "row";

      const header = document.createElement("h2");
      header.textContent = PAGE_TYPE;
      row.appendChild(header);

      grid = document.createElement("div");
      grid.className = "list";
      row.appendChild(grid);

      const loadWrapper = document.createElement("div");
      loadWrapper.className = "load-more-wrapper";

      const loadBtn = document.createElement("button");
      loadBtn.id = "loadMoreBtn";
      loadBtn.textContent = "Load More";
      loadBtn.addEventListener("click", loadMovies);

      loadWrapper.appendChild(loadBtn);
      row.appendChild(loadWrapper);

      content.appendChild(row);
    }

    // Add cards
    snapshot.forEach(doc => {
      const movie = { ...doc.data(), id: doc.id };
      const card = createCard(movie);
      if (card) grid.appendChild(card);
    });

    lastDoc = snapshot.docs[snapshot.docs.length - 1];

    // Disable button if end reached
    if (isEnd) {
      const btn = document.getElementById("loadMoreBtn");
      if (btn) {
        btn.disabled = true;
        btn.textContent = "You’ve reached the end";
      }
    }

  } catch (err) {
    console.error("Error loading movies/series:", err);
    notify("Failed to load titles", "error");
  }
}

// ==============================
// CLIENT-SIDE SEARCH
// ==============================
searchInput.addEventListener("input", () => {
  const filter = searchInput.value.toLowerCase();
  document.querySelectorAll(".card").forEach(card => {
    const title = card.getAttribute("data-title").toLowerCase();
    card.style.display = title.includes(filter) ? "block" : "none";
  });
});

// ==============================
// INITIALIZE PAGE
// ==============================
loadMovies();
