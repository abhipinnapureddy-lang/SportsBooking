const db = require('../config/db');

const listInventory = async (req, res, next) => {
    try {
        const [inventory] = await db.promise().query(
            `SELECT i.*, e.name AS equipment_name, e.category AS equipment_category
             FROM inventory i
             JOIN equipment e ON i.equipment_id = e.id
             ORDER BY i.created_at DESC`
        );
        res.json({ status: 'success', data: inventory });
    } catch (error) {
        next(error);
    }
};

const createInventoryEntry = async (req, res, next) => {
    try {
        const { equipment_id, transaction_type, quantity, balance, reference, notes } = req.body;
        if (!equipment_id || !transaction_type || !Number.isInteger(Number(quantity)) || !Number.isInteger(Number(balance))) {
            return res.status(400).json({ status: 'error', message: 'Missing or invalid inventory fields' });
        }

        const [equipmentRows] = await db.promise().query(`SELECT id FROM equipment WHERE id = ?`, [equipment_id]);
        if (!equipmentRows.length) {
            return res.status(404).json({ status: 'error', message: 'Equipment not found' });
        }

        const [result] = await db.promise().query(
            `INSERT INTO inventory (equipment_id, transaction_type, quantity, balance, reference, notes)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [equipment_id, transaction_type, Number(quantity), Number(balance), reference || null, notes || null]
        );

        const [[entry]] = await db.promise().query(`SELECT * FROM inventory WHERE id = ?`, [result.insertId]);
        res.status(201).json({ status: 'success', data: entry });
    } catch (error) {
        next(error);
    }
};

module.exports = { listInventory, createInventoryEntry };