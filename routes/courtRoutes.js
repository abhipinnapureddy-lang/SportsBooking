const express = require("express");
const { authenticate, authorizeRoles } = require("../middleware/authMiddleware");
const { getCourtsByVenue, getCourt, createCourt, updateCourt, deleteCourt } = require("../controllers/courtController");

const router = express.Router();

router.get("/venue/:venueId", getCourtsByVenue);
router.get("/:id", getCourt);
router.post("/venue/:venueId", authenticate, authorizeRoles("owner", "admin"), createCourt);
router.put("/:id", authenticate, authorizeRoles("owner", "admin"), updateCourt);
router.delete("/:id", authenticate, authorizeRoles("owner", "admin"), deleteCourt);

module.exports = router;
