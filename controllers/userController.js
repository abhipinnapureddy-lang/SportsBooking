const bcrypt = require("bcrypt");
const db = require("../config/db");
const { validateBody, validatePassword, validatePhone } = require("../utils/validators");

const updateProfile = async (req, res, next) => {
    try {
        const { name, phone, roll_number, branch, semester, department } = req.body;
        if ([name, phone, roll_number, branch, semester, department].every((value) => value === undefined)) {
            return res.status(400).json({ status: "error", message: "No profile data provided" });
        }

        if (name !== undefined && (!String(name).trim() || String(name).trim().length > 128)) {
            return res.status(400).json({ status: "error", message: "Name must be between 1 and 128 characters" });
        }
        if (!validatePhone(phone)) {
            return res.status(400).json({ status: "error", message: "Phone must be a valid number format." });
        }
        if (semester !== undefined && semester !== null && semester !== "" && (!Number.isInteger(Number(semester)) || Number(semester) < 1 || Number(semester) > 12)) {
            return res.status(400).json({ status: "error", message: "Semester must be a number between 1 and 12" });
        }

        const fields = [];
        const values = [];
        if (name !== undefined) {
            fields.push("name = ?");
            values.push(String(name).trim());
        }
        if (phone !== undefined) {
            fields.push("phone = ?");
            values.push(phone ? String(phone).trim() : null);
        }
        const textFields = { roll_number, branch, department };
        for (const [column, value] of Object.entries(textFields)) {
            if (value !== undefined) {
                if (value && String(value).trim().length > 128) {
                    return res.status(400).json({ status: "error", message: `${column.replace('_', ' ')} must be at most 128 characters` });
                }
                fields.push(`${column} = ?`);
                values.push(value ? String(value).trim() : null);
            }
        }
        if (semester !== undefined) {
            fields.push("semester = ?");
            values.push(semester === "" || semester === null ? null : Number(semester));
        }
        values.push(req.user.id);

        await db.promise().query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
        const [[user]] = await db.promise().query(`SELECT id, name, email, phone, roll_number, branch, semester, department FROM users WHERE id = ?`, [req.user.id]);
        res.json({ status: "success", data: user });
    } catch (error) {
        next(error);
    }
};

const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const errors = validateBody(["currentPassword", "newPassword"], req.body);
        if (errors.length) {
            return res.status(400).json({ status: "error", message: "Validation failed", errors });
        }
        if (!validatePassword(newPassword, { minLength: 8, requireLettersAndNumbers: true })) {
            return res.status(400).json({ status: "error", message: "New password must be at least 8 characters and include letters and numbers." });
        }

        const [[user]] = await db.promise().query(`SELECT password_hash FROM users WHERE id = ?`, [req.user.id]);
        if (!user) {
            return res.status(404).json({ status: "error", message: "User not found" });
        }

        const valid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!valid) {
            return res.status(401).json({ status: "error", message: "Current password is incorrect" });
        }

        const password_hash = await bcrypt.hash(newPassword, 10);
        await db.promise().query(`UPDATE users SET password_hash = ? WHERE id = ?`, [password_hash, req.user.id]);
        res.json({ status: "success", message: "Password updated" });
    } catch (error) {
        next(error);
    }
};

const listUsers = async (req, res, next) => {
    try {
        const [users] = await db.promise().query(
            `SELECT u.id, u.name, u.email, u.phone, r.name AS role, u.created_at
             FROM users u
             JOIN roles r ON u.role_id = r.id
             ORDER BY u.created_at DESC`
        );
        res.json({ status: "success", data: users });
    } catch (error) {
        next(error);
    }
};

const getUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [[user]] = await db.promise().query(
            `SELECT u.id, u.name, u.email, u.phone, r.name AS role, u.created_at
             FROM users u
             JOIN roles r ON u.role_id = r.id
             WHERE u.id = ?`,
            [id]
        );
        if (!user) {
            return res.status(404).json({ status: "error", message: "User not found" });
        }
        res.json({ status: "success", data: user });
    } catch (error) {
        next(error);
    }
};

module.exports = { updateProfile, changePassword, listUsers, getUser };
