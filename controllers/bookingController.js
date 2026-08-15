const db = require("../config/db");
const { generateBookingReference, parseDate } = require("../utils/helpers");
const { normalizePagination } = require("../utils/dbHelpers");

const createBooking = async (req, res, next) => {
    try {
        const { court_id, venue_id, start_time, end_time, slot_id } = req.body;

        let resolvedCourtId = court_id || null;
        let resolvedVenueId = venue_id || null;
        let groundId = null;
        let bookingStart = start_time ? parseDate(start_time) : null;
        let bookingEnd = end_time ? parseDate(end_time) : null;
        let total_amount = 0;

        if (!slot_id && (!resolvedCourtId || !resolvedVenueId || !start_time || !end_time)) {
            return res.status(400).json({ status: "error", message: "Missing required booking fields" });
        }

        let selectedSlot = null;
        if (slot_id) {
            const [[slot]] = await db.promise().query(
                `SELECT s.*, g.venue_id, g.id AS ground_id
                 FROM slots s
                 JOIN grounds g ON s.ground_id = g.id
                 WHERE s.id = ?`,
                [slot_id]
            );
            if (!slot) {
                return res.status(404).json({ status: "error", message: "Slot not found" });
            }
            if (slot.status !== 'available') {
                return res.status(409).json({ status: "error", message: "Slot is not available for booking" });
            }

            selectedSlot = slot;
            resolvedVenueId = slot.venue_id;
            groundId = slot.ground_id;
            resolvedCourtId = null;
            bookingStart = parseDate(slot.start_time);
            bookingEnd = parseDate(slot.end_time);
            total_amount = Number(slot.price_per_hour) * ((bookingEnd - bookingStart) / 1000 / 60 / 60);

            const [existingBookings] = await db.promise().query(
                `SELECT id FROM bookings WHERE slot_id = ? AND status IN ('pending', 'confirmed')`,
                [slot_id]
            );
            if (existingBookings.length > 0) {
                return res.status(409).json({ status: "error", message: "Slot is already booked" });
            }
        } else {
            if (!bookingStart || !bookingEnd || bookingStart >= bookingEnd) {
                return res.status(400).json({ status: "error", message: "Invalid booking time range" });
            }

            const [[court]] = await db.promise().query(`SELECT * FROM courts WHERE id = ? AND venue_id = ?`, [resolvedCourtId, resolvedVenueId]);
            if (!court) {
                return res.status(404).json({ status: "error", message: "Court not found" });
            }

            const [conflicts] = await db.promise().query(
                `SELECT id FROM bookings
                 WHERE court_id = ?
                   AND status IN ('pending', 'confirmed')
                   AND NOT (end_time <= ? OR start_time >= ?)`,
                [resolvedCourtId, start_time, end_time]
            );
            if (conflicts.length > 0) {
                return res.status(409).json({ status: "error", message: "Time slot is already booked" });
            }

            total_amount = Number(court.price_per_hour) * ((bookingEnd - bookingStart) / 1000 / 60 / 60);
        }

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const bookingDay = dayNames[bookingStart.getDay()];
        const bookingStartTime = bookingStart.toTimeString().slice(0, 8);
        const bookingEndTime = bookingEnd.toTimeString().slice(0, 8);
        const [classConflicts] = await db.promise().query(
            `SELECT id FROM student_timetables
             WHERE user_id = ?
               AND day_of_week = ?
               AND NOT (end_time <= ? OR start_time >= ?)`,
            [req.user.id, bookingDay, bookingStartTime, bookingEndTime]
        );

        if (classConflicts.length > 0) {
            return res.status(409).json({ status: 'error', message: 'Booking conflicts with your class schedule' });
        }

        const booking_reference = generateBookingReference();

        const [result] = await db.promise().query(
            `INSERT INTO bookings (user_id, venue_id, court_id, ground_id, slot_id, booking_reference, start_time, end_time, total_amount)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [req.user.id, resolvedVenueId, resolvedCourtId, groundId, slot_id || null, booking_reference, slot_id ? selectedSlot.start_time : start_time, slot_id ? selectedSlot.end_time : end_time, total_amount]
        );

        if (slot_id) {
            await db.promise().query(`UPDATE slots SET status = 'booked' WHERE id = ?`, [slot_id]);
        }

        const [[booking]] = await db.promise().query(`SELECT * FROM bookings WHERE id = ?`, [result.insertId]);
        res.status(201).json({ status: "success", data: booking });
    } catch (error) {
        next(error);
    }
};

const listBookings = async (req, res, next) => {
    try {
        const { search, status, from_date, to_date, page, limit, history_type } = req.query;
        const pagination = normalizePagination(page, limit, 12);

        const baseQuery = `SELECT b.*, u.name AS customer_name, c.name AS court_name, v.name AS venue_name, g.name AS ground_name,
                             COALESCE(sp.name, v.sport_type) AS sport_name, NULL AS equipment, s.start_time AS slot_start_time,
                             s.end_time AS slot_end_time, s.price_per_hour AS slot_price, v.owner_id
                             FROM bookings b
                             JOIN users u ON b.user_id = u.id
                             LEFT JOIN courts c ON b.court_id = c.id
                             LEFT JOIN venues v ON b.venue_id = v.id
                             LEFT JOIN grounds g ON b.ground_id = g.id
                             LEFT JOIN sports sp ON g.sport_id = sp.id
                             LEFT JOIN slots s ON b.slot_id = s.id`;
        const countBase = `SELECT COUNT(*) AS total FROM bookings b
                             JOIN users u ON b.user_id = u.id
                             LEFT JOIN courts c ON b.court_id = c.id
                             LEFT JOIN venues v ON b.venue_id = v.id
                             LEFT JOIN grounds g ON b.ground_id = g.id
                             LEFT JOIN sports sp ON g.sport_id = sp.id`;
        const values = [];
        const conditions = [];

        if (req.user.role === "customer") {
            conditions.push("b.user_id = ?");
            values.push(req.user.id);
        } else if (req.user.role === "owner") {
            conditions.push("v.owner_id = ?");
            values.push(req.user.id);
        }

        if (search) {
            conditions.push(`(b.booking_reference LIKE ? OR v.name LIKE ? OR c.name LIKE ? OR g.name LIKE ? OR u.name LIKE ? OR sp.name LIKE ? OR v.sport_type LIKE ?)`);
            const searchTerm = `%${search}%`;
            values.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
        }

        if (status) {
            conditions.push("b.status = ?");
            values.push(status);
        }

        if (from_date) {
            conditions.push("b.start_time >= ?");
            values.push(`${from_date} 00:00:00`);
        }
        if (to_date) {
            conditions.push("b.start_time <= ?");
            values.push(`${to_date} 23:59:59`);
        }

        if (history_type === 'current') {
            conditions.push("(b.status IN ('pending', 'confirmed') OR b.end_time >= NOW())");
        } else if (history_type === 'previous') {
            conditions.push("(b.status IN ('cancelled', 'completed') OR b.end_time < NOW())");
        }

        const whereClause = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
        const countQuery = `${countBase}${whereClause}`;
        const [countResult] = await db.promise().query(countQuery, values);
        const query = `${baseQuery}${whereClause} ORDER BY b.start_time DESC, b.created_at DESC LIMIT ? OFFSET ?`;
        const queryValues = [...values, pagination.limit, pagination.offset];
        const [bookings] = await db.promise().query(query, queryValues);

        res.json({ status: "success", data: bookings, meta: { total: countResult[0]?.total || 0, page: pagination.page, limit: pagination.limit } });
    } catch (error) {
        next(error);
    }
};

const getBooking = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [[booking]] = await db.promise().query(
            `SELECT b.*, u.name AS customer_name, u.email AS customer_email, c.name AS court_name, v.name AS venue_name, g.name AS ground_name, s.start_time AS slot_start_time, s.end_time AS slot_end_time, s.price_per_hour AS slot_price, v.owner_id
             FROM bookings b
             JOIN users u ON b.user_id = u.id
             LEFT JOIN courts c ON b.court_id = c.id
             LEFT JOIN venues v ON b.venue_id = v.id
             LEFT JOIN grounds g ON b.ground_id = g.id
             LEFT JOIN slots s ON b.slot_id = s.id
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

        if (booking.slot_id) {
            await db.promise().query(`UPDATE slots SET status = 'available' WHERE id = ?`, [booking.slot_id]);
        }

        const [[updatedBooking]] = await db.promise().query(`SELECT * FROM bookings WHERE id = ?`, [id]);
        res.json({ status: "success", data: updatedBooking });
    } catch (error) {
        next(error);
    }
};

const confirmBooking = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [[booking]] = await db.promise().query(`SELECT * FROM bookings WHERE id = ?`, [id]);
        if (!booking) {
            return res.status(404).json({ status: "error", message: "Booking not found" });
        }

        if (req.user.role !== 'admin') {
            const [[venue]] = await db.promise().query(`SELECT owner_id FROM venues WHERE id = ?`, [booking.venue_id]);
            if (!venue || venue.owner_id !== req.user.id) {
                return res.status(403).json({ status: "error", message: "Forbidden" });
            }
        }

        if (booking.status !== 'pending') {
            return res.status(400).json({ status: "error", message: "Only pending bookings can be confirmed" });
        }

        await db.promise().query(`UPDATE bookings SET status = 'confirmed' WHERE id = ?`, [id]);
        const [[updatedBooking]] = await db.promise().query(`SELECT * FROM bookings WHERE id = ?`, [id]);
        res.json({ status: "success", data: updatedBooking });
    } catch (error) {
        next(error);
    }
};

module.exports = { createBooking, listBookings, getBooking, cancelBooking, confirmBooking };