const db = require('../config/db');
const { validateBody, validateNumber, validateInteger, validateEnum } = require('../utils/validators');
const { buildUpdateFields, buildSearchQuery, normalizePagination } = require('../utils/dbHelpers');

const allowedStatuses = ['available', 'booked', 'reserved', 'cancelled'];

const canManageGround = async (user, ground_id) => {
    const [rows] = await db.promise().query(
        `SELECT g.*, v.owner_id
         FROM grounds g
         JOIN venues v ON g.venue_id = v.id
         WHERE g.id = ?`,
        [ground_id]
    );
    const ground = rows[0];
    if (!ground) {
        return null;
    }
    if (user.role === 'admin') {
        return ground;
    }
    if (user.role === 'owner' && ground.owner_id === user.id) {
        return ground;
    }
    if (user.role === 'coordinator' && ground.coordinator_id === user.id) {
        return ground;
    }
    return false;
};

const listSlots = async (req, res, next) => {
    try {
        const { ground_id, status = 'available', date, page, limit } = req.query;
        const { limit: safeLimit, offset } = normalizePagination(page, limit);
        const filters = ['s.status = ?'];
        const values = [status];

        if (ground_id !== undefined) {
            filters.push('s.ground_id = ?');
            values.push(ground_id);
        }
        if (date) {
            filters.push('DATE(s.start_time) = ?');
            values.push(date);
        }

        const where = buildSearchQuery(filters);
        const [slots] = await db.promise().query(
            `SELECT s.*, g.name AS ground_name, sp.name AS sport_name
             FROM slots s
             JOIN grounds g ON s.ground_id = g.id
             JOIN sports sp ON g.sport_id = sp.id
             ${where}
             ORDER BY s.start_time ASC
             LIMIT ? OFFSET ?`,
            [...values, safeLimit, offset]
        );

        res.json({ status: 'success', data: slots });
    } catch (error) {
        next(error);
    }
};

const getSlot = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [[slot]] = await db.promise().query(
            `SELECT s.*, g.name AS ground_name, sp.name AS sport_name
             FROM slots s
             JOIN grounds g ON s.ground_id = g.id
             JOIN sports sp ON g.sport_id = sp.id
             WHERE s.id = ?`,
            [id]
        );
        if (!slot) {
            return res.status(404).json({ status: 'error', message: 'Slot not found' });
        }

        res.json({ status: 'success', data: slot });
    } catch (error) {
        next(error);
    }
};

const createSlot = async (req, res, next) => {
    try {
        const { ground_id, start_time, end_time, price_per_hour, max_players, status } = req.body;
        const errors = validateBody(['ground_id', 'start_time', 'end_time', 'price_per_hour', 'max_players'], req.body);
        if (errors.length) {
            return res.status(400).json({ status: 'error', message: 'Validation failed', errors });
        }

        const startDate = new Date(start_time);
        const endDate = new Date(end_time);
        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || startDate >= endDate) {
            return res.status(400).json({ status: 'error', message: 'Invalid slot time range' });
        }
        if (!validateNumber(price_per_hour, { min: 0 })) {
            return res.status(400).json({ status: 'error', message: 'price_per_hour must be a valid number' });
        }
        if (!validateInteger(max_players, { min: 1 })) {
            return res.status(400).json({ status: 'error', message: 'max_players must be a positive integer' });
        }
        if (status !== undefined && !validateEnum(status, allowedStatuses)) {
            return res.status(400).json({ status: 'error', message: `status must be one of: ${allowedStatuses.join(', ')}` });
        }

        const permission = await canManageGround(req.user, ground_id);
        if (permission === null) {
            return res.status(404).json({ status: 'error', message: 'Ground not found' });
        }
        if (permission === false) {
            return res.status(403).json({ status: 'error', message: 'Forbidden' });
        }

        const [conflicts] = await db.promise().query(
            `SELECT id FROM slots WHERE ground_id = ? AND NOT (end_time <= ? OR start_time >= ?)`,
            [ground_id, start_time, end_time]
        );
        if (conflicts.length > 0) {
            return res.status(409).json({ status: 'error', message: 'Slot time conflicts with existing schedule' });
        }

        const [result] = await db.promise().query(
            `INSERT INTO slots (ground_id, start_time, end_time, price_per_hour, max_players, status)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [ground_id, start_time, end_time, Number(price_per_hour), Number(max_players), status || 'available']
        );

        const [[slot]] = await db.promise().query(`SELECT * FROM slots WHERE id = ?`, [result.insertId]);
        res.status(201).json({ status: 'success', data: slot });
    } catch (error) {
        next(error);
    }
};

const updateSlot = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const [[existingSlot]] = await db.promise().query(`SELECT * FROM slots WHERE id = ?`, [id]);
        if (!existingSlot) {
            return res.status(404).json({ status: 'error', message: 'Slot not found' });
        }

        const permission = await canManageGround(req.user, existingSlot.ground_id);
        if (permission === false) {
            return res.status(403).json({ status: 'error', message: 'Forbidden' });
        }

        if (updates.start_time !== undefined || updates.end_time !== undefined) {
            const start = updates.start_time ? new Date(updates.start_time) : new Date(existingSlot.start_time);
            const end = updates.end_time ? new Date(updates.end_time) : new Date(existingSlot.end_time);
            if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
                return res.status(400).json({ status: 'error', message: 'Invalid slot time range' });
            }
        }
        if (updates.price_per_hour !== undefined && !validateNumber(updates.price_per_hour, { min: 0 })) {
            return res.status(400).json({ status: 'error', message: 'price_per_hour must be a valid number' });
        }
        if (updates.max_players !== undefined && !validateInteger(updates.max_players, { min: 1 })) {
            return res.status(400).json({ status: 'error', message: 'max_players must be a positive integer' });
        }
        if (updates.status !== undefined && !validateEnum(updates.status, allowedStatuses)) {
            return res.status(400).json({ status: 'error', message: `status must be one of: ${allowedStatuses.join(', ')}` });
        }

        const allowedFields = ['start_time', 'end_time', 'price_per_hour', 'max_players', 'status'];
        const { fields, values } = buildUpdateFields(updates, allowedFields);
        if (!fields.length) {
            return res.status(400).json({ status: 'error', message: 'No valid slot updates provided' });
        }

        const normalizedValues = values.map((value, index) => {
            const field = fields[index].split(' = ')[0];
            if (field === 'price_per_hour') return Number(value);
            if (field === 'max_players') return Number(value);
            return value === undefined ? null : value;
        });

        normalizedValues.push(id);
        await db.promise().query(`UPDATE slots SET ${fields.join(', ')} WHERE id = ?`, normalizedValues);
        const [[updatedSlot]] = await db.promise().query(`SELECT * FROM slots WHERE id = ?`, [id]);
        res.json({ status: 'success', data: updatedSlot });
    } catch (error) {
        next(error);
    }
};

const deleteSlot = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [[existingSlot]] = await db.promise().query(`SELECT * FROM slots WHERE id = ?`, [id]);
        if (!existingSlot) {
            return res.status(404).json({ status: 'error', message: 'Slot not found' });
        }

        const permission = await canManageGround(req.user, existingSlot.ground_id);
        if (permission === false) {
            return res.status(403).json({ status: 'error', message: 'Forbidden' });
        }

        await db.promise().query(`DELETE FROM slots WHERE id = ?`, [id]);
        res.json({ status: 'success', message: 'Slot deleted' });
    } catch (error) {
        next(error);
    }
};

module.exports = { listSlots, getSlot, createSlot, updateSlot, deleteSlot };