const params = new URLSearchParams(window.location.search);
const teraboxUrl = params.get("url");

if (!teraboxUrl) {
  document.body.innerHTML = "<h3 style='color:white'>Invalid TeraBox link</h3>";
  throw new Error("Missing TeraBox URL");
}

// Populate the direct link input
const directLinkInput = document.getElementById("directLink");
directLinkInput.value = teraboxUrl;

// TeraDownloader button
const downloaderBtn = document.getElementById("downloaderBtn");
downloaderBtn.href = "https://teradownloader.com/?url=" + encodeURIComponent(teraboxUrl);

// Copy button logic
const copyBtn = document.getElementById("copyBtn");
copyBtn.onclick = () => {
  directLinkInput.select();
  directLinkInput.setSelectionRange(0, 99999); // for mobile
  navigator.clipboard.writeText(directLinkInput.value)
    .then(() => alert("Link copied to clipboard ✅"))
    .catch(() => alert("Failed to copy link ❌"));
};
