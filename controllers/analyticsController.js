const db = require('../config/db');

const analytics = async (req, res, next) => {
  try {
    const [[summary]] = await db.promise().query(`SELECT COUNT(*) AS total_bookings, SUM(status IN ('pending','confirmed')) AS active_bookings, SUM(status = 'cancelled') AS cancelled_bookings FROM bookings`);
    const [[popularSport]] = await db.promise().query(`SELECT COALESCE(sp.name, v.sport_type, 'Unknown') AS sport, COUNT(*) AS bookings FROM bookings b LEFT JOIN grounds g ON g.id = b.ground_id LEFT JOIN sports sp ON sp.id = g.sport_id LEFT JOIN venues v ON v.id = b.venue_id GROUP BY sport ORDER BY bookings DESC LIMIT 1`);
    const [[activeStudent]] = await db.promise().query(`SELECT u.name, u.email, COUNT(*) AS bookings FROM bookings b JOIN users u ON u.id = b.user_id GROUP BY u.id ORDER BY bookings DESC LIMIT 1`);
    const [groundUsage] = await db.promise().query(`SELECT COALESCE(g.name, 'Unassigned') AS ground, COUNT(*) AS bookings FROM bookings b LEFT JOIN grounds g ON g.id = b.ground_id GROUP BY g.id, g.name ORDER BY bookings DESC LIMIT 10`);
    const [equipmentUsage] = await db.promise().query(`SELECT e.name AS equipment, COALESCE(SUM(er.quantity), 0) AS reserved_quantity FROM equipment e LEFT JOIN equipment_reservations er ON er.equipment_id = e.id GROUP BY e.id, e.name ORDER BY reserved_quantity DESC LIMIT 10`);
    const [departmentParticipation] = await db.promise().query(`SELECT COALESCE(s.department, 'Not assigned') AS department, COUNT(b.id) AS bookings FROM students s JOIN users u ON u.id = s.user_id LEFT JOIN bookings b ON b.user_id = u.id GROUP BY s.department ORDER BY bookings DESC`);
    const [weekly] = await db.promise().query(`SELECT DATE_FORMAT(start_time, '%Y-%u') AS week, COUNT(*) AS bookings FROM bookings WHERE start_time >= DATE_SUB(CURDATE(), INTERVAL 12 WEEK) GROUP BY week ORDER BY week`);
    const [monthly] = await db.promise().query(`SELECT DATE_FORMAT(start_time, '%Y-%m') AS month, COUNT(*) AS bookings FROM bookings WHERE start_time >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH) GROUP BY month ORDER BY month`);
    res.json({ status: 'success', data: { summary, popularSport: popularSport || null, activeStudent: activeStudent || null, groundUsage, equipmentUsage, departmentParticipation, weekly, monthly } });
  } catch (error) { next(error); }
};

module.exports = { analytics };
