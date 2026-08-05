const db = require("../config/db");
const { validateBody, validateNumber } = require("../utils/validators");
const { buildSearchQuery, normalizePagination } = require("../utils/dbHelpers");

const allowedStatuses = ["pending", "approved", "rejected", "inactive"];

const getVenues = async (req, res, next) => {
    try {
        const { sport_type, city, search, page, limit } = req.query;
        const { limit: safeLimit, offset } = normalizePagination(page, limit);
        const filters = ["v.status = 'approved'"];
        const values = [];

        if (sport_type) {
            filters.push("v.sport_type = ?");
            values.push(sport_type);
        }
        if (city) {
            filters.push("v.city LIKE ?");
            values.push(`%${city}%`);
        }
        if (search) {
            filters.push("(v.name LIKE ? OR v.description LIKE ?)");
            values.push(`%${search}%`, `%${search}%`);
        }

        const where = buildSearchQuery(filters);
        const [venues] = await db.promise().query(
            `SELECT v.id, v.name, v.sport_type, v.city, v.state, v.zip_code, v.status,
                    v.description, v.address
             FROM venues v
             ${where}
             ORDER BY v.created_at DESC
             LIMIT ? OFFSET ?`,
            [...values, safeLimit, offset]
        );

        res.json({ status: "success", data: venues });
    } catch (error) {
        next(error);
    }
};

const getVenue = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [[venue]] = await db.promise().query(
            `SELECT v.*, u.name AS owner_name, u.email AS owner_email
             FROM venues v
             JOIN users u ON v.owner_id = u.id
             WHERE v.id = ?`,
            [id]
        );
        if (!venue) {
            return res.status(404).json({ status: "error", message: "Venue not found" });
        }

        const [courts] = await db.promise().query(
            `SELECT * FROM courts WHERE venue_id = ?`,
            [id]
        );

        res.json({ status: "success", data: { venue, courts } });
    } catch (error) {
        next(error);
    }
};

const createVenue = async (req, res, next) => {
    try {
        const { name, description, sport_type, address, city, state, zip_code, latitude, longitude } = req.body;
        const errors = validateBody(["name", "sport_type", "address", "city"], req.body);
        if (errors.length) {
            return res.status(400).json({ status: "error", message: "Validation failed", errors });
        }

        if (!validateNumber(latitude, { min: -90, max: 90 })) {
            return res.status(400).json({ status: "error", message: "Invalid latitude value" });
        }
        if (!validateNumber(longitude, { min: -180, max: 180 })) {
            return res.status(400).json({ status: "error", message: "Invalid longitude value" });
        }

        const [result] = await db.promise().query(
            `INSERT INTO venues (owner_id, name, description, sport_type, address, city, state, zip_code, latitude, longitude)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [req.user.id, name.trim(), description || null, sport_type.trim(), address.trim(), city.trim(), state || null, zip_code || null, latitude || null, longitude || null]
        );

        const [[venue]] = await db.promise().query(`SELECT * FROM venues WHERE id = ?`, [result.insertId]);
        res.status(201).json({ status: "success", data: venue });
    } catch (error) {
        next(error);
    }
};

const updateVenue = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const [[venue]] = await db.promise().query(`SELECT * FROM venues WHERE id = ?`, [id]);
        if (!venue) {
            return res.status(404).json({ status: "error", message: "Venue not found" });
        }
        if (req.user.role !== "admin" && venue.owner_id !== req.user.id) {
            return res.status(403).json({ status: "error", message: "Forbidden" });
        }

        if (updates.latitude !== undefined && !validateNumber(updates.latitude, { min: -90, max: 90 })) {
            return res.status(400).json({ status: "error", message: "Invalid latitude value" });
        }
        if (updates.longitude !== undefined && !validateNumber(updates.longitude, { min: -180, max: 180 })) {
            return res.status(400).json({ status: "error", message: "Invalid longitude value" });
        }

        const fields = [];
        const values = [];
        ["name", "description", "sport_type", "address", "city", "state", "zip_code", "latitude", "longitude", "status"].forEach((key) => {
            if (Object.prototype.hasOwnProperty.call(updates, key)) {
                fields.push(`${key} = ?`);
                values.push(updates[key] === undefined ? null : updates[key]);
            }
        });

        if (!fields.length) {
            return res.status(400).json({ status: "error", message: "No valid venue updates provided" });
        }

        values.push(id);
        await db.promise().query(`UPDATE venues SET ${fields.join(', ')} WHERE id = ?`, values);
        const [[updatedVenue]] = await db.promise().query(`SELECT * FROM venues WHERE id = ?`, [id]);
        res.json({ status: "success", data: updatedVenue });
    } catch (error) {
        next(error);
    }
};

const deleteVenue = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [[venue]] = await db.promise().query(`SELECT * FROM venues WHERE id = ?`, [id]);
        if (!venue) {
            return res.status(404).json({ status: "error", message: "Venue not found" });
        }
        if (req.user.role !== "admin" && venue.owner_id !== req.user.id) {
            return res.status(403).json({ status: "error", message: "Forbidden" });
        }

        await db.promise().query(`DELETE FROM venues WHERE id = ?`, [id]);
        res.json({ status: "success", message: "Venue deleted" });
    } catch (error) {
        next(error);
    }
};

module.exports = { getVenues, getVenue, createVenue, updateVenue, deleteVenue };