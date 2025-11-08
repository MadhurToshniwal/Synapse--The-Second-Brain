# 📋 Copy-Paste Prompts for Claude Code

Use these prompts when working with Claude Code CLI to build Project Synapse efficiently.

---

## 🚀 PHASE 1: Core Services

### Prompt 1: Claude Service
```
Create src/services/claudeService.js with the following implementation:

- Import Anthropic SDK (@anthropic-ai/sdk)
- Initialize client with:
  - apiKey: process.env.ANTHROPIC_API_KEY
  - baseURL: process.env.ANTHROPIC_BASE_URL
- Model: claude-3-5-sonnet-20241022

Create a class with these methods:

1. analyzeContent(content, contentType, url)
   - Takes content (HTML/text), contentType (article/product/image/video), and URL
   - Sends appropriate prompt based on contentType
   - For articles: extract title, summary (2-3 sentences), tags, key points
   - For products: extract name, price, brand, specs, category
   - For images: clean OCR text, identify type (todo/notes/diagram)
   - For videos: extract metadata and generate summary
   - Returns structured JSON

2. parseSearchQuery(query)
   - Takes natural language search query
   - Extracts: search terms, content type filter, price range, date filters
   - Returns structured filter object

3. generateTags(title, content)
   - Generates 5-7 relevant tags
   - Returns array of strings

Include error handling and logging.
```

---

### Prompt 2: Embedding Service
```
Create src/services/embeddingService.js:

- Use axios to call the embedding API
- Endpoint: https://litellm-339960399182.us-central1.run.app/v1/embeddings
- Model: gemini-embedding-001
- Authorization header: Bearer {API_KEY from env}

Create a class with:

1. generateEmbedding(text)
   - Takes a string (max 8000 chars, truncate if longer)
   - Returns 768-dimensional vector array

2. generateEmbeddingBatch(texts[])
   - Takes array of strings
   - Returns array of vectors
   - Handles rate limiting

Include error handling and retry logic.
```

---

### Prompt 3: Web Scraper Service
```
Create src/services/scraperService.js using Cheerio:

Import axios and cheerio.

Create a class with:

1. scrapeURL(url)
   - Fetches URL with proper User-Agent header
   - Detects content type (product/article/video)
   - Calls appropriate scraper method
   - Returns structured data

2. detectContentType(url, $)
   - Checks hostname and page structure
   - Returns: 'product', 'article', 'video', or 'bookmark'

3. scrapeProduct(url, $)
   - Extracts: title, price, images[], description, brand, rating
   - Returns product object

4. scrapeArticle(url, $)
   - Extracts: title, content, description, images[], author, date
   - Returns article object

5. scrapeVideo(url, $)
   - Extracts YouTube/Vimeo metadata
   - Returns video object with embed URL

6. Helper methods:
   - extractPrice($) - finds and parses price
   - extractImages($) - gets image URLs (limit 5)
   - extractYouTubeID(url) - gets video ID

Include 10-second timeout and error handling.
```

---

## 🎯 PHASE 2: Controllers & Routes

### Prompt 4: Items Controller
```
Create src/controllers/itemsController.js:

Import all services (claudeService, embeddingService, scraperService).
Import database pool from config/database.js.

Create a class with:

1. createItem(req, res)
   - Get { url, content, type } from req.body
   - Get userId from req.user.id (auth middleware)
   - If URL: scrape using scraperService
   - If content: use directly
   - Analyze with claudeService
   - Generate embedding with embeddingService
   - Store in database (items + embeddings table)
   - Return created item

2. getItems(req, res)
   - Get userId from req.user
   - Get query params: type, limit, offset
   - Query items table
   - Return paginated results

3. searchItems(req, res)
   - Get { query } from req.body
   - Parse query with Claude
   - Generate query embedding
   - Perform vector similarity search using pgvector
   - Apply filters (price, date, type)
   - Return ranked results

Use proper error handling and database transactions.
```

---

### Prompt 5: Express Routes
```
Create src/routes/items.js:

Import express Router and itemsController.

Define routes:
- POST /api/items - itemsController.createItem
- GET /api/items - itemsController.getItems
- POST /api/search - itemsController.searchItems
- GET /api/items/:id - get single item
- PUT /api/items/:id - update item
- DELETE /api/items/:id - delete item

Export router.

Then update src/server.js to use this router:
- Import items routes
- app.use('/api', itemsRoutes)
```

---

## 🧪 PHASE 3: Testing

### Prompt 6: Test the API
```
Create a test script test.js that:

1. Tests saving a URL:
   - POST to http://localhost:5000/api/items
   - Body: { url: "https://example.com/article" }
   - Shows the response

2. Tests search:
   - POST to http://localhost:5000/api/search
   - Body: { query: "example search" }
   - Shows results

3. Lists all items:
   - GET http://localhost:5000/api/items
   - Shows items

Use axios to make requests.
Run this script and show me the results.
```

---

## 🎨 PHASE 4: Frontend (After Backend Works)

### Prompt 7: React Setup
```
I need to create a React frontend in a new folder called 'frontend'.

Steps:
1. Create React app with Vite
2. Install dependencies: 
   - axios, react-router-dom, @tanstack/react-query
   - tailwindcss, framer-motion
3. Set up Tailwind CSS
4. Create folder structure:
   - src/components
   - src/pages
   - src/services
   - src/hooks
   - src/store

Do this for me and show the structure.
```

---

### Prompt 8: Main Components
```
Create these React components:

1. src/components/ItemCard.jsx
   - Takes item prop
   - Renders differently based on contentType
   - Product: shows image, price, title
   - Article: shows thumbnail, title, summary
   - Video: shows thumbnail, play button
   - Beautiful card design with Tailwind

2. src/components/SearchBar.jsx
   - Input with search icon
   - Calls onSearch(query) prop
   - Real-time search
   - Shows suggestions

3. src/pages/Dashboard.jsx
   - Grid of ItemCards
   - SearchBar at top
   - Filters sidebar
   - Infinite scroll

Use Tailwind for beautiful styling.
```

---

## 🔌 PHASE 5: Chrome Extension

### Prompt 9: Extension Setup
```
Create a Chrome extension in a new folder called 'extension'.

Create:
1. manifest.json (Manifest V3)
   - Name: Synapse - Save Anything
   - Permissions: activeTab, storage, contextMenus
   - Content script for all URLs
   - Background service worker
   - Popup HTML

2. popup.html & popup.js
   - Simple UI to save current page
   - Shows save success/error
   - Quick access to dashboard

3. content.js
   - Adds "Save to Synapse" button when text is selected
   - Sends data to background script

4. background.js
   - Receives save requests
   - POSTs to API
   - Handles authentication

Make it functional and beautiful.
```

---

## 💡 Quick Tips

**If Claude asks questions:**
- Answer them clearly
- Provide the information from .env file
- Reference the master plan document

**If something doesn't work:**
```
That didn't work. Here's the error: [paste error]
Can you fix it?
```

**To see what Claude is doing:**
```
Can you explain what you just created?
Show me how to test it.
```

**To commit progress:**
```
This looks good! Can you commit these changes to git with a meaningful message?
```

---

## 🎯 Recommended Order

1. ✅ Claude Service (analyze content)
2. ✅ Embedding Service (generate vectors)  
3. ✅ Scraper Service (fetch web content)
4. ✅ Items Controller (API logic)
5. ✅ Routes (Express endpoints)
6. ✅ Test everything works
7. ✅ React frontend
8. ✅ Chrome extension
9. ✅ Polish & deploy

**Copy these prompts and paste them into Claude Code one at a time!** 🚀
