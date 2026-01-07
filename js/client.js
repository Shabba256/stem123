// ==============================
// GLOBAL ELEMENTS
// ==============================
const hero = document.getElementById("hero");
const heroTitle = document.getElementById("hero-title");
const heroDesc = document.getElementById("hero-desc");
const playBtn = document.getElementById("play-btn");
const content = document.getElementById("content");
const searchInput = document.getElementById("quick-search");
const ALLOWED_CATEGORIES = ["Movies", "Series"];


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
// HERO SLIDER
// ==============================
let heroMovies = [];
let currentHeroIndex = 0;
let heroInterval = null;

// Load featured movies
db.collection("movies")
  .where("featured", "==", true)
  .orderBy("timestamp", "desc")
  .get()
  .then(snapshot => {
    snapshot.forEach(doc => heroMovies.push({ ...doc.data(), id: doc.id }));
    if (!heroMovies.length) return;

    renderHero(heroMovies[0]);

    if (heroMovies.length > 1) {
      heroInterval = setInterval(nextHero, 7000);
    }
  })
  .catch(err => console.error("Hero load error:", err));

function nextHero() {
  currentHeroIndex = (currentHeroIndex + 1) % heroMovies.length;
  renderHero(heroMovies[currentHeroIndex]);
}

function renderHero(movie) {
  const movieUrl = movie.source === "cloudinary" || movie.source === "both"
    ? movie.cloudinaryUrl
    : movie.teraboxUrl;

  if (!movieUrl) return; // skip if no URL

  const thumbUrl = movie.thumbnail
    ? movie.thumbnail
    : movie.cloudinaryUrl
    ? `https://res.cloudinary.com/dagxhzebg/video/upload/f_jpg,c_fill,w_1280/${movie.cloudinaryUrl.split("/").pop().replace(".mp4", ".jpg")}`
    : "https://placehold.co/1280x720?text=No+Thumbnail";

  hero.classList.remove("hero-animate");

  setTimeout(() => {
    hero.style.backgroundImage = `
      linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.4)),
      url("${thumbUrl}")
    `;
    heroTitle.textContent = movie.title;
    heroDesc.textContent = movie.description || "Watch now";
    playBtn.onclick = () => {
      window.open(movieUrl, "_blank");
      incrementViews(movie.id);
    };
    hero.classList.add("hero-animate");
  }, 200);

  hero.onmouseenter = () => heroInterval && clearInterval(heroInterval);
  hero.onmouseleave = () => {
    if (heroMovies.length > 1) heroInterval = setInterval(nextHero, 7000);
  };
}

// ==============================
// MOVIE LISTINGS
// ==============================
db.collection("movies")
  .orderBy("timestamp", "desc")
  .get()
  .then(snapshot => {
    const grouped = {};

    snapshot.forEach(doc => {
      const movie = doc.data();

      // 🔒 Only allow Movies & Series
      if (!ALLOWED_CATEGORIES.includes(movie.category)) return;

      if (!grouped[movie.category]) grouped[movie.category] = [];
      grouped[movie.category].push({ ...movie, id: doc.id });
    });

    for (const category in grouped) {
      const row = document.createElement("div");
      row.className = "row";
      row.innerHTML = `<h2>${category}</h2><div class="list"></div>`;

      grouped[category].slice(0, 8).forEach(movie => {
        const movieUrl = movie.source === "cloudinary" || movie.source === "both"
          ? movie.cloudinaryUrl
          : movie.teraboxUrl;

        if (!movieUrl) return; // skip movies with no URL

        const thumbUrl = movie.thumbnail
          ? movie.thumbnail
          : movie.cloudinaryUrl
          ? `https://res.cloudinary.com/dagxhzebg/video/upload/f_jpg,c_fill,w_400/${movie.cloudinaryUrl.split("/").pop().replace(".mp4", ".jpg")}`
          : "https://placehold.co/400x225?text=No+Thumbnail";

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
// OPEN MOVIE PAGE
// ==============================
function openMovie(movieId) {
  window.location.href = `movie.html?id=${movieId}`;
}

// ==============================
// INCREMENT VIEWS
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
