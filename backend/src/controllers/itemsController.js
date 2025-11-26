const { v4: uuidv4 } = require('uuid');
const claudeService = require('../services/claudeService');
const embeddingService = require('../services/embeddingService');
const transformerService = require('../services/transformerService');
const scraperService = require('../services/scraperService');
const db = require('../config/database');

class ItemsController {
  /**
   * Create a new item
   * POST /api/items
   */
  async createItem(req, res) {
    console.log('[ItemsController] Creating new item...');

    try {
      const {
        url,
        content,
        contentType,
        title,
        description,
        rawData
      } = req.body;

      // Validate required fields
      if (!content || !contentType) {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['content', 'contentType']
        });
      }

      // Use a default UUID for anonymous users
      const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';
      const itemId = uuidv4();

      console.log(`[ItemsController] Analyzing ${contentType} content...`);

      // Step 1: Analyze content with Claude
      const analysis = await claudeService.analyzeContent(content, contentType, url);

      // Step 2: Generate tags if not from analysis
      let tags = analysis.keyTopics || [];
      if (!tags.length && (title || analysis.title)) {
        tags = await claudeService.generateTags(
          title || analysis.title,
          content
        );
      }

      // Step 3: Prepare embedding text
      const embeddingText = this._prepareEmbeddingText(analysis, content, title);

      console.log('[ItemsController] 🤖 Generating transformer embedding (384D)...');
      const embedding = await transformerService.generateEmbedding(embeddingText);
      console.log(`[ItemsController] ✅ Generated ${embedding.length}D semantic embedding`);

      // Step 4: Extract domain from URL
      const sourceDomain = url ? new URL(url).hostname : null;

      // Step 5: Prepare item data
      const itemData = {
        id: itemId,
        user_id: userId,
        title: title || analysis.title || analysis.productName || 'Untitled',
        description: description || analysis.summary || '',
        content: content,
        raw_data: rawData || {},
        content_type: contentType,
        url: url || null,
        source_domain: sourceDomain,
        metadata: this._buildMetadata(analysis, contentType),
        thumbnail_url: analysis.thumbnailUrl || null,
        image_urls: analysis.imageUrls || [],
        video_url: analysis.videoUrl || null,
        file_path: null,
        tags: tags,
        collection_id: null,
        is_favorite: false,
        is_archived: false,
        created_at: new Date(),
        updated_at: new Date(),
        accessed_at: new Date()
      };

      console.log('[ItemsController] Saving to database...');

      // Step 6: Save item to database (with mock fallback)
      if (db.pool) {
        await db.pool.query(
          `INSERT INTO items (
            id, user_id, title, description, content, raw_data, content_type,
            url, source_domain, metadata, thumbnail_url, image_urls, video_url,
            tags, is_favorite, is_archived, created_at, updated_at, accessed_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
          [
            itemData.id, itemData.user_id, itemData.title, itemData.description,
            itemData.content, JSON.stringify(itemData.raw_data), itemData.content_type,
            itemData.url, itemData.source_domain, JSON.stringify(itemData.metadata),
            itemData.thumbnail_url, itemData.image_urls, itemData.video_url,
            itemData.tags, itemData.is_favorite, itemData.is_archived,
            itemData.created_at, itemData.updated_at, itemData.accessed_at
          ]
        );

        // Step 7: Save embedding
        await db.pool.query(
          `INSERT INTO embeddings (id, item_id, embedding, embedding_model, created_at)
           VALUES ($1, $2, $3, $4, $5)`,
          [uuidv4(), itemId, JSON.stringify(embedding), 'gemini-embedding-001', new Date()]
        );
      } else {
        console.warn('[ItemsController] Database not available - returning mock response');
      }

      console.log('[ItemsController] Item created successfully:', itemId);

      // Return response
      res.status(201).json({
        success: true,
        item: {
          id: itemData.id,
          title: itemData.title,
          description: itemData.description,
          content_type: itemData.content_type,
          url: itemData.url,
          metadata: itemData.metadata,
          tags: itemData.tags,
          created_at: itemData.created_at
        }
      });

    } catch (error) {
      console.error('[ItemsController] Error creating item:', error.message);
      res.status(500).json({
        error: 'Failed to create item',
        message: error.message
      });
    }
  }

  /**
   * Get all items for a user
   * GET /api/items
   */
  async getItems(req, res) {
    try {
      const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';
      const {
        contentType,
        tags,
        isFavorite,
        isArchived,
        startDate,
        endDate,
        limit = 50,
        offset = 0
      } = req.query;

      console.log(`[ItemsController] Fetching items for user: ${userId}`);

      if (!db.pool) {
        return res.status(503).json({
          error: 'Database not available',
          message: 'Please set up PostgreSQL to use this feature'
        });
      }

      // Build query
      let query = 'SELECT * FROM items WHERE user_id = $1';
      const params = [userId];
      let paramIndex = 2;

      if (contentType) {
        query += ` AND content_type = $${paramIndex}`;
        params.push(contentType);
        paramIndex++;
      }

      if (tags) {
        query += ` AND tags && $${paramIndex}`;
        params.push(tags.split(','));
        paramIndex++;
      }

      if (isFavorite !== undefined) {
        query += ` AND is_favorite = $${paramIndex}`;
        params.push(isFavorite === 'true');
        paramIndex++;
      }

      if (isArchived !== undefined) {
        query += ` AND is_archived = $${paramIndex}`;
        params.push(isArchived === 'true');
        paramIndex++;
      }

      // Date filtering
      if (startDate) {
        query += ` AND created_at >= $${paramIndex}`;
        params.push(new Date(startDate));
        paramIndex++;
      }

      if (endDate) {
        // Add 1 day to endDate to include the entire end date
        const endDateTime = new Date(endDate);
        endDateTime.setDate(endDateTime.getDate() + 1);
        query += ` AND created_at < $${paramIndex}`;
        params.push(endDateTime);
        paramIndex++;
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(limit), parseInt(offset));

      const result = await db.pool.query(query, params);

      res.json({
        success: true,
        items: result.rows,
        count: result.rows.length
      });

    } catch (error) {
      console.error('[ItemsController] Error fetching items:', error.message);
      res.status(500).json({
        error: 'Failed to fetch items',
        message: error.message
      });
    }
  }

  /**
   * Get a single item by ID
   * GET /api/items/:id
   */
  async getItemById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';

      console.log(`[ItemsController] Fetching item: ${id}`);

      if (!db.pool) {
        return res.status(503).json({
          error: 'Database not available'
        });
      }

      const result = await db.pool.query(
        'SELECT * FROM items WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Item not found'
        });
      }

      // Update accessed_at
      await db.pool.query(
        'UPDATE items SET accessed_at = $1 WHERE id = $2',
        [new Date(), id]
      );

      res.json({
        success: true,
        item: result.rows[0]
      });

    } catch (error) {
      console.error('[ItemsController] Error fetching item:', error.message);
      res.status(500).json({
        error: 'Failed to fetch item',
        message: error.message
      });
    }
  }

  /**
   * Update an item
   * PUT /api/items/:id
   */
  async updateItem(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';
      const updates = req.body;

      console.log(`[ItemsController] Updating item: ${id}`);

      if (!db.pool) {
        return res.status(503).json({
          error: 'Database not available'
        });
      }

      // Check if item exists and belongs to user
      const checkResult = await db.pool.query(
        'SELECT id FROM items WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Item not found'
        });
      }

      // Build update query dynamically
      const allowedFields = [
        'title', 'description', 'tags', 'is_favorite',
        'is_archived', 'collection_id', 'metadata'
      ];

      const updateFields = [];
      const params = [];
      let paramIndex = 1;

      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
          updateFields.push(`${key} = $${paramIndex}`);
          params.push(updates[key]);
          paramIndex++;
        }
      });

      if (updateFields.length === 0) {
        return res.status(400).json({
          error: 'No valid fields to update'
        });
      }

      updateFields.push(`updated_at = $${paramIndex}`);
      params.push(new Date());
      paramIndex++;

      params.push(id);
      params.push(userId);

      const query = `
        UPDATE items
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex - 1} AND user_id = $${paramIndex}
        RETURNING *
      `;

      const result = await db.pool.query(query, params);

      res.json({
        success: true,
        item: result.rows[0]
      });

    } catch (error) {
      console.error('[ItemsController] Error updating item:', error.message);
      res.status(500).json({
        error: 'Failed to update item',
        message: error.message
      });
    }
  }

  /**
   * Delete an item
   * DELETE /api/items/:id
   */
  async deleteItem(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';

      console.log(`[ItemsController] Deleting item: ${id}`);

      if (!db.pool) {
        return res.status(503).json({
          error: 'Database not available'
        });
      }

      // Delete embeddings first (foreign key)
      await db.pool.query('DELETE FROM embeddings WHERE item_id = $1', [id]);

      // Delete item
      const result = await db.pool.query(
        'DELETE FROM items WHERE id = $1 AND user_id = $2 RETURNING id',
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Item not found'
        });
      }

      res.json({
        success: true,
        message: 'Item deleted successfully',
        id: id
      });

    } catch (error) {
      console.error('[ItemsController] Error deleting item:', error.message);
      res.status(500).json({
        error: 'Failed to delete item',
        message: error.message
      });
    }
  }

  /**
   * Helper: Prepare text for embedding
   */
  _prepareEmbeddingText(analysis, content, title) {
    let text = '';

    if (analysis.title || title) {
      text += (analysis.title || title) + '. ';
    }

    if (analysis.summary) {
      text += analysis.summary + '. ';
    }

    if (analysis.productName) {
      text += analysis.productName + '. ';
    }

    if (analysis.keySpecs && Array.isArray(analysis.keySpecs)) {
      text += analysis.keySpecs.join('. ') + '. ';
    }

    if (analysis.keyTopics && Array.isArray(analysis.keyTopics)) {
      text += analysis.keyTopics.join('. ') + '. ';
    }

    // Add some of the original content
    text += content.substring(0, 1000);

    return text;
  }

  /**
   * Helper: Build metadata object based on content type
   */
  _buildMetadata(analysis, contentType) {
    const metadata = {};

    switch (contentType) {
      case 'product':
        metadata.price = analysis.price;
        metadata.brand = analysis.brand;
        metadata.specs = analysis.keySpecs;
        metadata.category = analysis.category;
        break;

      case 'article':
        metadata.mainPoints = analysis.mainPoints;
        metadata.category = analysis.category;
        break;

      case 'video':
        metadata.category = analysis.category;
        metadata.duration = analysis.duration;
        break;

      case 'image':
        metadata.type = analysis.type;
        metadata.structuredData = analysis.structuredData;
        break;

      default:
        // Copy all analysis data
        Object.assign(metadata, analysis);
    }

    return metadata;
  }

  /**
   * Upload and analyze image
   * POST /api/items/upload
   */
  async uploadImage(req, res) {
    console.log('[ItemsController] Processing image upload...');

    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'No image file provided'
        });
      }

      const imagePath = req.file.path;
      const mimeType = req.file.mimetype;

      console.log(`[ItemsController] Analyzing image: ${req.file.originalname}`);

      // Step 1: Analyze image with Claude Vision
      const analysis = await claudeService.analyzeImage(imagePath, mimeType);

      // Step 2: Prepare content for embedding (use extracted text + description)
      const embeddingText = this._prepareImageEmbeddingText(analysis);

      console.log('[ItemsController] Generating embedding vector...');
      const embedding = await embeddingService.generateEmbedding(embeddingText);

      // Step 3: Prepare item data
      const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';
      const itemId = uuidv4();

      const itemData = {
        id: itemId,
        user_id: userId,
        title: analysis.title || req.file.originalname,
        description: analysis.description || '',
        content: analysis.extractedText || analysis.description,
        raw_data: { analysis, filename: req.file.originalname },
        content_type: analysis.type || 'image',
        url: null,
        source_domain: null,
        metadata: {
          imageType: analysis.type,
          containsText: analysis.containsText,
          dominantColors: analysis.dominantColors,
          objects: analysis.objects,
          structuredData: analysis.structuredData
        },
        thumbnail_url: `/uploads/${req.file.filename}`,
        image_urls: [`/uploads/${req.file.filename}`],
        video_url: null,
        file_path: req.file.path,
        tags: analysis.keyTopics || [],
        collection_id: null,
        is_favorite: false,
        is_archived: false,
        created_at: new Date(),
        updated_at: new Date(),
        accessed_at: new Date()
      };

      console.log('[ItemsController] Saving to database...');

      // Step 4: Save item to database
      if (db.pool) {
        await db.pool.query(
          `INSERT INTO items (
            id, user_id, title, description, content, raw_data, content_type,
            url, source_domain, metadata, thumbnail_url, image_urls, video_url,
            file_path, tags, is_favorite, is_archived, created_at, updated_at, accessed_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
          [
            itemData.id, itemData.user_id, itemData.title, itemData.description,
            itemData.content, JSON.stringify(itemData.raw_data), itemData.content_type,
            itemData.url, itemData.source_domain, JSON.stringify(itemData.metadata),
            itemData.thumbnail_url, itemData.image_urls, itemData.video_url,
            itemData.file_path, itemData.tags, itemData.is_favorite, itemData.is_archived,
            itemData.created_at, itemData.updated_at, itemData.accessed_at
          ]
        );

        // Step 5: Save embedding
        await db.pool.query(
          `INSERT INTO embeddings (id, item_id, embedding, embedding_model, created_at)
           VALUES ($1, $2, $3, $4, $5)`,
          [uuidv4(), itemId, JSON.stringify(embedding), 'gemini-embedding-001', new Date()]
        );
      } else {
        console.warn('[ItemsController] Database not available - returning mock response');
      }

      console.log('[ItemsController] Image uploaded and analyzed successfully:', itemId);

      // Return response
      res.status(201).json({
        success: true,
        item: {
          id: itemData.id,
          title: itemData.title,
          description: itemData.description,
          content_type: itemData.content_type,
          metadata: itemData.metadata,
          tags: itemData.tags,
          thumbnail_url: itemData.thumbnail_url,
          extracted_text: analysis.extractedText,
          created_at: itemData.created_at
        }
      });

    } catch (error) {
      console.error('[ItemsController] Error processing image:', error.message);
      res.status(500).json({
        error: 'Failed to process image',
        message: error.message
      });
    }
  }

  /**
   * Helper: Prepare text for embedding from image analysis
   */
  _prepareImageEmbeddingText(analysis) {
    let text = '';

    if (analysis.title) {
      text += analysis.title + '. ';
    }

    if (analysis.description) {
      text += analysis.description + '. ';
    }

    if (analysis.extractedText) {
      text += analysis.extractedText + '. ';
    }

    if (analysis.keyTopics && Array.isArray(analysis.keyTopics)) {
      text += analysis.keyTopics.join('. ') + '. ';
    }

    if (analysis.objects && Array.isArray(analysis.objects)) {
      text += 'Contains: ' + analysis.objects.join(', ') + '. ';
    }

    return text.substring(0, 8000); // Limit for embedding
  }

  /**
   * Scrape URL and create item
   * POST /api/items/scrape
   */
  async scrapeAndCreateItem(req, res) {
    console.log('[ItemsController] Scraping URL and creating item...');

    try {
      const { url } = req.body;

      if (!url) {
        return res.status(400).json({
          error: 'URL is required'
        });
      }

      console.log(`[ItemsController] Scraping: ${url}`);

      // Step 1: Scrape the URL
      const scrapedData = await scraperService.scrapeURL(url);

      // Step 2: Create item using scraped data
      const createRequest = {
        body: {
          url: scrapedData.url,
          content: scrapedData.content,
          contentType: scrapedData.contentType,
          title: scrapedData.title,
          description: scrapedData.description,
          rawData: scrapedData.rawData
        },
        user: req.user
      };

      // Reuse createItem logic
      await this.createItem(createRequest, res);

    } catch (error) {
      console.error('[ItemsController] Error scraping and creating item:', error.message);
      res.status(500).json({
        error: 'Failed to scrape and create item',
        message: error.message
      });
    }
  }
}

module.exports = new ItemsController();
