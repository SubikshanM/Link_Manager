document.addEventListener('DOMContentLoaded', () => {
  const titleInput = document.getElementById('title');
  const urlInput = document.getElementById('url');
  const folderDropdown = document.getElementById('folderDropdown');
  const selectedFolderValue = document.getElementById('selectedFolderValue');
  const folderOptions = document.getElementById('folderOptions');
  const saveBtn = document.getElementById('saveBtn');
  const syncBtn = document.getElementById('syncBtn');
  
  let currentFolder = 'General';

  // Toggle Dropdown
  selectedFolderValue.addEventListener('click', () => {
    folderDropdown.classList.toggle('active');
    folderOptions.classList.toggle('active');
  });

  // Close dropdown if clicked outside
  document.addEventListener('click', (e) => {
    if (!folderDropdown.contains(e.target)) {
      folderDropdown.classList.remove('active');
      folderOptions.classList.remove('active');
    }
  });

  function renderOptions(folders) {
    folderOptions.innerHTML = '';
    folders.forEach(folderName => {
      const option = document.createElement('div');
      option.className = 'custom-option';
      option.dataset.value = folderName;
      option.textContent = folderName;
      option.addEventListener('click', () => {
        currentFolder = folderName;
        selectedFolderValue.textContent = folderName;
        folderDropdown.classList.remove('active');
        folderOptions.classList.remove('active');
      });
      folderOptions.appendChild(option);
    });
  }

  // Load cached folders
  chrome.storage.local.get(['linkManagerFolders'], (result) => {
    if (result.linkManagerFolders && result.linkManagerFolders.length > 0) {
      renderOptions(result.linkManagerFolders);
    } else {
      renderOptions(['General']);
    }
  });

  // Grab the active tab's info
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (tabs[0]) {
      titleInput.value = tabs[0].title || '';
      urlInput.value = tabs[0].url || '';
    }
  });

  // Sync button logic
  syncBtn.addEventListener('click', () => {
    syncBtn.classList.add('spinning');
    
    // Open a background tab to Link Manager to scrape folders
    const managerUrl = 'https://subikshanm.github.io/Link_Manager/index.html';
    chrome.tabs.create({ url: managerUrl, active: false }, (tab) => {
      // Give it a second to load
      setTimeout(() => {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const data = localStorage.getItem('folders');
            if (data) {
              try {
                return JSON.parse(data) || [];
              } catch(e) {}
            }
            return [];
          }
        }, (results) => {
          if (results && results[0] && results[0].result) {
            let folders = results[0].result;
            if (!folders.includes('General')) folders.unshift('General');
            
            chrome.storage.local.set({ linkManagerFolders: folders }, () => {
              renderOptions(folders);
              chrome.tabs.remove(tab.id, () => chrome.runtime.lastError);
              syncBtn.classList.remove('spinning');
            });
          } else {
            chrome.tabs.remove(tab.id, () => chrome.runtime.lastError);
            syncBtn.classList.remove('spinning');
          }
        });
      }, 1500);
    });
  });

  saveBtn.addEventListener('click', () => {
    if (!urlInput.value) return;

    const title = encodeURIComponent(titleInput.value);
    const url = encodeURIComponent(urlInput.value);
    const folder = encodeURIComponent(currentFolder);
    
    saveBtn.textContent = 'Saving...';
    saveBtn.style.opacity = '0.8';
    
    const targetUrl = `https://subikshanm.github.io/Link_Manager/index.html?url=${url}&title=${title}&folder=${folder}&autosave=true`;
    
    chrome.tabs.create({ url: targetUrl, active: false }, (tab) => {
      setTimeout(() => {
        chrome.tabs.remove(tab.id, () => chrome.runtime.lastError);
        
        saveBtn.textContent = 'Saved!';
        setTimeout(() => {
          window.close();
        }, 500);
      }, 1500);
    });
  });
});
