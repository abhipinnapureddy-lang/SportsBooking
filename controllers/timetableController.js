const db = require('../config/db');
const { getDayOfWeekName, isTimeRangeOverlap } = require('../utils/helpers');

const WEEK_START = '06:00:00';
const WEEK_END = '22:00:00';
const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const calculateFreePeriods = (events) => {
    const sortedEvents = [...events].sort((a, b) => a.start_time.localeCompare(b.start_time));
    const freePeriods = [];
    let cursor = WEEK_START;

    for (const event of sortedEvents) {
        if (event.start_time > cursor) {
            freePeriods.push({ start_time: cursor, end_time: event.start_time });
        }
        if (event.end_time > cursor) {
            cursor = event.end_time;
        }
    }

    if (cursor < WEEK_END) {
        freePeriods.push({ start_time: cursor, end_time: WEEK_END });
    }

    return freePeriods;
};

const getTimetable = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const [rows] = await db.promise().query(
            `SELECT id, title, day_of_week, start_time, end_time, subject, location
             FROM student_timetables
             WHERE user_id = ?
             ORDER BY FIELD(day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'), start_time ASC`,
            [userId]
        );

        const grouped = dayOrder.reduce((acc, day) => {
            acc[day] = [];
            return acc;
        }, {});

        const freePeriods = dayOrder.reduce((acc, day) => {
            acc[day] = [];
            return acc;
        }, {});

        for (const row of rows) {
            grouped[row.day_of_week].push(row);
        }

        for (const day of dayOrder) {
            freePeriods[day] = calculateFreePeriods(grouped[day]);
        }

        res.json({ status: 'success', data: { events: rows, grouped, free_periods: freePeriods } });
    } catch (error) {
        next(error);
    }
};

const getTimetableSlots = async (req, res, next) => {
    try {
        const { ground_id, date } = req.query;
        if (!ground_id) {
            return res.status(400).json({ status: 'error', message: 'ground_id query parameter is required' });
        }

        const queryDate = date || new Date().toISOString().slice(0, 10);
        const dayOfWeek = getDayOfWeekName(queryDate);
        const [events] = await db.promise().query(
            `SELECT start_time, end_time
             FROM student_timetables
             WHERE user_id = ? AND day_of_week = ?
             ORDER BY start_time ASC`,
            [req.user.id, dayOfWeek]
        );

        const [slots] = await db.promise().query(
            `SELECT s.*
             FROM slots s
             WHERE s.ground_id = ? AND DATE(s.start_time) = ?
             ORDER BY s.start_time ASC`,
            [ground_id, queryDate]
        );

        const processed = slots.map((slot) => {
            const isBusy = events.some((event) => {
                const slotStart = new Date(slot.start_time);
                const slotEnd = new Date(slot.end_time);
                const datePrefix = `${queryDate}T`;
                const eventStart = new Date(`${datePrefix}${event.start_time}`);
                const eventEnd = new Date(`${datePrefix}${event.end_time}`);
                return isTimeRangeOverlap(slotStart, slotEnd, eventStart, eventEnd);
            });

            return {
                ...slot,
                is_class_conflict: isBusy,
                available_for_booking: slot.status === 'available' && !isBusy
            };
        });

        res.json({ status: 'success', data: processed });
    } catch (error) {
        next(error);
    }
};

module.exports = { getTimetable, getTimetableSlots };