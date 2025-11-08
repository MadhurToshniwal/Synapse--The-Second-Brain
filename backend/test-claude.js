// Test file for Claude service
require('dotenv').config();
const claudeService = require('./src/services/claudeService');

async function testClaudeService() {
  console.log('🧪 Testing Claude Service...\n');

  // Sample article text
  const sampleArticle = `
    Artificial Intelligence and the Future of Work

    As artificial intelligence continues to evolve, its impact on the workplace becomes
    increasingly significant. Machine learning algorithms are now capable of performing
    tasks that once required human intelligence, from data analysis to customer service.

    Key developments include:
    - Natural language processing enabling better human-computer interaction
    - Computer vision revolutionizing quality control in manufacturing
    - Predictive analytics helping businesses make data-driven decisions

    While AI presents challenges such as job displacement, it also creates new opportunities
    for innovation and efficiency. The key is to focus on augmenting human capabilities
    rather than replacing them entirely.
  `;

  try {
    console.log('📝 Sample Article:');
    console.log(sampleArticle.trim());
    console.log('\n' + '='.repeat(60) + '\n');

    console.log('🤖 Analyzing with Claude...\n');

    const result = await claudeService.analyzeContent(
      sampleArticle,
      'article',
      'https://example.com/ai-future-work'
    );

    console.log('✅ Analysis Result:');
    console.log(JSON.stringify(result, null, 2));

    console.log('\n' + '='.repeat(60) + '\n');
    console.log('🎯 Testing Tag Generation...\n');

    const tags = await claudeService.generateTags(
      'AI and Future of Work',
      sampleArticle
    );

    console.log('✅ Generated Tags:');
    console.log(tags);

    console.log('\n✅ All tests passed! Claude service is working correctly.\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\nFull error:', error);
  }
}

// Run the test
testClaudeService();
