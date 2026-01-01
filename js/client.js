const movies = JSON.parse(localStorage.getItem("movies") || "[]");
const content = document.getElementById("content");

const grouped = {};
movies.forEach(m => {
  if (!grouped[m.category]) grouped[m.category] = [];
  grouped[m.category].push(m);
});

for (const category in grouped) {
  const row = document.createElement("div");
  row.className = "row";
  row.innerHTML = `<h2>${category}</h2><div class="list"></div>`;

  grouped[category].forEach(movie => {
    row.querySelector(".list").innerHTML += `
      <div class="card">
        <video src="${movie.url}" controls></video>
        <a href="${movie.url}" download>Download</a>
      </div>
    `;
  });

  content.appendChild(row);
}