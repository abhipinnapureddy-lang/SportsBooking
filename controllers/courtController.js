const db = require("../config/db");
const { validateBody, validateNumber, validateInteger } = require("../utils/validators");
const { buildUpdateFields } = require("../utils/dbHelpers");

const allowedStatuses = ["available", "active", "inactive", "maintenance"];

const getCourtsByVenue = async (req, res, next) => {
    try {
        const { venueId } = req.params;
        const [courts] = await db.promise().query(`SELECT * FROM courts WHERE venue_id = ?`, [venueId]);
        res.json({ status: "success", data: courts });
    } catch (error) {
        next(error);
    }
};

const getCourt = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [[court]] = await db.promise().query(`SELECT * FROM courts WHERE id = ?`, [id]);
        if (!court) {
            return res.status(404).json({ status: "error", message: "Court not found" });
        }
        res.json({ status: "success", data: court });
    } catch (error) {
        next(error);
    }
};

const createCourt = async (req, res, next) => {
    try {
        const { venueId } = req.params;
        const { name, court_type, price_per_hour, max_players, features, status } = req.body;
        const errors = validateBody(["name", "court_type", "price_per_hour"], req.body);
        if (errors.length) {
            return res.status(400).json({ status: "error", message: "Validation failed", errors });
        }

        if (!validateNumber(price_per_hour, { min: 0 })) {
            return res.status(400).json({ status: "error", message: "price_per_hour must be a valid number" });
        }
        if (max_players !== undefined && !validateInteger(max_players, { min: 1 })) {
            return res.status(400).json({ status: "error", message: "max_players must be a positive integer" });
        }
        if (status !== undefined && !allowedStatuses.includes(status)) {
            return res.status(400).json({ status: "error", message: `status must be one of: ${allowedStatuses.join(', ')}` });
        }

        const [venueRows] = await db.promise().query(`SELECT * FROM venues WHERE id = ?`, [venueId]);
        const venue = venueRows[0];
        if (!venue) {
            return res.status(404).json({ status: "error", message: "Venue not found" });
        }
        if (req.user.role !== "admin" && venue.owner_id !== req.user.id) {
            return res.status(403).json({ status: "error", message: "Forbidden" });
        }

        const [result] = await db.promise().query(
            `INSERT INTO courts (venue_id, name, court_type, price_per_hour, max_players, features, status)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [venueId, name.trim(), court_type.trim(), Number(price_per_hour), max_players !== undefined ? Number(max_players) : 1, features || null, status || "available"]
        );

        const [[court]] = await db.promise().query(`SELECT * FROM courts WHERE id = ?`, [result.insertId]);
        res.status(201).json({ status: "success", data: court });
    } catch (error) {
        next(error);
    }
};

const updateCourt = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const [[court]] = await db.promise().query(`SELECT * FROM courts WHERE id = ?`, [id]);
        if (!court) {
            return res.status(404).json({ status: "error", message: "Court not found" });
        }

        const [venueRows] = await db.promise().query(`SELECT owner_id FROM venues WHERE id = ?`, [court.venue_id]);
        const venue = venueRows[0];
        if (!venue) {
            return res.status(404).json({ status: "error", message: "Venue not found" });
        }
        if (req.user.role !== "admin" && venue.owner_id !== req.user.id) {
            return res.status(403).json({ status: "error", message: "Forbidden" });
        }

        if (updates.price_per_hour !== undefined && !validateNumber(updates.price_per_hour, { min: 0 })) {
            return res.status(400).json({ status: "error", message: "price_per_hour must be a valid number" });
        }
        if (updates.max_players !== undefined && !validateInteger(updates.max_players, { min: 1 })) {
            return res.status(400).json({ status: "error", message: "max_players must be a positive integer" });
        }
        if (updates.status !== undefined && !allowedStatuses.includes(updates.status)) {
            return res.status(400).json({ status: "error", message: `status must be one of: ${allowedStatuses.join(', ')}` });
        }

        const allowedFields = ["name", "court_type", "price_per_hour", "max_players", "features", "status"];
        const { fields, values } = buildUpdateFields(updates, allowedFields);
        if (!fields.length) {
            return res.status(400).json({ status: "error", message: "No valid court updates provided" });
        }

        const normalizedValues = values.map((value, index) => {
            const field = fields[index].split(' = ')[0];
            if (field === 'price_per_hour') return Number(value);
            if (field === 'max_players') return Number(value);
            return value === undefined ? null : value;
        });

        normalizedValues.push(id);
        await db.promise().query(`UPDATE courts SET ${fields.join(', ')} WHERE id = ?`, normalizedValues);
        const [[updatedCourt]] = await db.promise().query(`SELECT * FROM courts WHERE id = ?`, [id]);
        res.json({ status: "success", data: updatedCourt });
    } catch (error) {
        next(error);
    }
};

const deleteCourt = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [[court]] = await db.promise().query(`SELECT * FROM courts WHERE id = ?`, [id]);
        if (!court) {
            return res.status(404).json({ status: "error", message: "Court not found" });
        }

        const [venueRows] = await db.promise().query(`SELECT owner_id FROM venues WHERE id = ?`, [court.venue_id]);
        const venue = venueRows[0];
        if (!venue) {
            return res.status(404).json({ status: "error", message: "Venue not found" });
        }
        if (req.user.role !== "admin" && venue.owner_id !== req.user.id) {
            return res.status(403).json({ status: "error", message: "Forbidden" });
        }

        await db.promise().query(`DELETE FROM courts WHERE id = ?`, [id]);
        res.json({ status: "success", message: "Court deleted" });
    } catch (error) {
        next(error);
    }
};

module.exports = { getCourtsByVenue, getCourt, createCourt, updateCourt, deleteCourt };