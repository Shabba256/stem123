const params = new URLSearchParams(window.location.search);
const teraboxUrl = params.get("url");

if (!teraboxUrl) {
  document.body.innerHTML = "<h3 style='color:white; text-align:center'>Invalid TeraBox link</h3>";
  throw new Error("Missing TeraBox URL");
}

document.getElementById("teraboxBtn").href = teraboxUrl;
document.getElementById("downloaderBtn").href =
  "https://teradownloader.com/?url=" + encodeURIComponent(teraboxUrl);
