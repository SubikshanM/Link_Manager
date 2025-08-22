let links = JSON.parse(localStorage.getItem("links")) || [];

const form = document.getElementById("linkForm");
const titleInput = document.getElementById("title");
const urlInput = document.getElementById("url");
const tagsInput = document.getElementById("tags");
const searchInput = document.getElementById("search");
const linksList = document.getElementById("linksList");

const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const importFile = document.getElementById("importFile");

// QR Code Modal elements
const qrModal = document.getElementById("qrModal");
const qrcodeDiv = document.getElementById("qrcode");
const closeBtn = document.querySelector(".close-btn");

function saveLinks() {
  localStorage.setItem("links", JSON.stringify(links));
}

function renderLinks(filter = "") {
  linksList.innerHTML = "";

  let filtered = links.filter(l =>
    l.title.toLowerCase().includes(filter.toLowerCase()) ||
    l.url.toLowerCase().includes(filter.toLowerCase()) ||
    (l.tags && l.tags.toLowerCase().includes(filter.toLowerCase()))
  );

  filtered.sort((a, b) => b.favorite - a.favorite);

  filtered.forEach((link) => {
    const li = document.createElement("li");
    li.className = "link-item";
    if (link.favorite) li.classList.add("favorite");

    const info = document.createElement("div");
    info.className = "link-info";
    info.innerHTML = `
      <a href="${link.url}" target="_blank">${link.title}</a><br>
      <small class="tags">${link.tags || ""}</small>
    `;

    const actions = document.createElement("div");

    const copyBtn = document.createElement("button");
    copyBtn.className = "action copy-btn";
    copyBtn.textContent = "Copy";
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(link.url);
      alert("URL copied!");
    };
    
    // QR Button to generate and show QR code
    const qrBtn = document.createElement("button");
    qrBtn.className = "action qr-btn";
    qrBtn.textContent = "QR";
    qrBtn.onclick = () => {
        // Clear the QR code container to prevent duplicates
        qrcodeDiv.innerHTML = "";
        
        // Generate and display the new QR code
        new QRCode(qrcodeDiv, link.url);
        qrModal.style.display = "block";
    };
    
    const favBtn = document.createElement("button");
    favBtn.className = "action favorite-btn";
    favBtn.textContent = link.favorite ? "★" : "☆";
    favBtn.onclick = () => {
      const linkIndex = links.findIndex(l => l.url === link.url);
      if (linkIndex !== -1) {
        links[linkIndex].favorite = !links[linkIndex].favorite;
        saveLinks();
        renderLinks(searchInput.value);
      }
    };

    const delBtn = document.createElement("button");
    delBtn.className = "action delete-btn";
    delBtn.textContent = "Delete";
    delBtn.onclick = () => {
      const linkIndex = links.findIndex(l => l.url === link.url);
      if (linkIndex !== -1) {
        links.splice(linkIndex, 1);
        saveLinks();
        renderLinks(searchInput.value);
      }
    };

    actions.append(copyBtn, qrBtn, favBtn, delBtn);
    li.append(info, actions);
    linksList.appendChild(li);
  });
}

// Close the QR code modal when the user clicks the close button
if (closeBtn) {
  closeBtn.onclick = () => {
    qrModal.style.display = "none";
  };
}

// Close the QR code modal when the user clicks anywhere outside of it
window.onclick = (event) => {
  if (event.target === qrModal) {
    qrModal.style.display = "none";
  }
};

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  const url = urlInput.value.trim();
  const tags = tagsInput.value.trim();

  if (!title || !url) return alert("Please enter both title and URL!");

  links.push({ title, url, tags, favorite: false });
  saveLinks();
  renderLinks();
  form.reset();
});

searchInput.addEventListener("input", () => {
  renderLinks(searchInput.value);
});

exportBtn.addEventListener("click", () => {
  const exportData = links.map(link => ({
    Title: link.title,
    URL: link.url,
    Tags: link.tags,
    Favorite: link.favorite ? 'Yes' : 'No'
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Links");
  XLSX.writeFile(wb, "links.xlsx");
});

importBtn.addEventListener("click", () => importFile.click());
importFile.addEventListener("change", (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();

  reader.onload = (event) => {
    const data = new Uint8Array(event.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const importedData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const sanitizedLinks = importedData
      .map(row => {
        const titleKey = Object.keys(row).find(k => k.toLowerCase() === 'title');
        const urlKey = Object.keys(row).find(k => k.toLowerCase() === 'url');
        const tagsKey = Object.keys(row).find(k => k.toLowerCase() === 'tags');
        const favoriteKey = Object.keys(row).find(k => k.toLowerCase() === 'favorite');
        
        return {
          title: titleKey ? row[titleKey] || "" : "",
          url: urlKey ? row[urlKey] || "" : "",
          tags: tagsKey ? row[tagsKey] || "" : "",
          favorite: favoriteKey ? (row[favoriteKey].toString().toLowerCase() === 'yes' || !!row[favoriteKey]) : false
        };
      })
      .filter(link => link.url);

    sanitizedLinks.forEach(importedLink => {
      const existingLinkIndex = links.findIndex(l => l.url === importedLink.url);

      if (existingLinkIndex !== -1) {
        links[existingLinkIndex] = importedLink;
      } else {
        links.push(importedLink);
      }
    });

    saveLinks();
    renderLinks();
  };
  reader.readAsArrayBuffer(file);
});

renderLinks();