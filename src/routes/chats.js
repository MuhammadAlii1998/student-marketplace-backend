const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  createOrGetChat,
  getUserChats,
  getChatById,
  getChatMessages,
  deleteChat,
  getUnreadCount
} = require('../controllers/chatController');

// All chat routes require authentication
router.use(authenticate);

// Get unread message count (must be before /:chatId)
router.get('/unread/count', getUnreadCount);

// Create or get chat
router.post('/', createOrGetChat);

// Get user's chats
router.get('/', getUserChats);

// Get chat by ID
router.get('/:chatId', getChatById);

// Get chat messages
router.get('/:chatId/messages', getChatMessages);

// Delete chat
router.delete('/:chatId', deleteChat);

module.exports = router;
