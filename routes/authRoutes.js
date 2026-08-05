const express = require("express");
const { register, login, forgotPassword, resetPassword, refreshToken, logout, verifyEmail, me } = require("../controllers/authController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/verify-email", verifyEmail);
router.get("/me", authenticate, me);

module.exports = router;
