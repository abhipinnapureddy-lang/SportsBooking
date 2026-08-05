const jwt = require("jsonwebtoken");
const db = require("../config/db");

const authenticate = async (req, res, next) => {
    try {
        const authorization = req.headers.authorization;
        if (!authorization || !authorization.startsWith("Bearer ")) {
            return res.status(401).json({ status: "error", message: "Authorization header missing" });
        }

        const token = authorization.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.type && decoded.type !== "access") {
            return res.status(401).json({ status: "error", message: "Invalid access token" });
        }

        const [rows] = await db.promise().query(
            `SELECT u.id, u.name, u.email, u.phone, u.roll_number, u.branch, u.semester, u.department, u.role_id, r.name as role
             FROM users u
             JOIN roles r ON u.role_id = r.id
             WHERE u.id = ?`,
            [decoded.id]
        );

        if (!rows || rows.length === 0) {
            return res.status(401).json({ status: "error", message: "User not found" });
        }

        req.user = rows[0];
        next();
    } catch (error) {
        return res.status(401).json({ status: "error", message: "Invalid or expired token" });
    }
};

const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ status: "error", message: "Unauthorized" });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ status: "error", message: "Forbidden" });
        }

        next();
    };
};

module.exports = { authenticate, authorizeRoles };
