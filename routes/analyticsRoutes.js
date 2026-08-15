const express = require('express');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');
const { analytics } = require('../controllers/analyticsController');

const router = express.Router();
router.get('/', authenticate, authorizeRoles('admin', 'coordinator'), analytics);
module.exports = router;
