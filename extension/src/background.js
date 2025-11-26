// Background service worker for Synapse extension

// Create context menu when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  // Create parent menu item
  chrome.contextMenus.create({
    id: 'synapse-main',
    title: 'Save to Synapse',
    contexts: ['page', 'selection', 'link', 'image']
  });

  // Save current page
  chrome.contextMenus.create({
    id: 'synapse-save-page',
    parentId: 'synapse-main',
    title: 'Save this page',
    contexts: ['page']
  });

  // Save selected text
  chrome.contextMenus.create({
    id: 'synapse-save-selection',
    parentId: 'synapse-main',
    title: 'Save selection as note',
    contexts: ['selection']
  });

  // Save link
  chrome.contextMenus.create({
    id: 'synapse-save-link',
    parentId: 'synapse-main',
    title: 'Save this link',
    contexts: ['link']
  });

  // Save image
  chrome.contextMenus.create({
    id: 'synapse-save-image',
    parentId: 'synapse-main',
    title: 'Save this image',
    contexts: ['image']
  });

  console.log('Synapse extension installed! 🧠');
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case 'synapse-save-page':
      savePage(tab);
      break;
    case 'synapse-save-selection':
      saveSelection(info, tab);
      break;
    case 'synapse-save-link':
      saveLink(info);
      break;
    case 'synapse-save-image':
      saveImage(info, tab);
      break;
  }
});

// Save entire page
async function savePage(tab) {
  try {
    showNotification('Saving page...', 'info');

    const response = await fetch('http://localhost:5000/api/items/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: tab.url
      })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      showNotification('✓ Saved to Synapse!', 'success');
    } else {
      throw new Error(data.error || 'Failed to save');
    }
  } catch (error) {
    console.error('Save page error:', error);
    showNotification('✗ Error: ' + error.message, 'error');
  }
}

// Save selected text
async function saveSelection(info, tab) {
  try {
    const selectedText = info.selectionText;

    if (!selectedText || selectedText.trim().length === 0) {
      showNotification('No text selected', 'error');
      return;
    }

    showNotification('Saving selection...', 'info');

    const response = await fetch('http://localhost:5000/api/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: selectedText,
        contentType: 'note',
        title: 'Selected text from ' + tab.title,
        url: tab.url
      })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      showNotification('✓ Selection saved!', 'success');
    } else {
      throw new Error(data.error || 'Failed to save');
    }
  } catch (error) {
    console.error('Save selection error:', error);
    showNotification('✗ Error: ' + error.message, 'error');
  }
}

// Save link
async function saveLink(info) {
  try {
    showNotification('Saving link...', 'info');

    const response = await fetch('http://localhost:5000/api/items/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: info.linkUrl
      })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      showNotification('✓ Link saved!', 'success');
    } else {
      throw new Error(data.error || 'Failed to save');
    }
  } catch (error) {
    console.error('Save link error:', error);
    showNotification('✗ Error: ' + error.message, 'error');
  }
}

// Save image
async function saveImage(info, tab) {
  try {
    showNotification('Saving image...', 'info');

    const response = await fetch('http://localhost:5000/api/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: info.srcUrl,
        contentType: 'image',
        title: 'Image from ' + tab.title,
        url: tab.url,
        rawData: {
          imageUrl: info.srcUrl
        }
      })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      showNotification('✓ Image saved!', 'success');
    } else {
      throw new Error(data.error || 'Failed to save');
    }
  } catch (error) {
    console.error('Save image error:', error);
    showNotification('✗ Error: ' + error.message, 'error');
  }
}

// Show notification
function showNotification(message, type) {
  const iconPath = type === 'success' ? 'icons/icon48.png' : 'icons/icon48.png';

  chrome.notifications.create({
    type: 'basic',
    iconUrl: iconPath,
    title: 'Synapse',
    message: message,
    priority: 2
  });
}

// Listen for keyboard shortcuts (optional)
chrome.commands.onCommand.addListener((command) => {
  if (command === 'save-page') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        savePage(tabs[0]);
      }
    });
  }
});
