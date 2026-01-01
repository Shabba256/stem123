function login() {
const pass = document.getElementById("password").value;
if (pass === ADMIN_PASSWORD) {
document.getElementById("panel").classList.remove("hidden");
document.getElementById("login").style.display = "none";
} else {
alert("Wrong password");
}
}


function uploadVideo() {
const file = document.getElementById("videoFile").files[0];
const title = document.getElementById("title").value;
const category = document.getElementById("category").value;


if (!file || !title || !category) {
alert("Fill all fields");
return;
}


const data = new FormData();
data.append("file", file);
data.append("upload_preset", UPLOAD_PRESET);


fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
method: "POST",
body: data
})
.then(res => res.json())
.then(result => {
const movies = JSON.parse(localStorage.getItem("movies") || "[]");
movies.push({ title, category, url: result.secure_url });
localStorage.setItem("movies", JSON.stringify(movies));
alert("Upload successful");
})
.catch(err => alert("Upload failed: " + err));
}