require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./config/database');

const app = express();
const path = require('path');

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: '🧠 Synapse API is running',
    timestamp: new Date().toISOString()
  });
});

// Import routes
const itemsRoutes = require('./routes/items');
const searchRoutes = require('./routes/search');
const authRoutes = require('./routes/auth');
const mcpRoutes = require('./routes/mcp');
const chatRoutes = require('./routes/chat');

// API routes
app.use('/api/items', itemsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/mcp', mcpRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', require('./routes/admin'));

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Synapse API v1.0',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/me',
        updateProfile: 'PUT /api/auth/profile',
        changePassword: 'POST /api/auth/change-password'
      },
      items: {
        create: 'POST /api/items',
        list: 'GET /api/items',
        get: 'GET /api/items/:id',
        update: 'PUT /api/items/:id',
        delete: 'DELETE /api/items/:id'
      },
      search: {
        search: 'POST /api/search',
        similar: 'GET /api/search/similar/:itemId',
        suggestions: 'GET /api/search/suggestions'
      },
      mcp: {
        capabilities: 'GET /api/mcp/capabilities',
        context: 'GET /api/mcp/context',
        search: 'POST /api/mcp/search',
        searchByColor: 'POST /api/mcp/search-by-color',
        analyze: 'POST /api/mcp/analyze'
      },
      chat: {
        sendMessage: 'POST /api/chat',
        getConversations: 'GET /api/chat/conversations',
        getConversation: 'GET /api/chat/:conversationId',
        deleteConversation: 'DELETE /api/chat/:conversationId'
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize database and start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    console.log('🚀 Starting Synapse API...');
    
    // Initialize database
    await initDatabase();
    
    // Start listening
    app.listen(PORT, () => {
      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🧠  PROJECT SYNAPSE API');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`✅ Health check: http://localhost:${PORT}/health`);
      console.log(`✅ Environment: ${process.env.NODE_ENV}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
