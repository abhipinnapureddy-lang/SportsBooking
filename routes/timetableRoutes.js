const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { getTimetable, getTimetableSlots } = require('../controllers/timetableController');

const router = express.Router();

router.get('/', authenticate, getTimetable);
router.get('/slots', authenticate, getTimetableSlots);

module.exports = router;