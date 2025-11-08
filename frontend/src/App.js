import React, { useState, useEffect } from 'react';
import { SignIn, SignUp, UserButton, useUser, useAuth } from '@clerk/clerk-react';
import './App.css';
import ChatPanel from './ChatPanel';

function App() {
  const { isSignedIn, user } = useUser();
  const { getToken } = useAuth();

  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [uploadMode, setUploadMode] = useState('url'); // 'url' or 'image'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [authMode, setAuthMode] = useState('sign-in'); // 'sign-in' or 'sign-up'
  const [readerMode, setReaderMode] = useState(false);
  const [currentArticle, setCurrentArticle] = useState(null);

  // Date filter state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Fetch autocomplete suggestions as user types
  const fetchSuggestions = async (query) => {
    if (!query || query.trim().length < 2) {
      setRecommendations(null);
      setShowSuggestions(false);
      return;
    }

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`http://localhost:5000/api/search/suggestions?q=${encodeURIComponent(query)}`, {
        headers
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setRecommendations(data.recommendations);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Suggestions error:', error);
    }
  };

  // Handle search query change with debounce
  const handleSearchQueryChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Debounce API call
    if (window.searchTimeout) clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  // Get auth headers with Clerk token
  const getAuthHeaders = async () => {
    const token = await getToken();
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  // Fetch items
  const fetchItems = async () => {
    try {
      const token = await getToken();
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      let apiUrl = 'http://localhost:5000/api/items';

      // Add date filters if set
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (params.toString()) {
        apiUrl += `?${params.toString()}`;
      }

      const response = await fetch(apiUrl, { headers });
      const data = await response.json();

      if (response.ok && data.success) {
        setItems(data.items || []);
      }
    } catch (error) {
      console.error('Fetch items error:', error);
    }
  };

  // Load items when user signs in or date filters change
  useEffect(() => {
    if (isSignedIn) {
      fetchItems();
    }
  }, [isSignedIn, startDate, endDate]);

  // Save URL
  const handleSaveUrl = async (e) => {
    e.preventDefault();

    if (!url.trim()) {
      setMessage({ text: 'Please enter a URL', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: 'Saving...', type: 'info' });

    try {
      const headers = await getAuthHeaders();
      const response = await fetch('http://localhost:5000/api/items/scrape', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ text: '✓ Saved successfully!', type: 'success' });
        setUrl('');
        fetchItems();
      } else {
        throw new Error(data.error || data.message || 'Failed to save');
      }
    } catch (error) {
      console.error('Save error:', error);
      setMessage({ text: '✗ Error: ' + error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Upload Image
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setMessage({ text: 'Analyzing image...', type: 'info' });

    try {
      const formData = new FormData();
      formData.append('image', file);

      const token = await getToken();
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('http://localhost:5000/api/items/upload', {
        method: 'POST',
        headers: headers,
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({
          text: `✓ Image analyzed! ${data.item.content ? 'Text extracted.' : ''}`,
          type: 'success'
        });
        fetchItems();
      } else {
        throw new Error(data.error || data.message || 'Failed to upload');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessage({ text: '✗ Error: ' + error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = async (e) => {
    e.preventDefault();

    if (!searchQuery.trim()) {
      setSearchResults(null);
      fetchItems();
      return;
    }

    setLoading(true);
    setMessage({ text: 'Searching...', type: 'info' });

    try {
      const headers = await getAuthHeaders();
      const response = await fetch('http://localhost:5000/api/search', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          query: searchQuery,
          startDate: startDate || undefined,
          endDate: endDate || undefined
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSearchResults(data.results);
        setItems(data.results || []);
        setRecommendations(data.recommendations || null);

        // Show helpful message with recommendations if no results
        if (data.results.length === 0) {
          let helpMessage = data.message || 'No results found.';

          // Add recommendation hints
          if (data.recommendations) {
            if (data.recommendations.suggestions && data.recommendations.suggestions.length > 0) {
              helpMessage += ` Try: "${data.recommendations.suggestions[0].text}"`;
            } else if (data.recommendations.relatedSearches && data.recommendations.relatedSearches.length > 0) {
              helpMessage += ` Try: "${data.recommendations.relatedSearches[0].text}"`;
            }
          }

          setMessage({ text: helpMessage, type: 'info' });
        } else {
          setMessage({
            text: `✓ Found ${data.results.length} results ${data.performance?.topRelevance ? `(${data.performance.topRelevance})` : ''}`,
            type: 'success'
          });
          setRecommendations(null); // Clear recommendations when results found
        }
      } else {
        throw new Error(data.error || 'Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      setMessage({ text: '✗ Error: ' + error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
    fetchItems();
  };

  // Clear date filters
  const clearDateFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  // Open article in reader mode
  const openReaderMode = (item) => {
    if (item.content_type !== 'article' || !item.url) {
      return;
    }
    setCurrentArticle(item);
    setReaderMode(true);
  };

  // Close reader mode
  const closeReaderMode = () => {
    setReaderMode(false);
    setCurrentArticle(null);
  };

  // Delete item
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      const token = await getToken();
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`http://localhost:5000/api/items/${itemId}`, {
        method: 'DELETE',
        headers: headers
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ text: '✓ Item deleted successfully!', type: 'success' });
        fetchItems();
      } else {
        throw new Error(data.error || 'Failed to delete');
      }
    } catch (error) {
      console.error('Delete error:', error);
      setMessage({ text: '✗ Error: ' + error.message, type: 'error' });
    }
  };

  // If not signed in, show auth
  if (!isSignedIn) {
    return (
      <div className="App">
        <header className="app-header">
          <div className="container">
            <div className="logo">
              <span className="logo-icon">🧠</span>
              <h1>Synapse</h1>
            </div>
            <p className="tagline">Your Second Brain - Never Lose an Idea Again</p>
          </div>
        </header>

        <main className="main-content">
          <div className="container">
            <div className="auth-container">
              <div className="auth-tabs">
                <button
                  className={`auth-tab ${authMode === 'sign-in' ? 'active' : ''}`}
                  onClick={() => setAuthMode('sign-in')}
                >
                  Sign In
                </button>
                <button
                  className={`auth-tab ${authMode === 'sign-up' ? 'active' : ''}`}
                  onClick={() => setAuthMode('sign-up')}
                >
                  Sign Up
                </button>
              </div>

              <div className="clerk-auth-wrapper">
                {authMode === 'sign-in' ? (
                  <SignIn routing="hash" />
                ) : (
                  <SignUp routing="hash" />
                )}
              </div>
            </div>
          </div>
        </main>

        <footer className="app-footer">
          <div className="container">
            <p>Built with ❤️ for Appointy Internship Drive 2025</p>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="App">
      {/* Header */}
      <header className="app-header">
        <div className="container">
          <div className="header-top">
            <div className="logo">
              <span className="logo-icon">🧠</span>
              <h1>Synapse</h1>
            </div>
            <div className="header-actions">
              <span className="user-name">👤 {user?.firstName || user?.emailAddresses[0]?.emailAddress}</span>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
          <p className="tagline">Your Second Brain - Never Lose an Idea Again</p>

          {/* Search Bar */}
          <div className="search-container">
            <form onSubmit={handleSearch} className="search-form" style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search with natural language... (e.g., 'articles about AI from last week')"
                value={searchQuery}
                onChange={handleSearchQueryChange}
                onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="search-input"
                autoComplete="off"
              />
              <button type="submit" className="search-btn" disabled={loading}>
                🔍 Search
              </button>
              {searchResults && (
                <button type="button" onClick={clearSearch} className="clear-search-btn">
                  ✕
                </button>
              )}

              {/* Autocomplete Dropdown */}
              {showSuggestions && recommendations && recommendations.relatedSearches && recommendations.relatedSearches.length > 0 && (
                <div className="autocomplete-dropdown">
                  <div className="autocomplete-section">
                    <div className="autocomplete-header">Related Searches</div>
                    {recommendations.relatedSearches.slice(0, 8).map((rec, idx) => (
                      <div
                        key={idx}
                        className="autocomplete-item"
                        onMouseDown={() => {
                          setSearchQuery(rec.text);
                          setShowSuggestions(false);
                          handleSearch({ preventDefault: () => {} });
                        }}
                      >
                        <span className="autocomplete-icon">🔍</span>
                        <span className="autocomplete-text">{rec.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </form>

            {/* Date Filters */}
            <div className="date-filters">
              <div className="date-filter-group">
                <label>From:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="date-input"
                />
              </div>
              <div className="date-filter-group">
                <label>To:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="date-input"
                />
              </div>
              {(startDate || endDate) && (
                <button onClick={clearDateFilters} className="clear-dates-btn">
                  Clear Dates
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Reader Mode */}
      {readerMode && currentArticle && (
        <div className="reader-overlay" onClick={closeReaderMode}>
          <div className="reader-container" onClick={(e) => e.stopPropagation()}>
            <div className="reader-header">
              <button className="reader-close" onClick={closeReaderMode}>
                ← Back
              </button>
              <a
                href={currentArticle.url}
                target="_blank"
                rel="noopener noreferrer"
                className="reader-original-link"
              >
                Open Original ↗
              </a>
            </div>

            <article className="reader-content">
              {currentArticle.thumbnail_url && (
                <img
                  src={currentArticle.thumbnail_url}
                  alt={currentArticle.title}
                  className="reader-image"
                />
              )}

              <h1 className="reader-title">{currentArticle.title}</h1>

              {currentArticle.metadata?.author && (
                <div className="reader-meta">
                  <span>By {currentArticle.metadata.author}</span>
                  {currentArticle.metadata.publishedDate && (
                    <span> • {new Date(currentArticle.metadata.publishedDate).toLocaleDateString()}</span>
                  )}
                </div>
              )}

              <div className="reader-body">
                {currentArticle.content ? (
                  currentArticle.content.split('\n\n').map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))
                ) : (
                  <p>{currentArticle.description}</p>
                )}
              </div>

              {currentArticle.tags && currentArticle.tags.length > 0 && (
                <div className="reader-tags">
                  <h3>Topics</h3>
                  <div className="item-tags">
                    {currentArticle.tags.map((tag, index) => (
                      <span key={index} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </article>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="main-content">
        <div className="container">
          {/* Save Form */}
          <div className="save-section">
            <h2>Save Anything</h2>

            {/* Mode Tabs */}
            <div className="mode-tabs">
              <button
                className={`mode-tab ${uploadMode === 'url' ? 'active' : ''}`}
                onClick={() => setUploadMode('url')}
              >
                🔗 URL
              </button>
              <button
                className={`mode-tab ${uploadMode === 'image' ? 'active' : ''}`}
                onClick={() => setUploadMode('image')}
              >
                📸 Image
              </button>
            </div>

            {/* URL Mode */}
            {uploadMode === 'url' && (
              <form onSubmit={handleSaveUrl} className="save-form">
                <div className="input-group">
                  <input
                    type="url"
                    placeholder="Paste any URL (article, product, video, etc.)"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="url-input"
                    disabled={loading}
                  />
                  <button type="submit" className="save-btn" disabled={loading}>
                    {loading ? '⏳ Saving...' : '💾 Save'}
                  </button>
                </div>
              </form>
            )}

            {/* Image Mode */}
            {uploadMode === 'image' && (
              <div className="save-form">
                <div className="upload-area">
                  <input
                    type="file"
                    id="image-upload"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={loading}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="image-upload" className="upload-label">
                    {loading ? (
                      <>⏳ Analyzing...</>
                    ) : (
                      <>
                        📷 Click to upload or drag image<br />
                        <span className="upload-hint">
                          Screenshots, photos, to-do lists, receipts, notes...
                        </span>
                      </>
                    )}
                  </label>
                </div>
              </div>
            )}

            {/* Message */}
            {message.text && (
              <div className={`message message-${message.type}`}>
                {message.text}
              </div>
            )}
          </div>

          {/* Search Recommendations */}
          {recommendations && (
            <div className="recommendations-section">
              <h3>💡 Search Suggestions</h3>

              {recommendations.relatedSearches && recommendations.relatedSearches.length > 0 && (
                <div className="recommendation-group">
                  <h4>Related Searches</h4>
                  <div className="recommendation-chips">
                    {recommendations.relatedSearches.map((rec, idx) => (
                      <button
                        key={idx}
                        className="recommendation-chip"
                        onClick={() => {
                          setSearchQuery(rec.text);
                          handleSearch({ preventDefault: () => {} });
                        }}
                      >
                        🔍 {rec.text}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {recommendations.trending && recommendations.trending.length > 0 && (
                <div className="recommendation-group">
                  <h4>Trending Searches</h4>
                  <div className="recommendation-chips">
                    {recommendations.trending.map((rec, idx) => (
                      <button
                        key={idx}
                        className="recommendation-chip trending"
                        onClick={() => {
                          setSearchQuery(rec.text);
                          handleSearch({ preventDefault: () => {} });
                        }}
                      >
                        🔥 {rec.text}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {recommendations.suggestions && recommendations.suggestions.length > 0 && (
                <div className="recommendation-group">
                  <h4>Try These</h4>
                  <div className="recommendation-chips">
                    {recommendations.suggestions.map((rec, idx) => (
                      <button
                        key={idx}
                        className="recommendation-chip suggestion"
                        onClick={() => {
                          setSearchQuery(rec.text);
                          handleSearch({ preventDefault: () => {} });
                        }}
                      >
                        ✨ {rec.text}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Items Grid */}
          <div className="items-section">
            <div className="section-header">
              <h2>Your Saved Items</h2>
              <span className="item-count">{items.length} items</span>
            </div>

            {items.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <h3>No items yet</h3>
                <p>Start saving content to your second brain!</p>
              </div>
            ) : (
              <div className="items-grid">
                {items.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onDelete={handleDeleteItem}
                    onRead={openReaderMode}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="container">
          <p>Built with ❤️ for Appointy Internship Drive 2025</p>
        </div>
      </footer>

      {/* Floating Chat Button */}
      <button
        className="floating-chat-btn"
        onClick={() => setIsChatOpen(true)}
        title="Chat with your knowledge base"
      >
        💬
        <span className="chat-badge">AI</span>
      </button>

      {/* Chat Panel */}
      <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}

// Item Card Component
function ItemCard({ item, onDelete, onRead }) {
  const getContentTypeIcon = (type) => {
    const icons = {
      article: '📰',
      product: '🛍️',
      video: '🎥',
      image: '🖼️',
      note: '📝',
      bookmark: '🔖',
      'todo-list': '✅',
      document: '📄',
      receipt: '🧾',
      screenshot: '📸',
    };
    return icons[type] || '📄';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className={`item-card item-card-${item.content_type}`}>
      <div className="item-header">
        <span className="content-type-badge">
          {getContentTypeIcon(item.content_type)} {item.content_type}
        </span>
        <div className="item-actions">
          {item.metadata?.price && (
            <span className="price-badge">${item.metadata.price}</span>
          )}
          <button
            className="delete-btn"
            onClick={() => onDelete(item.id)}
            title="Delete item"
          >
            🗑️
          </button>
        </div>
      </div>

      {item.thumbnail_url && (
        <div className="item-thumbnail">
          <img src={item.thumbnail_url} alt={item.title} />
        </div>
      )}

      <div className="item-content">
        <h3 className="item-title">{item.title}</h3>
        {item.description && (
          <p className="item-description">{item.description}</p>
        )}

        {item.tags && item.tags.length > 0 && (
          <div className="item-tags">
            {item.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="tag">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="item-footer">
          <span className="item-date">{formatDate(item.created_at)}</span>
          <div className="item-footer-actions">
            {item.content_type === 'article' && (
              <button
                onClick={() => onRead(item)}
                className="read-btn"
                title="Read in distraction-free mode"
              >
                📖 Read
              </button>
            )}
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="item-link"
              >
                Open →
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
