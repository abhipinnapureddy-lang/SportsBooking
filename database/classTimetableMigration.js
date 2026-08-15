const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * CBIT CSE (IoT & CSBCT) III-Semester class timetable supplied by the project owner.
 * Effective from 13-07-2026.
 *
 * The source timetable contains batch-specific lab entries (B1/B2). Until a student's
 * batch is stored in the application, both listed lab periods are treated as busy so
 * the booking system never incorrectly allows a student to book during a class/lab.
 */
const CLASS_TIMETABLE = [
  // Monday
  ['Monday', '09:10:00', '10:10:00', 'DM', 'Discrete Mathematics'],
  ['Monday', '10:10:00', '11:10:00', 'JP', 'Java Programming'],
  ['Monday', '11:15:00', '12:15:00', 'DBMS', 'Database Management Systems'],
  ['Monday', '14:00:00', '15:00:00', 'Java Lab (B1)', 'Java Programming Lab'],
  ['Monday', '15:05:00', '16:05:00', 'DBMS Lab (B2)', 'Database Management Systems Lab'],

  // Tuesday
  ['Tuesday', '09:10:00', '10:10:00', 'DAA', 'Design and Analysis of Algorithms'],
  ['Tuesday', '10:10:00', '11:10:00', 'DBMS', 'Database Management Systems'],
  ['Tuesday', '11:15:00', '12:15:00', 'FCST', 'Fundamentals of Cyber Security and Tools'],
  ['Tuesday', '13:00:00', '14:00:00', 'Library', 'Library'],
  ['Tuesday', '14:00:00', '15:00:00', 'Sports', 'Sports'],

  // Wednesday
  ['Wednesday', '10:10:00', '11:10:00', 'Java Lab (B2)', 'Java Programming Lab'],
  ['Wednesday', '11:15:00', '12:15:00', 'DBMS Lab (B1)', 'Database Management Systems Lab'],
  ['Wednesday', '13:00:00', '14:00:00', 'DLCA', 'Digital Logic and Computer Architecture'],
  ['Wednesday', '14:00:00', '15:00:00', 'FCST', 'Fundamentals of Cyber Security and Tools'],

  // Thursday
  ['Thursday', '09:10:00', '10:10:00', 'DLCA', 'Digital Logic and Computer Architecture'],
  ['Thursday', '10:10:00', '11:10:00', 'DM', 'Discrete Mathematics'],
  ['Thursday', '11:15:00', '12:15:00', 'JP', 'Java Programming'],
  ['Thursday', '13:00:00', '14:00:00', 'DAA Lab (B2)', 'Design and Analysis of Algorithms Lab'],
  ['Thursday', '14:00:00', '15:00:00', 'Sports', 'Sports'],

  // Friday
  ['Friday', '09:10:00', '10:10:00', 'FCST', 'Fundamentals of Cyber Security and Tools'],
  ['Friday', '10:10:00', '11:10:00', 'DBMS', 'Database Management Systems'],
  ['Friday', '11:15:00', '12:15:00', 'DBMS/JP (T)', 'DBMS / Java Programming Tutorial'],
  ['Friday', '13:00:00', '14:00:00', 'DAA', 'Design and Analysis of Algorithms'],
  ['Friday', '14:00:00', '15:00:00', 'DM', 'Discrete Mathematics'],

  // Saturday
  ['Saturday', '09:10:00', '10:10:00', 'DLCA', 'Digital Logic and Computer Architecture'],
  ['Saturday', '10:10:00', '11:10:00', 'JP', 'Java Programming'],
  ['Saturday', '11:15:00', '12:15:00', 'DAA', 'Design and Analysis of Algorithms'],
  ['Saturday', '13:00:00', '14:00:00', 'Mentoring', 'Mentoring'],
];

const runClassTimetableMigration = async () => {
  const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
  const pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
  });

  try {
    // Apply the supplied class timetable only to student/customer accounts that do
    // not already have a personal timetable. Existing personal timetables are never overwritten.
    const [students] = await pool.query(`
      SELECT u.id
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE r.name = 'customer'
        AND NOT EXISTS (
          SELECT 1 FROM student_timetables st WHERE st.user_id = u.id
        )
    `);

    if (!students.length) return;

    const values = [];
    for (const student of students) {
      for (const [day, start, end, title, subject] of CLASS_TIMETABLE) {
        values.push([student.id, day, start, end, title, subject, 'CBIT CSE (IoT & CSBCT) - III Semester']);
      }
    }

    await pool.query(
      `INSERT INTO student_timetables
        (user_id, day_of_week, start_time, end_time, title, subject, location)
       VALUES ?`,
      [values]
    );
  } finally {
    await pool.end();
  }
};

module.exports = { runClassTimetableMigration, CLASS_TIMETABLE };
