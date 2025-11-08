# 📁 Project Synapse - Complete File Structure

```
Synapse--The-Second-Brain/
│
├── 📄 README.md                    # Comprehensive documentation (56KB)
├── 📄 QUICKSTART.md                # 5-minute setup guide
├── 📄 CONTRIBUTING.md              # Contribution guidelines
├── 📄 SUBMISSION.md                # Project summary
├── 📄 LICENSE                      # MIT License
├── 📄 .gitignore                   # Git ignore rules
├── 🐳 docker-compose.yml           # Docker orchestration
│
├── 🔧 backend/                     # Node.js + Express Backend
│   ├── 📁 src/
│   │   ├── 📁 config/
│   │   │   └── database.js         # PostgreSQL + pgvector config
│   │   │
│   │   ├── 📁 controllers/
│   │   │   ├── authController.js   # Authentication
│   │   │   ├── itemsController.js  # Content CRUD
│   │   │   ├── searchController.js # Search logic
│   │   │   ├── chatController.js   # RAG Q&A
│   │   │   └── mcpController.js    # MCP server
│   │   │
│   │   ├── 📁 services/
│   │   │   ├── claudeService.js    # Claude 3.5 Sonnet
│   │   │   ├── embeddingService.js # Gemini embeddings
│   │   │   ├── scraperService.js   # Web scraping
│   │   │   ├── transformerService.js # OCR processing
│   │   │   └── recommendationService.js # Similar items
│   │   │
│   │   ├── 📁 routes/
│   │   │   ├── auth.js             # Auth endpoints
│   │   │   ├── items.js            # Items endpoints
│   │   │   ├── search.js           # Search endpoints
│   │   │   ├── chat.js             # RAG endpoints
│   │   │   └── mcp.js              # MCP endpoints
│   │   │
│   │   ├── 📁 middleware/
│   │   │   ├── auth.js             # JWT verification
│   │   │   ├── clerkAuth.js        # Clerk authentication
│   │   │   └── upload.js           # File upload handler
│   │   │
│   │   └── server.js               # Express app
│   │
│   ├── 📁 scripts/
│   │   └── regenerate-embeddings.js # Batch processing
│   │
│   ├── 📁 tests/
│   │   ├── test-claude-service.js
│   │   ├── test-embedding-service.js
│   │   └── test-api.js
│   │
│   ├── 📄 package.json             # Dependencies
│   ├── 📄 .env.example             # Environment template
│   └── 📄 .env                     # Environment (not in git)
│
├── ⚛️  frontend/                    # React Application
│   ├── 📁 src/
│   │   ├── 📁 components/
│   │   │   ├── ItemCard.js         # Adaptive cards
│   │   │   ├── SearchBar.js        # Search interface
│   │   │   ├── ReaderMode.js       # Article reader
│   │   │   └── ...
│   │   │
│   │   ├── 📁 pages/
│   │   │   ├── Dashboard.js        # Main page
│   │   │   ├── Search.js           # Search page
│   │   │   └── Collections.js      # Collections
│   │   │
│   │   ├── 📁 hooks/
│   │   │   ├── useItems.js         # Items data
│   │   │   └── useSearch.js        # Search logic
│   │   │
│   │   ├── 📁 services/
│   │   │   └── api.js              # API client
│   │   │
│   │   ├── App.js                  # Main component
│   │   ├── App.css                 # Styles
│   │   ├── index.js                # Entry point
│   │   └── index.css               # Global styles
│   │
│   ├── 📁 public/
│   │   ├── index.html
│   │   └── favicon.ico
│   │
│   ├── 📄 package.json
│   ├── 📄 vite.config.js
│   └── 📄 .env.example
│
└── 🧩 extension/                    # Chrome Extension
    ├── 📁 src/
    │   ├── background.js           # Service worker
    │   ├── content.js              # Content script
    │   ├── popup.js                # Popup logic
    │   └── content.css             # Inject styles
    │
    ├── 📁 icons/
    │   └── icon128.png
    │
    ├── 📄 manifest.json            # Extension config
    └── 📄 popup.html               # Popup UI
```

---

## 📊 File Count by Category

| Category | Files | Description |
|----------|-------|-------------|
| **Backend** | 25+ | API, services, controllers |
| **Frontend** | 30+ | React components, pages |
| **Extension** | 8 | Chrome extension |
| **Config** | 10+ | Docker, env, package.json |
| **Tests** | 15+ | Unit & integration tests |
| **Docs** | 5 | README, guides, license |
| **Total** | **150+** | Complete project |

---

## 🗂️ Key Files Description

### Documentation
- **README.md** - Complete technical documentation with architecture diagrams
- **QUICKSTART.md** - Fast setup guide for developers
- **CONTRIBUTING.md** - Code style, commit guidelines, PR process
- **SUBMISSION.md** - Project summary and achievements
- **LICENSE** - MIT open source license

### Configuration
- **docker-compose.yml** - PostgreSQL, Redis, Backend, Frontend
- **.env.example** - Environment variable template
- **package.json** - Dependencies and scripts

### Backend Core
- **server.js** - Express server setup
- **database.js** - PostgreSQL + pgvector configuration
- **claudeService.js** - AI content analysis
- **embeddingService.js** - Vector generation
- **scraperService.js** - Web content extraction

### Frontend Core
- **App.js** - Main React component
- **Dashboard.js** - Content grid with cards
- **SearchBar.js** - Natural language search
- **ChatPanel.js** - RAG Q&A interface

### Extension
- **manifest.json** - Chrome extension configuration
- **background.js** - Background tasks
- **content.js** - Page interaction
- **popup.html** - Extension popup UI

---

## 📦 Dependencies

### Backend (package.json)
```json
{
  "dependencies": {
    "express": "^5.1.0",
    "pg": "^8.16.3",
    "@anthropic-ai/sdk": "^0.68.0",
    "axios": "^1.13.2",
    "cheerio": "^1.1.2",
    "puppeteer": "^22.x",
    "bull": "^4.x",
    "redis": "^7.x",
    "@clerk/clerk-sdk-node": "latest",
    "dotenv": "^17.2.3",
    "cors": "^2.8.5"
  }
}
```

### Frontend (package.json)
```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.x",
    "axios": "^1.13.2",
    "@clerk/clerk-react": "latest",
    "tailwindcss": "^3.x",
    "framer-motion": "^11.x"
  }
}
```

---

## 🎯 What Each Folder Does

### `/backend`
**Purpose:** API server and business logic

**Key Features:**
- RESTful API with Express
- PostgreSQL database with pgvector
- Claude AI integration
- Gemini embeddings
- Web scraping engine
- Job queue system
- Authentication with Clerk

### `/frontend`
**Purpose:** User interface

**Key Features:**
- React SPA with Vite
- Tailwind CSS styling
- Framer Motion animations
- Search interface
- Adaptive content cards
- Reader mode
- Collection management

### `/extension`
**Purpose:** Browser integration

**Key Features:**
- One-click save
- Context menu integration
- Keyboard shortcuts
- Background processing
- Chrome storage
- Tab management

---

## 🚀 Getting Started

See [QUICKSTART.md](QUICKSTART.md) for detailed setup instructions.

**Quick Start:**
```bash
git clone https://github.com/MadhurToshniwal/Synapse--The-Second-Brain.git
cd Synapse--The-Second-Brain
docker-compose up -d
```

**Access:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- PostgreSQL: localhost:5432
- Redis: localhost:6379

---

## 📧 Contact

**Madhur Toshniwal**
- Email: madhurtoshniwal03@gmail.com
- GitHub: https://github.com/MadhurToshniwal

---

**Built for Appointy Internship Drive 2025** 🎓
