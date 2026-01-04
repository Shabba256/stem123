// ==============================
// HERO ELEMENTS
// ==============================
const hero = document.getElementById("hero");
const heroTitle = document.getElementById("hero-title");
const heroDesc = document.getElementById("hero-desc");
const playBtn = document.getElementById("play-btn");
const content = document.getElementById("content");
const searchInput = document.getElementById("quick-search");

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
// HELPER: GET THUMBNAIL URL
// ==============================
function getThumbnail(movie) {
  if (movie.thumbnail) return movie.thumbnail;
  const fileName = movie.url.split("/").pop().replace(".mp4", ".jpg");
  return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/so_1,w_400/${fileName}`;
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
    snapshot.forEach(doc => heroMovies.push({ ...doc.data(), id: doc.id }));
    if (!heroMovies.length) return;
    renderHero(heroMovies[0]);
    if (heroMovies.length > 1) heroInterval = setInterval(nextHero, 7000);
  })
  .catch(err => console.error("Hero error:", err));

function nextHero() {
  currentHeroIndex = (currentHeroIndex + 1) % heroMovies.length;
  renderHero(heroMovies[currentHeroIndex]);
}

function renderHero(movie) {
  const bg = getThumbnail(movie);

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

  hero.addEventListener("mouseenter", () => heroInterval && clearInterval(heroInterval));
  hero.addEventListener("mouseleave", () => {
    if (heroMovies.length > 1) heroInterval = setInterval(nextHero, 7000);
  });
}

// ==============================
// MOVIE LISTING (FRONT PAGE)
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
        const thumbUrl = getThumbnail(movie);

        row.querySelector(".list").innerHTML += `
          <div class="card" data-title="${movie.title}" onclick="openMovie('${movie.id}')">
            <img src="${thumbUrl}" alt="${movie.title}" loading="lazy"/>
          </div>
        `;
      });

      content.appendChild(row);
    }
  })
  .catch(err => console.error("Listing error:", err));

// ==============================
// OPEN MOVIE DETAIL
// ==============================
function openMovie(movieId) {
  window.location.href = `movie.html?id=${movieId}`;
}

// ==============================
// VIEWS / DOWNLOADS
// ==============================
function incrementViews(movieId) {
  db.collection("movies").doc(movieId).update({
    views: firebase.firestore.FieldValue.increment(1)
  }).catch(() => notify("Failed to increment views", "error"));
}

// ==============================
// QUICK SEARCH
// ==============================
searchInput.addEventListener("input", () => {
  const filter = searchInput.value.toLowerCase();
  document.querySelectorAll(".card").forEach(card => {
    const title = card.getAttribute("data-title").toLowerCase();
    card.style.display = title.includes(filter) ? "block" : "none";
  });
});
