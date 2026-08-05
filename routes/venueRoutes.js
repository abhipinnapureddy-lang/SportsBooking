const express = require("express");
const { authenticate, authorizeRoles } = require("../middleware/authMiddleware");
const { getVenues, getVenue, createVenue, updateVenue, deleteVenue } = require("../controllers/venueController");

const router = express.Router();

router.get("/", getVenues);
router.get("/:id", getVenue);
router.post("/", authenticate, authorizeRoles("owner", "admin"), createVenue);
router.put("/:id", authenticate, authorizeRoles("owner", "admin"), updateVenue);
router.delete("/:id", authenticate, authorizeRoles("owner", "admin"), deleteVenue);

module.exports = router;
