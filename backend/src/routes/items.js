const express = require('express');
const router = express.Router();
const itemsController = require('../controllers/itemsController');
const { optionalClerkAuth } = require('../middleware/clerkAuth');
const upload = require('../middleware/upload');

/**
 * @route   POST /api/items
 * @desc    Create a new item
 * @access  Private (requires authentication)
 */
router.post('/', optionalClerkAuth, itemsController.createItem.bind(itemsController));

/**
 * @route   POST /api/items/upload
 * @desc    Upload and analyze image
 * @access  Private
 */
router.post('/upload', optionalClerkAuth, upload.single('image'), itemsController.uploadImage.bind(itemsController));

/**
 * @route   POST /api/items/scrape
 * @desc    Scrape URL and create item
 * @access  Private
 */
router.post('/scrape', optionalClerkAuth, itemsController.scrapeAndCreateItem.bind(itemsController));

/**
 * @route   GET /api/items
 * @desc    Get all items for the authenticated user
 * @access  Private
 */
router.get('/', optionalClerkAuth, itemsController.getItems.bind(itemsController));

/**
 * @route   GET /api/items/:id
 * @desc    Get a single item by ID
 * @access  Private
 */
router.get('/:id', optionalClerkAuth, itemsController.getItemById.bind(itemsController));

/**
 * @route   PUT /api/items/:id
 * @desc    Update an item
 * @access  Private
 */
router.put('/:id', optionalClerkAuth, itemsController.updateItem.bind(itemsController));

/**
 * @route   DELETE /api/items/:id
 * @desc    Delete an item
 * @access  Private
 */
router.delete('/:id', optionalClerkAuth, itemsController.deleteItem.bind(itemsController));

module.exports = router;
