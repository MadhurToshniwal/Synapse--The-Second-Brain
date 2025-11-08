const db = require('../src/config/database');
const transformerService = require('../src/services/transformerService');

/**
 * Regenerate embeddings for all existing items using MPNet 768D model
 */
async function regenerateEmbeddings() {
  console.log('🔄 Starting embedding regeneration with MPNet (768D)...\n');

  try {
    // Initialize database
    await db.initDatabase();

    if (!db.pool) {
      throw new Error('Database not available. Please configure PostgreSQL.');
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

    console.log(`📊 Found ${items.length} items needing embeddings\n`);

    if (items.length === 0) {
      console.log('✅ All items already have embeddings!');
      process.exit(0);
    }

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const progress = `[${i + 1}/${items.length}]`;

      try {
        // Create text to embed from item content
        const textToEmbed = [
          item.title || '',
          item.description || '',
          item.extracted_text || '',
          (item.tags || []).join(' ')
        ].filter(Boolean).join(' ').substring(0, 1000); // Limit to 1000 chars

        if (!textToEmbed.trim()) {
          console.log(`${progress} ⚠️  Skipping item ${item.id} - no text content`);
          continue;
        }

        console.log(`${progress} 🔄 Processing: "${item.title?.substring(0, 50)}..."`);

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
        console.log(`${progress} ✅ Generated 768D embedding for "${item.title?.substring(0, 50)}..."\n`);

      } catch (error) {
        errorCount++;
        console.error(`${progress} ❌ Error processing item ${item.id}:`, error.message, '\n');
      }

      // Add small delay to avoid overwhelming the transformer
      if (i < items.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 EMBEDDING REGENERATION COMPLETE');
    console.log('='.repeat(50));
    console.log(`✅ Success: ${successCount} embeddings generated`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📈 Success rate: ${((successCount / items.length) * 100).toFixed(1)}%`);
    console.log('='.repeat(50) + '\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Fatal error during embedding regeneration:', error);
    process.exit(1);
  }
}

// Run the script
console.log('╔══════════════════════════════════════════════════╗');
console.log('║     SYNAPSE EMBEDDING REGENERATION SCRIPT       ║');
console.log('║     MPNet all-mpnet-base-v2 (768D SOTA)         ║');
console.log('╚══════════════════════════════════════════════════╝\n');

regenerateEmbeddings();
