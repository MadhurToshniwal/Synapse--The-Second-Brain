const express = require('express');
const router = express.Router();
const mcpController = require('../controllers/mcpController');
const { optionalClerkAuth } = require('../middleware/clerkAuth');

/**
 * @route   GET /api/mcp/capabilities
 * @desc    Get MCP server capabilities and schema
 * @access  Public
 */
router.get('/capabilities', mcpController.getCapabilities.bind(mcpController));

/**
 * @route   GET /api/mcp/context
 * @desc    Get user's knowledge base context
 * @access  Private
 */
router.get('/context', optionalClerkAuth, mcpController.getContext.bind(mcpController));

/**
 * @route   POST /api/mcp/search
 * @desc    Search knowledge base with semantic query
 * @access  Private
 */
router.post('/search', optionalClerkAuth, mcpController.searchKnowledgeBase.bind(mcpController));

/**
 * @route   POST /api/mcp/search-by-color
 * @desc    Search items by color attributes
 * @access  Private
 */
router.post('/search-by-color', optionalClerkAuth, mcpController.searchByColor.bind(mcpController));

/**
 * @route   POST /api/mcp/analyze
 * @desc    Analyze content via MCP
 * @access  Private
 */
router.post('/analyze', optionalClerkAuth, mcpController.analyzeContent.bind(mcpController));

module.exports = router;
