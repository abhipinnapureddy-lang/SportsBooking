const express = require('express');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');
const {
  listTournaments,
  getTournament,
  createTournament,
  registerTeam,
  createMatch,
  updateMatch
} = require('../controllers/tournamentController');

const router = express.Router();

router.get('/', authenticate, listTournaments);
router.get('/:id', authenticate, getTournament);
router.post('/', authenticate, authorizeRoles('admin', 'coordinator'), createTournament);
router.post('/:id/teams', authenticate, registerTeam);
router.post('/:id/matches', authenticate, authorizeRoles('admin', 'coordinator'), createMatch);
router.put('/:id/matches/:matchId', authenticate, authorizeRoles('admin', 'coordinator'), updateMatch);

module.exports = router;
