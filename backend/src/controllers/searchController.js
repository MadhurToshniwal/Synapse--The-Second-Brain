const claudeService = require('../services/claudeService');
const embeddingService = require('../services/embeddingService');
const transformerService = require('../services/transformerService');
const recommendationService = require('../services/recommendationService');
const db = require('../config/database');

class SearchController {
  /**
   * Search items using natural language query
   * POST /api/search
   */
  async search(req, res) {
    console.log('[SearchController] Processing search request...');

    try {
      const { query, filters = {} } = req.body;
      const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';

      if (!query) {
        return res.status(400).json({
          error: 'Query is required'
        });
      }

      console.log(`[SearchController] Query: "${query}"`);

      if (!db.pool) {
        return res.status(503).json({
          error: 'Database not available',
          message: 'Please set up PostgreSQL to use search functionality'
        });
      }

      // Step 1: Advanced query analysis with transformers
      console.log('[SearchController] 🤖 Analyzing query with HuggingFace transformers...');
      const queryAnalysis = await transformerService.analyzeQuery(query);

      console.log('[SearchController] Query analysis:', {
        intent: queryAnalysis.intent,
        queryType: queryAnalysis.queryType,
        keywords: queryAnalysis.keywords,
        expansions: queryAnalysis.expansions
      });

      // Step 2: Parse natural language query with Claude for filters
      console.log('[SearchController] Parsing natural language query...');
      const parsedQuery = await claudeService.parseSearchQuery(query);

      console.log('[SearchController] Parsed query:', parsedQuery);

      // Step 3: Generate advanced transformer embedding for semantic search
      console.log('[SearchController] 🚀 Generating transformer embedding (384D)...');
      const searchEmbedding = await transformerService.generateEmbedding(parsedQuery.searchText || query);

      console.log(`[SearchController] ✅ Generated ${searchEmbedding.length}D semantic embedding`);

      // Step 4: Merge parsed filters with manual filters and query analysis
      const combinedFilters = {
        ...parsedQuery.filters,
        ...filters,
        // Add query type from transformer analysis
        suggestedType: queryAnalysis.queryType !== 'general' ? queryAnalysis.queryType : undefined
      };

      // Step 5: Build SQL query
      const { sqlQuery, params } = this._buildSearchQuery(
        userId,
        searchEmbedding,
        combinedFilters
      );

      console.log('[SearchController] Executing advanced semantic search...');

      // Step 6: Execute search with expanded limit for re-ranking
      const expandedFilters = { ...combinedFilters, limit: (combinedFilters.limit || 20) * 3 };
      const { sqlQuery: expandedQuery, params: expandedParams } = this._buildSearchQuery(
        userId,
        searchEmbedding,
        expandedFilters
      );

      const result = await db.pool.query(expandedQuery, expandedParams);

      console.log(`[SearchController] ✅ Found ${result.rows.length} initial results`);

      // Step 7: Advanced re-ranking with MPNet for superior relevance
      console.log('[SearchController] 🔄 Applying advanced re-ranking...');
      const rerankedResults = await transformerService.rerankResults(
        query,
        result.rows,
        combinedFilters.limit || 20
      );

      console.log(`[SearchController] ✅ Re-ranked to ${rerankedResults.length} most relevant results`);

      // Step 8: Generate intelligent recommendations
      let recommendations = null;
      if (rerankedResults.length === 0) {
        console.log('[SearchController] 💡 No results found, generating recommendations...');

        // Get all user items for recommendations
        const allItemsQuery = `
          SELECT * FROM items
          WHERE user_id = $1 AND is_archived = false
          ORDER BY created_at DESC
          LIMIT 100
        `;
        const allItemsResult = await db.pool.query(allItemsQuery, [userId]);

        recommendations = await recommendationService.generateRecommendations(
          query,
          allItemsResult.rows,
          10
        );

        // Record search for learning
        recommendationService.recordSearch(query);
      }

      // Step 9: Return enhanced results with semantic analysis and recommendations
      res.json({
        success: true,
        query: query,
        semanticAnalysis: {
          intent: queryAnalysis.intent,
          queryType: queryAnalysis.queryType,
          keywords: queryAnalysis.keywords,
          expansions: queryAnalysis.expansions
        },
        parsedQuery: parsedQuery,
        filters: combinedFilters,
        results: rerankedResults,
        count: rerankedResults.length,
        model: 'HuggingFace all-mpnet-base-v2 (768D Transformer + Re-ranking)',
        searchType: 'Advanced Semantic Search with MPNet + Re-ranking',
        performance: {
          initialResults: result.rows.length,
          rerankedResults: rerankedResults.length,
          topRelevance: rerankedResults[0]?.relevance_explanation
        },
        // Intelligent recommendations when no results
        recommendations: recommendations,
        message: rerankedResults.length === 0
          ? 'No results found. Try the suggestions below or save some content first!'
          : undefined
      });

    } catch (error) {
      console.error('[SearchController] Search error:', error.message);
      res.status(500).json({
        error: 'Search failed',
        message: error.message
      });
    }
  }

  /**
   * Find similar items to a given item
   * GET /api/search/similar/:itemId
   */
  async findSimilar(req, res) {
    try {
      const { itemId } = req.params;
      const { limit = 10 } = req.query;
      const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';

      console.log(`[SearchController] Finding similar items to: ${itemId}`);

      if (!db.pool) {
        return res.status(503).json({
          error: 'Database not available'
        });
      }

      // Get the embedding for the source item
      const embeddingResult = await db.pool.query(
        `SELECT e.embedding, i.content_type
         FROM embeddings e
         JOIN items i ON e.item_id = i.id
         WHERE e.item_id = $1`,
        [itemId]
      );

      if (embeddingResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Item not found or has no embedding'
        });
      }

      const sourceEmbedding = embeddingResult.rows[0].embedding;
      const contentType = embeddingResult.rows[0].content_type;

      // Find similar items using vector similarity
      const query = `
        SELECT
          i.*,
          (e.embedding <=> $1::vector) as similarity_score
        FROM items i
        JOIN embeddings e ON i.id = e.item_id
        WHERE i.user_id = $2
          AND i.id != $3
          AND i.content_type = $4
          AND i.is_archived = false
        ORDER BY e.embedding <=> $1::vector
        LIMIT $5
      `;

      const result = await db.pool.query(query, [
        JSON.stringify(sourceEmbedding),
        userId,
        itemId,
        contentType,
        parseInt(limit)
      ]);

      res.json({
        success: true,
        sourceItemId: itemId,
        similarItems: result.rows,
        count: result.rows.length
      });

    } catch (error) {
      console.error('[SearchController] Error finding similar items:', error.message);
      res.status(500).json({
        error: 'Failed to find similar items',
        message: error.message
      });
    }
  }

  /**
   * Get intelligent search suggestions with NLP
   * GET /api/search/suggestions?q=partial_query
   */
  async getSuggestions(req, res) {
    try {
      const { q: query } = req.query;
      const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';

      if (!db.pool) {
        return res.status(503).json({
          error: 'Database not available'
        });
      }

      console.log(`[SearchController] 💡 Generating suggestions for query: "${query || '(empty)'}"`);

      // Get user's items for content-based recommendations
      const itemsQuery = `
        SELECT * FROM items
        WHERE user_id = $1 AND is_archived = false
        ORDER BY created_at DESC
        LIMIT 100
      `;

      const itemsResult = await db.pool.query(itemsQuery, [userId]);
      const userItems = itemsResult.rows;

      // Generate intelligent recommendations
      const recommendations = await recommendationService.generateRecommendations(
        query || '',
        userItems,
        10
      );

      // Get popular tags
      const tagsQuery = `
        SELECT UNNEST(tags) as tag, COUNT(*) as count
        FROM items
        WHERE user_id = $1
        GROUP BY tag
        ORDER BY count DESC
        LIMIT 10
      `;

      const tagsResult = await db.pool.query(tagsQuery, [userId]);

      // If no query and no items, show empty state suggestions
      if (!query && userItems.length === 0) {
        const emptyState = recommendationService.getEmptyStateSuggestions();
        return res.json({
          success: true,
          suggestions: emptyState,
          hasContent: false
        });
      }

      res.json({
        success: true,
        query: query || '',
        recommendations: recommendations,
        popularTags: tagsResult.rows,
        hasContent: userItems.length > 0,
        totalItems: userItems.length
      });

    } catch (error) {
      console.error('[SearchController] Error getting suggestions:', error.message);
      res.status(500).json({
        error: 'Failed to get suggestions',
        message: error.message
      });
    }
  }

  /**
   * Build search SQL query with filters
   * @private
   */
  _buildSearchQuery(userId, embedding, filters) {
    let query = `
      SELECT
        i.*,
        (e.embedding <=> $1::vector) as similarity_score
      FROM items i
      JOIN embeddings e ON i.id = e.item_id
      WHERE i.user_id = $2
        AND i.is_archived = false
    `;

    const params = [JSON.stringify(embedding), userId];
    let paramIndex = 3;

    // Content type filter
    if (filters.contentType) {
      query += ` AND i.content_type = $${paramIndex}`;
      params.push(filters.contentType);
      paramIndex++;
    }

    // Price filter (for products)
    if (filters.price) {
      if (filters.price.min !== undefined) {
        query += ` AND (i.metadata->>'price')::numeric >= $${paramIndex}`;
        params.push(filters.price.min);
        paramIndex++;
      }
      if (filters.price.max !== undefined) {
        query += ` AND (i.metadata->>'price')::numeric <= $${paramIndex}`;
        params.push(filters.price.max);
        paramIndex++;
      }
    }

    // Date range filter
    if (filters.dateRange) {
      if (filters.dateRange.from) {
        query += ` AND i.created_at >= $${paramIndex}`;
        params.push(new Date(filters.dateRange.from));
        paramIndex++;
      }
      if (filters.dateRange.to) {
        query += ` AND i.created_at <= $${paramIndex}`;
        params.push(new Date(filters.dateRange.to));
        paramIndex++;
      }
      // Handle period-based filters (e.g., "last week")
      if (filters.dateRange.period) {
        const periodDate = this._getPeriodDate(filters.dateRange.period);
        if (periodDate) {
          query += ` AND i.created_at >= $${paramIndex}`;
          params.push(periodDate);
          paramIndex++;
        }
      }
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      query += ` AND i.tags && $${paramIndex}`;
      params.push(filters.tags);
      paramIndex++;
    }

    // Favorite filter
    if (filters.isFavorite !== undefined) {
      query += ` AND i.is_favorite = $${paramIndex}`;
      params.push(filters.isFavorite);
      paramIndex++;
    }

    // Collection filter
    if (filters.collectionId) {
      query += ` AND i.collection_id = $${paramIndex}`;
      params.push(filters.collectionId);
      paramIndex++;
    }

    // Color filter (search in metadata->objects array or dominantColors)
    if (filters.colors && filters.colors.length > 0) {
      const colorConditions = filters.colors.map(color => {
        return `(
          i.metadata::text ILIKE '%${color}%' OR
          i.description ILIKE '%${color}%' OR
          EXISTS (
            SELECT 1 FROM jsonb_array_elements(i.metadata->'objects') obj
            WHERE obj->>'colors' ILIKE '%${color}%'
          )
        )`;
      });
      query += ` AND (${colorConditions.join(' OR ')})`;
    }

    // Author filter (search in metadata->author or content)
    if (filters.author) {
      query += ` AND (
        i.metadata->>'author' ILIKE $${paramIndex} OR
        i.content ILIKE $${paramIndex} OR
        i.description ILIKE $${paramIndex}
      )`;
      params.push(`%${filters.author}%`);
      paramIndex++;
    }

    // Keywords filter (search in content, description, title)
    if (filters.keywords && filters.keywords.length > 0) {
      const keywordConditions = filters.keywords.map(keyword => {
        return `(
          i.title ILIKE '%${keyword}%' OR
          i.description ILIKE '%${keyword}%' OR
          i.content ILIKE '%${keyword}%' OR
          EXISTS (SELECT 1 FROM unnest(i.tags) tag WHERE tag ILIKE '%${keyword}%')
        )`;
      });
      query += ` AND (${keywordConditions.join(' AND ')})`;
    }

    // Order by similarity and limit
    query += `
      ORDER BY e.embedding <=> $1::vector
      LIMIT $${paramIndex}
    `;
    params.push(filters.limit || 20);

    return { sqlQuery: query, params };
  }

  /**
   * Convert period string to date
   * @private
   */
  _getPeriodDate(period) {
    const now = new Date();
    const periodLower = period.toLowerCase();

    if (periodLower.includes('today')) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today;
    }

    if (periodLower.includes('yesterday')) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      return yesterday;
    }

    if (periodLower.includes('last week') || periodLower.includes('past week')) {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      return lastWeek;
    }

    if (periodLower.includes('last month') || periodLower.includes('past month')) {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      return lastMonth;
    }

    if (periodLower.includes('last year') || periodLower.includes('past year')) {
      const lastYear = new Date();
      lastYear.setFullYear(lastYear.getFullYear() - 1);
      return lastYear;
    }

    return null;
  }
}

module.exports = new SearchController();
