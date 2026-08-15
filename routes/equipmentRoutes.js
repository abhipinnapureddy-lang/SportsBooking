const express = require('express');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');
const {
  listEquipment,
  getEquipment,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  listMyReservations,
  reserveEquipment,
  cancelReservation,
  qrAction
} = require('../controllers/equipmentController');

const router = express.Router();

router.get('/', authenticate, listEquipment);
router.get('/reservations', authenticate, listMyReservations);
router.post('/reservations', authenticate, reserveEquipment);
router.put('/reservations/:id/cancel', authenticate, cancelReservation);
router.post('/qr-action', authenticate, authorizeRoles('admin', 'coordinator'), qrAction);
router.get('/:id', authenticate, getEquipment);
router.post('/', authenticate, authorizeRoles('admin'), createEquipment);
router.put('/:id', authenticate, authorizeRoles('admin'), updateEquipment);
router.delete('/:id', authenticate, authorizeRoles('admin'), deleteEquipment);

module.exports = router;
