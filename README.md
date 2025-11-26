# 🧠 Synapse - Your AI-Powered Second Brain

<div align="center">

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-316192?logo=postgresql&logoColor=white)

**Never lose an idea again.** Synapse is an intelligent knowledge management system that captures, understands, and makes any content searchable - from articles and products to screenshots and handwritten notes.

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [Tech Stack](#-tech-stack) • [API](#-api-documentation)

</div>

---

## 🎯 Overview

Synapse is your digital second brain - a powerful, AI-driven platform that captures any content (articles, products, videos, handwritten notes, AI conversations) and makes it instantly searchable using natural language.

### The Problem
- You save content across dozens of platforms
- Finding something you saved months ago is nearly impossible
- Your best ideas get lost in the chaos

### The Solution
Synapse uses **AI to understand** what you save, creates **semantic embeddings** for intelligent search, and presents everything in a **beautiful interface** that makes retrieval effortless.

---

## ✨ Features

### 🤖 **Dual-AI Architecture**
- **Claude Sonnet 4.5**: Content analysis, summarization, OCR, query understanding
- **Hugging Face MPNet**: 768-dimensional semantic vectors (all-mpnet-base-v2)
- **Vision AI**: Image analysis and text extraction

### 📸 **Image Intelligence (OCR)**
- Extract text from screenshots and handwritten notes
- Automatically structure task lists from images
- Parse receipts and documents
- Support for JPEG, PNG, GIF, WebP, BMP

### 🔍 **Natural Language Search**
- Semantic understanding: *"articles about AI from last week"*
- 768-dimensional vector similarity using pgvector
- Smart filtering by content type, date, tags, price
- Query intelligence powered by Claude AI

### 🌐 **Chrome Extension (Manifest V3)**
- One-click save from any website
- Context menu integration
- Keyboard shortcuts (Ctrl+Shift+S)
- Smart content extraction
- Browser notifications

### 📖 **Reader Mode**
- Distraction-free reading experience
- Medium-style typography
- Image preservation
- Metadata display

### 🎨 **Beautiful UI/UX**
- Modern gradient design
- Content-type specific cards
- Smooth animations and transitions
- Fully responsive layout
- Toast notifications

### 💾 **Smart Content Capture**
- Automatic URL scraping and metadata extraction
- Content classification (articles, products, videos)
- AI-powered tag generation
- Thumbnail capture

### 🗄️ **Advanced Database**
- PostgreSQL with pgvector for vector similarity
- Full-text search capabilities
- Efficient indexing and JSON storage

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    USER INTERFACES                       │
├──────────────┬──────────────┬──────────────┬────────────┤
│   Web App    │  Extension   │  Mobile PWA  │  REST API  │
└──────┬───────┴──────┬───────┴──────┬───────┴────┬───────┘
       │              │              │            │
       └──────────────┴──────────────┴────────────┘
                       │
       ┌───────────────┼───────────────┐
       ▼               ▼               ▼
┌────────────┐ ┌─────────────┐ ┌──────────────┐
│ CLAUDE API │ │  MPNet 🤗   │ │   SCRAPERS   │
│ - Analysis │ │ - Embeddings│ │  - Cheerio   │
│ - OCR      │ │ (768-dim)   │ │  - Metadata  │
└────────────┘ └─────────────┘ └──────────────┘
       │              │              │
       └──────────────┴──────────────┘
                       │
       ┌───────────────┴───────────────┐
       ▼                               ▼
┌──────────────────┐      ┌────────────────────┐
│  PostgreSQL 16   │      │   Vector Search    │
│  + pgvector      │      │   (HNSW Index)     │
└──────────────────┘      └────────────────────┘
```

---

## 🛠️ Tech Stack

### Backend
- **Node.js + Express.js** - REST API server
- **PostgreSQL + pgvector** - Database with vector search
- **Claude 3.5 Sonnet** - Content understanding and analysis
- **Hugging Face Transformers** - Sentence embeddings (all-mpnet-base-v2)
- **Cheerio** - Web scraping
- **bcrypt + JWT** - Authentication

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Axios** - HTTP client

### Chrome Extension
- **Manifest V3** - Modern extension architecture
- **Content Scripts** - Page interaction
- **Background Service Worker** - Event handling

---

## 🚀 Installation

### Prerequisites
- Node.js >= 22.x
- PostgreSQL >= 16.x with pgvector extension
- Git
- Anthropic API key

### Quick Start with Docker

```bash
# 1. Clone repository
git clone https://github.com/MadhurToshniwal/Synapse--The-Second-Brain.git
cd Synapse--The-Second-Brain

# 2. Start database with pgvector
docker run -d --name synapse-db \
  -e POSTGRES_PASSWORD=synapse2024 \
  -p 5432:5432 \
  ankane/pgvector

# 3. Setup backend
cd backend
npm install
cp .env.example .env
# Edit .env with your ANTHROPIC_API_KEY
npm start

# 4. Setup frontend (in new terminal)
cd frontend
npm install
npm start

# 5. Load Chrome Extension
# Go to chrome://extensions/
# Enable Developer Mode
# Click "Load Unpacked"
# Select the /extension folder
```

### Manual Setup

#### 1. Backend Setup

```bash
cd backend
npm install

# Configure environment variables
# Edit .env with:
# - DATABASE_URL
# - ANTHROPIC_API_KEY
# - JWT_SECRET

# Initialize database
npm run db:init

# Start server
npm start
```

Backend runs on `http://localhost:5000`

#### 2. Frontend Setup

```bash
cd frontend
npm install

# Configure environment
# Edit .env with:
# - VITE_API_URL=http://localhost:5000
# - VITE_CLERK_PUBLISHABLE_KEY (if using Clerk)

# Start development server
npm run dev
```

Frontend runs on `http://localhost:3000`

#### 3. Chrome Extension

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension` folder

---

## 📖 Usage

### Saving Content

#### Web Application
1. Open `http://localhost:3000`
2. Paste any URL in the input field
3. Click "Save"
4. Content is automatically scraped, analyzed, and saved

#### Chrome Extension
- **Quick Save**: Click extension icon → "Save This Page"
- **Context Menu**: Right-click → "Save to Synapse"
- **Selection**: Highlight text → Right-click → "Save selection"
- **Keyboard**: `Ctrl+Shift+S` to save current page

### Searching

Use natural language queries:
- *"articles about AI from last week"*
- *"black shoes under $300"*
- *"React tutorials I saved"*

The AI understands:
- Content type filters
- Date ranges
- Price constraints
- Semantic meaning

### Supported Content Types

| Type | Examples | Auto-Extracted Data |
|------|----------|---------------------|
| 📰 Article | Blog posts, news | Title, summary, author, date, tags |
| 🛍️ Product | E-commerce listings | Name, price, brand, specs, images |
| 🎥 Video | YouTube, Vimeo | Title, description, thumbnail, embed URL |
| 🖼️ Image | Screenshots, photos | OCR text, structured content |
| 📝 Note | Selected text | Cleaned text, formatting |
| 🔖 Bookmark | Any URL | Title, description, images |

---

## 📚 API Documentation

### Authentication

All requests require JWT authentication:

```javascript
headers: {
  'Authorization': 'Bearer <your_jwt_token>'
}
```

### Endpoints

#### Items

```bash
# Create item from URL
POST /api/items
{
  "url": "https://example.com/article",
  "type": "article"
}

# Get all items (paginated)
GET /api/items?limit=20&offset=0&contentType=article

# Get single item
GET /api/items/:id

# Update item
PUT /api/items/:id

# Delete item
DELETE /api/items/:id

# Upload file/image
POST /api/items/upload
```

#### Search

```bash
# Natural language search
POST /api/search
{
  "query": "articles about vector databases",
  "limit": 20,
  "filters": {
    "contentType": "article",
    "dateFrom": "2025-01-01"
  }
}

# Find similar items
POST /api/search/similar
{
  "itemId": "uuid",
  "limit": 10
}
```

### Example Response

```json
{
  "success": true,
  "results": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Understanding Vector Databases",
      "description": "A comprehensive guide...",
      "content_type": "article",
      "similarity_score": 0.94,
      "tags": ["databases", "vectors", "ai"],
      "thumbnail_url": "https://...",
      "created_at": "2025-11-01T14:20:00Z"
    }
  ],
  "total": 15,
  "query_understanding": {
    "intent": "filtered_search",
    "search_terms": ["vector", "databases"],
    "content_type": "article"
  }
}
```

---

## 🗄️ Database Schema

```sql
-- Items table (core content storage)
CREATE TABLE items (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    title TEXT,
    description TEXT,
    content TEXT,
    content_type VARCHAR(50),
    url TEXT,
    metadata JSONB,
    tags TEXT[],
    thumbnail_url TEXT,
    is_favorite BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Embeddings table (semantic search)
CREATE TABLE embeddings (
    id UUID PRIMARY KEY,
    item_id UUID REFERENCES items(id),
    embedding vector(768), -- MPNet 768-dimensional vectors
    embedding_model VARCHAR(100),
    created_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX embeddings_vector_idx 
    ON embeddings USING hnsw (embedding vector_cosine_ops);

CREATE INDEX items_content_fts 
    ON items USING GIN (
        to_tsvector('english', title || ' ' || content)
    );
```

---

## 🤖 AI Components

### 1. Claude 3.5 Sonnet (Anthropic)
- **Content analysis** - Extract metadata from web pages
- **Query understanding** - Parse natural language searches
- **OCR** - Extract text from images
- **Tag generation** - Auto-generate relevant tags

### 2. all-mpnet-base-v2 (Hugging Face)
- **768-dimensional embeddings** for semantic search
- **No API costs** - Runs locally
- **Privacy-friendly** - Data never leaves your server
- **Offline capable** - No internet required after setup

### 3. Tesseract.js (OCR)
- Extract text from screenshots
- Handwritten note recognition
- Document digitization

---

## 🔮 Future Enhancements

- [ ] Collections/Folders for organization
- [ ] Collaborative boards and sharing
- [ ] Mobile app (iOS/Android)
- [ ] Export functionality (JSON, CSV, PDF)
- [ ] Dark mode
- [ ] Price tracking with alerts
- [ ] AI-powered recommendations
- [ ] Multi-language support
- [ ] Browser bookmarks import

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Madhur Toshniwal**
- Email: madhurtoshniwal03@gmail.com
- GitHub: [@MadhurToshniwal](https://github.com/MadhurToshniwal)

---

## 🙏 Acknowledgments

- **Anthropic** - For the powerful Claude API
- **Hugging Face** - For open-source transformer models
- **PostgreSQL + pgvector** - For vector similarity search
- Open Source Community

---

<div align="center">

**Built with ❤️ using Claude API**

*"Your mind is for having ideas, not storing them. Let Synapse be your second brain."* 🧠✨

</div>
