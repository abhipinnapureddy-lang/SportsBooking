const express = require('express');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');
const { listInventory, createInventoryEntry } = require('../controllers/inventoryController');

const router = express.Router();

router.get('/', authenticate, authorizeRoles('admin', 'owner'), listInventory);
router.post('/', authenticate, authorizeRoles('admin'), createInventoryEntry);

module.exports = router;