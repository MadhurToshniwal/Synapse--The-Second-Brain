# 🚀 Using Claude Code in VS Code Terminal

## ✅ You're Ready! Follow These Steps:

### **STEP 1: In the VS Code Terminal (where you are now)**

Just type this command and press Enter:

```powershell
claude
```

That's it! Claude Code will start!

---

### **STEP 2: When Claude Code Starts**

You'll see something like:

```
Claude Code - Interactive Coding Assistant
Type your request or question...

>
```

---

### **STEP 3: Paste Your First Prompt**

Copy this entire prompt and paste it into Claude Code:

```
Hi Claude! I'm building Project Synapse - an intelligent second brain app for the Appointy internship.

The backend structure is set up. Now I need you to create the core services:

First, create src/services/claudeService.js with:

- Import the Anthropic SDK (@anthropic-ai/sdk)
- Initialize the client using:
  - apiKey: process.env.ANTHROPIC_API_KEY
  - baseURL: process.env.ANTHROPIC_BASE_URL
- Use model: claude-3-5-sonnet-20241022

Create a ClaudeService class with these methods:

1. analyzeContent(content, contentType, url)
   Purpose: Analyze and extract metadata from any content
   
   - For 'article': Extract title, summary (2-3 sentences), key topics (5-7 tags), main points
   - For 'product': Extract product name, price (number only), brand, key specs, category
   - For 'image': Clean OCR text, identify type (todo/notes/diagram), extract structured data
   - For 'video': Extract metadata and generate summary from title/description
   
   Return structured JSON object

2. parseSearchQuery(query)
   Purpose: Parse natural language search queries
   
   - Extract: search terms, content type filter, price range, date range
   - Example: "black shoes under $300" → {searchText: "black shoes", filters: {price: {max: 300}}}
   
   Return filter object

3. generateTags(title, content)
   Purpose: Generate relevant tags
   
   - Create 5-7 tags based on content
   - Return array of strings

Include proper error handling and console.log for debugging.

Can you create this file for me?
```

---

### **STEP 4: Watch Claude Work!**

Claude will:
- ✅ Create the file
- ✅ Write the complete code
- ✅ Explain what it did
- ✅ Ask if you want to test it

---

### **STEP 5: Continue Building**

After the first service is done, ask Claude to build the next one:

```
Great! Now create src/services/embeddingService.js that:

- Uses axios to call the embedding API
- Endpoint: ${process.env.ANTHROPIC_BASE_URL}/v1/embeddings
- Model: gemini-embedding-001
- Authorization: Bearer ${process.env.ANTHROPIC_API_KEY}

Create an EmbeddingService class with:

1. generateEmbedding(text)
   - Takes a string (truncate to 8000 chars if longer)
   - POST to the endpoint
   - Returns the 768-dimensional vector array

2. generateEmbeddingBatch(texts)
   - Takes array of strings
   - Generates embeddings for all
   - Returns array of vectors

Include error handling and retry logic.
```

---

### **STEP 6: Test Your Code**

Ask Claude to test:

```
Can you create a test file that:
1. Imports the claudeService
2. Tests analyzing a sample article text
3. Shows the output

Run it and show me the results.
```

---

## 💡 **Pro Tips:**

### **Claude Code Commands:**

- **Exit**: Press `Ctrl+C` or type `exit`
- **New conversation**: Restart with `claude`
- **See files**: Claude can see all files in the current directory
- **Run commands**: Claude can run npm install, node scripts, etc.

### **What to Ask Claude:**

✅ "Create [filename] with [functionality]"
✅ "Fix the error in [file]"
✅ "Add [feature] to [file]"
✅ "Test the [service/function]"
✅ "Explain how [code] works"
✅ "Install the packages we need"

### **Working Efficiently:**

1. **One feature at a time** - Don't ask for everything at once
2. **Test as you go** - Ask Claude to test each feature
3. **Be specific** - The more details, the better Claude's output
4. **Iterate** - If something's wrong, just tell Claude to fix it

---

## 📋 **Build Order (What to Ask Claude Next):**

After Claude creates each service, continue with:

1. ✅ **claudeService.js** - Content analysis (START HERE)
2. ✅ **embeddingService.js** - Vector embeddings
3. ✅ **scraperService.js** - Web scraping
4. ✅ **itemsController.js** - API logic
5. ✅ **routes/items.js** - Express routes
6. ✅ Test everything
7. ✅ React frontend
8. ✅ Chrome extension

---

## 🆘 **If Something Goes Wrong:**

**Claude not starting?**
```powershell
npm install -g @anthropic-ai/claude-code
```

**API errors?**
```powershell
# Reload keys
$env:ANTHROPIC_BASE_URL = "https://litellm-339960399182.us-central1.run.app"
$env:ANTHROPIC_AUTH_TOKEN = "sk-8pjKWRFiz5tNxaJSpkFXtQ"
```

**Wrong directory?**
```powershell
cd d:\claude\project-synapse\backend
```

---

## 🎯 **You're Ready!**

In your VS Code terminal, type:

```
claude
```

Then paste the first prompt above! 🚀

Claude will be your coding partner and build this entire project with you!
