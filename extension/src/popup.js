// Get current tab info
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const currentTab = tabs[0];

  if (currentTab) {
    document.getElementById('pageTitle').textContent = currentTab.title || 'Untitled';
    document.getElementById('pageUrl').textContent = currentTab.url || '';
  }
});

// Save current page
document.getElementById('saveBtn').addEventListener('click', async () => {
  const saveBtn = document.getElementById('saveBtn');
  const status = document.getElementById('status');

  try {
    // Disable button and show loading
    saveBtn.disabled = true;
    saveBtn.classList.add('btn-disabled');
    saveBtn.innerHTML = '<span class="loading-spinner"></span><span>Saving...</span>';

    status.className = 'status status-loading';
    status.textContent = 'Saving page to Synapse...';
    status.classList.remove('hidden');

    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      throw new Error('No active tab found');
    }

    // Send URL to backend
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
      status.className = 'status status-success';
      status.textContent = '✓ Saved to Synapse successfully!';

      // Reset button after delay
      setTimeout(() => {
        saveBtn.disabled = false;
        saveBtn.classList.remove('btn-disabled');
        saveBtn.innerHTML = '<span>💾</span><span>Save This Page</span>';
      }, 2000);
    } else {
      throw new Error(data.error || data.message || 'Failed to save');
    }

  } catch (error) {
    console.error('Save error:', error);
    status.className = 'status status-error';
    status.textContent = '✗ Error: ' + error.message;

    // Reset button
    saveBtn.disabled = false;
    saveBtn.classList.remove('btn-disabled');
    saveBtn.innerHTML = '<span>💾</span><span>Save This Page</span>';
  }
});

// Save selected text
document.getElementById('saveSelectionBtn').addEventListener('click', async () => {
  const saveSelectionBtn = document.getElementById('saveSelectionBtn');
  const status = document.getElementById('status');

  try {
    saveSelectionBtn.disabled = true;
    saveSelectionBtn.classList.add('btn-disabled');

    status.className = 'status status-loading';
    status.textContent = 'Saving selection...';
    status.classList.remove('hidden');

    // Get selected text from page
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => window.getSelection().toString()
    });

    const selectedText = results[0].result;

    if (!selectedText || selectedText.trim().length === 0) {
      throw new Error('No text selected. Please select some text first.');
    }

    // Send selected text to backend
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
      status.className = 'status status-success';
      status.textContent = '✓ Selection saved!';
    } else {
      throw new Error(data.error || 'Failed to save selection');
    }

  } catch (error) {
    console.error('Save selection error:', error);
    status.className = 'status status-error';
    status.textContent = '✗ ' + error.message;
  } finally {
    saveSelectionBtn.disabled = false;
    saveSelectionBtn.classList.remove('btn-disabled');
  }
});

// Open dashboard
document.getElementById('openDashboardBtn').addEventListener('click', () => {
  chrome.tabs.create({ url: 'http://localhost:3000' });
});
