const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { listSlots, getSlot, createSlot, updateSlot, deleteSlot } = require('../controllers/slotController');

const router = express.Router();

router.get('/', listSlots);
router.get('/:id', getSlot);
router.post('/', authenticate, createSlot);
router.put('/:id', authenticate, updateSlot);
router.delete('/:id', authenticate, deleteSlot);

module.exports = router;