const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { optionalClerkAuth } = require('../middleware/clerkAuth');

/**
 * @route   POST /api/chat
 * @desc    Send a message and get AI response with RAG
 * @access  Private
 */
router.post('/', optionalClerkAuth, chatController.sendMessage.bind(chatController));

/**
 * @route   GET /api/chat/conversations
 * @desc    Get all conversations for user
 * @access  Private
 */
router.get('/conversations', optionalClerkAuth, chatController.getConversations.bind(chatController));

/**
 * @route   GET /api/chat/:conversationId
 * @desc    Get specific conversation with messages
 * @access  Private
 */
router.get('/:conversationId', optionalClerkAuth, chatController.getConversation.bind(chatController));

/**
 * @route   DELETE /api/chat/:conversationId
 * @desc    Delete a conversation
 * @access  Private
 */
router.delete('/:conversationId', optionalClerkAuth, chatController.deleteConversation.bind(chatController));

module.exports = router;
