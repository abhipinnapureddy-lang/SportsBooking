const db = require('../config/db');
const listNotifications = async (req, res, next) => { try { const [rows] = await db.promise().query(`SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC`, [req.user.id]); res.json({ status: 'success', data: rows }); } catch (error) { next(error); } };
const markRead = async (req, res, next) => { try { await db.promise().query(`UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id]); res.json({ status: 'success' }); } catch (error) { next(error); } };
const markAllRead = async (req, res, next) => { try { await db.promise().query(`UPDATE notifications SET is_read = 1 WHERE user_id = ?`, [req.user.id]); res.json({ status: 'success' }); } catch (error) { next(error); } };
module.exports = { listNotifications, markRead, markAllRead };
