const db = require('../config/db');
const { validateBody, validateNumber, validateInteger, validateEnum } = require('../utils/validators');
const { buildUpdateFields, buildSearchQuery, normalizePagination } = require('../utils/dbHelpers');

const allowedStatuses = ['pending', 'approved', 'rejected', 'inactive'];

const getGrounds = async (req, res, next) => {
    try {
        const { sport_id, city, venue_id, search, status = 'approved', page, limit } = req.query;
        const { limit: safeLimit, offset } = normalizePagination(page, limit);
        const filters = ['g.status = ?'];
        const values = [status];

        if (sport_id !== undefined) {
            filters.push('g.sport_id = ?');
            values.push(sport_id);
        }
        if (venue_id !== undefined) {
            filters.push('g.venue_id = ?');
            values.push(venue_id);
        }
        if (city) {
            filters.push('g.city LIKE ?');
            values.push(`%${city}%`);
        }
        if (search) {
            filters.push('(g.name LIKE ? OR g.description LIKE ?)');
            values.push(`%${search}%`, `%${search}%`);
        }

        const where = buildSearchQuery(filters);
        const [grounds] = await db.promise().query(
            `SELECT g.*, s.name AS sport_name, v.name AS venue_name, u.name AS coordinator_name
             FROM grounds g
             JOIN sports s ON g.sport_id = s.id
             LEFT JOIN venues v ON g.venue_id = v.id
             LEFT JOIN users u ON g.coordinator_id = u.id
             ${where}
             ORDER BY g.created_at DESC
             LIMIT ? OFFSET ?`,
            [...values, safeLimit, offset]
        );

        res.json({ status: 'success', data: grounds });
    } catch (error) {
        next(error);
    }
};

const getGround = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [[ground]] = await db.promise().query(
            `SELECT g.*, s.name AS sport_name, v.name AS venue_name, v.owner_id, u.name AS coordinator_name, u.email AS coordinator_email
             FROM grounds g
             JOIN sports s ON g.sport_id = s.id
             LEFT JOIN venues v ON g.venue_id = v.id
             LEFT JOIN users u ON g.coordinator_id = u.id
             WHERE g.id = ?`,
            [id]
        );
        if (!ground) {
            return res.status(404).json({ status: 'error', message: 'Ground not found' });
        }

        const [slots] = await db.promise().query(`SELECT * FROM slots WHERE ground_id = ? ORDER BY start_time ASC`, [id]);
        res.json({ status: 'success', data: { ground, slots } });
    } catch (error) {
        next(error);
    }
};

const createGround = async (req, res, next) => {
    try {
        const { sport_id, venue_id, coordinator_id, name, description, address, city, state, zip_code, latitude, longitude, status } = req.body;
        const errors = validateBody(['sport_id', 'venue_id', 'name', 'address', 'city'], req.body);
        if (errors.length) {
            return res.status(400).json({ status: 'error', message: 'Validation failed', errors });
        }

        if (!validateNumber(latitude, { min: -90, max: 90 })) {
            return res.status(400).json({ status: 'error', message: 'latitude must be a valid coordinate' });
        }
        if (!validateNumber(longitude, { min: -180, max: 180 })) {
            return res.status(400).json({ status: 'error', message: 'longitude must be a valid coordinate' });
        }
        if (status !== undefined && !validateEnum(status, allowedStatuses)) {
            return res.status(400).json({ status: 'error', message: `status must be one of: ${allowedStatuses.join(', ')}` });
        }

        const [[venue]] = await db.promise().query(`SELECT * FROM venues WHERE id = ?`, [venue_id]);
        if (!venue) {
            return res.status(404).json({ status: 'error', message: 'Venue not found' });
        }

        if (req.user.role !== 'admin' && venue.owner_id !== req.user.id) {
            return res.status(403).json({ status: 'error', message: 'Forbidden' });
        }

        const [result] = await db.promise().query(
            `INSERT INTO grounds (sport_id, coordinator_id, venue_id, name, description, address, city, state, zip_code, latitude, longitude, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [sport_id, coordinator_id || null, venue_id, name.trim(), description || null, address.trim(), city.trim(), state || null, zip_code || null, latitude || null, longitude || null, status || 'pending']
        );

        const [[ground]] = await db.promise().query(`SELECT * FROM grounds WHERE id = ?`, [result.insertId]);
        res.status(201).json({ status: 'success', data: ground });
    } catch (error) {
        next(error);
    }
};

const updateGround = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const [groundRows] = await db.promise().query(`SELECT g.*, v.owner_id FROM grounds g JOIN venues v ON g.venue_id = v.id WHERE g.id = ?`, [id]);
        const ground = groundRows[0];
        if (!ground) {
            return res.status(404).json({ status: 'error', message: 'Ground not found' });
        }
        if (req.user.role !== 'admin' && ground.owner_id !== req.user.id) {
            return res.status(403).json({ status: 'error', message: 'Forbidden' });
        }

        if (updates.latitude !== undefined && !validateNumber(updates.latitude, { min: -90, max: 90 })) {
            return res.status(400).json({ status: 'error', message: 'latitude must be a valid coordinate' });
        }
        if (updates.longitude !== undefined && !validateNumber(updates.longitude, { min: -180, max: 180 })) {
            return res.status(400).json({ status: 'error', message: 'longitude must be a valid coordinate' });
        }
        if (updates.status !== undefined && !validateEnum(updates.status, allowedStatuses)) {
            return res.status(400).json({ status: 'error', message: `status must be one of: ${allowedStatuses.join(', ')}` });
        }

        const allowedFields = ['sport_id', 'coordinator_id', 'venue_id', 'name', 'description', 'address', 'city', 'state', 'zip_code', 'latitude', 'longitude', 'status'];
        const { fields, values } = buildUpdateFields(updates, allowedFields);
        if (!fields.length) {
            return res.status(400).json({ status: 'error', message: 'No valid ground updates provided' });
        }

        values.push(id);
        await db.promise().query(`UPDATE grounds SET ${fields.join(', ')} WHERE id = ?`, values);
        const [[updatedGround]] = await db.promise().query(`SELECT * FROM grounds WHERE id = ?`, [id]);
        res.json({ status: 'success', data: updatedGround });
    } catch (error) {
        next(error);
    }
};

const deleteGround = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [groundRows] = await db.promise().query(`SELECT g.*, v.owner_id FROM grounds g JOIN venues v ON g.venue_id = v.id WHERE g.id = ?`, [id]);
        const ground = groundRows[0];
        if (!ground) {
            return res.status(404).json({ status: 'error', message: 'Ground not found' });
        }
        if (req.user.role !== 'admin' && ground.owner_id !== req.user.id) {
            return res.status(403).json({ status: 'error', message: 'Forbidden' });
        }

        await db.promise().query(`DELETE FROM grounds WHERE id = ?`, [id]);
        res.json({ status: 'success', message: 'Ground deleted' });
    } catch (error) {
        next(error);
    }
};

module.exports = { getGrounds, getGround, createGround, updateGround, deleteGround };