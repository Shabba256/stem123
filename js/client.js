const hero = document.getElementById("hero");
const heroTitle = document.getElementById("hero-title");
const heroDesc = document.getElementById("hero-desc");
const playBtn = document.getElementById("play-btn");


const content = document.getElementById("content");


//  HERO BANNER CODE 
db.collection("movies")
  .where("featured", "==", true)
  .orderBy("timestamp", "desc")
  .limit(1)
  .get()
  .then(snapshot => {
    snapshot.forEach(doc => {
      const movie = doc.data();

      hero.style.backgroundImage = `
        linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.3)),
        url("https://res.cloudinary.com/dagxhzebg/video/upload/w_1280,so_1/${movie.url.split('/').pop()}")
      `;

      heroTitle.textContent = movie.title;
      heroDesc.textContent = movie.description;
    });
  });

// EXISTING MOVIE LISTING CODE 
db.collection("movies")
  .orderBy("timestamp", "desc")
  .get()
  .then(snapshot => {
    const grouped = {};
    snapshot.forEach(doc => {
      const m = doc.data();
      if (!grouped[m.category]) grouped[m.category] = [];
      grouped[m.category].push(m);
    });

    for (const category in grouped) {
      const row = document.createElement("div");
      row.className = "row";
      row.innerHTML = `<h2>${category}</h2><div class="list"></div>`;

      grouped[category].forEach(movie => {
        row.querySelector(".list").innerHTML += `
          <div class="card" data-title="${movie.title}">
            <video src="${movie.url}" muted></video>
            <a href="${movie.url}" download>Download</a>
          </div>`;
      });

      content.appendChild(row);
    }
  });
