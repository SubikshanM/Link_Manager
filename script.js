let links = JSON.parse(localStorage.getItem("links")) || [];
let editingIndex = -1; // Track which link is being edited
let deletingUrl = null; // Track which link is being deleted

const form = document.getElementById("linkForm");
const titleInput = document.getElementById("title");
const urlInput = document.getElementById("url");
const tagsInput = document.getElementById("tags");
const searchInput = document.getElementById("search");
const linksList = document.getElementById("linksList");
const cancelBtn = document.getElementById("cancelBtn");

const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const importFile = document.getElementById("importFile");
const emptyState = document.getElementById("emptyState");
const tagSuggestionsContainer = document.getElementById("tagSuggestions");

// Smart tag suggestion based on URL
function generateTagSuggestions(url) {
  if (!url) return [];
  
  const suggestions = new Set();
  
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');
    const path = urlObj.pathname;
    
    // Domain-based suggestions
    const domainMap = {
      'github.com': ['coding', 'development', 'opensource'],
      'stackoverflow.com': ['coding', 'programming', 'help'],
      'youtube.com': ['video', 'tutorial', 'entertainment'],
      'youtu.be': ['video', 'tutorial'],
      'medium.com': ['article', 'blog', 'reading'],
      'dev.to': ['coding', 'article', 'development'],
      'twitter.com': ['social', 'news'],
      'x.com': ['social', 'news'],
      'linkedin.com': ['professional', 'networking'],
      'facebook.com': ['social'],
      'instagram.com': ['social', 'photos'],
      'reddit.com': ['community', 'discussion'],
      'wikipedia.org': ['reference', 'knowledge'],
      'docs.google.com': ['document', 'work'],
      'drive.google.com': ['storage', 'files'],
      'notion.so': ['productivity', 'notes'],
      'figma.com': ['design', 'ui'],
      'canva.com': ['design', 'graphics'],
      'aws.amazon.com': ['cloud', 'infrastructure'],
      'azure.microsoft.com': ['cloud', 'infrastructure'],
      'codepen.io': ['coding', 'frontend', 'demo'],
      'jsfiddle.net': ['coding', 'frontend', 'demo'],
      'npmjs.com': ['javascript', 'package', 'nodejs'],
      'pypi.org': ['python', 'package'],
      'coursera.org': ['education', 'learning'],
      'udemy.com': ['education', 'learning', 'course'],
      'netflix.com': ['entertainment', 'video'],
      'spotify.com': ['music', 'audio'],
      'amazon.com': ['shopping', 'ecommerce'],
      'ebay.com': ['shopping', 'ecommerce'],
      'vercel.app': ['deployment', 'web', 'project'],
      'netlify.app': ['deployment', 'web', 'project'],
      'onrender.com': ['deployment', 'web', 'project'],
      'herokuapp.com': ['deployment', 'web', 'project'],
      'railway.app': ['deployment', 'web', 'project'],
      'replit.com': ['coding', 'online', 'development']
    };
    
    // Check domain mappings
    Object.keys(domainMap).forEach(key => {
      if (domain.includes(key)) {
        domainMap[key].forEach(tag => suggestions.add(tag));
      }
    });
    
    // Extract keywords from entire domain (not just subdomain)
    const domainWords = domain.replace(/\.(com|net|org|io|app|dev|co|in)$/i, '').split(/[.-_]/).filter(word => word.length > 2);
    const commonKeywords = {
      'shop': 'shopping', 'store': 'shopping', 'buy': 'shopping', 'cart': 'shopping',
      'blog': 'blog', 'post': 'blog', 'article': 'article',
      'news': 'news', 'media': 'news', 'press': 'news',
      'video': 'video', 'watch': 'video', 'tube': 'video', 'stream': 'video',
      'music': 'music', 'audio': 'audio', 'sound': 'audio', 'podcast': 'podcast',
      'doc': 'documentation', 'docs': 'documentation', 'wiki': 'documentation', 'guide': 'guide',
      'api': 'api', 'developer': 'development', 'dev': 'development', 'code': 'coding',
      'social': 'social', 'chat': 'chat', 'forum': 'forum', 'community': 'community',
      'learn': 'learning', 'course': 'course', 'edu': 'education', 'school': 'education',
      'game': 'gaming', 'play': 'gaming', 'sport': 'sports',
      'health': 'health', 'fitness': 'fitness', 'medical': 'health',
      'food': 'food', 'recipe': 'food', 'cook': 'food',
      'travel': 'travel', 'hotel': 'travel', 'flight': 'travel',
      'book': 'books', 'read': 'reading', 'library': 'books',
      'photo': 'photography', 'image': 'images', 'pic': 'photography',
      'cloud': 'cloud', 'storage': 'storage', 'drive': 'storage',
      'mail': 'email', 'email': 'email', 'message': 'messaging',
      'work': 'productivity', 'job': 'career', 'hire': 'career',
      'finance': 'finance', 'bank': 'finance', 'money': 'finance',
      'tech': 'technology', 'digital': 'technology', 'software': 'software',
      'design': 'design', 'creative': 'design', 'art': 'art',
      'dashboard': 'dashboard', 'admin': 'admin', 'panel': 'admin'
    };
    
    domainWords.forEach(word => {
      const lowerWord = word.toLowerCase();
      if (commonKeywords[lowerWord]) {
        suggestions.add(commonKeywords[lowerWord]);
      } else if (word.length > 4 && !['www', 'http', 'https'].includes(lowerWord)) {
        // Add meaningful domain words as tags
        suggestions.add(lowerWord);
      }
    });
    
    // Path-based analysis (more comprehensive)
    const pathParts = path.toLowerCase().split(/[\/\-_.]/).filter(word => word.length > 2);
    pathParts.forEach(part => {
      if (commonKeywords[part]) {
        suggestions.add(commonKeywords[part]);
      }
    });
    
    // TLD-based suggestions
    if (domain.endsWith('.edu')) suggestions.add('education');
    if (domain.endsWith('.gov')) suggestions.add('government');
    if (domain.endsWith('.org')) suggestions.add('organization');
    if (domain.endsWith('.io')) suggestions.add('tech');
    if (domain.endsWith('.dev')) suggestions.add('development');
    if (domain.endsWith('.app')) suggestions.add('application');
    
    // Hosting platform detection
    if (domain.includes('github.io')) suggestions.add('github-pages');
    if (domain.includes('pages.dev')) suggestions.add('cloudflare');
    if (domain.includes('azurewebsites.net')) suggestions.add('azure');
    if (domain.includes('amplifyapp.com')) suggestions.add('aws');
    
    // Always ensure at least one suggestion
    if (suggestions.size === 0) {
      suggestions.add('website');
      suggestions.add('link');
    }
    
  } catch (e) {
    // Invalid URL, return empty suggestions
  }
  
  return Array.from(suggestions).slice(0, 5); // Limit to 5 suggestions
}

function displayTagSuggestions(suggestions) {
  tagSuggestionsContainer.innerHTML = '';
  
  if (suggestions.length === 0) {
    tagSuggestionsContainer.classList.remove('show');
    return;
  }
  
  tagSuggestionsContainer.classList.add('show');
  
  const label = document.createElement('div');
  label.className = 'suggestions-label';
  label.innerHTML = '<i class="fas fa-lightbulb"></i><span>Suggested tags:</span>';
  tagSuggestionsContainer.appendChild(label);
  
  suggestions.forEach(tag => {
    const chip = document.createElement('div');
    chip.className = 'tag-suggestion-chip';
    chip.innerHTML = `<i class="fas fa-plus"></i><span>${tag}</span>`;
    chip.onclick = () => {
      const currentTags = tagsInput.value.trim();
      const tagsArray = currentTags ? currentTags.split(',').map(t => t.trim()) : [];
      
      if (!tagsArray.includes(tag)) {
        tagsArray.push(tag);
        tagsInput.value = tagsArray.join(', ');
        showToast(`Tag "${tag}" added!`, 'success');
        
        // Remove this suggestion
        chip.remove();
        
        // If no more suggestions, hide container
        if (tagSuggestionsContainer.querySelectorAll('.tag-suggestion-chip').length === 0) {
          tagSuggestionsContainer.classList.remove('show');
        }
      } else {
        showToast(`Tag "${tag}" already added`, 'info');
      }
    };
    tagSuggestionsContainer.appendChild(chip);
  });
}

// Listen to URL input changes
urlInput.addEventListener('input', () => {
  const url = urlInput.value.trim();
  if (url) {
    const suggestions = generateTagSuggestions(url);
    displayTagSuggestions(suggestions);
    
    // Clear tags input when URL changes (not in edit mode)
    if (editingIndex === -1) {
      tagsInput.value = '';
    }
  } else {
    displayTagSuggestions([]);
    // Clear tags when URL is empty
    if (editingIndex === -1) {
      tagsInput.value = '';
    }
  }
});

// Listen to URL paste events
urlInput.addEventListener('paste', (e) => {
  setTimeout(() => {
    const url = urlInput.value.trim();
    if (url) {
      const suggestions = generateTagSuggestions(url);
      displayTagSuggestions(suggestions);
    }
  }, 150);
});

// Also trigger on change event (covers paste, autofill, etc)
urlInput.addEventListener('change', () => {
  const url = urlInput.value.trim();
  if (url) {
    const suggestions = generateTagSuggestions(url);
    displayTagSuggestions(suggestions);
  }
});

// QR Code Modal elements
const qrModal = document.getElementById("qrModal");
const qrcodeDiv = document.getElementById("qrcode");
const closeBtn = document.querySelector(".close-btn");

// Delete Modal elements
const deleteModal = document.getElementById("deleteModal");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");

// Download QR code button
const downloadQrBtn = document.getElementById("downloadQrBtn");
if (downloadQrBtn) {
  downloadQrBtn.onclick = () => {
    const canvas = qrcodeDiv.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `qrcode-${Date.now()}.png`;
      link.href = url;
      link.click();
      showToast('QR code downloaded!', 'success');
    }
  };
}

// Toast notification function
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = type === 'success' ? 'fa-check-circle' : 
               type === 'error' ? 'fa-exclamation-circle' : 
               type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle';
  
  toast.innerHTML = `
    <i class="fas ${icon}"></i>
    <span>${message}</span>
  `;
  
  container.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Remove toast after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

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

  // Show/hide empty state
  if (links.length === 0) {
    emptyState.classList.add('show');
    linksList.style.display = 'none';
  } else {
    emptyState.classList.remove('show');
    linksList.style.display = 'block';
  }

  // Sort: favorites first, then by creation order (newer first)
  filtered.sort((a, b) => {
    if (b.favorite !== a.favorite) {
      return b.favorite - a.favorite; // Favorites first
    }
    // If both are favorites or both are not, maintain original order
    return links.indexOf(b) - links.indexOf(a);
  });

  filtered.forEach((link) => {
    const li = document.createElement("li");
    li.className = "link-item";
    if (link.favorite) li.classList.add("favorite");

    const info = document.createElement("div");
    info.className = "link-info";
    
    // Extract domain for favicon
    let domain;
    try {
      domain = new URL(link.url).hostname;
    } catch (e) {
      domain = '';
    }
    
    const faviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=32` : '';
    
    info.innerHTML = `
      <div class="link-content">
        ${faviconUrl ? `<img src="${faviconUrl}" class="link-favicon" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM5Y2EzYWYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTAgMTNhNSA1IDAgMCAwIDcuNTQgNC4zOWw0LjI5IDQuMjltLTcuODMtNC4zOUE1IDUgMCAxIDAgNS40NiA4Ljg5bS00LjI5LTQuMjltMTMuNjYgMTMuNjZMMy0zIi8+PC9zdmc+'">` : '<div class="link-favicon-placeholder"><i class="fas fa-link"></i></div>'}
        <div class="link-text">
          <a href="${link.url}" target="_blank">${link.title}</a>
          <div class="link-url">${domain || link.url}</div>
        </div>
      </div>
      ${link.tags ? `<small class="tags">${link.tags}</small>` : ''}
    `;

    const actions = document.createElement("div");

    const copyBtn = document.createElement("button");
    copyBtn.className = "action copy-btn";
    copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
    copyBtn.title = "Copy URL";
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(link.url);
      showToast('URL copied to clipboard!', 'success');
    };
    
    // QR Button to generate and show QR code
    const qrBtn = document.createElement("button");
    qrBtn.className = "action qr-btn";
    qrBtn.innerHTML = '<i class="fas fa-qrcode"></i>';
    qrBtn.title = "Generate QR Code";
    qrBtn.onclick = () => {
        qrcodeDiv.innerHTML = "";
        new QRCode(qrcodeDiv, {
          text: link.url,
          width: 200,
          height: 200,
          colorDark: "#1f2937",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.H
        });
        qrModal.classList.add("show");
        document.body.style.overflow = "hidden";
    };
    
    const editBtn = document.createElement("button");
    editBtn.className = "action edit-btn";
    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
    editBtn.title = "Edit Link";
    editBtn.onclick = () => {
      editingIndex = links.findIndex(l => l.url === link.url);
      if (editingIndex !== -1) {
        titleInput.value = links[editingIndex].title;
        urlInput.value = links[editingIndex].url;
        tagsInput.value = links[editingIndex].tags || '';
        
        // Generate suggestions for editing
        const suggestions = generateTagSuggestions(links[editingIndex].url);
        displayTagSuggestions(suggestions);
        
        // Change button text to indicate editing
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-save"></i><span>Update Link</span>';
        submitBtn.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
        
        // Show cancel button
        cancelBtn.style.display = 'inline-flex';
        
        // Scroll to form
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
        titleInput.focus();
        
        showToast('Editing link...', 'info');
      }
    };
    
    const favBtn = document.createElement("button");
    favBtn.className = "action favorite-btn";
    favBtn.innerHTML = link.favorite ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
    favBtn.title = link.favorite ? "Remove from Favorites" : "Add to Favorites";
    favBtn.onclick = () => {
      const linkIndex = links.findIndex(l => l.url === link.url);
      if (linkIndex !== -1) {
        links[linkIndex].favorite = !links[linkIndex].favorite;
        saveLinks();
        renderLinks(searchInput.value);
        showToast(links[linkIndex].favorite ? 'Added to favorites!' : 'Removed from favorites', 'success');
      }
    };

    const delBtn = document.createElement("button");
    delBtn.className = "action delete-btn";
    delBtn.innerHTML = '<i class="fas fa-trash"></i>';
    delBtn.title = "Delete Link";
    delBtn.onclick = () => {
      deletingUrl = link.url;
      deleteModal.classList.add("show");
      document.body.style.overflow = "hidden";
    };

    actions.append(copyBtn, qrBtn, editBtn, favBtn, delBtn);
    li.append(info, actions);
    linksList.appendChild(li);
  });
}

// Delete confirmation handlers
if (confirmDeleteBtn) {
  confirmDeleteBtn.onclick = () => {
    const linkIndex = links.findIndex(l => l.url === deletingUrl);
    if (linkIndex !== -1) {
      links.splice(linkIndex, 1);
      saveLinks();
      renderLinks(searchInput.value);
      showToast('Link deleted successfully', 'success');
    }
    deleteModal.classList.remove("show");
    document.body.style.overflow = "auto";
    deletingUrl = null;
  };
}

if (cancelDeleteBtn) {
  cancelDeleteBtn.onclick = () => {
    deleteModal.classList.remove("show");
    document.body.style.overflow = "auto";
    deletingUrl = null;
  };
}

// Download QR code handler
if (downloadQrBtn) {
  downloadQrBtn.onclick = () => {
    const canvas = qrcodeDiv.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `qrcode-${Date.now()}.png`;
      link.href = url;
      link.click();
      showToast('QR code downloaded!', 'success');
    }
  };
}

// Close the QR code modal when the user clicks the close button
if (closeBtn) {
  closeBtn.onclick = () => {
    qrModal.classList.remove("show");
    document.body.style.overflow = "auto";
  };
}

// Close modals when clicking outside
window.onclick = (event) => {
  if (event.target === qrModal) {
    qrModal.classList.remove("show");
    document.body.style.overflow = "auto";
  }
  if (event.target === deleteModal) {
    deleteModal.classList.remove("show");
    document.body.style.overflow = "auto";
    deletingUrl = null;
  }
};

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  const url = urlInput.value.trim();
  const tags = tagsInput.value.trim();

  if (!title || !url) {
    showToast('Please enter both title and URL!', 'error');
    return;
  }

  // Check for duplicate URL (excluding current editing link)
  const duplicateIndex = links.findIndex(l => l.url === url);
  if (duplicateIndex !== -1 && duplicateIndex !== editingIndex) {
    showToast('This URL already exists in your links!', 'warning');
    return;
  }

  if (editingIndex !== -1) {
    // Update existing link
    links[editingIndex] = { 
      ...links[editingIndex],
      title, 
      url, 
      tags 
    };
    showToast('Link updated successfully!', 'success');
    editingIndex = -1;
    
    // Reset buttons
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.innerHTML = '<i class="fas fa-plus"></i><span>Add Link</span>';
    submitBtn.style.background = '';
    cancelBtn.style.display = 'none';
    cancelBtn.style.display = 'none';
  } else {
    // Add new link
    links.push({ title, url, tags, favorite: false });
    showToast('Link added successfully!', 'success');
  }
  
  saveLinks();
  renderLinks();
  form.reset();
  displayTagSuggestions([]); // Clear suggestions
});

// Cancel edit mode
cancelBtn.addEventListener('click', () => {
  editingIndex = -1;
  form.reset();
  displayTagSuggestions([]);
  
  // Reset buttons
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.innerHTML = '<i class="fas fa-plus"></i><span>Add Link</span>';
  submitBtn.style.background = '';
  cancelBtn.style.display = 'none';
  
  showToast('Edit cancelled', 'info');
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
    showToast(`Imported ${sanitizedLinks.length} links successfully!`, 'success');
  };
  reader.readAsArrayBuffer(file);
});

renderLinks();