const express = require('express');
const router = express.Router();
const { getMessages, sendMessage } = require('../controllers/messageController');
const protect = require('../middleware/authMiddleware');

router.get('/:requestId', protect, getMessages);
router.post('/:requestId', protect, sendMessage);

module.exports = router;