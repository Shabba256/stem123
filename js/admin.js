// ==============================
// UPLOAD VIDEO (WITH OPTIONAL THUMBNAIL)
// ==============================
function uploadVideo() {
  if (!currentUser) { notify("Admin not logged in", "error"); return; }

  const videoFile = document.getElementById("videoFile").files[0];
  const thumbnailFile = document.getElementById("thumbnailFile").files[0]; // optional
  const title = document.getElementById("title").value.trim();
  const category = document.getElementById("category").value.trim();
  const description = document.getElementById("description").value.trim() || "Watch the latest release now";
  const featured = document.getElementById("featured").checked;

  if (!videoFile || !title || !category) { notify("Fill all required fields", "error"); return; }

  const progressBox = document.getElementById("progress-container");
  const progressBar = document.getElementById("progress-bar");
  const progressText = document.getElementById("progress-text");

  // Reset progress UI
  progressBox.classList.remove("hidden");
  progressBar.style.width = "0%";
  progressText.textContent = "Uploading 0%";

  // Helper: auto-generate thumbnail from video URL
  function generateThumbnailFromVideo(videoUrl) {
    const fileName = videoUrl.split("/").pop().replace(".mp4", ".jpg");
    return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/so_1,w_400/${fileName}`;
  }

  // --------------------------
  // UPLOAD VIDEO FIRST
  // --------------------------
  const data = new FormData();
  data.append("file", videoFile);
  data.append("upload_preset", UPLOAD_PRESET);

  const xhr = new XMLHttpRequest();
  xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`);

  xhr.upload.onprogress = e => {
    if (e.lengthComputable) {
      const percent = Math.round((e.loaded / e.total) * 100);
      progressBar.style.width = percent + "%";
      progressText.textContent = `Uploading video ${percent}%`;
    }
  };

  xhr.onload = () => {
    if (xhr.status !== 200) { notify("Video upload failed", "error"); resetProgress(); return; }
    let videoUrl;
    try {
      const result = JSON.parse(xhr.responseText);
      videoUrl = result.secure_url;
      if (!videoUrl) throw new Error("Invalid video URL");
    } catch (err) {
      notify("Video upload parse failed", "error");
      resetProgress();
      return;
    }

    // --------------------------
    // UPLOAD THUMBNAIL IF EXISTS
    // --------------------------
    if (thumbnailFile) {
      const thumbData = new FormData();
      thumbData.append("file", thumbnailFile);
      thumbData.append("upload_preset", UPLOAD_PRESET);

      const thumbXhr = new XMLHttpRequest();
      thumbXhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);

      thumbXhr.upload.onprogress = e => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          progressBar.style.width = percent + "%";
          progressText.textContent = `Uploading thumbnail ${percent}%`;
        }
      };

      thumbXhr.onload = () => {
        let thumbnailUrl;
        try {
          const thumbResult = JSON.parse(thumbXhr.responseText);
          thumbnailUrl = thumbResult.secure_url || generateThumbnailFromVideo(videoUrl);
        } catch (err) {
          notify("Thumbnail upload failed, using auto screenshot", "info");
          thumbnailUrl = generateThumbnailFromVideo(videoUrl);
        }
        saveMovieToFirestore(title, category, description, featured, videoUrl, thumbnailUrl);
      };

      thumbXhr.onerror = () => {
        notify("Thumbnail upload failed, using auto screenshot", "info");
        saveMovieToFirestore(title, category, description, featured, videoUrl, generateThumbnailFromVideo(videoUrl));
      };

      thumbXhr.send(thumbData);
    } else {
      // No custom thumbnail → use auto screenshot
      saveMovieToFirestore(title, category, description, featured, videoUrl, generateThumbnailFromVideo(videoUrl));
    }
  };

  xhr.onerror = () => { notify("Network error during video upload", "error"); resetProgress(); };
  xhr.send(data);

  // --------------------------
  // RESET PROGRESS FUNCTION
  // --------------------------
  function resetProgress() {
    progressBar.style.width = "0%";
    progressText.textContent = "";
    progressBox.classList.add("hidden");
  }
}

// ==============================
// SAVE MOVIE TO FIRESTORE
// ==============================
function saveMovieToFirestore(title, category, description, featured, videoUrl, thumbnailUrl) {
  db.collection("movies").add({
    title,
    category,
    description,
    url: videoUrl,
    thumbnail: thumbnailUrl,
    featured,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    views: 0,
    downloads: 0
  }).then(() => {
    // Reset inputs & progress
    const progressBox = document.getElementById("progress-container");
    const progressBar = document.getElementById("progress-bar");
    const progressText = document.getElementById("progress-text");

    progressBar.style.width = "100%";
    progressText.textContent = "Upload complete ✅";

    setTimeout(() => {
      progressBar.style.width = "0%";
      progressText.textContent = "";
      progressBox.classList.add("hidden");
    }, 1000);

    document.getElementById("videoFile").value = "";
    document.getElementById("thumbnailFile").value = "";
    document.getElementById("title").value = "";
    document.getElementById("category").value = "";
    document.getElementById("description").value = "";
    document.getElementById("featured").checked = false;

    notify("Movie uploaded successfully", "success");
  }).catch(err => notify("Firestore error: " + err.message, "error"));
}
