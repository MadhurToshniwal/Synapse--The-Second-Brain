require('dotenv').config();
const embeddingService = require('./src/services/embeddingService');

async function testEmbeddingService() {
  console.log('=== Testing EmbeddingService ===\n');

  try {
    // Test 1: Generate single embedding
    console.log('📊 TEST 1: Generating Single Embedding...\n');
    const singleText = 'Artificial intelligence is transforming the healthcare industry with machine learning and deep learning technologies.';

    const singleEmbedding = await embeddingService.generateEmbedding(singleText);
    console.log('Single Embedding Result:');
    console.log(`- Dimensions: ${singleEmbedding.length}`);
    console.log(`- First 10 values: [${singleEmbedding.slice(0, 10).map(v => v.toFixed(4)).join(', ')}...]`);
    console.log(`- Vector type: ${typeof singleEmbedding[0]}`);
    console.log('\n---\n');

    // Test 2: Generate batch embeddings
    console.log('📊 TEST 2: Generating Batch Embeddings...\n');
    const batchTexts = [
      'Machine learning algorithms can analyze large datasets efficiently.',
      'Natural language processing enables computers to understand human language.',
      'Computer vision allows machines to interpret and process visual information.',
      'Deep learning uses neural networks with multiple layers.'
    ];

    const batchEmbeddings = await embeddingService.generateEmbeddingBatch(batchTexts);
    console.log('Batch Embedding Results:');
    console.log(`- Number of embeddings: ${batchEmbeddings.length}`);
    console.log(`- Dimensions per embedding: ${batchEmbeddings[0].length}`);
    console.log('\nFirst embedding preview:');
    console.log(`  [${batchEmbeddings[0].slice(0, 10).map(v => v.toFixed(4)).join(', ')}...]`);
    console.log('\n---\n');

    // Test 3: Test truncation with long text
    console.log('✂️  TEST 3: Testing Text Truncation...\n');
    const longText = 'AI technology '.repeat(1000); // Create a very long text
    console.log(`Original text length: ${longText.length} chars`);

    const truncatedEmbedding = await embeddingService.generateEmbedding(longText);
    console.log(`Embedding generated successfully with ${truncatedEmbedding.length} dimensions`);
    console.log('\n---\n');

    // Test 4: Verify embeddings are different for different texts
    console.log('🔍 TEST 4: Verifying Embeddings Are Unique...\n');
    const text1 = 'Cats are wonderful pets.';
    const text2 = 'Dogs are loyal companions.';

    const [embedding1, embedding2] = await embeddingService.generateEmbeddingBatch([text1, text2]);

    // Calculate simple difference
    let differences = 0;
    for (let i = 0; i < Math.min(embedding1.length, embedding2.length); i++) {
      if (Math.abs(embedding1[i] - embedding2[i]) > 0.001) {
        differences++;
      }
    }

    console.log(`Text 1: "${text1}"`);
    console.log(`Text 2: "${text2}"`);
    console.log(`Differences in embedding values: ${differences}/${embedding1.length}`);
    console.log(`Embeddings are ${differences > 0 ? 'DIFFERENT ✅' : 'SAME ❌'}`);
    console.log('\n---\n');

    console.log('✅ All embedding tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the tests
testEmbeddingService();
