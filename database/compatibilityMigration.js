const mysql = require('mysql2/promise');
require('dotenv').config();

async function runCompatibilityMigration() {
  const db = await mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 5
  });

  try {
    // Ground/slot bookings do not use a court. The original schema made
    // court_id mandatory, which caused slot-based bookings to fail.
    const [columns] = await db.query(
      `SELECT IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'court_id'`,
      [process.env.DB_NAME]
    );

    if (columns.length && columns[0].IS_NULLABLE === 'NO') {
      await db.query(`ALTER TABLE bookings MODIFY COLUMN court_id INT NULL`);
    }
  } finally {
    await db.end();
  }
}

module.exports = { runCompatibilityMigration };
