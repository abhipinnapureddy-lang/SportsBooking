const router = require('express').Router(); const { authenticate } = require('../middleware/authMiddleware'); const { listNotifications, markRead, markAllRead } = require('../controllers/notificationController');
router.get('/', authenticate, listNotifications); router.put('/read-all', authenticate, markAllRead); router.put('/:id/read', authenticate, markRead); module.exports = router;
