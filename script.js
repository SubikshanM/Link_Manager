let links = JSON.parse(localStorage.getItem("links")) || [];
let folders = JSON.parse(localStorage.getItem("folders")) || ['General'];
let currentFolder = 'all'; // 'all', 'favorites', or folder name
let editingIndex = -1;
let deletingUrl = null;

let isSelectionMode = false;
let selectedLinks = new Set();


let draggedItem = null;
let draggedItemType = null;
let draggedItemIndex = -1;
let draggedLinkUrl = null;

const form = document.getElementById("linkForm");
const titleInput = document.getElementById("title");
const urlInput = document.getElementById("url");
const tagsInput = document.getElementById("tags");
const folderSelect = document.getElementById("folderSelect");
const searchInput = document.getElementById("search");
const linksList = document.getElementById("linksList");
const cancelBtn = document.getElementById("cancelBtn");

const toggleSelectBtn = document.getElementById("toggleSelectBtn");
const bulkActionBar = document.getElementById("bulkActionBar");
const selectedCount = document.getElementById("selectedCount");
const bulkMoveSelect = document.getElementById("bulkMoveSelect");
const bulkFavBtn = document.getElementById("bulkFavBtn");
const bulkDelBtn = document.getElementById("bulkDelBtn");


const folderList = document.getElementById("folderList");
const fixedFolders = document.getElementById("fixedFolders");
const addFolderBtn = document.getElementById("addFolderBtn");

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

function saveFolders() {
  localStorage.setItem("folders", JSON.stringify(folders));
}

function renderFolders() {
  folderList.innerHTML = "";
  folderSelect.innerHTML = "";
  
  fixedFolders.querySelectorAll('.folder-item').forEach(el => {
    if (el.dataset.folder === currentFolder) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });

  folders.forEach((folder, index) => {
    const li = document.createElement("li");
    li.className = "folder-item";
    if (currentFolder === folder) li.classList.add("active");
    li.dataset.folder = folder;
    li.draggable = true;
    
    li.innerHTML = `
      <i class="fas fa-folder"></i> <span>${folder}</span>
      ${folder !== 'General' ? `
      <div class="folder-actions">
        <button class="delete-folder-btn" title="Delete folder"><i class="fas fa-times"></i></button>
      </div>` : ''}
    `;
    
    li.addEventListener('click', (e) => {
      if(e.target.closest('.delete-folder-btn')) return;
      currentFolder = folder;
      if (isSelectionMode) toggleSelectionMode();
      renderFolders();
      renderLinks(searchInput.value);
      if (window.innerWidth <= 768 && typeof closeMobileMenu === 'function') closeMobileMenu();
    });

    if (folder !== 'General') {
      const delBtn = li.querySelector('.delete-folder-btn');
      delBtn.onclick = (e) => {
        e.stopPropagation();
        if (confirm(`Delete folder "${folder}"? Links will be moved to General.`)) {
          links.forEach(l => {
            if (l.folder === folder) l.folder = 'General';
          });
          saveLinks();
          folders.splice(index, 1);
          saveFolders();
          if (currentFolder === folder) currentFolder = 'all';
          renderFolders();
          renderLinks(searchInput.value);
        }
      };
    }

    setupFolderDragAndDrop(li, folder, index);
    folderList.appendChild(li);

    const option = document.createElement("option");
    option.value = folder;
    option.textContent = folder;
    if (currentFolder === folder) option.selected = true;
    folderSelect.appendChild(option);
  });
}

fixedFolders.addEventListener('click', (e) => {
  const item = e.target.closest('.folder-item');
  if (item) {
    currentFolder = item.dataset.folder;
    if (isSelectionMode) toggleSelectionMode();
    renderFolders();
    renderLinks(searchInput.value);
    if (window.innerWidth <= 768 && typeof closeMobileMenu === 'function') closeMobileMenu();
  }
});

// Allow dropping links on "All Links" (moves to General) and "Favorites" (marks as fav)
fixedFolders.querySelectorAll('.folder-item').forEach(li => {
  li.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (draggedItemType === 'link') {
      li.classList.add('drag-over');
    }
  });
  li.addEventListener('dragleave', () => li.classList.remove('drag-over'));
  li.addEventListener('drop', (e) => {
    e.preventDefault();
    li.classList.remove('drag-over');
    if (draggedItemType === 'link') {
      const linkIndex = links.findIndex(l => l.url === draggedLinkUrl);
      if (linkIndex !== -1) {
        if (li.dataset.folder === 'all') {
          links[linkIndex].folder = 'General';
          showToast('Moved to General', 'success');
        } else if (li.dataset.folder === 'favorites') {
          links[linkIndex].favorite = true;
          showToast('Added to Favorites', 'success');
        }
        saveLinks();
        renderLinks(searchInput.value);
      }
    }
  });
});

addFolderBtn.addEventListener('click', () => {
  const name = prompt("Enter new folder name:");
  if (name && name.trim() !== '') {
    const trimmed = name.trim();
    if (folders.includes(trimmed) || trimmed.toLowerCase() === 'all' || trimmed.toLowerCase() === 'favorites') {
      showToast('Folder already exists!', 'error');
    } else {
      folders.push(trimmed);
      saveFolders();
      renderFolders();
      showToast('Folder created!', 'success');
    }
  }
});

function setupFolderDragAndDrop(li, folderName, folderIndex) {
  li.addEventListener('dragstart', (e) => {
    draggedItem = li;
    draggedItemType = 'folder';
    draggedItemIndex = folderIndex;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => li.style.opacity = '0.5', 0);
  });

  li.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (draggedItemType === 'folder' && draggedItem !== li) {
      li.classList.add('drag-over');
    } else if (draggedItemType === 'link') {
      li.classList.add('drag-over');
    }
  });

  li.addEventListener('dragleave', () => li.classList.remove('drag-over'));

  li.addEventListener('drop', (e) => {
    e.preventDefault();
    li.classList.remove('drag-over');
    
    if (draggedItemType === 'folder' && draggedItem !== li) {
      const fromIndex = draggedItemIndex;
      const toIndex = folderIndex;
      const movedFolder = folders.splice(fromIndex, 1)[0];
      folders.splice(toIndex, 0, movedFolder);
      saveFolders();
      renderFolders();
    } else if (draggedItemType === 'link') {
      const linkIndex = links.findIndex(l => l.url === draggedLinkUrl);
      if (linkIndex !== -1 && links[linkIndex].folder !== folderName) {
        links[linkIndex].folder = folderName;
        saveLinks();
        renderLinks(searchInput.value);
        showToast(`Moved to ${folderName}`, 'success');
      }
    }
  });

  li.addEventListener('dragend', () => {
    li.style.opacity = '1';
    draggedItem = null;
    draggedItemType = null;
  });
}

function setupLinkDragAndDrop(li, linkObj) {
  li.addEventListener('dragstart', (e) => {
    draggedItem = li;
    draggedItemType = 'link';
    draggedLinkUrl = linkObj.url;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => li.classList.add('dragging'), 0);
  });

  li.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (draggedItemType === 'link' && draggedItem !== li) {
      const bounding = li.getBoundingClientRect();
      const offset = bounding.y + (bounding.height / 2);
      if (e.clientY - offset > 0) {
        li.style.borderBottom = '2px solid #667eea';
        li.style.borderTop = '';
      } else {
        li.style.borderTop = '2px solid #667eea';
        li.style.borderBottom = '';
      }
    }
  });

  li.addEventListener('dragleave', () => {
    li.style.borderTop = '';
    li.style.borderBottom = '';
  });

  li.addEventListener('drop', (e) => {
    e.preventDefault();
    li.style.borderTop = '';
    li.style.borderBottom = '';
    
    if (draggedItemType === 'link' && draggedItem !== li) {
      const fromIndex = links.findIndex(l => l.url === draggedLinkUrl);
      const toIndex = links.findIndex(l => l.url === linkObj.url);
      
      if (fromIndex !== -1 && toIndex !== -1) {
        const bounding = li.getBoundingClientRect();
        const offset = bounding.y + (bounding.height / 2);
        
        let insertIndex = toIndex;
        if (e.clientY - offset > 0) insertIndex = toIndex + 1;
        if (fromIndex < insertIndex) insertIndex--;
        
        const movedLink = links.splice(fromIndex, 1)[0];
        links.splice(insertIndex, 0, movedLink);
        
        saveLinks();
        renderLinks(searchInput.value);
      }
    }
  });

  li.addEventListener('dragend', () => {
    li.classList.remove('dragging');
    draggedItem = null;
    draggedItemType = null;
    draggedLinkUrl = null;
    document.querySelectorAll('.link-item').forEach(item => {
      item.style.borderTop = '';
      item.style.borderBottom = '';
    });
  });
}


function renderLinks(filter = "") {
  if(typeof renderDashboard === 'function') renderDashboard();
  
  const actionButtons = document.querySelector('.action-buttons');
  
  if (currentFolder === 'favorites') {
    form.style.display = 'none';
    if(actionButtons) actionButtons.style.display = 'none';
  } else {
    form.style.display = '';
    if(actionButtons) actionButtons.style.display = '';
  }
  
  linksList.innerHTML = "";

  let filtered = links;
  
  // Parse URL parameters for bookmarklet or extension auto-fill
  const urlParams = new URLSearchParams(window.location.search);
  const addUrl = urlParams.get('url');
  const addTitle = urlParams.get('title');
  const addFolder = urlParams.get('folder');
  const addTags = urlParams.get('tags');
  const autosave = urlParams.get('autosave');
  
  if (addUrl && !window.bookmarkletProcessed) {
    if (autosave === 'true') {
      window.bookmarkletProcessed = true;
      links.unshift({
        id: Date.now().toString(),
        title: addTitle || new URL(addUrl).hostname,
        url: addUrl,
        tags: addTags || '',
        folder: addFolder || 'General',
        favorite: false
      });
      saveLinks();
      // Wait for React/UI to settle just in case, though this is loaded in a background iframe
      setTimeout(() => {
        window.close();
      }, 100);
    } else {
      urlInput.value = addUrl;
      if (addTitle) titleInput.value = addTitle;
      if (addTags) tagsInput.value = addTags;
      window.bookmarkletProcessed = true; // Prevent re-triggering
      setTimeout(() => form.scrollIntoView({behavior: 'smooth'}), 500);
    }
  }

  filtered = filtered.filter(l =>
    l.title.toLowerCase().includes(filter.toLowerCase()) ||
    l.url.toLowerCase().includes(filter.toLowerCase()) ||
    (l.tags && l.tags.toLowerCase().includes(filter.toLowerCase()))
  );

  if (currentFolder === 'favorites') {
    filtered = filtered.filter(l => l.favorite);
  } else if (currentFolder !== 'all') {
    filtered = filtered.filter(l => (l.folder || 'General') === currentFolder);
  }

  if (filtered.length === 0) {
    emptyState.classList.add('show');
    linksList.style.display = 'none';
  } else {
    emptyState.classList.remove('show');
    linksList.style.display = 'block';
  }

  if (currentFolder === 'all') {
    filtered.sort((a, b) => {
      if (b.favorite !== a.favorite) {
        return b.favorite - a.favorite;
      }
      return 0;
    });
  }

  filtered.forEach((link) => {
    const li = document.createElement("li");
    li.className = "link-item";
    li.draggable = true;
    setupLinkDragAndDrop(li, link);
    if (link.favorite) li.classList.add("favorite");

    li.style.position = "relative";
    const dragHandle = document.createElement("i");
    dragHandle.className = "fas fa-grip-vertical drag-handle";
    dragHandle.style.position = "absolute";
    dragHandle.style.left = "16px";
    dragHandle.style.top = "50%";
    dragHandle.style.transform = "translateY(-50%)";
    dragHandle.style.color = "rgba(0,0,0,0.15)";
    dragHandle.style.cursor = "grab";
    dragHandle.style.fontSize = "1.2rem";
    dragHandle.style.padding = "10px";
    li.appendChild(dragHandle);

    const info = document.createElement("div");
    info.className = "link-info";
    
    // Extract domain for favicon
    let domain;
    try {
      domain = new URL(link.url).hostname;
    } catch (e) {
      domain = '';
    }
    
    let faviconUrl = '';
    if (domain === window.location.hostname && new URL(link.url).port === window.location.port) {
      faviconUrl = 'favicon.png';
    } else if (domain === 'localhost' || domain === '127.0.0.1') {
      faviconUrl = `http://${new URL(link.url).host}/favicon.ico`;
    } else {
      faviconUrl = domain ? `https://icon.horse/icon/${domain}` : '';
    }
    
    info.innerHTML = `
      <div class="link-content" style="padding-left: 36px;">
        ${faviconUrl ? `<img src="${faviconUrl}" class="link-favicon" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM5Y2EzYWYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTAgMTNhNSA1IDAgMCAwIDcuNTQgNC4zOWw0LjI5IDQuMjltLTcuODMtNC4zOUE1IDUgMCAxIDAgNS40NiA4Ljg5bS00LjI5LTQuMjltMTMuNjYgMTMuNjZMMy0zIi8+PC9zdmc+'">` : '<div class="link-favicon-placeholder"><i class="fas fa-link"></i></div>'}
        <div class="link-text">
          <a href="${link.url}" target="_blank">${link.title}</a>
          <div class="link-url">${domain || link.url}</div>
        </div>
      </div>
      ${link.tags ? `<small class="tags">${link.tags}</small>` : ''}
    `;

    // Add checkbox
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "link-checkbox";
    checkbox.checked = selectedLinks.has(link.url);
    
    checkbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        selectedLinks.add(link.url);
        li.classList.add('selected');
      } else {
        selectedLinks.delete(link.url);
        li.classList.remove('selected');
      }
      updateBulkActionBar();
    });

    li.addEventListener('click', (e) => {
      if (isSelectionMode && !e.target.closest('.action') && e.target !== checkbox) {
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change'));
      }
    });

    info.prepend(checkbox);


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
        folderSelect.value = links[editingIndex].folder || 'General';
        
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
  if (event.target === exportModal) {
    exportModal.classList.remove("show");
    document.body.style.overflow = "auto";
  }
};

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  const url = urlInput.value.trim();
  const tags = tagsInput.value.trim();
  const folder = folderSelect.value;


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
    links[editingIndex] = { 
      ...links[editingIndex],
      title, 
      url, 
      tags,
      folder
    };
    showToast('Link updated successfully!', 'success');
    editingIndex = -1;
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.innerHTML = '<i class="fas fa-plus"></i><span>Add Link</span>';
    submitBtn.style.background = '';
    cancelBtn.style.display = 'none';
  } else {
    links.unshift({ title, url, tags, favorite: false, folder: folder || 'General' });
    showToast('Link added successfully!', 'success');
  }
  
  saveLinks();
  renderFolders();
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


function toggleSelectionMode() {
  isSelectionMode = !isSelectionMode;
  if (isSelectionMode) {
    toggleSelectBtn.textContent = 'Cancel';
    toggleSelectBtn.classList.add('active');
    linksList.classList.add('selection-mode');
    
    // Disable drag and drop during selection mode
    document.querySelectorAll('.link-item').forEach(li => li.draggable = false);
  } else {
    toggleSelectBtn.textContent = 'Select';
    toggleSelectBtn.classList.remove('active');
    linksList.classList.remove('selection-mode');
    selectedLinks.clear();
    document.querySelectorAll('.link-checkbox').forEach(cb => cb.checked = false);
    bulkActionBar.classList.remove('show');
    
    // Re-enable drag and drop
    document.querySelectorAll('.link-item').forEach(li => li.draggable = true);
  }
}

if (toggleSelectBtn) {
  toggleSelectBtn.addEventListener('click', toggleSelectionMode);
}

function updateBulkActionBar() {
  if (selectedLinks.size > 0) {
    bulkActionBar.classList.add('show');
    selectedCount.textContent = `${selectedLinks.size} selected`;
    
    // Populate Move To dropdown based on current folder
    bulkMoveSelect.innerHTML = '<option value="" disabled selected>Move to...</option>';
    
    // If in a specific folder, exclude it. If in all/favorites, include General.
    const foldersToShow = folders.filter(f => {
      if (currentFolder === 'all' || currentFolder === 'favorites') return true;
      return f !== currentFolder; // Exclude current folder if viewing a specific one
    });
    
    // If viewing a specific folder, and it's not General, make sure General is an option
    if (currentFolder !== 'all' && currentFolder !== 'favorites' && currentFolder !== 'General' && !foldersToShow.includes('General')) {
      foldersToShow.unshift('General');
    }

    foldersToShow.forEach(f => {
      const opt = document.createElement('option');
      opt.value = f;
      opt.textContent = f;
      bulkMoveSelect.appendChild(opt);
    });
  } else {
    bulkActionBar.classList.remove('show');
  }
}

if (bulkMoveSelect) {
  bulkMoveSelect.addEventListener('change', (e) => {
    const targetFolder = e.target.value;
    if (targetFolder) {
      const count = selectedLinks.size;
      links.forEach(l => {
        if (selectedLinks.has(l.url)) {
          l.folder = targetFolder;
        }
      });
      saveLinks();
      renderLinks(searchInput.value);
      toggleSelectionMode();
      showToast(`Moved ${count} links to ${targetFolder}`, 'success');
    }
  });
}

if (bulkFavBtn) {
  bulkFavBtn.addEventListener('click', () => {
    const count = selectedLinks.size;
    links.forEach(l => {
      if (selectedLinks.has(l.url)) {
        l.favorite = true;
      }
    });
    saveLinks();
    renderLinks(searchInput.value);
    toggleSelectionMode();
    showToast(`Favorited ${count} links`, 'success');
  });
}

if (bulkDelBtn) {
  bulkDelBtn.addEventListener('click', () => {
    if (confirm(`Delete ${selectedLinks.size} links?`)) {
      links = links.filter(l => !selectedLinks.has(l.url));
      saveLinks();
      renderLinks(searchInput.value);
      toggleSelectionMode();
      showToast('Links deleted successfully', 'success');
    }
  });
}



const exportModal = document.getElementById("exportModal");
const exportFolderList = document.getElementById("exportFolderList");
const confirmExportBtn = document.getElementById("confirmExportBtn");
const cancelExportBtn = document.getElementById("cancelExportBtn");
const exportSelectAllBtn = document.getElementById("exportSelectAllBtn");
const exportDeselectAllBtn = document.getElementById("exportDeselectAllBtn");
const exportSearchFolder = document.getElementById("exportSearchFolder");
const exportSummaryText = document.getElementById("exportSummaryText");
const exportFileName = document.getElementById("exportFileName");

function updateExportSummary() {
  const checkboxes = Array.from(document.querySelectorAll(".export-folder-checkbox"));
  const selected = checkboxes.filter(cb => cb.checked);
  
  let totalLinks = 0;
  selected.forEach(cb => {
    const count = parseInt(cb.dataset.count) || 0;
    totalLinks += count;
  });
  
  exportSummaryText.textContent = `Exporting ${selected.length} folders (${totalLinks} total links)`;
}

// Bookmarklet functionality
const bookmarkletBtn = document.getElementById('bookmarkletBtn');
if (bookmarkletBtn) {
  bookmarkletBtn.addEventListener('click', () => {
    const modal = document.getElementById('bookmarkletModal');
    if (modal) {
      modal.classList.add('show');
      const origin = window.location.origin;
      const pathname = window.location.pathname;
      const link = document.getElementById('bookmarkletLink');
      if (link) {
        link.href = "javascript:(function(){var title=encodeURIComponent(document.title);var url=encodeURIComponent(window.location.href);window.open('" + origin + pathname + "?title='+title+'&url='+url, '_blank');})();";
      }
    }
  });
}

const closeBookmarkletModal = document.getElementById('closeBookmarkletModal');
if (closeBookmarkletModal) {
  closeBookmarkletModal.addEventListener('click', () => {
    document.getElementById('bookmarkletModal').classList.remove('show');
  });
}

exportBtn.addEventListener("click", () => {
  exportFolderList.innerHTML = '';
  exportSearchFolder.value = '';
  exportFileName.value = 'links';
  
  folders.forEach(folder => {
    const label = document.createElement("label");
    label.className = "export-folder-label";
    
    // Calculate links in this folder
    const folderLinks = links.filter(l => (l.folder || 'General') === folder);
    const linkCount = folderLinks.length;
    
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "export-folder-checkbox";
    checkbox.value = folder;
    checkbox.checked = true;
    checkbox.dataset.count = linkCount;
    
    checkbox.addEventListener("change", updateExportSummary);
    
    const icon = document.createElement("i");
    icon.className = "fas fa-folder";
    icon.style.color = "#9ca3af";
    icon.style.marginLeft = "4px";
    
    const textWrapper = document.createElement("div");
    textWrapper.style.display = "flex";
    textWrapper.style.flexDirection = "column";
    textWrapper.style.marginLeft = "8px";
    textWrapper.style.flex = "1";
    
    const titleSpan = document.createElement("span");
    titleSpan.textContent = folder;
    titleSpan.style.fontWeight = "500";
    titleSpan.style.color = "#374151";
    
    const countSpan = document.createElement("span");
    countSpan.textContent = `${linkCount} link${linkCount !== 1 ? 's' : ''}`;
    countSpan.style.fontSize = "12px";
    countSpan.style.color = "#6b7280";
    
    textWrapper.appendChild(titleSpan);
    textWrapper.appendChild(countSpan);
    
    label.appendChild(checkbox);
    label.appendChild(icon);
    label.appendChild(textWrapper);
    exportFolderList.appendChild(label);
  });
  
  updateExportSummary();
  exportModal.classList.add("show");
  document.body.style.overflow = "hidden";
});

exportSearchFolder.addEventListener("input", (e) => {
  const term = e.target.value.toLowerCase();
  const labels = document.querySelectorAll(".export-folder-label");
  labels.forEach(label => {
    const folderName = label.querySelector("input").value.toLowerCase();
    if (folderName.includes(term)) {
      label.style.display = "flex";
    } else {
      label.style.display = "none";
    }
  });
});

exportSelectAllBtn.addEventListener("click", () => {
  document.querySelectorAll(".export-folder-checkbox").forEach(cb => {
    if (cb.closest('label').style.display !== 'none') cb.checked = true;
  });
  updateExportSummary();
});

exportDeselectAllBtn.addEventListener("click", () => {
  document.querySelectorAll(".export-folder-checkbox").forEach(cb => {
    if (cb.closest('label').style.display !== 'none') cb.checked = false;
  });
  updateExportSummary();
});

cancelExportBtn.addEventListener("click", () => {
  exportModal.classList.remove("show");
  document.body.style.overflow = "auto";
});

confirmExportBtn.addEventListener("click", () => {
  const selectedFolders = Array.from(document.querySelectorAll(".export-folder-checkbox"))
                               .filter(cb => cb.checked)
                               .map(cb => cb.value);
                               
  if (selectedFolders.length === 0) {
    showToast("Please select at least one folder to export", "warning");
    return;
  }
  
  const wb = XLSX.utils.book_new();
  
  selectedFolders.forEach(folderName => {
    const folderLinks = links.filter(l => (l.folder || 'General') === folderName);
    
    const exportData = folderLinks.map(link => ({
      Title: link.title,
      URL: link.url,
      Tags: link.tags,
      Favorite: link.favorite ? 'Yes' : 'No'
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData.length ? exportData : [{Title: "", URL: "", Tags: "", Favorite: ""}]);
    let sheetName = folderName.substring(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  const finalFileName = (exportFileName.value.trim() || "links") + ".xlsx";
  XLSX.writeFile(wb, finalFileName);
  
  exportModal.classList.remove("show");
  document.body.style.overflow = "auto";
  showToast(`Exported ${selectedFolders.length} folders successfully!`, "success");
});


importBtn.addEventListener("click", () => importFile.click());
importFile.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const data = new Uint8Array(event.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    
    let totalImported = 0;

    workbook.SheetNames.forEach(sheetName => {
      const folderName = sheetName;
      // Add folder if it doesn't exist
      if (folderName !== 'General' && !folders.includes(folderName)) {
        folders.push(folderName);
      }
      
      const sheet = workbook.Sheets[sheetName];
      const importedData = XLSX.utils.sheet_to_json(sheet);
      
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
            favorite: favoriteKey ? (row[favoriteKey].toString().toLowerCase() === 'yes' || !!row[favoriteKey]) : false,
            folder: folderName
          };
        })
        .filter(link => link.url); // Only keep valid URLs
        
      sanitizedLinks.forEach(importedLink => {
        const existingLinkIndex = links.findIndex(l => l.url === importedLink.url);

        if (existingLinkIndex !== -1) {
          links[existingLinkIndex] = importedLink;
        } else {
          links.push(importedLink);
        }
      });
      
      totalImported += sanitizedLinks.length;
    });

    saveLinks();
    saveFolders();
    renderFolders();
    renderLinks();
    showToast(`Imported ${totalImported} links successfully!`, 'success');
  };
  reader.readAsArrayBuffer(file);
});

renderFolders();
renderLinks();

function renderDashboard() {
  const dashTotalLinks = document.getElementById('dashTotalLinks');
  const dashTotalFolders = document.getElementById('dashTotalFolders');
  const dashTotalFavs = document.getElementById('dashTotalFavs');
  const dashFolderChart = document.getElementById('dashFolderChart');
  const dashTopTags = document.getElementById('dashTopTags');
  
  if (!dashTotalLinks) return;
  
  // Calculate Totals
  dashTotalLinks.textContent = links.length;
  dashTotalFolders.textContent = folders.length;
  dashTotalFavs.textContent = links.filter(l => l.favorite).length;
  
  // Calculate Folder Distribution
  const folderCounts = {};
  links.forEach(l => {
    const f = l.folder || 'General';
    folderCounts[f] = (folderCounts[f] || 0) + 1;
  });
  
  // Convert to array and sort by count descending
  const sortedFolders = Object.keys(folderCounts).map(f => ({ name: f, count: folderCounts[f] }))
                              .sort((a, b) => b.count - a.count)
                              .slice(0, 5); // top 5
                              
  dashFolderChart.innerHTML = '';
  
  if (sortedFolders.length === 0) {
    dashFolderChart.innerHTML = '<p style="color:#6b7280; font-size:14px;">No folders yet.</p>';
  } else {
    const maxCount = sortedFolders[0].count;
    sortedFolders.forEach(item => {
      const percentage = (item.count / maxCount) * 100;
      
      const barContainer = document.createElement('div');
      barContainer.className = 'chart-bar-container';
      
      barContainer.innerHTML = `
        <div class="chart-label">
          <span>${item.name}</span>
          <span>${item.count}</span>
        </div>
        <div class="chart-bar-bg">
          <div class="chart-bar-fill" style="width: ${percentage}%"></div>
        </div>
      `;
      
      dashFolderChart.appendChild(barContainer);
    });
  }
  
  // Calculate Top Tags
  const tagCounts = {};
  links.forEach(l => {
    if (l.tags) {
      const tagsArray = l.tags.split(',').map(t => t.trim().toLowerCase()).filter(t => t);
      tagsArray.forEach(t => {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      });
    }
  });
  
  const sortedTags = Object.keys(tagCounts).map(t => ({ name: t, count: tagCounts[t] }))
                           .sort((a, b) => b.count - a.count)
                           .slice(0, 10); // top 10
                           
  dashTopTags.innerHTML = '';
  if (sortedTags.length === 0) {
    dashTopTags.innerHTML = '<p style="color:#6b7280; font-size:14px;">No tags used yet.</p>';
  } else {
    sortedTags.forEach(tag => {
      const tagEl = document.createElement('span');
      tagEl.className = 'dash-tag';
      tagEl.textContent = `#${tag.name} (${tag.count})`;
      dashTopTags.appendChild(tagEl);
    });
  }
}


// --- Mobile Responsiveness Logic ---
const hamburgerBtn = document.getElementById("hamburgerBtn");
const mobileBackdrop = document.getElementById("mobileBackdrop");
const sidebar = document.getElementById("sidebar");

function toggleMobileMenu() {
  sidebar.classList.toggle("mobile-open");
  mobileBackdrop.classList.toggle("show");
  
  if (sidebar.classList.contains("mobile-open")) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "auto";
  }
}

function closeMobileMenu() {
  sidebar.classList.remove("mobile-open");
  mobileBackdrop.classList.remove("show");
  document.body.style.overflow = "auto";
}

if (hamburgerBtn && mobileBackdrop) {
  hamburgerBtn.addEventListener("click", toggleMobileMenu);
  mobileBackdrop.addEventListener("click", closeMobileMenu);
  
  // Close menu when a folder is clicked on mobile
  const allFolderItems = document.querySelectorAll(".folder-item");
  allFolderItems.forEach(item => {
    item.addEventListener("click", () => {
      if (window.innerWidth <= 768) {
        closeMobileMenu();
      }
    });
  });
}
