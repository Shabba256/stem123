// ==============================
// DOM ELEMENTS
// ==============================
const hero = document.getElementById("hero");
const heroTitle = document.getElementById("hero-title");
const heroDesc = document.getElementById("hero-desc");
const playBtn = document.getElementById("play-btn");
const content = document.getElementById("content");

// ==============================
// HERO AUTO SLIDER STATE
// ==============================
let heroMovies = [];
let currentHeroIndex = 0;
let heroInterval = null;
const HERO_DELAY = 7000;

// ==============================
// CLOUDINARY THUMB HELPER (SAFE)
// ==============================
function getCloudinaryThumb(url, width = 1280) {
  return url
    .replace("/upload/", `/upload/so_1,w_${width}/`)
    .replace(/\.(mp4|mov|webm).*/i, ".jpg");
}

// ==============================
// LOAD FEATURED HERO MOVIES
// ==============================
db.collection("movies")
  .where("featured", "==", true)
  .orderBy("timestamp", "desc")
  .get()
  .then(snapshot => {
    snapshot.forEach(doc => {
      heroMovies.push({ ...doc.data(), id: doc.id });
    });

    if (!heroMovies.length) return;

    renderHero(heroMovies[0]);

    if (heroMovies.length > 1) {
      heroInterval = setInterval(nextHero, HERO_DELAY);
    }
  })
  .catch(err => console.error("Hero error:", err));

// ==============================
// HERO SLIDER CONTROLS
// ==============================
function nextHero() {
  currentHeroIndex = (currentHeroIndex + 1) % heroMovies.length;
  renderHero(heroMovies[currentHeroIndex]);
}

function renderHero(movie) {
  const bgImage = getCloudinaryThumb(movie.url, 1280);

  hero.classList.remove("hero-animate");

  setTimeout(() => {
    hero.style.backgroundImage = `
      linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.25)),
      url("${bgImage}")
    `;

    heroTitle.textContent = movie.title;
    heroDesc.textContent = movie.description || "Watch now";

    playBtn.onclick = () => {
      window.open(movie.url, "_blank");
      incrementViews(movie.id);
    };

    hero.classList.add("hero-animate");
  }, 200);
}

// Pause slider on hover
hero.addEventListener("mouseenter", () => {
  if (heroInterval) clearInterval(heroInterval);
});

hero.addEventListener("mouseleave", () => {
  if (heroMovies.length > 1) {
    heroInterval = setInterval(nextHero, HERO_DELAY);
  }
});

// ==============================
// MOVIE LISTING (GROUPED)
// ==============================
db.collection("movies")
  .orderBy("timestamp", "desc")
  .get()
  .then(snapshot => {
    const grouped = {};

    snapshot.forEach(doc => {
      const movie = { ...doc.data(), id: doc.id };
      if (!grouped[movie.category]) grouped[movie.category] = [];
      grouped[movie.category].push(movie);
    });

    for (const category in grouped) {
      const row = document.createElement("div");
      row.className = "row";
      row.innerHTML = `<h2>${category}</h2><div class="list"></div>`;

      const list = row.querySelector(".list");

      grouped[category].forEach(movie => {
        const thumbUrl = getCloudinaryThumb(movie.url, 400);

        const card = document.createElement("div");
        card.className = "card";
        card.dataset.id = movie.id;
        card.dataset.title = movie.title;

        card.innerHTML = `
          <img src="${thumbUrl}" alt="${movie.title}" loading="lazy"/>

          <div class="card-buttons">
            <button class="play-btn">▶ Play</button>
            <a class="download-btn" href="${movie.url}" download>⬇ Download</a>
          </div>

          <div class="analytics">
            <span>👁 <span class="views-count">${movie.views || 0}</span></span>
            <span>⬇ <span class="downloads-count">${movie.downloads || 0}</span></span>
          </div>
        `;

        // CLICK HANDLERS
        card.querySelector("img").onclick = () =>
          playMovie(movie.id, movie.url);

        card.querySelector(".play-btn").onclick = e => {
          e.stopPropagation();
          playMovie(movie.id, movie.url);
        };

        card.querySelector(".download-btn").onclick = e => {
          e.stopPropagation();
          downloadMovie(movie.id, movie.url, card);
        };

        list.appendChild(card);
      });

      content.appendChild(row);
    }
  })
  .catch(err => console.error("Listing error:", err));

// ==============================
// ANALYTICS FUNCTIONS
// ==============================
function incrementViews(movieId) {
  db.collection("movies").doc(movieId).update({
    views: firebase.firestore.FieldValue.increment(1)
  });

  const card = document.querySelector(`.card[data-id="${movieId}"]`);
  if (card) {
    const el = card.querySelector(".views-count");
    el.textContent = parseInt(el.textContent) + 1;
  }
}

function downloadMovie(movieId, url, card) {
  const a = document.createElement("a");
  a.href = url;
  a.download = "";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  db.collection("movies").doc(movieId).update({
    downloads: firebase.firestore.FieldValue.increment(1)
  });

  const el = card.querySelector(".downloads-count");
  el.textContent = parseInt(el.textContent) + 1;
}

function playMovie(movieId, url) {
  window.open(url, "_blank");
  incrementViews(movieId);
}
