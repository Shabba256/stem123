// ==============================
// HERO ELEMENTS
// ==============================
const hero = document.getElementById("hero");
const heroTitle = document.getElementById("hero-title");
const heroDesc = document.getElementById("hero-desc");
const playBtn = document.getElementById("play-btn");
const content = document.getElementById("content");

// ==============================
// FEATURED HERO MOVIE
// ==============================
db.collection("movies")
  .where("featured", "==", true)
  .orderBy("timestamp", "desc")
  .limit(1)
  .get()
  .then(snapshot => {
    snapshot.forEach(doc => {
      const movie = doc.data();
      const fileName = movie.url.split("/").pop();

      // Hero background
      hero.style.backgroundImage = `
        linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.3)),
        url("https://res.cloudinary.com/dagxhzebg/video/upload/so_1,w_1280/${fileName.replace('.mp4','.jpg')}")
      `;
      heroTitle.textContent = movie.title;
      heroDesc.textContent = movie.description;

      playBtn.onclick = () => {
        window.open(movie.url, "_blank");
        incrementViews(doc.id);
      };
    });
  })
  .catch(err => console.error("Hero error:", err));

// ==============================
// MOVIE LISTING (GROUPED BY CATEGORY)
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
  });
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
  });
}

function playMovie(movieId, url) {
  window.open(url, "_blank");
  incrementViews(movieId);
}
