let currentUser = null;

function notify(message,type="info"){
  const n=document.createElement("div");
  n.className=`notification ${type}`;
  n.textContent=message;
  document.body.appendChild(n);
  setTimeout(()=>n.remove(),3000);
}

function adminLogin(){
  const email=document.getElementById("email").value.trim();
  const password=document.getElementById("password").value.trim();
  if(!email||!password){ notify("Enter email and password","error"); return; }

  auth.signInWithEmailAndPassword(email,password)
    .then(({user})=>{
      if(user.uid!==ADMIN_UID){ notify("Not authorized","error"); auth.signOut(); return; }
      currentUser=user;
      document.getElementById("panel").classList.remove("hidden");
      document.getElementById("login").style.display="none";
      loadAdminMovies();
      notify("Admin logged in ✅","success");
    })
    .catch(err=>notify("Login failed: "+err.message,"error"));
}

function uploadVideo(){
  if(!currentUser){ notify("Admin not logged in","error"); return; }

  const videoFile=document.getElementById("videoFile").files[0];
  const posterFile=document.getElementById("posterFile").files[0];
  const title=document.getElementById("title").value.trim();
  const category=document.getElementById("category").value.trim();
  const description=document.getElementById("description").value.trim()||"Watch the latest release now";
  const featured=document.getElementById("featured").checked;

  if(!videoFile||!posterFile||!title||!category){ notify("Fill all required fields and poster is mandatory","error"); return; }

  const progressBar=document.getElementById("progress-bar");
  const progressText=document.getElementById("progress-text");
  const progressContainer=document.getElementById("progress-container");

  progressContainer.classList.remove("hidden");
  progressBar.style.width="0%";
  progressText.textContent="Uploading 0%";

  // Upload video
  const videoData=new FormData();
  videoData.append("file",videoFile);
  videoData.append("upload_preset",UPLOAD_PRESET);

  const xhr=new XMLHttpRequest();
  xhr.open("POST",`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`);

  xhr.upload.onprogress=e=>{
    if(e.lengthComputable){
      const percent=Math.round((e.loaded/e.total)*100);
      progressBar.style.width=percent+"%";
      progressText.textContent=`Uploading video ${percent}%`;
    }
  };

  xhr.onload=()=>{
    if(xhr.status!==200){ notify("Video upload failed","error"); return; }
    const result=JSON.parse(xhr.responseText);
    const videoUrl=result.secure_url;
    if(!videoUrl){ notify("Invalid video response","error"); return; }

    // Upload poster
    const posterData=new FormData();
    posterData.append("file",posterFile);
    posterData.append("upload_preset",UPLOAD_PRESET);

    const posterXhr=new XMLHttpRequest();
    posterXhr.open("POST",`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);

    posterXhr.upload.onprogress=e=>{
      if(e.lengthComputable){
        const percent=Math.round((e.loaded/e.total)*100);
        progressBar.style.width=percent+"%";
        progressText.textContent=`Uploading poster ${percent}%`;
      }
    };

    posterXhr.onload=()=>{
      const posterResult=JSON.parse(posterXhr.responseText);
      const posterUrl=posterResult.secure_url;
      if(!posterUrl){ notify("Poster upload failed","error"); return; }
      saveMovieToFirestore(title,category,description,featured,videoUrl,posterUrl);
    };

    posterXhr.onerror=()=>notify("Poster upload failed","error");
    posterXhr.send(posterData);
  };

  xhr.onerror=()=>notify("Video upload network error","error");
  xhr.send(videoData);
}

function saveMovieToFirestore(title,category,description,featured,videoUrl,posterUrl){
  db.collection("movies").add({
    title,category,description,url:videoUrl,thumbnail:posterUrl,featured,timestamp:firebase.firestore.FieldValue.serverTimestamp(),views:0,downloads:0
  }).then(()=>{
    document.getElementById("progress-bar").style.width="0%";
    document.getElementById("progress-text").textContent="";
    document.getElementById("progress-container").classList.add("hidden");

    ["videoFile","posterFile","title","category","description"].forEach(id=>document.getElementById(id).value="");
    document.getElementById("featured").checked=false;
    notify("Movie uploaded successfully ✅","success");
  }).catch(err=>notify("Firestore error: "+err.message,"error"));
}

// loadAdminMovies(), toggleFeatured() etc remain identical to previous admin.js
auth.onAuthStateChanged(user=>{
  if(user&&user.uid===ADMIN_UID){ currentUser=user; loadAdminMovies(); }
});
