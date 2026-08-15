const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMember4Migration() {
  const db = await mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 5
  });

  // mysql2 does not enable multiple SQL statements by default.
  // Run each CREATE TABLE statement separately so the migration works
  // with the default pool configuration.
  const tableStatements = [
    `
      CREATE TABLE IF NOT EXISTS tournaments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(160) NOT NULL,
        sport_id INT NOT NULL,
        description TEXT,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status ENUM('upcoming','registration','ongoing','completed','cancelled') NOT NULL DEFAULT 'registration',
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY idx_tournament_sport (sport_id),
        KEY idx_tournament_creator (created_by),
        CONSTRAINT fk_tournament_sport FOREIGN KEY (sport_id) REFERENCES sports(id) ON DELETE RESTRICT,
        CONSTRAINT fk_tournament_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `,
    `
      CREATE TABLE IF NOT EXISTS tournament_teams (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tournament_id INT NOT NULL,
        name VARCHAR(128) NOT NULL,
        captain_id INT NOT NULL,
        status ENUM('registered','approved','eliminated','winner') NOT NULL DEFAULT 'registered',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_tournament_team (tournament_id, name),
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
        FOREIGN KEY (captain_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `,
    `
      CREATE TABLE IF NOT EXISTS tournament_matches (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tournament_id INT NOT NULL,
        team_a_id INT NOT NULL,
        team_b_id INT NOT NULL,
        scheduled_at DATETIME,
        venue VARCHAR(160),
        score_a INT NOT NULL DEFAULT 0,
        score_b INT NOT NULL DEFAULT 0,
        status ENUM('scheduled','live','completed','cancelled') NOT NULL DEFAULT 'scheduled',
        winner_team_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
        FOREIGN KEY (team_a_id) REFERENCES tournament_teams(id) ON DELETE CASCADE,
        FOREIGN KEY (team_b_id) REFERENCES tournament_teams(id) ON DELETE CASCADE,
        FOREIGN KEY (winner_team_id) REFERENCES tournament_teams(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `,
    `
      CREATE TABLE IF NOT EXISTS certificates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tournament_id INT NOT NULL,
        user_id INT NOT NULL,
        title VARCHAR(160) NOT NULL,
        certificate_code VARCHAR(80) NOT NULL UNIQUE,
        issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `
  ];

  try {
    for (const statement of tableStatements) {
      await db.query(statement);
    }

    const sports = [
      'Cricket',
      'Football',
      'Basketball',
      'Volleyball',
      'Badminton',
      'Kabaddi',
      'Table Tennis',
      'Chess',
      'Carrom',
      'Athletics'
    ];

    for (const name of sports) {
      await db.query(
        "INSERT IGNORE INTO sports (name, description, status) VALUES (?, ?, 'active')",
        [name, `${name} campus sport`]
      );
    }
  } finally {
    await db.end();
  }
}

module.exports = { runMember4Migration };
