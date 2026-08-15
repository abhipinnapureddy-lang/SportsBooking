const db = require('../config/db');
const { validateBody } = require('../utils/validators');

const allowedStatuses = ['available', 'unavailable'];
const allowedConditions = ['excellent', 'good', 'maintenance'];

const listEquipment = async (req, res, next) => {
  try {
    const { search, category, sport_id, status } = req.query;
    const filters = [];
    const values = [];
    if (search) { filters.push('(name LIKE ? OR category LIKE ? OR description LIKE ?)'); values.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    if (category) { filters.push('category = ?'); values.push(category); }
    if (sport_id) { filters.push('sport_id = ?'); values.push(sport_id); }
    if (status) { filters.push('status = ?'); values.push(status); }
    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const [items] = await db.promise().query(`SELECT * FROM equipment ${where} ORDER BY category ASC, name ASC`, values);
    res.json({ status: 'success', data: items });
  } catch (error) { next(error); }
};

const getEquipment = async (req, res, next) => {
  try {
    const [[item]] = await db.promise().query(`SELECT * FROM equipment WHERE id = ?`, [req.params.id]);
    if (!item) return res.status(404).json({ status: 'error', message: 'Equipment item not found' });
    res.json({ status: 'success', data: item });
  } catch (error) { next(error); }
};

const createEquipment = async (req, res, next) => {
  try {
    const { name, category, sport_id, description, available_quantity, item_condition, status } = req.body;
    const errors = validateBody(['name', 'category'], req.body);
    if (errors.length) return res.status(400).json({ status: 'error', message: 'Validation failed', errors });
    if (status && !allowedStatuses.includes(status)) return res.status(400).json({ status: 'error', message: 'Invalid equipment status' });
    if (item_condition && !allowedConditions.includes(item_condition)) return res.status(400).json({ status: 'error', message: 'Invalid item condition' });
    const quantity = Number(available_quantity ?? 0);
    if (!Number.isInteger(quantity) || quantity < 0) return res.status(400).json({ status: 'error', message: 'Available quantity must be a non-negative integer' });
    const [result] = await db.promise().query(`INSERT INTO equipment (name, category, sport_id, description, available_quantity, reserved_quantity, item_condition, status) VALUES (?, ?, ?, ?, ?, 0, ?, ?)`, [name.trim(), category.trim(), sport_id || null, description || null, quantity, item_condition || 'good', status || 'available']);
    const [[item]] = await db.promise().query(`SELECT * FROM equipment WHERE id = ?`, [result.insertId]);
    res.status(201).json({ status: 'success', data: item });
  } catch (error) { next(error); }
};

const updateEquipment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, category, sport_id, description, available_quantity, reserved_quantity, item_condition, status } = req.body;
    if ([name, category, sport_id, description, available_quantity, reserved_quantity, item_condition, status].every((v) => v === undefined)) return res.status(400).json({ status: 'error', message: 'No equipment data provided for update' });
    if (status !== undefined && !allowedStatuses.includes(status)) return res.status(400).json({ status: 'error', message: 'Invalid equipment status' });
    if (item_condition !== undefined && !allowedConditions.includes(item_condition)) return res.status(400).json({ status: 'error', message: 'Invalid item condition' });
    const [[existing]] = await db.promise().query(`SELECT id FROM equipment WHERE id = ?`, [id]);
    if (!existing) return res.status(404).json({ status: 'error', message: 'Equipment item not found' });
    const fields = [];
    const values = [];
    if (name !== undefined) { fields.push('name = ?'); values.push(name.trim()); }
    if (category !== undefined) { fields.push('category = ?'); values.push(category.trim()); }
    if (sport_id !== undefined) { fields.push('sport_id = ?'); values.push(sport_id || null); }
    if (description !== undefined) { fields.push('description = ?'); values.push(description || null); }
    if (available_quantity !== undefined) { fields.push('available_quantity = ?'); values.push(Number(available_quantity)); }
    if (reserved_quantity !== undefined) { fields.push('reserved_quantity = ?'); values.push(Number(reserved_quantity)); }
    if (item_condition !== undefined) { fields.push('item_condition = ?'); values.push(item_condition); }
    if (status !== undefined) { fields.push('status = ?'); values.push(status); }
    values.push(id);
    await db.promise().query(`UPDATE equipment SET ${fields.join(', ')} WHERE id = ?`, values);
    const [[item]] = await db.promise().query(`SELECT * FROM equipment WHERE id = ?`, [id]);
    res.json({ status: 'success', data: item });
  } catch (error) { next(error); }
};

const deleteEquipment = async (req, res, next) => {
  try {
    const [[item]] = await db.promise().query(`SELECT id FROM equipment WHERE id = ?`, [req.params.id]);
    if (!item) return res.status(404).json({ status: 'error', message: 'Equipment item not found' });
    await db.promise().query(`DELETE FROM equipment WHERE id = ?`, [req.params.id]);
    res.json({ status: 'success', message: 'Equipment deleted' });
  } catch (error) { next(error); }
};

const listMyReservations = async (req, res, next) => {
  try {
    const [reservations] = await db.promise().query(`SELECT r.*, e.name AS equipment_name, e.category FROM equipment_reservations r JOIN equipment e ON e.id = r.equipment_id WHERE r.user_id = ? ORDER BY r.created_at DESC`, [req.user.id]);
    res.json({ status: 'success', data: reservations });
  } catch (error) { next(error); }
};

const reserveEquipment = async (req, res, next) => {
  const connection = await db.promise().getConnection();
  try {
    const { equipment_id, quantity, pickup_date, return_date } = req.body;
    const amount = Number(quantity);
    if (!equipment_id || !Number.isInteger(amount) || amount < 1 || !pickup_date || !return_date || new Date(pickup_date) > new Date(return_date)) return res.status(400).json({ status: 'error', message: 'Enter a valid equipment reservation.' });
    await connection.beginTransaction();
    const [updated] = await connection.query(`UPDATE equipment SET available_quantity = available_quantity - ?, reserved_quantity = reserved_quantity + ? WHERE id = ? AND status = 'available' AND available_quantity >= ?`, [amount, amount, equipment_id, amount]);
    if (!updated.affectedRows) { await connection.rollback(); return res.status(409).json({ status: 'error', message: 'Requested equipment is no longer available in that quantity.' }); }
    const [result] = await connection.query(`INSERT INTO equipment_reservations (user_id, equipment_id, quantity, pickup_date, return_date) VALUES (?, ?, ?, ?, ?)`, [req.user.id, equipment_id, amount, pickup_date, return_date]);
    const [[item]] = await connection.query(`SELECT name FROM equipment WHERE id = ?`, [equipment_id]);
    await connection.query(`INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'success')`, [req.user.id, 'Equipment reservation received', `${amount} × ${item.name} is reserved for collection on ${pickup_date}.`]);
    await connection.commit();
    res.status(201).json({ status: 'success', data: { id: result.insertId }, message: 'Equipment reserved successfully.' });
  } catch (error) { await connection.rollback(); next(error); } finally { connection.release(); }
};

const cancelReservation = async (req, res, next) => {
  const connection = await db.promise().getConnection();
  try {
    await connection.beginTransaction();
    const [[reservation]] = await connection.query(`SELECT * FROM equipment_reservations WHERE id = ? AND user_id = ? FOR UPDATE`, [req.params.id, req.user.id]);
    if (!reservation) { await connection.rollback(); return res.status(404).json({ status: 'error', message: 'Reservation not found.' }); }
    if (!['pending', 'approved'].includes(reservation.status)) { await connection.rollback(); return res.status(400).json({ status: 'error', message: 'This reservation cannot be cancelled.' }); }
    await connection.query(`UPDATE equipment_reservations SET status = 'cancelled' WHERE id = ?`, [reservation.id]);
    await connection.query(`UPDATE equipment SET available_quantity = available_quantity + ?, reserved_quantity = GREATEST(reserved_quantity - ?, 0) WHERE id = ?`, [reservation.quantity, reservation.quantity, reservation.equipment_id]);
    await connection.commit();
    res.json({ status: 'success', message: 'Equipment reservation cancelled.' });
  } catch (error) { await connection.rollback(); next(error); } finally { connection.release(); }
};

const qrAction = async (req, res, next) => {
  const connection = await db.promise().getConnection();
  try {
    const { reservation_id, action } = req.body;
    if (!reservation_id || !['issue', 'return'].includes(action)) return res.status(400).json({ status: 'error', message: 'QR action must be issue or return.' });
    await connection.beginTransaction();
    const [[reservation]] = await connection.query(`SELECT r.*, e.name AS equipment_name FROM equipment_reservations r JOIN equipment e ON e.id = r.equipment_id WHERE r.id = ? FOR UPDATE`, [reservation_id]);
    if (!reservation) { await connection.rollback(); return res.status(404).json({ status: 'error', message: 'Reservation not found.' }); }
    if (action === 'issue') {
      if (reservation.status !== 'pending') { await connection.rollback(); return res.status(409).json({ status: 'error', message: 'Only pending reservations can be issued.' }); }
      await connection.query(`UPDATE equipment_reservations SET status = 'approved' WHERE id = ?`, [reservation.id]);
      await connection.query(`INSERT INTO notifications (user_id, title, message, type) VALUES (?, 'Equipment ready', ?, 'success')`, [reservation.user_id, `${reservation.equipment_name} has been issued to you.`]);
    } else {
      if (reservation.status !== 'approved') { await connection.rollback(); return res.status(409).json({ status: 'error', message: 'Only issued equipment can be returned.' }); }
      await connection.query(`UPDATE equipment_reservations SET status = 'returned' WHERE id = ?`, [reservation.id]);
      await connection.query(`UPDATE equipment SET available_quantity = available_quantity + ?, reserved_quantity = GREATEST(reserved_quantity - ?, 0) WHERE id = ?`, [reservation.quantity, reservation.quantity, reservation.equipment_id]);
      await connection.query(`INSERT INTO notifications (user_id, title, message, type) VALUES (?, 'Equipment returned', ?, 'success')`, [reservation.user_id, `${reservation.equipment_name} has been returned and inventory was updated.`]);
    }
    await connection.commit();
    res.json({ status: 'success', message: action === 'issue' ? 'Equipment issued successfully.' : 'Equipment returned and inventory updated.' });
  } catch (error) { await connection.rollback(); next(error); } finally { connection.release(); }
};

module.exports = { listEquipment, getEquipment, createEquipment, updateEquipment, deleteEquipment, listMyReservations, reserveEquipment, cancelReservation, qrAction };
