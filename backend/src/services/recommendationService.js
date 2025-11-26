const transformerService = require('./transformerService');

/**
 * RecommendationService - Intelligent NLP-based Search Recommendations
 *
 * Provides smart suggestions based on:
 * - Query understanding
 * - User's search history
 * - Content patterns
 * - Semantic similarity
 */
class RecommendationService {
  constructor() {
    this.searchHistory = [];
    this.popularQueries = new Map();
    this.queryPatterns = [];
  }

  /**
   * Generate intelligent search recommendations based on partial query
   *
   * @param {string} partialQuery - User's partial search query
   * @param {Array} userItems - User's saved items
   * @param {number} limit - Max number of recommendations
   * @returns {Promise<Object>} - Recommendations with categories
   */
  async generateRecommendations(partialQuery, userItems = [], limit = 10) {
    try {
      const recommendations = {
        suggestions: [],
        relatedSearches: [],
        trending: [],
        contentBased: []
      };

      if (!partialQuery || partialQuery.trim().length === 0) {
        // No query - show trending and popular
        recommendations.trending = this._getTrendingQueries(5);
        recommendations.contentBased = this._getContentBasedSuggestions(userItems, 5);
        return recommendations;
      }

      console.log(`🎯 Generating recommendations for: "${partialQuery}"`);

      // 1. Autocomplete suggestions (prefix matching)
      recommendations.suggestions = await this._getAutocompleteSuggestions(partialQuery, userItems, limit);

      // 2. Related searches (semantic similarity)
      recommendations.relatedSearches = await this._getRelatedSearches(partialQuery, limit);

      // 3. Content-based recommendations
      if (userItems.length > 0) {
        recommendations.contentBased = await this._getSemanticContentSuggestions(
          partialQuery,
          userItems,
          limit
        );
      }

      // 4. Trending queries
      recommendations.trending = this._getTrendingQueries(3);

      console.log(`✅ Generated ${this._countRecommendations(recommendations)} total recommendations`);

      return recommendations;

    } catch (error) {
      console.error('❌ Recommendation generation failed:', error);
      return { suggestions: [], relatedSearches: [], trending: [], contentBased: [] };
    }
  }

  /**
   * Get autocomplete suggestions based on prefix matching
   */
  async _getAutocompleteSuggestions(partialQuery, userItems, limit) {
    const suggestions = new Set();
    const lowerQuery = partialQuery.toLowerCase();

    // Common search patterns
    const commonPatterns = [
      'what is',
      'how to',
      'show me',
      'find all',
      'get me',
      'search for',
      'articles about',
      'videos on',
      'images of',
      'notes about'
    ];

    // Add pattern-based suggestions
    commonPatterns.forEach(pattern => {
      if (pattern.startsWith(lowerQuery) || lowerQuery.startsWith(pattern.split(' ')[0])) {
        suggestions.add(pattern + (lowerQuery.includes(pattern) ? '' : ' ' + lowerQuery));
      }
    });

    // Extract tags and titles from user items
    const userTerms = new Set();
    userItems.forEach(item => {
      // Add title words
      if (item.title) {
        item.title.toLowerCase().split(' ').forEach(word => {
          if (word.length > 3 && word.startsWith(lowerQuery)) {
            userTerms.add(word);
          }
        });
      }

      // Add tags
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach(tag => {
          if (tag.toLowerCase().startsWith(lowerQuery)) {
            userTerms.add(tag.toLowerCase());
          }
        });
      }
    });

    // Combine with user content
    userTerms.forEach(term => {
      suggestions.add(term);
      suggestions.add(`articles about ${term}`);
      suggestions.add(`${term} notes`);
    });

    // Convert to array and limit
    return Array.from(suggestions).slice(0, limit).map(text => ({
      text,
      type: 'autocomplete',
      confidence: 0.8
    }));
  }

  /**
   * Get related searches using semantic similarity
   */
  async _getRelatedSearches(query, limit) {
    const relatedSearches = [];

    // Analyze query intent
    const analysis = await transformerService.analyzeQuery(query);

    // Generate related queries based on intent and type
    if (analysis.intent === 'question') {
      relatedSearches.push(
        { text: `how to ${analysis.keywords.join(' ')}`, type: 'related', confidence: 0.9 },
        { text: `what is ${analysis.keywords[0]}`, type: 'related', confidence: 0.85 },
        { text: `examples of ${analysis.keywords.join(' ')}`, type: 'related', confidence: 0.8 }
      );
    }

    if (analysis.queryType !== 'general') {
      relatedSearches.push(
        { text: `${analysis.queryType}s about ${analysis.keywords.join(' ')}`, type: 'related', confidence: 0.9 },
        { text: `recent ${analysis.queryType}s`, type: 'related', confidence: 0.7 }
      );
    }

    // Add expansion-based searches
    if (analysis.expansions && analysis.expansions.length > 1) {
      analysis.expansions.slice(0, 3).forEach((expansion, idx) => {
        if (expansion !== query.toLowerCase()) {
          relatedSearches.push({
            text: expansion,
            type: 'expansion',
            confidence: 0.9 - (idx * 0.1)
          });
        }
      });
    }

    // Add keyword combinations
    if (analysis.keywords.length > 1) {
      const combinations = this._generateKeywordCombinations(analysis.keywords);
      combinations.slice(0, 2).forEach(combo => {
        relatedSearches.push({
          text: combo,
          type: 'combination',
          confidence: 0.75
        });
      });
    }

    return relatedSearches.slice(0, limit);
  }

  /**
   * Get semantic content suggestions from user's items
   */
  async _getSemanticContentSuggestions(query, userItems, limit) {
    const suggestions = [];

    try {
      // Generate query embedding
      const queryEmbedding = await transformerService.generateEmbedding(query);

      // Calculate similarity with each item
      const scoredItems = await Promise.all(
        userItems.slice(0, 50).map(async (item) => { // Limit to 50 items for performance
          const itemText = `${item.title || ''} ${item.description || ''}`.substring(0, 200);
          const itemEmbedding = await transformerService.generateEmbedding(itemText);
          const similarity = transformerService._cosineSimilarity(queryEmbedding, itemEmbedding);

          return {
            item,
            similarity,
            suggestion: `find more like "${item.title?.substring(0, 30)}..."`
          };
        })
      );

      // Sort by similarity and take top matches
      scoredItems
        .filter(s => s.similarity > 0.6) // Only relevant items
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)
        .forEach(({ item, similarity, suggestion }) => {
          suggestions.push({
            text: suggestion,
            type: 'content-based',
            confidence: similarity,
            itemId: item.id
          });

          // Add tag-based suggestions
          if (item.tags && item.tags.length > 0) {
            item.tags.slice(0, 2).forEach(tag => {
              suggestions.push({
                text: `${tag} content`,
                type: 'tag-based',
                confidence: similarity * 0.8
              });
            });
          }
        });

    } catch (error) {
      console.error('Error generating semantic suggestions:', error);
    }

    return suggestions.slice(0, limit);
  }

  /**
   * Get content-based suggestions when no query is provided
   */
  _getContentBasedSuggestions(userItems, limit) {
    const suggestions = [];
    const tagCount = new Map();
    const typeCount = new Map();

    // Analyze user's content
    userItems.forEach(item => {
      // Count content types
      if (item.content_type) {
        typeCount.set(item.content_type, (typeCount.get(item.content_type) || 0) + 1);
      }

      // Count tags
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach(tag => {
          tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
        });
      }
    });

    // Generate suggestions from popular tags
    const sortedTags = Array.from(tagCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    sortedTags.forEach(([tag, count]) => {
      suggestions.push({
        text: `${tag} content`,
        type: 'content-based',
        confidence: Math.min(count / userItems.length, 1),
        count
      });
    });

    // Generate suggestions from popular content types
    const sortedTypes = Array.from(typeCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    sortedTypes.forEach(([type, count]) => {
      suggestions.push({
        text: `all ${type}s`,
        type: 'content-type',
        confidence: Math.min(count / userItems.length, 1),
        count
      });
    });

    return suggestions.slice(0, limit);
  }

  /**
   * Get trending queries
   */
  _getTrendingQueries(limit) {
    const trending = [
      { text: 'recent saves', type: 'trending', confidence: 0.9 },
      { text: 'important articles', type: 'trending', confidence: 0.85 },
      { text: 'bookmarks from this week', type: 'trending', confidence: 0.8 },
      { text: 'videos to watch', type: 'trending', confidence: 0.75 },
      { text: 'notes and ideas', type: 'trending', confidence: 0.7 }
    ];

    // Add popular queries from history
    const popularFromHistory = Array.from(this.popularQueries.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([text, count]) => ({
        text,
        type: 'popular',
        confidence: Math.min(count / 10, 1)
      }));

    return [...popularFromHistory, ...trending].slice(0, limit);
  }

  /**
   * Generate keyword combinations
   */
  _generateKeywordCombinations(keywords) {
    const combinations = [];

    if (keywords.length >= 2) {
      // Two-word combinations
      for (let i = 0; i < keywords.length - 1; i++) {
        for (let j = i + 1; j < keywords.length; j++) {
          combinations.push(`${keywords[i]} ${keywords[j]}`);
          combinations.push(`${keywords[j]} ${keywords[i]}`);
        }
      }
    }

    return combinations;
  }

  /**
   * Record a search query for learning user patterns
   */
  recordSearch(query) {
    this.searchHistory.push({
      query,
      timestamp: new Date()
    });

    // Update popular queries
    this.popularQueries.set(query, (this.popularQueries.get(query) || 0) + 1);

    // Keep history limited
    if (this.searchHistory.length > 100) {
      this.searchHistory.shift();
    }
  }

  /**
   * Count total recommendations
   */
  _countRecommendations(recommendations) {
    return Object.values(recommendations).reduce((sum, arr) => sum + (arr?.length || 0), 0);
  }

  /**
   * Get search suggestions for empty state
   */
  getEmptyStateSuggestions() {
    return {
      quickActions: [
        { text: 'Save your first article', icon: '📰', action: 'save' },
        { text: 'Upload an image', icon: '📸', action: 'upload' },
        { text: 'Explore features', icon: '✨', action: 'explore' }
      ],
      exampleQueries: [
        { text: 'Try: "articles about AI"', type: 'example' },
        { text: 'Try: "videos saved last week"', type: 'example' },
        { text: 'Try: "images with black color"', type: 'example' }
      ]
    };
  }
}

// Export singleton
module.exports = new RecommendationService();
