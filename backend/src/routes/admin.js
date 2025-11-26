const express = require('express');
const router = express.Router();
const { optionalClerkAuth } = require('../middleware/clerkAuth');
const db = require('../config/database');
const transformerService = require('../services/transformerService');

/**
 * @route   POST /api/admin/regenerate-embeddings
 * @desc    Regenerate embeddings for all items
 * @access  Private
 */
router.post('/regenerate-embeddings', optionalClerkAuth, async (req, res) => {
  console.log('[Admin] Starting embedding regeneration...');

  try {
    if (!db.pool) {
      return res.status(503).json({
        error: 'Database not available'
      });
    }

    // Get all items that don't have embeddings yet
    const itemsQuery = `
      SELECT i.*
      FROM items i
      LEFT JOIN embeddings e ON i.id = e.item_id AND e.embedding_model = 'all-mpnet-base-v2'
      WHERE e.id IS NULL
      ORDER BY i.created_at DESC
    `;

    const result = await db.pool.query(itemsQuery);
    const items = result.rows;

    console.log(`[Admin] Found ${items.length} items needing embeddings`);

    if (items.length === 0) {
      return res.json({
        success: true,
        message: 'All items already have embeddings',
        processed: 0,
        total: 0
      });
    }

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const item of items) {
      try {
        // Create text to embed from item content
        const textToEmbed = [
          item.title || '',
          item.description || '',
          item.content || '',
          (item.tags || []).join(' ')
        ].filter(Boolean).join(' ').substring(0, 1000);

        if (!textToEmbed.trim()) {
          console.log(`[Admin] Skipping item ${item.id} - no text content`);
          continue;
        }

        console.log(`[Admin] Processing: "${item.title?.substring(0, 50)}..."`);

        // Generate 768D MPNet embedding
        const embedding = await transformerService.generateEmbedding(textToEmbed);

        // Insert embedding into database
        await db.pool.query(
          `INSERT INTO embeddings (item_id, embedding, embedding_model, created_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (item_id, embedding_model)
           DO UPDATE SET embedding = $2, created_at = NOW()`,
          [item.id, JSON.stringify(embedding), 'all-mpnet-base-v2']
        );

        successCount++;
        console.log(`[Admin] ✅ Generated 768D embedding for "${item.title?.substring(0, 50)}..."`);

      } catch (error) {
        errorCount++;
        errors.push({ itemId: item.id, error: error.message });
        console.error(`[Admin] ❌ Error processing item ${item.id}:`, error.message);
      }
    }

    res.json({
      success: true,
      message: 'Embedding regeneration complete',
      processed: successCount,
      errors: errorCount,
      total: items.length,
      errorDetails: errors.slice(0, 10) // Limit error details
    });

  } catch (error) {
    console.error('[Admin] Error regenerating embeddings:', error.message);
    res.status(500).json({
      error: 'Failed to regenerate embeddings',
      message: error.message
    });
  }
});

module.exports = router;
