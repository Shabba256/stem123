// ==============================
// FIREBASE
// ==============================
const db = firebase.firestore();

// ==============================
// HERO ELEMENTS
// ==============================
const hero = document.getElementById("hero");
const heroTitle = document.getElementById("hero-title");
const heroDesc = document.getElementById("hero-desc");
const playBtn = document.getElementById("play-btn");
const content = document.getElementById("content");

// ==============================
// HERO AUTO SLIDER (FEATURED)
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

  const bg = `https://res.cloudinary.com/dagxhzebg/video/upload/so_1,c_fill,w_1280,f_jpg/${fileName}`;

  hero.classList.remove("hero-animate");

  setTimeout(() => {
    hero.style.backgroundImage = `
      linear-gradient(to top, rgba(0,0,0,.95), rgba(0,0,0,.35)),
      url("${bg}")
    `;

    heroTitle.textContent = movie.title;
    heroDesc.textContent = movie.description || "Watch now";

    playBtn.onclick = () => {
      playMovie(movie.id, movie.url);
    };

    hero.classList.add("hero-animate");
  }, 200);
}

// Pause slider on hover
hero.addEventListener("mouseenter", () => heroInterval && clearInterval(heroInterval));
hero.addEventListener("mouseleave", () => {
  if (heroMovies.length > 1) {
    heroInterval = setInterval(nextHero, 7000);
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

      grouped[category].forEach(movie => {
        const fileName = movie.url.split("/").pop();

        const thumbUrl =
          `https://res.cloudinary.com/dagxhzebg/video/upload/so_1,c_fill,w_400,f_jpg/${fileName}`;

        row.querySelector(".list").innerHTML += `
          <div class="card" data-id="${movie.id}">
            <img src="${thumbUrl}" alt="${movie.title}" loading="lazy"/>

            <div class="card-buttons">
              <button class="play-btn"
                onclick="playMovie('${movie.id}','${movie.url}')">
                ▶ Play
              </button>

              <button class="download-btn"
                onclick="downloadMovie('${movie.id}','${movie.url}')">
                ⬇ Download
              </button>
            </div>

            <div class="analytics">
              <span>👁 <span class="views-count">${movie.views || 0}</span></span>
              <span>⬇ <span class="downloads-count">${movie.downloads || 0}</span></span>
            </div>
          </div>
        `;
      });

      content.appendChild(row);
    }
  })
  .catch(err => console.error("Listing error:", err));

// ==============================
// PLAY / DOWNLOAD / ANALYTICS
// ==============================
function playMovie(movieId, url) {
  window.open(url, "_blank");
  incrementViews(movieId);
}

function downloadMovie(movieId, url) {
  const a = document.createElement("a");
  a.href = url;
  a.download = "";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  db.collection("movies").doc(movieId).update({
    downloads: firebase.firestore.FieldValue.increment(1)
  });

  updateCounter(movieId, "downloads-count");
}

function incrementViews(movieId) {
  db.collection("movies").doc(movieId).update({
    views: firebase.firestore.FieldValue.increment(1)
  });

  updateCounter(movieId, "views-count");
}

function updateCounter(movieId, className) {
  const card = document.querySelector(`.card[data-id="${movieId}"]`);
  const el = card?.querySelector(`.${className}`);
  if (el) el.textContent = parseInt(el.textContent) + 1;
}
