const express = require("express");
const { authenticate } = require("../middleware/authMiddleware");
const { createBooking, listBookings, getBooking, cancelBooking } = require("../controllers/bookingController");

const router = express.Router();

router.get("/", authenticate, listBookings);
router.get("/:id", authenticate, getBooking);
router.post("/", authenticate, createBooking);
router.put("/:id/cancel", authenticate, cancelBooking);

module.exports = router;
