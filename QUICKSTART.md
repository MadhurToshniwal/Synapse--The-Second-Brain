# 🚀 Quick Start Guide

## Prerequisites

- Node.js >= 22.x
- PostgreSQL >= 16.x with pgvector
- Redis >= 7.x
- Git

## Installation (5 minutes)

### 1. Clone & Install

```bash
git clone https://github.com/MadhurToshniwal/Synapse--The-Second-Brain.git
cd Synapse--The-Second-Brain

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment

```bash
# Backend .env
cd backend
cp .env.example .env

# Edit .env with your keys:
# - DATABASE_URL
# - ANTHROPIC_API_KEY
# - CLERK_PUBLISHABLE_KEY
# - CLERK_SECRET_KEY

# Frontend .env
cd ../frontend
cp .env.example .env

# Edit .env:
# - VITE_API_URL=http://localhost:5000
# - VITE_CLERK_PUBLISHABLE_KEY=your_key
```

### 3. Start with Docker (Easiest)

```bash
# In project root
docker-compose up -d

# Access:
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

### 4. Or Start Manually

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev

# Terminal 3 - Database (if not using Docker)
# Start PostgreSQL and Redis manually
```

## First Time Setup

1. **Create Account:** Go to http://localhost:3000
2. **Sign up** with email
3. **Save your first item:**
   - Click "Add Content"
   - Paste a URL or write a note
   - Click Save

4. **Try Search:**
   - Use natural language: "articles about AI"
   - See intelligent results!

## Chrome Extension

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `extension` folder
5. Pin the extension
6. Use Alt+S to save any page!

## Need Help?

- 📧 Email: madhurtoshniwal03@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/MadhurToshniwal/Synapse--The-Second-Brain/issues)
- 📖 Full docs: See [README.md](README.md)

## Common Issues

**Database connection error:**
```bash
# Make sure PostgreSQL is running
# Check DATABASE_URL in .env
```

**API key errors:**
```bash
# Verify ANTHROPIC_API_KEY in backend/.env
# Check CLERK keys are correct
```

**Port already in use:**
```bash
# Change PORT in backend/.env
# Change port in frontend/vite.config.js
```

---

**That's it! You're ready to build your second brain! 🧠**
