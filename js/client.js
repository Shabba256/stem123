// ==============================
// HERO ELEMENTS
// ==============================
const hero = document.getElementById("hero");
const heroTitle = document.getElementById("hero-title");
const heroDesc = document.getElementById("hero-desc");
const playBtn = document.getElementById("play-btn");
const content = document.getElementById("content");

// ==============================
// NOTIFICATIONS
// ==============================
function notify(message, type = "info") {
  const n = document.createElement("div");
  n.className = `notification ${type}`;
  n.textContent = message;
  document.body.appendChild(n);
  setTimeout(() => n.remove(), 3000);
}

// ==============================
// HERO AUTO SLIDER
// ==============================
let heroMovies = [];
let currentHeroIndex = 0;
let heroInterval = null;

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
      heroInterval = setInterval(nextHero, 7000);
    }
  })
  .catch(err => console.error("Hero error:", err));

function nextHero() {
  currentHeroIndex = (currentHeroIndex + 1) % heroMovies.length;
  renderHero(heroMovies[currentHeroIndex]);
}

function renderHero(movie) {
  const fileName = movie.url.split("/").pop();
  const bg = `https://res.cloudinary.com/dagxhzebg/video/upload/so_1,w_1280/${fileName.replace(".mp4", ".jpg")}`;

  hero.classList.remove("hero-animate");

  setTimeout(() => {
    hero.style.backgroundImage = `
      linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.4)),
      url("${bg}")
    `;

    heroTitle.textContent = movie.title;
    heroDesc.textContent = movie.description || "Watch now";

    playBtn.onclick = () => {
      window.open(movie.url, "_blank");
      incrementViews(movie.id);
    };

    hero.classList.add("hero-animate");
  }, 200);

  hero.addEventListener("mouseenter", () => {
    if (heroInterval) clearInterval(heroInterval);
  });

  hero.addEventListener("mouseleave", () => {
    if (heroMovies.length > 1) heroInterval = setInterval(nextHero, 7000);
  });
}

// ==============================
// MOVIE LISTING
// ==============================
db.collection("movies")
  .orderBy("timestamp", "desc")
  .get()
  .then(snapshot => {
    const grouped = {};
    snapshot.forEach(doc => {
      const movie = doc.data();
      if (!grouped[movie.category]) grouped[movie.category] = [];
      grouped[movie.category].push({ ...movie, id: doc.id });
    });

    for (const category in grouped) {
      const row = document.createElement("div");
      row.className = "row";
      row.innerHTML = `<h2>${category}</h2><div class="list"></div>`;

      grouped[category].forEach(movie => {
        const fileName = movie.url.split("/").pop();
        const thumbUrl = `https://res.cloudinary.com/dagxhzebg/video/upload/so_1,w_400/${fileName.replace('.mp4','.jpg')}`;

        row.querySelector(".list").innerHTML += `
          <div class="card" data-title="${movie.title}">
            <img src="${thumbUrl}" alt="${movie.title}" loading="lazy"
                 onclick="playMovie('${movie.id}','${movie.url}')"/>
            <div class="card-buttons">
              <button class="play-btn"
                onclick="event.stopPropagation(); playMovie('${movie.id}','${movie.url}')">
                ▶ Play
              </button>
              <a class="download-btn" href="${movie.url}" download
                 onclick="event.stopPropagation(); downloadMovie('${movie.id}','${movie.url}')">
                 ⬇ Download
              </a>
            </div>
            <div class="analytics">
              <span>Views: <span class="views-count">${movie.views || 0}</span></span>
              <span>Downloads: <span class="downloads-count">${movie.downloads || 0}</span></span>
            </div>
          </div>
        `;
      });

      content.appendChild(row);
    }
  })
  .catch(err => console.error("Listing error:", err));

// ==============================
// VIEWS / DOWNLOADS FUNCTIONS
// ==============================
function incrementViews(movieId) {
  db.collection("movies").doc(movieId).update({
    views: firebase.firestore.FieldValue.increment(1)
  }).then(() => {
    const card = document.querySelector(`.card[data-title]`);
    const countEl = card?.querySelector(".views-count");
    if (countEl) countEl.textContent = parseInt(countEl.textContent) + 1;
  }).catch(err => notify("Failed to increment views", "error"));
}

function downloadMovie(movieId, url) {
  const a = document.createElement("a");
  a.href = url;
  a.download = "";
  a.click();

  db.collection("movies").doc(movieId).update({
    downloads: firebase.firestore.FieldValue.increment(1)
  }).then(() => {
    const card = document.querySelector(`.card[data-title]`);
    const countEl = card?.querySelector(".downloads-count");
    if (countEl) countEl.textContent = parseInt(countEl.textContent) + 1;
    notify("Download started", "info");
  }).catch(err => notify("Failed to increment downloads", "error"));
}

function playMovie(movieId, url) {
  window.open(url, "_blank");
  incrementViews(movieId);
}
