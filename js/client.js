// HERO ELEMENTS
const hero = document.getElementById("hero");
const heroTitle = document.getElementById("hero-title");
const heroDesc = document.getElementById("hero-desc");
const playBtn = document.getElementById("play-btn");

const content = document.getElementById("content");

// ==============================
// HERO BANNER (FEATURED MOVIE)
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

      hero.style.backgroundImage = `
        linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.3)),
        url("https://res.cloudinary.com/dagxhzebg/video/upload/so_1,w_1280/${fileName.replace('.mp4','.jpg')}")
      `;

      heroTitle.textContent = movie.title;
      heroDesc.textContent = movie.description;

      playBtn.onclick = () => {
        window.open(movie.url, "_blank");
      };
    });
  })
  .catch(err => console.error(err));

// ==============================
// MOVIE LISTING (THUMBNAILS)
// ==============================
db.collection("movies")
  .orderBy("timestamp", "desc")
  .get()
  .then(snapshot => {
    const grouped = {};

    snapshot.forEach(doc => {
      const movie = doc.data();
      if (!grouped[movie.category]) grouped[movie.category] = [];
      grouped[movie.category].push(movie);
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
            <img 
              src="${thumbUrl}" 
              alt="${movie.title}" 
              loading="lazy"
              onclick="window.open('${movie.url}', '_blank')"
            />
            <a href="${movie.url}" download>Download</a>
          </div>
        `;
      });

      content.appendChild(row);
    }
  })
  .catch(err => console.error(err));
