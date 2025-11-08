# 🤖 HOW TO USE CLAUDE CODE CLI

## What is Claude Code CLI?

Claude Code is an AI coding assistant that works directly in your terminal. Instead of me (the VS Code assistant) helping you, Claude will work with you interactively to build your project.

## Starting Claude Code

1. **Open a NEW PowerShell Terminal** (separate from VS Code)
2. **Navigate to your project:**
   ```powershell
   cd d:\claude\project-synapse\backend
   ```

3. **Start Claude Code:**
   ```powershell
   claude
   ```

4. **That's it!** Claude will start an interactive session.

## How to Work with Claude Code

Once Claude Code starts, you can ask it to help you build features:

### Example Commands:

**Ask Claude to build the Claude Service:**
```
Create a Claude service in src/services/claudeService.js that:
- Uses the Anthropic SDK
- Has a method to analyze content (articles, products, images)
- Returns structured JSON with title, summary, tags, and metadata
- Uses the API key from environment variables
```

**Ask Claude to create the embedding service:**
```
Build an embedding service that calls the Gemini embedding API at:
https://litellm-339960399182.us-central1.run.app/v1/embeddings
Model: gemini-embedding-001
Use my API key: sk-8pjKWRFiz5tNxaJSpkFXtQ
```

**Ask Claude to build a scraper:**
```
Create a web scraper service using Cheerio that:
- Takes a URL
- Detects if it's a product, article, or video
- Extracts relevant data (title, description, images, price if product)
- Returns structured JSON
```

**Ask Claude to create API routes:**
```
Build Express routes for:
- POST /api/items - Save a new item
- GET /api/items - Get all items
- POST /api/search - Semantic search
Use the services we created
```

## What Claude Code Can Do

- ✅ Write complete code files
- ✅ Edit existing files
- ✅ Run terminal commands
- ✅ Install npm packages
- ✅ Test code
- ✅ Debug errors
- ✅ Explain how things work
- ✅ Suggest improvements

## Tips for Best Results

1. **Be specific**: Tell Claude exactly what you want
2. **One feature at a time**: Build incrementally
3. **Test as you go**: Ask Claude to test each feature
4. **Ask questions**: If you don't understand, ask Claude to explain
5. **Iterate**: If something doesn't work, tell Claude and it will fix it

## Example Session

```
You: "Let's start building Project Synapse. First, create the Claude service 
     that analyzes content and extracts metadata."

Claude: [Creates claudeService.js with complete implementation]

You: "Great! Now create the embedding service that generates vectors."

Claude: [Creates embeddingService.js]

You: "Test the embedding service with a sample text"

Claude: [Runs test code and shows results]

You: "Perfect! Now build the web scraper service..."
```

## Important Notes

- **Claude Code uses YOUR API key** (sk-8pjKWRFiz5tNxaJSpkFXtQ)
- **It works in your project folder** - it can see and edit all files
- **It commits to git** - your progress is saved
- **It's conversational** - just talk to it naturally!

## Getting Help

If Claude Code isn't working:

1. **Check API keys:**
   ```powershell
   echo $env:ANTHROPIC_AUTH_TOKEN
   echo $env:ANTHROPIC_BASE_URL
   ```

2. **Reload environment:**
   ```powershell
   $env:ANTHROPIC_BASE_URL = [Environment]::GetEnvironmentVariable("ANTHROPIC_BASE_URL","User")
   $env:ANTHROPIC_AUTH_TOKEN = [Environment]::GetEnvironmentVariable("ANTHROPIC_AUTH_TOKEN","User")
   ```

3. **Restart Claude:**
   ```powershell
   claude
   ```

## Next Steps

1. Open a new PowerShell terminal
2. Navigate to `d:\claude\project-synapse\backend`
3. Run `claude`
4. Start asking Claude to build features!

**Claude Code will be your pair programmer for this entire project!** 🚀
