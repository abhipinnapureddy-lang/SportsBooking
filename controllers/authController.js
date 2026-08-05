const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const db = require("../config/db");
const { validateBody, validateEmail, validatePassword, validatePhone } = require("../utils/validators");

const createEmailTransporter = () => {
    if (!process.env.MAIL_HOST || !process.env.MAIL_PORT || !process.env.MAIL_USER || !process.env.MAIL_PASS) {
        return null;
    }

    return nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: Number(process.env.MAIL_PORT),
        secure: process.env.MAIL_SECURE === "true",
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
        },
    });
};

const sendEmail = async ({ to, subject, text, html }) => {
    const transporter = createEmailTransporter();
    if (!transporter) {
        console.warn("Email not sent because SMTP is not configured.");
        console.warn(`To: ${to}`);
        console.warn(text);
        return;
    }

    const fromAddress = process.env.MAIL_FROM || `"Smart Campus" <no-reply@${process.env.MAIL_HOST || "localhost"}>`;
    await transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        text,
        html,
    });
};

const sendVerificationEmail = async (toEmail, userName, verifyUrl) => {
    const subject = "Confirm your Smart Campus account";
    const text = `Hello ${userName},\n\nThank you for creating a Smart Campus account. Confirm your email by opening the link below:\n${verifyUrl}\n\nIf you did not create this account, you can ignore this message.`;
    const html = `
        <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#334155;line-height:1.6;">
            <h1 style="color:#0f172a;">Confirm your email</h1>
            <p>Hello ${userName},</p>
            <p>Thanks for signing up for Smart Campus. Click the button below to verify your email address and activate your account.</p>
            <p><a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;border-radius:9999px;background:#0f172a;color:#ffffff;text-decoration:none;">Verify your email</a></p>
            <p>If the button does not work, paste this link into your browser:</p>
            <p><a href="${verifyUrl}" style="color:#2563eb;">${verifyUrl}</a></p>
            <p>If you did not register, simply ignore this email.</p>
        </div>
    `;

    await sendEmail({ to: toEmail, subject, text, html });
};

const sendPasswordResetEmail = async (toEmail, userName, resetUrl) => {
    const subject = "Reset your Smart Campus password";
    const text = `Hello ${userName},\n\nTo reset your password, open the following link:\n${resetUrl}\n\nIf you did not request this, please ignore this email.`;
    const html = `
        <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#334155;line-height:1.6;">
            <h1 style="color:#0f172a;">Reset your password</h1>
            <p>Hello ${userName},</p>
            <p>Use the button below to choose a new password for your Smart Campus account.</p>
            <p><a href="${resetUrl}" style="display:inline-block;padding:12px 24px;border-radius:9999px;background:#0f172a;color:#ffffff;text-decoration:none;">Reset password</a></p>
            <p>If the button does not work, paste this link into your browser:</p>
            <p><a href="${resetUrl}" style="color:#2563eb;">${resetUrl}</a></p>
            <p>If you did not request this password reset, you can ignore this email.</p>
        </div>
    `;

    await sendEmail({ to: toEmail, subject, text, html });
};

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const createAccessToken = (userId) => {
    return jwt.sign(
        { id: userId, type: "access" },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );
};

const createRefreshToken = (userId) => {
    return jwt.sign(
        { id: userId, type: "refresh" },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" }
    );
};

const validateRefreshToken = (refreshToken) => {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    if (decoded.type !== "refresh") {
        throw new Error("Invalid refresh token type");
    }
    return decoded;
};

const storeRefreshToken = async (userId, refreshToken, userAgent = null, ipAddress = null) => {
    const tokenHash = hashToken(refreshToken);
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    const expiresAt = new Date(decoded.exp * 1000);

    await db.promise().query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE revoked = 0, expires_at = VALUES(expires_at), user_agent = VALUES(user_agent), ip_address = VALUES(ip_address)`,
        [userId, tokenHash, expiresAt, userAgent, ipAddress]
    );
};

const register = async (req, res, next) => {
    try {
        let { name, email, password, phone } = req.body;
        const roleName = "customer";

        const errors = validateBody(["name", "email", "password"], req.body);
        if (errors.length) {
            return res.status(400).json({ status: "error", message: "Validation failed", errors });
        }

        name = String(name || "").trim();
        email = String(email || "").trim().toLowerCase();
        phone = phone !== undefined && phone !== null ? String(phone).trim() : null;

        if (!validateEmail(email)) {
            return res.status(400).json({ status: "error", message: "Invalid email address" });
        }

        if (phone && !validatePhone(phone)) {
            return res.status(400).json({ status: "error", message: "Phone must be a valid number format." });
        }

        if (!validatePassword(password, { minLength: 8, requireLettersAndNumbers: true })) {
            return res.status(400).json({ status: "error", message: "Password must be at least 8 characters and include letters and numbers." });
        }

        const [existing] = await db.promise().query("SELECT id FROM users WHERE email = ?", [email]);
        if (existing.length > 0) {
            return res.status(409).json({ status: "error", message: "Email already registered" });
        }

        const [roleRows] = await db.promise().query("SELECT id FROM roles WHERE name = ?", [roleName]);
        const roleId = roleRows.length ? roleRows[0].id : 3;

        const password_hash = await bcrypt.hash(password, 10);
        const [result] = await db.promise().query(
            `INSERT INTO users (role_id, name, email, password_hash, phone)
             VALUES (?, ?, ?, ?, ?)`,
            [roleId, name, email, password_hash, phone || null]
        );

        const verificationToken = jwt.sign({ id: result.insertId }, process.env.JWT_SECRET, { expiresIn: "1d" });
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const verifyUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

        await sendVerificationEmail(email, name || "student", verifyUrl);

        res.status(201).json({
            status: "success",
            message: "Account created. Check your email to verify your address before signing in."
        });
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        let { email, password } = req.body;
        const errors = validateBody(["email", "password"], req.body);
        if (errors.length) {
            return res.status(400).json({ status: "error", message: "Validation failed", errors });
        }

        email = String(email || "").trim().toLowerCase();

        const [rows] = await db.promise().query(
            `SELECT u.id, u.password_hash, u.email_verified, r.name AS role, u.name, u.phone
             FROM users u
             JOIN roles r ON u.role_id = r.id
             WHERE u.email = ?`,
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({ status: "error", message: "Invalid credentials" });
        }

        const user = rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({ status: "error", message: "Invalid credentials" });
        }

        if (!user.email_verified) {
            return res.status(403).json({ status: "error", message: "Please verify your email address before signing in." });
        }

        const accessToken = createAccessToken(user.id);
        const refreshToken = createRefreshToken(user.id);
        await storeRefreshToken(user.id, refreshToken, req.headers["user-agent"] || null, req.ip || null);

        res.json({
            status: "success",
            data: {
                user: { id: user.id, name: user.name, email, phone: user.phone, role: user.role },
                token: accessToken,
                refreshToken
            }
        });
    } catch (error) {
        next(error);
    }
};

const forgotPassword = async (req, res, next) => {
    try {
        let { email } = req.body;
        const errors = validateBody(["email"], req.body);
        if (errors.length) {
            return res.status(400).json({ status: "error", message: "Validation failed", errors });
        }

        email = String(email || "").trim().toLowerCase();
        if (!validateEmail(email)) {
            return res.status(400).json({ status: "error", message: "Invalid email address" });
        }

        const [rows] = await db.promise().query("SELECT id, name FROM users WHERE email = ?", [email]);
        if (rows.length === 0) {
            return res.json({ status: "success", message: "If the email exists, password reset instructions have been sent." });
        }

        const user = rows[0];
        const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

        await sendPasswordResetEmail(user.email, user.name || "student", resetUrl);

        res.json({
            status: "success",
            message: "If the email exists, password reset instructions have been sent."
        });
    } catch (error) {
        next(error);
    }
};

const resetPassword = async (req, res, next) => {
    try {
        const { token, password } = req.body;
        const errors = validateBody(["token", "password"], req.body);
        if (errors.length) {
            return res.status(400).json({ status: "error", message: "Validation failed", errors });
        }

        if (!validatePassword(password, { minLength: 8, requireLettersAndNumbers: true })) {
            return res.status(400).json({ status: "error", message: "Password must be at least 8 characters and include letters and numbers." });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(400).json({ status: "error", message: "Reset link is invalid or expired." });
        }

        const [rows] = await db.promise().query("SELECT id FROM users WHERE id = ?", [decoded.id]);
        if (rows.length === 0) {
            return res.status(404).json({ status: "error", message: "User not found" });
        }

        const password_hash = await bcrypt.hash(password, 10);
        await db.promise().query("UPDATE users SET password_hash = ? WHERE id = ?", [password_hash, decoded.id]);

        res.json({ status: "success", message: "Your password has been reset successfully." });
    } catch (error) {
        next(error);
    }
};

const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        const errors = validateBody(["refreshToken"], req.body);
        if (errors.length) {
            return res.status(400).json({ status: "error", message: "Validation failed", errors });
        }

        let decoded;
        try {
            decoded = validateRefreshToken(refreshToken);
        } catch (err) {
            return res.status(401).json({ status: "error", message: "Refresh token is invalid or expired." });
        }

        const tokenHash = hashToken(refreshToken);
        const [rows] = await db.promise().query(
            `SELECT id, user_id, revoked, expires_at FROM refresh_tokens WHERE token_hash = ?`,
            [tokenHash]
        );

        if (rows.length === 0 || rows[0].revoked) {
            return res.status(401).json({ status: "error", message: "Refresh token is invalid or expired." });
        }

        if (new Date(rows[0].expires_at) <= new Date()) {
            return res.status(401).json({ status: "error", message: "Refresh token has expired." });
        }

        await db.promise().query(`UPDATE refresh_tokens SET revoked = 1 WHERE id = ?`, [rows[0].id]);

        const accessToken = createAccessToken(decoded.id);
        const newRefreshToken = createRefreshToken(decoded.id);
        await storeRefreshToken(decoded.id, newRefreshToken, req.headers["user-agent"] || null, req.ip || null);

        res.json({
            status: "success",
            data: {
                token: accessToken,
                refreshToken: newRefreshToken
            }
        });
    } catch (error) {
        next(error);
    }
};

const logout = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        const errors = validateBody(["refreshToken"], req.body);
        if (errors.length) {
            return res.status(400).json({ status: "error", message: "Validation failed", errors });
        }

        const tokenHash = hashToken(refreshToken);
        await db.promise().query(`UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ?`, [tokenHash]);

        res.json({ status: "success", message: "Logged out successfully." });
    } catch (error) {
        next(error);
    }
};

const verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.body;
        const errors = validateBody(["token"], req.body);
        if (errors.length) {
            return res.status(400).json({ status: "error", message: "Validation failed", errors });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(400).json({ status: "error", message: "Verification link is invalid or expired." });
        }

        const [rows] = await db.promise().query("SELECT id, email_verified FROM users WHERE id = ?", [decoded.id]);
        if (rows.length === 0) {
            return res.status(404).json({ status: "error", message: "User not found." });
        }

        if (rows[0].email_verified) {
            return res.json({ status: "success", message: "Email already verified." });
        }

        await db.promise().query("UPDATE users SET email_verified = 1 WHERE id = ?", [decoded.id]);
        res.json({ status: "success", message: "Your email has been verified. You can now sign in." });
    } catch (error) {
        next(error);
    }
};

const me = async (req, res, next) => {
    try {
        res.json({ status: "success", data: { user: req.user } });
    } catch (error) {
        next(error);
    }
};

module.exports = { register, login, forgotPassword, resetPassword, refreshToken, logout, verifyEmail, me };