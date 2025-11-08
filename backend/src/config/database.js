const { Pool } = require('pg');

// Check if PostgreSQL is available
const isDatabaseAvailable = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('postgresql');

let pool;

if (isDatabaseAvailable) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  // Test database connection
  pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL database');
  });

  pool.on('error', (err) => {
    console.error('❌ Unexpected database error:', err);
  });
} else {
  console.log('⚠️  PostgreSQL not configured - using mock database for development');
  console.log('📝 See DATABASE_SETUP.md for installation instructions');
}

// Initialize database schema
const initDatabase = async () => {
  if (!isDatabaseAvailable) {
    console.log('⚠️  Skipping database initialization - PostgreSQL not available');
    console.log('💡 Install PostgreSQL or Docker to enable full functionality');
    return;
  }

  const client = await pool.connect();
  try {
    console.log('🔧 Initializing database schema...');

    // Enable extensions
    await client.query('CREATE EXTENSION IF NOT EXISTS vector');
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        
        title TEXT,
        description TEXT,
        content TEXT,
        raw_data JSONB,
        
        content_type VARCHAR(50) NOT NULL,
        url TEXT,
        source_domain VARCHAR(255),
        
        metadata JSONB DEFAULT '{}',
        
        thumbnail_url TEXT,
        image_urls TEXT[],
        video_url TEXT,
        file_path TEXT,
        
        tags TEXT[],
        collection_id UUID,
        is_favorite BOOLEAN DEFAULT FALSE,
        is_archived BOOLEAN DEFAULT FALSE,
        
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        accessed_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create embeddings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS embeddings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        item_id UUID REFERENCES items(id) ON DELETE CASCADE,
        embedding vector(768),
        embedding_model VARCHAR(100) DEFAULT 'gemini-embedding-001',
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(item_id, embedding_model)
      )
    `);

    // Create collections table
    await client.query(`
      CREATE TABLE IF NOT EXISTS collections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        color VARCHAR(7),
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_items_content_type ON items(content_type)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at DESC)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_items_tags ON items USING GIN(tags)');
    
    // Vector similarity index
    await client.query(`
      CREATE INDEX IF NOT EXISTS embeddings_vector_idx 
      ON embeddings USING hnsw (embedding vector_cosine_ops)
    `);

    // Full-text search index
    await client.query(`
      CREATE INDEX IF NOT EXISTS items_content_fts 
      ON items USING GIN (
        to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(content, ''))
      )
    `);

    console.log('✅ Database schema initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { pool, initDatabase };
