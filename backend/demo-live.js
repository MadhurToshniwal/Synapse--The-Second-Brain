require('dotenv').config();
const claudeService = require('./src/services/claudeService');
const embeddingService = require('./src/services/embeddingService');

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🧠  PROJECT SYNAPSE - LIVE DEMO');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

async function demonstrateApp() {
  try {
    // Scenario: User saves a product link
    console.log('📱 SCENARIO: User saves a product from Amazon\n');
    console.log('User action: Clicks Chrome extension on product page');
    console.log('URL: https://amazon.com/sony-headphones\n');

    const productContent = `
      Sony WH-1000XM5 Wireless Headphones
      $399.99

      Industry-leading noise cancellation with Auto NC Optimizer.
      Crystal clear hands-free calling with 4 beamforming microphones.
      Up to 30-hour battery life with quick charging (3 min charge = 3 hours of playback).
      Ultra-comfortable, lightweight design with soft fit leather.
      Multipoint connection allows you to switch between devices.
      Speak-to-chat technology automatically reduces volume during conversations.
    `;

    console.log('⚙️  STEP 1: AI Analysis (Claude)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    const analysis = await claudeService.analyzeContent(productContent, 'product', 'https://amazon.com/sony-headphones');

    console.log('\n✅ Analysis Complete!\n');
    console.log('Extracted Data:');
    console.log(`  📦 Product: ${analysis.productName}`);
    console.log(`  💰 Price: $${analysis.price}`);
    console.log(`  🏢 Brand: ${analysis.brand}`);
    console.log(`  📁 Category: ${analysis.category}`);
    console.log(`  ⚡ Key Features: ${analysis.keySpecs.length} specs extracted\n`);

    console.log('⚙️  STEP 2: Generate Search Vector (Gemini)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    const searchText = `${analysis.productName} ${analysis.keySpecs.join(' ')}`;
    const embedding = await embeddingService.generateEmbedding(searchText);

    console.log(`\n✅ Vector Generated!`);
    console.log(`  📊 Dimensions: ${embedding.length}`);
    console.log(`  🔢 Sample values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]\n`);

    console.log('⚙️  STEP 3: Generate Smart Tags');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    const tags = await claudeService.generateTags(analysis.productName, productContent);

    console.log(`\n✅ Tags Generated!`);
    console.log(`  🏷️  Tags: ${tags.join(', ')}\n`);

    console.log('💾 STEP 4: Save to Database (Mock)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const savedItem = {
      id: 'uuid-12345',
      user_id: 'user-001',
      title: analysis.productName,
      content_type: 'product',
      url: 'https://amazon.com/sony-headphones',
      metadata: {
        price: analysis.price,
        brand: analysis.brand,
        specs: analysis.keySpecs,
        category: analysis.category
      },
      tags: tags,
      is_favorite: false,
      created_at: new Date().toISOString()
    };

    console.log('Item saved to database:');
    console.log(JSON.stringify(savedItem, null, 2));
    console.log('');
    console.log('Vector saved to embeddings table (3072 dimensions)');
    console.log('');

    // Scenario 2: User searches
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 SCENARIO 2: User Searches');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const userQuery = 'wireless headphones under $500';
    console.log(`User types: "${userQuery}"\n`);

    console.log('⚙️  Parsing Natural Language Query...\n');
    const parsedQuery = await claudeService.parseSearchQuery(userQuery);

    console.log('✅ Query Parsed!');
    console.log(`  🔎 Search terms: "${parsedQuery.searchText}"`);
    console.log(`  🎯 Filters: ${JSON.stringify(parsedQuery.filters)}\n`);

    console.log('⚙️  Generating search vector...\n');
    const searchEmbedding = await embeddingService.generateEmbedding(parsedQuery.searchText);

    console.log('✅ Search vector generated!');
    console.log(`  📊 Will compare with ${embedding.length} dimensions\n`);

    console.log('💡 Search Query (SQL + Vector):');
    console.log(`
    SELECT items.*, embeddings.embedding <=> $1 as distance
    FROM items
    JOIN embeddings ON items.id = embeddings.item_id
    WHERE content_type = 'product'
      AND (metadata->>'price')::numeric <= 500
    ORDER BY embeddings.embedding <=> $1
    LIMIT 10;
    `);

    console.log('\n✅ Would return: Sony WH-1000XM5 (price: $399.99, similarity: 0.95)\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ WHAT THE USER SEES:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('┌─────────────────────────────────────────┐');
    console.log('│  🎧 Sony WH-1000XM5 Wireless Headphones │');
    console.log('│  💰 $399.99                             │');
    console.log('│  🏢 Sony                                │');
    console.log('│  ⚡ Industry-leading noise cancellation │');
    console.log('│  🔋 30-hour battery life                │');
    console.log('│  🏷️  wireless, headphones, audio, sony  │');
    console.log('│  🔗 amazon.com/sony-headphones          │');
    console.log('└─────────────────────────────────────────┘\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 SUMMARY: What Project Synapse Does');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✅ Captures: URLs, products, articles, images, notes, videos');
    console.log('✅ Understands: AI extracts titles, prices, specs, summaries');
    console.log('✅ Organizes: Auto-generates tags and metadata');
    console.log('✅ Searches: Natural language + semantic similarity');
    console.log('✅ Displays: Beautiful cards with rich previews\n');

    console.log('🎯 Status: Backend AI services WORKING ✅');
    console.log('📝 TODO: Build routes, controllers, frontend, Chrome extension\n');

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    console.error(error.stack);
  }
}

demonstrateApp();
