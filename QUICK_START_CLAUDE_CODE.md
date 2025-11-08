# 🎯 Quick Start Guide for Project Synapse with Claude Code

## Step-by-Step: Using Claude Code to Build This Project

### 1. Open a New Terminal
- Press `Ctrl + Shift + `` (backtick) in VS Code
- Or open Windows Terminal / PowerShell separately

### 2. Set Up Environment (One-Time Setup)
```powershell
# Load API keys
$env:ANTHROPIC_BASE_URL = [Environment]::GetEnvironmentVariable("ANTHROPIC_BASE_URL","User")
$env:ANTHROPIC_AUTH_TOKEN = [Environment]::GetEnvironmentVariable("ANTHROPIC_AUTH_TOKEN","User")

# Navigate to project
cd d:\claude\project-synapse\backend
```

### 3. Start Claude Code
```powershell
claude
```

### 4. Your First Prompt to Claude

Copy and paste this into Claude Code:

```
Hi Claude! I'm building Project Synapse for the Appointy internship. 

Here's what we need to build:
- An intelligent content management system (second brain)
- Users can save any content: URLs, products, videos, handwritten notes
- AI analyzes and understands the content
- Semantic search using natural language
- Beautiful visual interface

The backend structure is ready. Let's build the core services:

1. First, create src/services/claudeService.js that:
   - Uses @anthropic-ai/sdk
   - Has an analyzeContent(content, contentType, url) method
   - Returns structured data: {title, summary, tags, metadata}
   - Handles different content types (article, product, image, video)

Use these environment variables:
- ANTHROPIC_API_KEY from process.env
- ANTHROPIC_BASE_URL from process.env

The API endpoint is: https://litellm-339960399182.us-central1.run.app
Model: claude-3-5-sonnet-20241022

Can you create this service for me?
```

### 5. Continue Building

After Claude creates the first service, continue with:

**Embedding Service:**
```
Great! Now create src/services/embeddingService.js that:
- Calls the embedding API at ANTHROPIC_BASE_URL/v1/embeddings
- Model: gemini-embedding-001
- Takes text and returns a 768-dimensional vector
- Has methods: generateEmbedding(text) and generateEmbeddingBatch(texts[])
```

**Web Scraper:**
```
Now build src/services/scraperService.js using Cheerio:
- scrapeURL(url) method
- Detects content type (product, article, video)
- Extracts: title, description, images, metadata
- For products: also extract price, brand
- Returns structured JSON
```

**Items Controller:**
```
Create src/controllers/itemsController.js with:
- createItem(req, res) - saves content, analyzes with Claude, generates embedding
- getItems(req, res) - retrieves user's items
- searchItems(req, res) - semantic search using embeddings

Use the services we just created.
```

**Routes:**
```
Set up Express routes in src/routes/items.js:
- POST /api/items - create item
- GET /api/items - get items
- POST /api/search - search items

Connect to the itemsController.
```

### 6. Testing

Ask Claude to test each feature:
```
Can you create a test script that:
1. Saves a sample URL (an article)
2. Shows the analyzed data
3. Generates an embedding
4. Tests the search functionality
```

### 7. Next Steps

Once backend is working, ask Claude to:
- Build the React frontend
- Create the Chrome extension
- Add authentication
- Improve the UI

## Why Use Claude Code Instead of Me?

**Claude Code (in terminal):**
- ✅ Can execute code and see results
- ✅ Can install packages
- ✅ Can test features immediately
- ✅ Interactive back-and-forth
- ✅ Can fix errors as they happen

**Me (VS Code Copilot):**
- ✅ Good for explaining concepts
- ✅ Good for planning
- ✅ Good for reviewing code
- ❌ Can't execute code directly
- ❌ Can't install packages as easily

**Use both!**
- Use **Claude Code** to build features
- Use **me** to understand architecture and get explanations

## Troubleshooting

**If `claude` command doesn't work:**
```powershell
# Reinstall
npm install -g @anthropic-ai/claude-code

# Check PATH
npm prefix -g
# Add that path to your system PATH
```

**If API key errors:**
```powershell
# Reload environment
$env:ANTHROPIC_BASE_URL = "https://litellm-339960399182.us-central1.run.app"
$env:ANTHROPIC_AUTH_TOKEN = "sk-8pjKWRFiz5tNxaJSpkFXtQ"
```

**If Claude seems stuck:**
- Press `Ctrl+C` to stop
- Type `claude` to restart
- Be more specific in your request

## You're Ready! 🚀

Open a terminal, navigate to the backend folder, and type `claude` to start building!
