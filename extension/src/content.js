// Content script for Synapse extension
// This script runs on every page and provides UI for quick saving

console.log('Synapse content script loaded 🧠');

// Create floating save button
function createFloatingButton() {
  // Check if button already exists
  if (document.getElementById('synapse-floating-btn')) {
    return;
  }

  const button = document.createElement('div');
  button.id = 'synapse-floating-btn';
  button.innerHTML = '🧠';
  button.title = 'Save to Synapse';

  button.addEventListener('click', () => {
    saveCurrentPage();
  });

  document.body.appendChild(button);
}

// Save current page
async function saveCurrentPage() {
  try {
    const button = document.getElementById('synapse-floating-btn');
    button.innerHTML = '⏳';

    const response = await fetch('http://localhost:5000/api/items/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: window.location.href
      })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      button.innerHTML = '✓';
      setTimeout(() => {
        button.innerHTML = '🧠';
      }, 2000);
    } else {
      throw new Error(data.error || 'Failed to save');
    }
  } catch (error) {
    console.error('Save error:', error);
    const button = document.getElementById('synapse-floating-btn');
    button.innerHTML = '✗';
    setTimeout(() => {
      button.innerHTML = '🧠';
    }, 2000);
  }
}

// Listen for selection changes to show save selection button
document.addEventListener('mouseup', (e) => {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  if (selectedText.length > 0) {
    showSelectionButton(e.clientX, e.clientY, selectedText);
  } else {
    hideSelectionButton();
  }
});

// Show selection save button
function showSelectionButton(x, y, text) {
  // Remove existing button
  hideSelectionButton();

  const button = document.createElement('div');
  button.id = 'synapse-selection-btn';
  button.innerHTML = '💾 Save to Synapse';
  button.style.position = 'fixed';
  button.style.left = x + 'px';
  button.style.top = (y + 10) + 'px';

  button.addEventListener('click', async () => {
    button.innerHTML = '⏳ Saving...';

    try {
      const response = await fetch('http://localhost:5000/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: text,
          contentType: 'note',
          title: 'Selected text from ' + document.title,
          url: window.location.href
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        button.innerHTML = '✓ Saved!';
        setTimeout(() => {
          hideSelectionButton();
        }, 1500);
      } else {
        throw new Error(data.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Save selection error:', error);
      button.innerHTML = '✗ Error';
      setTimeout(() => {
        hideSelectionButton();
      }, 2000);
    }
  });

  document.body.appendChild(button);
}

// Hide selection button
function hideSelectionButton() {
  const button = document.getElementById('synapse-selection-btn');
  if (button) {
    button.remove();
  }
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createFloatingButton);
} else {
  createFloatingButton();
}
