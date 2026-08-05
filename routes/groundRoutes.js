const express = require('express');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');
const { getGrounds, getGround, createGround, updateGround, deleteGround } = require('../controllers/groundController');

const router = express.Router();

router.get('/', getGrounds);
router.get('/:id', getGround);
router.post('/', authenticate, authorizeRoles('owner', 'admin'), createGround);
router.put('/:id', authenticate, authorizeRoles('owner', 'admin'), updateGround);
router.delete('/:id', authenticate, authorizeRoles('owner', 'admin'), deleteGround);

module.exports = router;