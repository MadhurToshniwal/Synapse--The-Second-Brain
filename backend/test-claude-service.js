require('dotenv').config();
const claudeService = require('./src/services/claudeService');

async function testClaudeService() {
  console.log('=== Testing ClaudeService ===\n');

  try {
    // Test 1: Analyze Article
    console.log('📰 TEST 1: Analyzing Article Content...\n');
    const articleContent = `
      Artificial Intelligence in Healthcare: A Revolution in Progress

      The healthcare industry is experiencing a transformative shift with the integration
      of artificial intelligence. Machine learning algorithms are now capable of diagnosing
      diseases with accuracy comparable to experienced physicians. AI-powered systems can
      analyze medical images, predict patient outcomes, and personalize treatment plans.

      Key benefits include faster diagnosis times, reduced medical errors, and improved
      patient care. However, challenges remain in areas of data privacy, algorithm bias,
      and regulatory approval. The future of healthcare will likely see deeper AI integration
      across all medical specialties.
    `;

    const articleResult = await claudeService.analyzeContent(
      articleContent,
      'article',
      'https://example.com/ai-healthcare'
    );
    console.log('Article Analysis Result:', JSON.stringify(articleResult, null, 2));
    console.log('\n---\n');

    // Test 2: Analyze Product
    console.log('🛍️  TEST 2: Analyzing Product Content...\n');
    const productContent = `
      Sony WH-1000XM5 Wireless Noise Cancelling Headphones
      Price: $399.99

      Premium wireless headphones from Sony featuring industry-leading noise cancellation.
      30-hour battery life, multipoint connection, adaptive sound control, and premium sound quality.
      Available in Black and Silver. Includes carrying case and audio cable.
      Perfect for travel, work, and music listening.
    `;

    const productResult = await claudeService.analyzeContent(
      productContent,
      'product',
      'https://example.com/sony-headphones'
    );
    console.log('Product Analysis Result:', JSON.stringify(productResult, null, 2));
    console.log('\n---\n');

    // Test 3: Parse Search Query
    console.log('🔍 TEST 3: Parsing Search Queries...\n');

    const queries = [
      'black shoes under $300',
      'articles about AI from last week',
      'gaming laptops over $1000'
    ];

    for (const query of queries) {
      const searchResult = await claudeService.parseSearchQuery(query);
      console.log(`Query: "${query}"`);
      console.log('Parsed Result:', JSON.stringify(searchResult, null, 2));
      console.log('');
    }
    console.log('---\n');

    // Test 4: Generate Tags
    console.log('🏷️  TEST 4: Generating Tags...\n');
    const tagTitle = 'Introduction to Machine Learning';
    const tagContent = `
      Machine learning is a subset of artificial intelligence that enables systems to learn
      and improve from experience. It uses algorithms to parse data, learn from it, and make
      predictions or decisions. Common applications include image recognition, natural language
      processing, recommendation systems, and autonomous vehicles.
    `;

    const tags = await claudeService.generateTags(tagTitle, tagContent);
    console.log('Generated Tags:', tags);
    console.log('\n---\n');

    console.log('✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the tests
testClaudeService();
