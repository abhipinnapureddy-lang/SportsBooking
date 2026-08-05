const db = require("../config/db");
const { generateBookingReference, parseDate } = require("../utils/helpers");

const createBooking = async (req, res, next) => {
    try {
        const { court_id, venue_id, start_time, end_time } = req.body;
        if (!court_id || !venue_id || !start_time || !end_time) {
            return res.status(400).json({ status: "error", message: "Missing required booking fields" });
        }

        const startDate = parseDate(start_time);
        const endDate = parseDate(end_time);
        if (!startDate || !endDate || startDate >= endDate) {
            return res.status(400).json({ status: "error", message: "Invalid booking time range" });
        }

        const [[court]] = await db.promise().query(`SELECT * FROM courts WHERE id = ? AND venue_id = ?`, [court_id, venue_id]);
        if (!court) {
            return res.status(404).json({ status: "error", message: "Court not found" });
        }

        const [conflicts] = await db.promise().query(
            `SELECT id FROM bookings
             WHERE court_id = ?
               AND status IN ('pending', 'confirmed')
               AND NOT (end_time <= ? OR start_time >= ?)`,
            [court_id, start_time, end_time]
        );
        if (conflicts.length > 0) {
            return res.status(409).json({ status: "error", message: "Time slot is already booked" });
        }

        const booking_reference = generateBookingReference();

        const [result] = await db.promise().query(
            `INSERT INTO bookings (user_id, venue_id, court_id, booking_reference, start_time, end_time, total_amount)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [req.user.id, venue_id, court_id, booking_reference, start_time, end_time, 0]
        );

        const [[booking]] = await db.promise().query(`SELECT * FROM bookings WHERE id = ?`, [result.insertId]);
        res.status(201).json({ status: "success", data: booking });
    } catch (error) {
        next(error);
    }
};

const listBookings = async (req, res, next) => {
    try {
        let query = `SELECT b.*, u.name AS customer_name, c.name AS court_name, v.name AS venue_name, v.owner_id
                     FROM bookings b
                     JOIN users u ON b.user_id = u.id
                     JOIN courts c ON b.court_id = c.id
                     JOIN venues v ON b.venue_id = v.id`;
        const values = [];
        const conditions = [];

        if (req.user.role === "customer") {
            conditions.push("b.user_id = ?");
            values.push(req.user.id);
        } else if (req.user.role === "owner") {
            conditions.push("v.owner_id = ?");
            values.push(req.user.id);
        }

        if (conditions.length) {
            query += ` WHERE ${conditions.join(" AND ")}`;
        }

        query += ` ORDER BY b.created_at DESC`;
        const [bookings] = await db.promise().query(query, values);
        res.json({ status: "success", data: bookings });
    } catch (error) {
        next(error);
    }
};

const getBooking = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [[booking]] = await db.promise().query(
            `SELECT b.*, u.name AS customer_name, u.email AS customer_email, c.name AS court_name, v.name AS venue_name, v.owner_id
             FROM bookings b
             JOIN users u ON b.user_id = u.id
             JOIN courts c ON b.court_id = c.id
             JOIN venues v ON b.venue_id = v.id
             WHERE b.id = ?`,
            [id]
        );
        if (!booking) {
            return res.status(404).json({ status: "error", message: "Booking not found" });
        }

        if (req.user.role === "customer" && booking.user_id !== req.user.id) {
            return res.status(403).json({ status: "error", message: "Forbidden" });
        }
        if (req.user.role === "owner" && booking.owner_id !== req.user.id) {
            return res.status(403).json({ status: "error", message: "Forbidden" });
        }

        res.json({ status: "success", data: booking });
    } catch (error) {
        next(error);
    }
};

const cancelBooking = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [[booking]] = await db.promise().query(`SELECT * FROM bookings WHERE id = ?`, [id]);
        if (!booking) {
            return res.status(404).json({ status: "error", message: "Booking not found" });
        }

        if (req.user.role === "customer" && booking.user_id !== req.user.id) {
            return res.status(403).json({ status: "error", message: "Forbidden" });
        }

        if (req.user.role === "owner") {
            const [[venue]] = await db.promise().query(`SELECT owner_id FROM venues WHERE id = ?`, [booking.venue_id]);
            if (!venue || venue.owner_id !== req.user.id) {
                return res.status(403).json({ status: "error", message: "Forbidden" });
            }
        }

        await db.promise().query(
            `UPDATE bookings SET status = 'cancelled' WHERE id = ?`,
            [id]
        );

        const [[updatedBooking]] = await db.promise().query(`SELECT * FROM bookings WHERE id = ?`, [id]);
        res.json({ status: "success", data: updatedBooking });
    } catch (error) {
        next(error);
    }
};

module.exports = { createBooking, listBookings, getBooking, cancelBooking };