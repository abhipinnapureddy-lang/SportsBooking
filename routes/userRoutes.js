const express = require("express");
const { authenticate, authorizeRoles } = require("../middleware/authMiddleware");
const { updateProfile, changePassword, listUsers, getUser } = require("../controllers/userController");

const router = express.Router();

router.get("/me", authenticate, (req, res) => {
    res.json({ status: "success", data: req.user });
});
router.put("/me", authenticate, updateProfile);
router.put("/me/password", authenticate, changePassword);
router.get("/", authenticate, authorizeRoles("admin"), listUsers);
router.get("/:id", authenticate, authorizeRoles("admin"), getUser);

module.exports = router;
