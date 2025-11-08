// Synapse Chrome Extension - Content Script
// Runs on every webpage to extract content

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractContent') {
    const content = extractPageContent();
    sendResponse(content);
  }
  return true;
});

// Extract meaningful content from the page
function extractPageContent() {
  // Get basic page info
  const pageData = {
    url: window.location.href,
    title: document.title,
    description: getMetaDescription(),
    content: getMainContent(),
    images: extractImages(),
    links: extractLinks(),
    metadata: extractMetadata()
  };

  return pageData;
}

// Get meta description
function getMetaDescription() {
  const metaDesc = document.querySelector('meta[name="description"]');
  const ogDesc = document.querySelector('meta[property="og:description"]');
  return metaDesc?.content || ogDesc?.content || '';
}

// Extract main content (try to filter out navigation, ads, etc.)
function getMainContent() {
  // Try to find main content area
  const mainSelectors = [
    'main',
    'article',
    '[role="main"]',
    '.main-content',
    '#main-content',
    '.post-content',
    '.article-content'
  ];

  for (const selector of mainSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      return cleanText(element.innerText);
    }
  }

  // Fallback to body
  return cleanText(document.body.innerText).substring(0, 5000);
}

// Clean extracted text
function cleanText(text) {
  return text
    .replace(/\s+/g, ' ')  // Multiple spaces to single
    .replace(/\n+/g, '\n')  // Multiple newlines to single
    .trim();
}

// Extract images from page
function extractImages() {
  const images = [];
  const imgElements = document.querySelectorAll('img');

  imgElements.forEach(img => {
    if (img.width > 100 && img.height > 100) {  // Filter small images
      images.push({
        src: img.src,
        alt: img.alt,
        title: img.title
      });
    }
  });

  return images.slice(0, 10);  // Limit to 10 images
}

// Extract links
function extractLinks() {
  const links = [];
  const linkElements = document.querySelectorAll('a[href]');

  linkElements.forEach(link => {
    if (link.href && link.innerText.trim()) {
      links.push({
        url: link.href,
        text: link.innerText.trim()
      });
    }
  });

  return links.slice(0, 20);  // Limit to 20 links
}

// Extract all metadata
function extractMetadata() {
  const metadata = {
    og: {},
    twitter: {},
    schema: []
  };

  // Open Graph
  document.querySelectorAll('meta[property^="og:"]').forEach(meta => {
    const property = meta.getAttribute('property').replace('og:', '');
    metadata.og[property] = meta.content;
  });

  // Twitter Cards
  document.querySelectorAll('meta[name^="twitter:"]').forEach(meta => {
    const property = meta.getAttribute('name').replace('twitter:', '');
    metadata.twitter[property] = meta.content;
  });

  // Schema.org JSON-LD
  document.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
    try {
      const data = JSON.parse(script.textContent);
      metadata.schema.push(data);
    } catch (e) {
      // Ignore invalid JSON
    }
  });

  return metadata;
}

// Visual indicator when page is saved
function showSaveIndicator() {
  const indicator = document.createElement('div');
  indicator.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 16px;
    font-weight: 600;
    animation: slideIn 0.3s ease-out;
  `;
  indicator.textContent = '✓ Saved to Synapse!';

  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(indicator);

  // Remove after 3 seconds
  setTimeout(() => {
    indicator.style.animation = 'slideIn 0.3s ease-in reverse';
    setTimeout(() => indicator.remove(), 300);
  }, 3000);
}

// Export for use
window.synapseExtension = {
  extractPageContent,
  showSaveIndicator
};
