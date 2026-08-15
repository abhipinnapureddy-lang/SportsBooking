const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { assistant } = require('../controllers/aiController');

const router = express.Router();
router.post('/assistant', authenticate, assistant);
module.exports = router;
