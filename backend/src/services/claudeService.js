const Anthropic = require('@anthropic-ai/sdk');

class ClaudeService {
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseURL: process.env.ANTHROPIC_BASE_URL
    });
    this.model = 'claude-sonnet-4-5-20250929';
  }

  /**
   * Clean JSON response by removing markdown code blocks
   * @param {string} text - Response text that may contain JSON
   * @returns {string} Clean JSON string
   */
  _cleanJsonResponse(text) {
    // Remove markdown code blocks if present
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }
    return cleaned.trim();
  }

  /**
   * Analyze image with Claude Vision API (supports OCR, object detection, etc.)
   * @param {string} imagePath - Path to the image file or base64 data
   * @param {string} mediaType - Image mime type (e.g., 'image/jpeg')
   * @returns {Promise<Object>} Analyzed image data with OCR text and metadata
   */
  async analyzeImage(imagePath, mediaType = 'image/jpeg') {
    console.log('[ClaudeService] Analyzing image with Vision API...');

    try {
      const fs = require('fs');
      const imageData = fs.readFileSync(imagePath);
      const base64Image = imageData.toString('base64');

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Image
              }
            },
            {
              type: 'text',
              text: `Analyze this image comprehensively and return a JSON object with:
- type: string (what kind of image: "screenshot", "document", "photo", "todo-list", "receipt", "note", "diagram", "meme", "infographic", etc.)
- title: string (a descriptive title for this image)
- description: string (detailed description of what you see)
- extractedText: string (all text found in the image via OCR, if any)
- structuredData: object (if it's a todo list, receipt, table, etc., extract the structured information)
- keyTopics: array of 5-7 relevant tags/topics
- containsText: boolean (whether the image contains readable text)
- dominantColors: array of main colors present in the image (e.g., ["blue", "black", "white"])
- objects: array of objects with their colors - each object should be: {name: string, colors: array, description: string} (e.g., {name: "car", colors: ["blue", "black"], description: "a blue and black car"})
- colorMetadata: object with detailed color information like {primary: string, accent: array, background: string}
- author: string (if there's a signature or attribution visible)
- keywords: array of searchable keywords including colors, object types, and text content

IMPORTANT: For color detection, be very specific about which colors belong to which objects. If you see a "blue and black car", make sure to identify it as such.

Return ONLY the JSON object, no other text.`
            }
          ]
        }]
      });

      const rawResponse = response.content[0].text;
      const cleanedResponse = this._cleanJsonResponse(rawResponse);
      const analysis = JSON.parse(cleanedResponse);

      console.log('[ClaudeService] Image analysis complete');
      return analysis;

    } catch (error) {
      console.error('[ClaudeService] Image analysis error:', error.message);
      throw new Error(`Failed to analyze image: ${error.message}`);
    }
  }

  /**
   * Analyze and extract metadata from any content
   * @param {string} content - The content to analyze
   * @param {string} contentType - Type: 'article', 'product', 'image', 'video'
   * @param {string} url - Optional URL of the content
   * @returns {Promise<Object>} Structured JSON object with extracted metadata
   */
  async analyzeContent(content, contentType, url = '') {
    console.log(`[ClaudeService] Analyzing ${contentType} content...`);

    try {
      let systemPrompt = '';
      let userPrompt = '';

      switch (contentType) {
        case 'article':
          systemPrompt = 'You are a content analyzer. Extract structured metadata from articles and return ONLY valid JSON.';
          userPrompt = `Analyze this article and return a JSON object with:
- title: string (the article title)
- summary: string (2-3 sentences summarizing the article)
- keyTopics: array of 5-7 relevant tags/topics
- mainPoints: array of key points from the article

Article content:
${content}

${url ? `URL: ${url}` : ''}

Return ONLY the JSON object, no additional text.`;
          break;

        case 'product':
          systemPrompt = 'You are a product analyzer. Extract structured metadata from product descriptions and return ONLY valid JSON.';
          userPrompt = `Analyze this product and return a JSON object with:
- productName: string (the product name)
- price: number (price value only, no currency symbols)
- brand: string (brand name)
- keySpecs: array of key specifications
- category: string (product category)

Product content:
${content}

${url ? `URL: ${url}` : ''}

Return ONLY the JSON object, no additional text.`;
          break;

        case 'image':
          systemPrompt = 'You are an OCR text analyzer. Clean and structure text extracted from images and return ONLY valid JSON.';
          userPrompt = `Analyze this OCR text from an image and return a JSON object with:
- cleanedText: string (cleaned and properly formatted text)
- type: string (one of: "todo", "notes", "diagram", "other")
- structuredData: object (any structured information you can extract, like todo items, diagram elements, etc.)

OCR content:
${content}

${url ? `Image URL: ${url}` : ''}

Return ONLY the JSON object, no additional text.`;
          break;

        case 'video':
          systemPrompt = 'You are a video metadata analyzer. Extract and summarize video information and return ONLY valid JSON.';
          userPrompt = `Analyze this video metadata and return a JSON object with:
- title: string (video title)
- summary: string (2-3 sentences summarizing the video)
- keyTopics: array of 5-7 relevant tags/topics
- category: string (video category)

Video metadata:
${content}

${url ? `URL: ${url}` : ''}

Return ONLY the JSON object, no additional text.`;
          break;

        default:
          throw new Error(`Unsupported content type: ${contentType}`);
      }

      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: userPrompt
        }]
      });

      const responseText = message.content[0].text;
      console.log('[ClaudeService] Raw response:', responseText);

      // Parse the JSON response
      const cleanedJson = this._cleanJsonResponse(responseText);
      const result = JSON.parse(cleanedJson);
      console.log('[ClaudeService] Analysis complete:', result);

      return result;

    } catch (error) {
      console.error('[ClaudeService] Error analyzing content:', error.message);
      throw new Error(`Failed to analyze ${contentType}: ${error.message}`);
    }
  }

  /**
   * Parse natural language search queries
   * @param {string} query - Natural language search query
   * @returns {Promise<Object>} Filter object with searchText and filters
   */
  async parseSearchQuery(query) {
    console.log(`[ClaudeService] Parsing search query: "${query}"`);

    try {
      const systemPrompt = 'You are an advanced search query parser. Parse complex natural language queries into structured search filters and return ONLY valid JSON.';

      const userPrompt = `Parse this search query and return a JSON object with:
- searchText: string (the main search terms for semantic matching)
- filters: object (may include contentType, priceRange, dateRange, colors, author, keywords, etc.)

Advanced Examples:
"black shoes under $300" -> {"searchText": "black shoes", "filters": {"price": {"max": 300}, "colors": ["black"]}}
"articles about AI from last month" -> {"searchText": "AI articles", "filters": {"contentType": "article", "dateRange": {"period": "last month"}}}
"products over $500" -> {"searchText": "products", "filters": {"price": {"min": 500}, "contentType": "product"}}
"What did Karpathy say about tokenization" -> {"searchText": "tokenization", "filters": {"author": "Karpathy", "contentType": "article"}}
"images with black color" -> {"searchText": "images", "filters": {"colors": ["black"], "contentType": "image"}}
"car with blue and black" -> {"searchText": "car", "filters": {"colors": ["blue", "black"]}}
"that quote about new beginnings" -> {"searchText": "new beginnings quote", "filters": {"keywords": ["quote"]}}
"my to-do list for yesterday" -> {"searchText": "to-do list", "filters": {"contentType": "todo-list", "dateRange": {"period": "yesterday"}}}
"handwritten note about productivity" -> {"searchText": "productivity", "filters": {"contentType": "note", "keywords": ["handwritten"]}}
"Inspiration for a travel blog logo" -> {"searchText": "travel blog logo inspiration", "filters": {"keywords": ["inspiration", "logo", "design"]}}

IMPORTANT RULES:
1. Extract author/person names when queries mention "What did [Name] say" or "by [Name]"
2. Extract colors when mentioned (black, blue, red, etc.) and add to filters.colors array
3. Detect content types from context (article, image, product, video, note, todo-list, receipt, screenshot)
4. Parse temporal expressions (yesterday, last week, last month, last year, today)
5. Extract keywords for specific concepts (quote, handwritten, logo, inspiration, etc.)
6. For color searches, make searchText focus on the object, and add colors to filters

Query: ${query}

Return ONLY the JSON object, no additional text.`;

      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: userPrompt
        }]
      });

      const responseText = message.content[0].text;
      console.log('[ClaudeService] Raw response:', responseText);

      const cleanedJson = this._cleanJsonResponse(responseText);
      const result = JSON.parse(cleanedJson);
      console.log('[ClaudeService] Parsed query:', result);

      return result;

    } catch (error) {
      console.error('[ClaudeService] Error parsing search query:', error.message);
      throw new Error(`Failed to parse search query: ${error.message}`);
    }
  }

  /**
   * Generate relevant tags based on title and content
   * @param {string} title - Content title
   * @param {string} content - Content text
   * @returns {Promise<Array<string>>} Array of 5-7 tags
   */
  async generateTags(title, content) {
    console.log(`[ClaudeService] Generating tags for: "${title}"`);

    try {
      const systemPrompt = 'You are a tag generator. Generate relevant, concise tags for content and return ONLY a JSON array of strings.';

      const userPrompt = `Generate 5-7 relevant tags for this content. Tags should be:
- Short (1-3 words)
- Relevant to the main topics
- Useful for search and categorization
- Lowercase

Title: ${title}

Content: ${content.substring(0, 1000)}${content.length > 1000 ? '...' : ''}

Return ONLY a JSON array of tag strings, like: ["tag1", "tag2", "tag3"]`;

      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: 256,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: userPrompt
        }]
      });

      const responseText = message.content[0].text;
      console.log('[ClaudeService] Raw response:', responseText);

      const cleanedJson = this._cleanJsonResponse(responseText);
      const result = JSON.parse(cleanedJson);
      console.log('[ClaudeService] Generated tags:', result);

      return result;

    } catch (error) {
      console.error('[ClaudeService] Error generating tags:', error.message);
      throw new Error(`Failed to generate tags: ${error.message}`);
    }
  }
}

module.exports = new ClaudeService();
