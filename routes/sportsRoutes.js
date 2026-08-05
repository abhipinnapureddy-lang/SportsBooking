const express = require('express');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');
const { listSports, getSport, createSport, updateSport, deleteSport } = require('../controllers/sportsController');

const router = express.Router();

router.get('/', listSports);
router.get('/:id', getSport);
router.post('/', authenticate, authorizeRoles('admin'), createSport);
router.put('/:id', authenticate, authorizeRoles('admin'), updateSport);
router.delete('/:id', authenticate, authorizeRoles('admin'), deleteSport);

module.exports = router;
