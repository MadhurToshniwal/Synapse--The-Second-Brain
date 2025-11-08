// Synapse Chrome Extension - Background Service Worker

const API_URL = 'http://localhost:5000';

// Create context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'save-to-synapse',
    title: '💾 Save to Synapse',
    contexts: ['page', 'selection', 'link', 'image']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'save-to-synapse') {
    try {
      // Get page content from content script
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: extractPageContent
      });

      const pageData = result.result;

      // Determine what to save based on context
      let saveData = {};

      if (info.linkUrl) {
        // Saving a link
        saveData = {
          url: info.linkUrl,
          title: info.linkText || info.linkUrl,
          source: 'context-menu-link'
        };
      } else if (info.srcUrl) {
        // Saving an image
        saveData = {
          imageUrl: info.srcUrl,
          title: pageData.title,
          source: 'context-menu-image'
        };
      } else if (info.selectionText) {
        // Saving selected text
        saveData = {
          url: tab.url,
          title: pageData.title,
          selectedText: info.selectionText,
          source: 'context-menu-selection'
        };
      } else {
        // Saving entire page
        saveData = {
          url: tab.url,
          title: pageData.title,
          description: pageData.description,
          content: pageData.content,
          source: 'context-menu-page'
        };
      }

      // Send to Synapse API
      await saveToSynapse(saveData);

      // Show success notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon128.png',
        title: 'Saved to Synapse!',
        message: `"${saveData.title}" has been saved to your second brain.`
      });

    } catch (error) {
      console.error('Error saving to Synapse:', error);
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon128.png',
        title: 'Error',
        message: 'Failed to save to Synapse. Is the server running?'
      });
    }
  }
});

// Function to extract page content (injected into page)
function extractPageContent() {
  return {
    title: document.title,
    url: window.location.href,
    description: document.querySelector('meta[name="description"]')?.content || '',
    content: document.body.innerText.substring(0, 5000), // First 5000 chars
    og: {
      title: document.querySelector('meta[property="og:title"]')?.content,
      description: document.querySelector('meta[property="og:description"]')?.content,
      image: document.querySelector('meta[property="og:image"]')?.content
    }
  };
}

// Save to Synapse API
async function saveToSynapse(data) {
  let endpoint = `${API_URL}/api/items/scrape`;
  let requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ url: data.url })
  };

  // If saving an image, download it and upload to the upload endpoint
  if (data.imageUrl) {
    try {
      // Fetch the image as a blob
      const imageResponse = await fetch(data.imageUrl);
      const imageBlob = await imageResponse.blob();

      // Create FormData for image upload
      const formData = new FormData();
      formData.append('image', imageBlob, 'saved-image.jpg');

      // Update endpoint and request options
      endpoint = `${API_URL}/api/items/upload`;
      requestOptions = {
        method: 'POST',
        body: formData
        // Note: Don't set Content-Type header, browser will set it with boundary
      };
    } catch (imageError) {
      console.error('Error fetching image:', imageError);
      // Fall back to URL scraping if image download fails
      requestOptions.body = JSON.stringify({ url: data.imageUrl });
    }
  }

  const response = await fetch(endpoint, requestOptions);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

// Keyboard shortcut handler
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'save-current-page') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    try {
      await saveToSynapse({ url: tab.url });

      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon128.png',
        title: 'Saved!',
        message: `"${tab.title}" saved to Synapse`
      });
    } catch (error) {
      console.error('Error:', error);
    }
  }
});
