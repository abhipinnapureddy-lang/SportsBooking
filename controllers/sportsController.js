const db = require('../config/db');
const { validateBody, validateEnum } = require('../utils/validators');
const { buildUpdateFields, buildSearchQuery } = require('../utils/dbHelpers');

const allowedStatuses = ['active', 'inactive'];

const listSports = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    const filters = [];
    const values = [];

    if (search) {
      filters.push('(name LIKE ? OR description LIKE ?)');
      values.push(`%${search}%`, `%${search}%`);
    }
    if (status) {
      filters.push('status = ?');
      values.push(status);
    }

    const where = buildSearchQuery(filters);
    const [sports] = await db.promise().query(
      `SELECT id, name, description, status, created_at, updated_at
       FROM sports
       ${where}
       ORDER BY name ASC`,
      values
    );

    res.json({ status: 'success', data: sports });
  } catch (error) {
    next(error);
  }
};

const getSport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [[sport]] = await db.promise().query(
      `SELECT id, name, description, status, created_at, updated_at
       FROM sports
       WHERE id = ?`,
      [id]
    );

    if (!sport) {
      return res.status(404).json({ status: 'error', message: 'Sport not found' });
    }

    res.json({ status: 'success', data: sport });
  } catch (error) {
    next(error);
  }
};

const createSport = async (req, res, next) => {
  try {
    const { name, description, status } = req.body;
    const errors = validateBody(['name'], req.body);
    if (errors.length) {
      return res.status(400).json({ status: 'error', message: 'Validation failed', errors });
    }

    if (status !== undefined && !validateEnum(status, allowedStatuses)) {
      return res.status(400).json({ status: 'error', message: 'Status must be active or inactive' });
    }

    const [existing] = await db.promise().query(`SELECT id FROM sports WHERE name = ?`, [name.trim()]);
    if (existing.length) {
      return res.status(409).json({ status: 'error', message: 'Sport name already exists' });
    }

    const [result] = await db.promise().query(
      `INSERT INTO sports (name, description, status) VALUES (?, ?, ?)`,
      [name.trim(), description || null, status || 'active']
    );

    const [[sport]] = await db.promise().query(`SELECT id, name, description, status, created_at, updated_at FROM sports WHERE id = ?`, [result.insertId]);
    res.status(201).json({ status: 'success', data: sport });
  } catch (error) {
    next(error);
  }
};

const updateSport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ status: 'error', message: 'No sport data provided for update' });
    }

    if (updates.status !== undefined && updates.status !== null && !validateEnum(updates.status, allowedStatuses)) {
      return res.status(400).json({ status: 'error', message: 'Status must be active or inactive' });
    }

    const [[sport]] = await db.promise().query(`SELECT id FROM sports WHERE id = ?`, [id]);
    if (!sport) {
      return res.status(404).json({ status: 'error', message: 'Sport not found' });
    }

    if (updates.name !== undefined) {
      const [duplicate] = await db.promise().query(`SELECT id FROM sports WHERE name = ? AND id != ?`, [updates.name.trim(), id]);
      if (duplicate.length) {
        return res.status(409).json({ status: 'error', message: 'Sport name already exists' });
      }
    }

    const allowedFields = ['name', 'description', 'status'];
    const { fields, values } = buildUpdateFields(updates, allowedFields);
    if (!fields.length) {
      return res.status(400).json({ status: 'error', message: 'No valid sport updates provided' });
    }

    const normalizedValues = values.map((value, index) => {
      const field = fields[index].split(' = ')[0];
      if (field === 'name' && value !== undefined && value !== null) return value.trim();
      return value === undefined ? null : value;
    });

    normalizedValues.push(id);
    await db.promise().query(`UPDATE sports SET ${fields.join(', ')} WHERE id = ?`, normalizedValues);

    const [[updatedSport]] = await db.promise().query(`SELECT id, name, description, status, created_at, updated_at FROM sports WHERE id = ?`, [id]);
    res.json({ status: 'success', data: updatedSport });
  } catch (error) {
    next(error);
  }
};

const deleteSport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [[sport]] = await db.promise().query(`SELECT id FROM sports WHERE id = ?`, [id]);
    if (!sport) {
      return res.status(404).json({ status: 'error', message: 'Sport not found' });
    }

    await db.promise().query(`DELETE FROM sports WHERE id = ?`, [id]);
    res.json({ status: 'success', message: 'Sport deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { listSports, getSport, createSport, updateSport, deleteSport };
