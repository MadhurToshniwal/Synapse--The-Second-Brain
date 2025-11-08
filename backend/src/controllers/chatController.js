const db = require('../config/database');
const claudeService = require('../services/claudeService');
const transformerService = require('../services/transformerService');

/**
 * Chat Controller - Conversational RAG System
 * Allows users to chat with their knowledge base
 */
class ChatController {
  /**
   * Send a message and get AI response with RAG
   * POST /api/chat
   */
  async sendMessage(req, res) {
    try {
      const { message, conversationId, mode = 'chat' } = req.body;
      const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';

      if (!message || !message.trim()) {
        return res.status(400).json({
          error: 'Message is required'
        });
      }

      if (!db.pool) {
        return res.status(503).json({
          error: 'Database not available'
        });
      }

      console.log(`[ChatController] Processing message for user ${userId}`);
      console.log(`[ChatController] Mode: ${mode}, Message: "${message}"`);

      // Step 1: Get or create conversation
      let conversation = null;
      if (conversationId) {
        const convResult = await db.pool.query(
          'SELECT * FROM conversations WHERE id = $1 AND user_id = $2',
          [conversationId, userId]
        );
        conversation = convResult.rows[0];
      }

      if (!conversation) {
        // Create new conversation
        const title = message.substring(0, 50) + (message.length > 50 ? '...' : '');
        const convResult = await db.pool.query(
          'INSERT INTO conversations (user_id, title) VALUES ($1, $2) RETURNING *',
          [userId, title]
        );
        conversation = convResult.rows[0];
        console.log(`[ChatController] Created new conversation: ${conversation.id}`);
      }

      // Step 2: Store user message
      await db.pool.query(
        'INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3)',
        [conversation.id, 'user', message]
      );

      // Step 3: Advanced semantic search with MPNet transformer
      console.log('[ChatController] 🧠 Performing advanced semantic search with MPNet...');

      // Analyze query for better retrieval
      const queryAnalysis = await transformerService.analyzeQuery(message);
      console.log(`[ChatController] Query intent: ${queryAnalysis.intent}, type: ${queryAnalysis.queryType}`);

      const embedding = await transformerService.generateEmbedding(message);

      // Get total item count first
      const totalCountResult = await db.pool.query(
        'SELECT COUNT(*) FROM items WHERE user_id = $1 AND is_archived = false',
        [userId]
      );
      const totalItemCount = parseInt(totalCountResult.rows[0].count);
      console.log(`[ChatController] User has ${totalItemCount} total items in knowledge base`);

      // Retrieve more items for re-ranking (10 instead of 5)
      const searchQuery = `
        SELECT
          i.*,
          (e.embedding <=> $1::vector) as relevance_score
        FROM items i
        JOIN embeddings e ON i.id = e.item_id
        WHERE i.user_id = $2
          AND i.is_archived = false
        ORDER BY e.embedding <=> $1::vector
        LIMIT 10
      `;

      const searchResult = await db.pool.query(searchQuery, [
        JSON.stringify(embedding),
        userId
      ]);

      console.log(`[ChatController] Found ${searchResult.rows.length} initial items`);

      // Step 3.5: Re-rank for superior relevance
      console.log('[ChatController] 🔄 Re-ranking results for optimal RAG context...');
      const relevantItems = await transformerService.rerankResults(
        message,
        searchResult.rows,
        5 // Get top 5 most relevant
      );

      console.log(`[ChatController] ✅ Selected top ${relevantItems.length} most relevant items`);
      console.log(`[ChatController] Top relevance: ${relevantItems[0]?.relevance_explanation}`);

      // Step 4: Build context from relevant items
      const context = this._buildContext(relevantItems, totalItemCount);

      // Step 5: Get conversation history (last 6 messages for context)
      const historyResult = await db.pool.query(
        `SELECT role, content FROM messages
         WHERE conversation_id = $1
         ORDER BY created_at DESC
         LIMIT 6`,
        [conversation.id]
      );
      const history = historyResult.rows.reverse();

      // Step 6: Generate response based on mode
      let response;
      let sources = [];

      if (mode === 'summarize') {
        response = await this._generateSummary(relevantItems);
        sources = relevantItems.map(item => ({
          id: item.id,
          title: item.title,
          relevance: 1 - item.relevance_score
        }));
      } else if (mode === 'compare') {
        response = await this._generateComparison(relevantItems, message);
        sources = relevantItems.map(item => ({
          id: item.id,
          title: item.title,
          relevance: 1 - item.relevance_score
        }));
      } else if (mode === 'quiz') {
        response = await this._generateQuiz(relevantItems, message);
        sources = relevantItems.map(item => ({
          id: item.id,
          title: item.title,
          relevance: 1 - item.relevance_score
        }));
      } else {
        // Normal chat mode with RAG
        response = await this._generateChatResponse(message, context, history);
        sources = relevantItems
          .filter(item => item.relevance_score < 0.5) // Only highly relevant items
          .map(item => ({
            id: item.id,
            title: item.title,
            type: item.content_type,
            url: item.url,
            relevance: (1 - item.relevance_score).toFixed(2)
          }));
      }

      // Step 7: Store assistant message
      await db.pool.query(
        'INSERT INTO messages (conversation_id, role, content, sources) VALUES ($1, $2, $3, $4)',
        [conversation.id, 'assistant', response, JSON.stringify(sources)]
      );

      // Step 8: Generate follow-up questions
      const followUpQuestions = await this._generateFollowUpQuestions(message, response, relevantItems);

      // Step 9: Return response
      res.json({
        success: true,
        conversationId: conversation.id,
        message: response,
        sources: sources,
        followUpQuestions: followUpQuestions,
        relevantItemCount: relevantItems.length,
        totalItemCount: totalItemCount
      });

    } catch (error) {
      console.error('[ChatController] Error:', error.message);
      res.status(500).json({
        error: 'Failed to process message',
        message: error.message
      });
    }
  }

  /**
   * Get conversation history
   * GET /api/chat/:conversationId
   */
  async getConversation(req, res) {
    try {
      const { conversationId } = req.params;
      const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';

      if (!db.pool) {
        return res.status(503).json({ error: 'Database not available' });
      }

      const conversation = await db.pool.query(
        'SELECT * FROM conversations WHERE id = $1 AND user_id = $2',
        [conversationId, userId]
      );

      if (conversation.rows.length === 0) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      const messages = await db.pool.query(
        'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
        [conversationId]
      );

      res.json({
        success: true,
        conversation: conversation.rows[0],
        messages: messages.rows
      });

    } catch (error) {
      console.error('[ChatController] Error:', error.message);
      res.status(500).json({ error: 'Failed to get conversation' });
    }
  }

  /**
   * Get all conversations for user
   * GET /api/chat/conversations
   */
  async getConversations(req, res) {
    try {
      const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';

      if (!db.pool) {
        return res.status(503).json({ error: 'Database not available' });
      }

      const result = await db.pool.query(
        `SELECT c.*, COUNT(m.id) as message_count
         FROM conversations c
         LEFT JOIN messages m ON c.id = m.conversation_id
         WHERE c.user_id = $1
         GROUP BY c.id
         ORDER BY c.updated_at DESC
         LIMIT 50`,
        [userId]
      );

      res.json({
        success: true,
        conversations: result.rows
      });

    } catch (error) {
      console.error('[ChatController] Error:', error.message);
      res.status(500).json({ error: 'Failed to get conversations' });
    }
  }

  /**
   * Delete conversation
   * DELETE /api/chat/:conversationId
   */
  async deleteConversation(req, res) {
    try {
      const { conversationId } = req.params;
      const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';

      if (!db.pool) {
        return res.status(503).json({ error: 'Database not available' });
      }

      await db.pool.query(
        'DELETE FROM conversations WHERE id = $1 AND user_id = $2',
        [conversationId, userId]
      );

      res.json({ success: true });

    } catch (error) {
      console.error('[ChatController] Error:', error.message);
      res.status(500).json({ error: 'Failed to delete conversation' });
    }
  }

  /**
   * Build context string from relevant items
   * @private
   */
  _buildContext(items, totalCount = null) {
    if (items.length === 0) {
      return totalCount
        ? `The user has ${totalCount} total items in their knowledge base, but no items are relevant to this query.`
        : 'No relevant content found in knowledge base.';
    }

    let context = '';

    if (totalCount) {
      context = `The user has ${totalCount} total items in their knowledge base. You are provided with the ${items.length} most relevant items for this conversation.\n\n`;
    }

    context += 'Here is relevant content from the user\'s knowledge base:\n\n';

    items.forEach((item, index) => {
      context += `[Item ${index + 1}: ${item.content_type}]\n`;
      context += `Title: ${item.title}\n`;
      if (item.description) {
        context += `Description: ${item.description}\n`;
      }
      if (item.content) {
        context += `Content: ${item.content.substring(0, 500)}...\n`;
      }
      context += `\n`;
    });

    return context;
  }

  /**
   * Generate chat response with RAG
   * @private
   */
  async _generateChatResponse(userMessage, context, history) {
    const systemPrompt = `You are Synapse, an intelligent AI assistant for a personal knowledge base system.

Your role is to help users understand and explore their saved content. You have access to their knowledge base through the context provided.

IMPORTANT RULES:
1. ONLY use information from the provided context
2. If the context doesn't contain relevant information, say so clearly
3. Always cite which items you're referencing (e.g., "In the article you saved...")
4. Be conversational and helpful
5. Suggest follow-up actions when appropriate
6. Format responses with markdown for readability`;

    let conversationHistory = '';
    if (history.length > 1) {
      conversationHistory = '\nPrevious conversation:\n';
      history.slice(0, -1).forEach(msg => {
        conversationHistory += `${msg.role === 'user' ? 'User' : 'Synapse'}: ${msg.content}\n`;
      });
    }

    const userPrompt = `${conversationHistory}

${context}

User's current question: ${userMessage}

Please provide a helpful, accurate response based ONLY on the context above. If you can't answer from the context, explain what information is missing.`;

    try {
      const message = await claudeService.client.messages.create({
        model: claudeService.model,
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: userPrompt
        }]
      });

      return message.content[0].text;
    } catch (error) {
      console.error('[ChatController] Error generating response:', error);
      return 'I encountered an error generating a response. Please try again.';
    }
  }

  /**
   * Generate summary of items
   * @private
   */
  async _generateSummary(items) {
    if (items.length === 0) {
      return 'You haven\'t saved any relevant content yet. Start saving articles, images, and other content to build your knowledge base!';
    }

    const context = this._buildContext(items);

    const prompt = `Based on the following saved items, provide a concise summary of the key themes and insights:

${context}

Provide a well-structured summary with:
1. Main themes (3-5 bullet points)
2. Key insights
3. Recommended actions or next steps`;

    try {
      const message = await claudeService.client.messages.create({
        model: claudeService.model,
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      return message.content[0].text;
    } catch (error) {
      console.error('[ChatController] Error generating summary:', error);
      return 'Unable to generate summary at this time.';
    }
  }

  /**
   * Generate comparison of items
   * @private
   */
  async _generateComparison(items, userMessage) {
    if (items.length < 2) {
      return 'I need at least 2 items to compare. Try saving more content first!';
    }

    const context = this._buildContext(items);

    const prompt = `The user asked: "${userMessage}"

Based on these saved items:
${context}

Provide a detailed comparison highlighting:
1. Similarities
2. Differences
3. Pros and cons of each
4. Recommendation or conclusion`;

    try {
      const message = await claudeService.client.messages.create({
        model: claudeService.model,
        max_tokens: 1536,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      return message.content[0].text;
    } catch (error) {
      console.error('[ChatController] Error generating comparison:', error);
      return 'Unable to generate comparison at this time.';
    }
  }

  /**
   * Generate quiz questions
   * @private
   */
  async _generateQuiz(items, userMessage) {
    if (items.length === 0) {
      return 'You need some saved content first before I can quiz you!';
    }

    const context = this._buildContext(items);

    const prompt = `Based on this content from the user's knowledge base:
${context}

Generate 3 multiple-choice questions to test understanding. Format as:

**Question 1:** [question text]
A) [option]
B) [option]
C) [option]
D) [option]

Correct Answer: [letter]
Explanation: [brief explanation]

(Repeat for questions 2 and 3)`;

    try {
      const message = await claudeService.client.messages.create({
        model: claudeService.model,
        max_tokens: 1536,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      return message.content[0].text;
    } catch (error) {
      console.error('[ChatController] Error generating quiz:', error);
      return 'Unable to generate quiz at this time.';
    }
  }

  /**
   * Generate follow-up questions
   * @private
   */
  async _generateFollowUpQuestions(userMessage, response, items) {
    if (items.length === 0) {
      return [
        "What topics are you interested in?",
        "Would you like me to help you get started?"
      ];
    }

    // Simple rule-based follow-up questions
    const questions = [];

    if (items.some(item => item.content_type === 'article')) {
      questions.push("Would you like a summary of these articles?");
    }

    if (items.length > 1) {
      questions.push("Should I compare these items?");
    }

    if (items.some(item => item.metadata && item.metadata.price)) {
      questions.push("Would you like to see price comparisons?");
    }

    questions.push("Tell me more about this topic");
    questions.push("What else did I save related to this?");

    return questions.slice(0, 3);
  }
}

module.exports = new ChatController();
