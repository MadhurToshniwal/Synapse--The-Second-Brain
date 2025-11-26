const db = require('../config/database');
const embeddingService = require('../services/embeddingService');
const claudeService = require('../services/claudeService');

/**
 * MCP (Model-Context-Protocol) Controller
 * Provides AI integration endpoints for external systems
 */
class MCPController {
  /**
   * Get user's knowledge base context
   * GET /api/mcp/context
   */
  async getContext(req, res) {
    try {
      const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';
      const { limit = 100 } = req.query;

      if (!db.pool) {
        return res.status(503).json({
          error: 'Database not available'
        });
      }

      // Get all items for context
      const query = `
        SELECT
          id,
          title,
          description,
          content_type,
          url,
          extracted_text,
          tags,
          metadata,
          created_at
        FROM items
        WHERE user_id = $1
          AND is_archived = false
        ORDER BY created_at DESC
        LIMIT $2
      `;

      const result = await db.pool.query(query, [userId, parseInt(limit)]);

      res.json({
        success: true,
        context: {
          userId: userId,
          itemCount: result.rows.length,
          items: result.rows
        }
      });

    } catch (error) {
      console.error('[MCPController] Error getting context:', error.message);
      res.status(500).json({
        error: 'Failed to get context',
        message: error.message
      });
    }
  }

  /**
   * Search knowledge base with semantic query
   * POST /api/mcp/search
   */
  async searchKnowledgeBase(req, res) {
    try {
      const { query, filters = {}, limit = 10 } = req.body;
      const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';

      if (!query) {
        return res.status(400).json({
          error: 'Query is required'
        });
      }

      if (!db.pool) {
        return res.status(503).json({
          error: 'Database not available'
        });
      }

      // Generate embedding
      const embedding = await embeddingService.generateEmbedding(query);

      // Build search query
      let sqlQuery = `
        SELECT
          i.id,
          i.title,
          i.description,
          i.content_type,
          i.url,
          i.extracted_text,
          i.tags,
          i.metadata,
          i.created_at,
          (e.embedding <=> $1::vector) as similarity_score
        FROM items i
        JOIN embeddings e ON i.id = e.item_id
        WHERE i.user_id = $2
          AND i.is_archived = false
      `;

      const params = [JSON.stringify(embedding), userId];
      let paramIndex = 3;

      // Apply filters
      if (filters.contentType) {
        sqlQuery += ` AND i.content_type = $${paramIndex}`;
        params.push(filters.contentType);
        paramIndex++;
      }

      if (filters.colors && filters.colors.length > 0) {
        const colorConditions = filters.colors.map(color =>
          `i.metadata::text ILIKE '%${color}%'`
        );
        sqlQuery += ` AND (${colorConditions.join(' OR ')})`;
      }

      sqlQuery += `
        ORDER BY e.embedding <=> $1::vector
        LIMIT $${paramIndex}
      `;
      params.push(parseInt(limit));

      const result = await db.pool.query(sqlQuery, params);

      res.json({
        success: true,
        query: query,
        results: result.rows,
        count: result.rows.length
      });

    } catch (error) {
      console.error('[MCPController] Error searching:', error.message);
      res.status(500).json({
        error: 'Search failed',
        message: error.message
      });
    }
  }

  /**
   * Get items by color attributes
   * POST /api/mcp/search-by-color
   */
  async searchByColor(req, res) {
    try {
      const { colors, objectType = null, limit = 20 } = req.body;
      const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';

      if (!colors || colors.length === 0) {
        return res.status(400).json({
          error: 'At least one color is required'
        });
      }

      if (!db.pool) {
        return res.status(503).json({
          error: 'Database not available'
        });
      }

      let query = `
        SELECT
          i.id,
          i.title,
          i.description,
          i.content_type,
          i.url,
          i.metadata,
          i.created_at
        FROM items i
        WHERE i.user_id = $1
          AND i.is_archived = false
      `;

      const params = [userId];
      let paramIndex = 2;

      // Color filtering
      const colorConditions = colors.map(color => {
        return `(
          i.metadata->'dominantColors' ? '${color}' OR
          i.metadata::text ILIKE '%${color}%' OR
          i.description ILIKE '%${color}%' OR
          EXISTS (
            SELECT 1 FROM jsonb_array_elements(i.metadata->'objects') obj
            WHERE obj->'colors' ? '${color}' OR obj->>'colors' ILIKE '%${color}%'
          )
        )`;
      });

      query += ` AND (${colorConditions.join(' OR ')})`;

      // Object type filtering
      if (objectType) {
        query += ` AND (
          i.metadata::text ILIKE $${paramIndex} OR
          EXISTS (
            SELECT 1 FROM jsonb_array_elements(i.metadata->'objects') obj
            WHERE obj->>'name' ILIKE $${paramIndex}
          )
        )`;
        params.push(`%${objectType}%`);
        paramIndex++;
      }

      query += `
        ORDER BY i.created_at DESC
        LIMIT $${paramIndex}
      `;
      params.push(parseInt(limit));

      const result = await db.pool.query(query, params);

      res.json({
        success: true,
        colors: colors,
        objectType: objectType,
        results: result.rows,
        count: result.rows.length
      });

    } catch (error) {
      console.error('[MCPController] Error searching by color:', error.message);
      res.status(500).json({
        error: 'Color search failed',
        message: error.message
      });
    }
  }

  /**
   * Analyze new content via MCP
   * POST /api/mcp/analyze
   */
  async analyzeContent(req, res) {
    try {
      const { content, contentType, url = '' } = req.body;

      if (!content || !contentType) {
        return res.status(400).json({
          error: 'Content and contentType are required'
        });
      }

      const analysis = await claudeService.analyzeContent(content, contentType, url);

      res.json({
        success: true,
        analysis: analysis
      });

    } catch (error) {
      console.error('[MCPController] Error analyzing content:', error.message);
      res.status(500).json({
        error: 'Analysis failed',
        message: error.message
      });
    }
  }

  /**
   * Get MCP server capabilities and schema
   * GET /api/mcp/capabilities
   */
  async getCapabilities(req, res) {
    try {
      res.json({
        success: true,
        version: '1.0.0',
        protocol: 'Model-Context-Protocol',
        capabilities: {
          search: {
            semantic: true,
            colorBased: true,
            filters: ['contentType', 'colors', 'author', 'dateRange', 'price', 'keywords']
          },
          contentTypes: ['article', 'product', 'image', 'video', 'note', 'todo-list', 'receipt', 'screenshot', 'document'],
          analysis: {
            vision: true,
            ocr: true,
            colorDetection: true,
            objectRecognition: true
          },
          embeddings: {
            model: 'gemini-embedding-001',
            dimensions: 3072
          }
        },
        endpoints: {
          context: 'GET /api/mcp/context',
          search: 'POST /api/mcp/search',
          searchByColor: 'POST /api/mcp/search-by-color',
          analyze: 'POST /api/mcp/analyze',
          capabilities: 'GET /api/mcp/capabilities'
        }
      });
    } catch (error) {
      console.error('[MCPController] Error getting capabilities:', error.message);
      res.status(500).json({
        error: 'Failed to get capabilities',
        message: error.message
      });
    }
  }
}

module.exports = new MCPController();
