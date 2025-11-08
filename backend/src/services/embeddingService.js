const axios = require('axios');

class EmbeddingService {
  constructor() {
    this.baseURL = process.env.ANTHROPIC_BASE_URL;
    this.apiKey = process.env.ANTHROPIC_API_KEY;
    this.model = 'gemini-embedding-001';
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
    this.maxTextLength = 8000;
  }

  /**
   * Sleep for a specified duration
   * @param {number} ms - Milliseconds to sleep
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Truncate text to max length
   * @param {string} text - Text to truncate
   * @returns {string} Truncated text
   */
  _truncateText(text) {
    if (text.length > this.maxTextLength) {
      console.log(`[EmbeddingService] Truncating text from ${text.length} to ${this.maxTextLength} chars`);
      return text.substring(0, this.maxTextLength);
    }
    return text;
  }

  /**
   * Make API request with retry logic
   * @param {Object} payload - Request payload
   * @param {number} attempt - Current attempt number
   * @returns {Promise<Object>} API response
   */
  async _makeRequest(payload, attempt = 1) {
    try {
      console.log(`[EmbeddingService] Making request (attempt ${attempt}/${this.maxRetries})`);

      const response = await axios.post(
        `${this.baseURL}/v1/embeddings`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          timeout: 30000 // 30 second timeout
        }
      );

      return response.data;

    } catch (error) {
      console.error(`[EmbeddingService] Request failed (attempt ${attempt}):`, error.message);

      // If we haven't exhausted retries and it's a retriable error
      if (attempt < this.maxRetries && this._isRetriableError(error)) {
        const delay = this.retryDelay * attempt; // Exponential backoff
        console.log(`[EmbeddingService] Retrying in ${delay}ms...`);
        await this._sleep(delay);
        return this._makeRequest(payload, attempt + 1);
      }

      // Throw error if retries exhausted or non-retriable error
      throw error;
    }
  }

  /**
   * Check if error is retriable
   * @param {Error} error - Error object
   * @returns {boolean} True if error is retriable
   */
  _isRetriableError(error) {
    // Retry on network errors or 5xx server errors
    if (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND') {
      return true;
    }
    if (error.response && error.response.status >= 500) {
      return true;
    }
    // Retry on rate limiting (429)
    if (error.response && error.response.status === 429) {
      return true;
    }
    return false;
  }

  /**
   * Generate embedding for a single text
   * @param {string} text - Text to generate embedding for
   * @returns {Promise<Array<number>>} Embedding vector (3072 dimensions for gemini-embedding-001)
   */
  async generateEmbedding(text) {
    console.log(`[EmbeddingService] Generating embedding for text (${text.length} chars)`);

    try {
      // Validate input
      if (!text || typeof text !== 'string') {
        throw new Error('Text must be a non-empty string');
      }

      // Truncate text if necessary
      const truncatedText = this._truncateText(text);

      // Make API request
      const payload = {
        model: this.model,
        input: truncatedText
      };

      const response = await this._makeRequest(payload);

      // Extract embedding vector
      if (!response.data || !response.data[0] || !response.data[0].embedding) {
        throw new Error('Invalid response format from embedding API');
      }

      const embedding = response.data[0].embedding;
      console.log(`[EmbeddingService] Generated embedding (${embedding.length} dimensions)`);

      return embedding;

    } catch (error) {
      console.error('[EmbeddingService] Error generating embedding:', error.message);

      // Provide detailed error message
      if (error.response) {
        throw new Error(`Embedding API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      }
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  /**
   * Generate embeddings for multiple texts
   * @param {Array<string>} texts - Array of texts to generate embeddings for
   * @returns {Promise<Array<Array<number>>>} Array of embedding vectors
   */
  async generateEmbeddingBatch(texts) {
    console.log(`[EmbeddingService] Generating embeddings for ${texts.length} texts`);

    try {
      // Validate input
      if (!Array.isArray(texts) || texts.length === 0) {
        throw new Error('texts must be a non-empty array');
      }

      // Truncate all texts
      const truncatedTexts = texts.map(text => this._truncateText(text));

      // Make API request with all texts
      const payload = {
        model: this.model,
        input: truncatedTexts
      };

      const response = await this._makeRequest(payload);

      // Extract embedding vectors
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid response format from embedding API');
      }

      const embeddings = response.data.map(item => {
        if (!item.embedding) {
          throw new Error('Missing embedding in response');
        }
        return item.embedding;
      });

      console.log(`[EmbeddingService] Generated ${embeddings.length} embeddings`);

      return embeddings;

    } catch (error) {
      console.error('[EmbeddingService] Error generating batch embeddings:', error.message);

      // Provide detailed error message
      if (error.response) {
        throw new Error(`Embedding API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      }
      throw new Error(`Failed to generate batch embeddings: ${error.message}`);
    }
  }
}

module.exports = new EmbeddingService();
