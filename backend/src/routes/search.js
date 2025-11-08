const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { optionalClerkAuth } = require('../middleware/clerkAuth');

/**
 * @route   POST /api/search
 * @desc    Search items using natural language query
 * @access  Private
 */
router.post('/', optionalClerkAuth, searchController.search.bind(searchController));

/**
 * @route   GET /api/search/similar/:itemId
 * @desc    Find similar items to a given item
 * @access  Private
 */
router.get('/similar/:itemId', optionalClerkAuth, searchController.findSimilar.bind(searchController));

/**
 * @route   GET /api/search/suggestions
 * @desc    Get search suggestions based on user's data
 * @access  Private
 */
router.get('/suggestions', optionalClerkAuth, searchController.getSuggestions.bind(searchController));

module.exports = router;
