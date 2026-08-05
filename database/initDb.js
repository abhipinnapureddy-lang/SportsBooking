const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
require("dotenv").config();

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

if (!DB_NAME) {
    throw new Error("DB_NAME is required in .env");
}

const schema = `
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(32) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    name VARCHAR(128) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(32),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS venues (
    id INT AUTO_INCREMENT PRIMARY KEY,
    owner_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sport_type VARCHAR(64) NOT NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(128) NOT NULL,
    state VARCHAR(128),
    zip_code VARCHAR(32),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    status ENUM('pending', 'approved', 'rejected', 'inactive') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS courts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    venue_id INT NOT NULL,
    name VARCHAR(128) NOT NULL,
    court_type VARCHAR(64) NOT NULL,
    price_per_hour DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    max_players INT NOT NULL DEFAULT 1,
    status ENUM('available', 'unavailable') NOT NULL DEFAULT 'available',
    features TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    venue_id INT NOT NULL,
    court_id INT NOT NULL,
    booking_reference VARCHAR(64) NOT NULL UNIQUE,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status ENUM('pending', 'confirmed', 'cancelled', 'completed', 'refunded') NOT NULL DEFAULT 'pending',
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE,
    FOREIGN KEY (court_id) REFERENCES courts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(128) NOT NULL UNIQUE,
    description TEXT,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS equipment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    category VARCHAR(64) NOT NULL,
    sport_id INT NULL,
    description TEXT,
    available_quantity INT NOT NULL DEFAULT 0,
    reserved_quantity INT NOT NULL DEFAULT 0,
    item_condition ENUM('excellent', 'good', 'maintenance') NOT NULL DEFAULT 'good',
    status ENUM('available', 'unavailable') NOT NULL DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_equipment_sport_id (sport_id),
    CONSTRAINT fk_equipment_sport FOREIGN KEY (sport_id) REFERENCES sports(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    equipment_id INT NOT NULL,
    transaction_type ENUM('addition', 'removal', 'adjustment') NOT NULL,
    quantity INT NOT NULL,
    balance INT NOT NULL,
    reference VARCHAR(128),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_inventory_equipment_id (equipment_id),
    CONSTRAINT fk_inventory_equipment FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS grounds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sport_id INT NOT NULL,
    coordinator_id INT NULL,
    venue_id INT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(128) NOT NULL,
    state VARCHAR(128),
    zip_code VARCHAR(32),
    latitude DECIMAL(10,8) NULL,
    longitude DECIMAL(11,8) NULL,
    status ENUM('pending', 'approved', 'rejected', 'inactive') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_grounds_name_city (name, city),
    KEY idx_grounds_sport_id (sport_id),
    KEY idx_grounds_coordinator_id (coordinator_id),
    KEY idx_grounds_venue_id (venue_id),
    CONSTRAINT fk_grounds_sport FOREIGN KEY (sport_id) REFERENCES sports(id) ON DELETE RESTRICT,
    CONSTRAINT fk_grounds_coordinator FOREIGN KEY (coordinator_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_grounds_venue FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ground_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    price_per_hour DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    max_players INT NOT NULL DEFAULT 1,
    status ENUM('available', 'booked', 'cancelled') NOT NULL DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_slots_ground_id (ground_id),
    UNIQUE KEY uq_slots_ground_time (ground_id, start_time, end_time),
    CONSTRAINT fk_slots_ground FOREIGN KEY (ground_id) REFERENCES grounds(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    roll_number VARCHAR(64) UNIQUE,
    branch VARCHAR(128),
    semester TINYINT UNSIGNED,
    department VARCHAR(128),
    enrollment_year YEAR NULL,
    date_of_birth DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_students_user_id (user_id),
    CONSTRAINT fk_students_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS coordinators (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    department VARCHAR(128),
    phone VARCHAR(32),
    assigned_ground_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_coordinators_user_id (user_id),
    KEY idx_coordinators_ground_id (assigned_ground_id),
    CONSTRAINT fk_coordinators_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_coordinators_ground FOREIGN KEY (assigned_ground_id) REFERENCES grounds(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    admin_level TINYINT UNSIGNED NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_admins_user_id (user_id),
    CONSTRAINT fk_admins_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS equipment_reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    equipment_id INT NOT NULL,
    quantity INT NOT NULL,
    pickup_date DATE NOT NULL,
    return_date DATE NOT NULL,
    status ENUM('pending', 'approved', 'cancelled', 'returned') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(160) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'success', 'warning') NOT NULL DEFAULT 'info',
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_settings (
    user_id INT PRIMARY KEY,
    email_notifications TINYINT(1) NOT NULL DEFAULT 1,
    booking_reminders TINYINT(1) NOT NULL DEFAULT 1,
    dark_mode TINYINT(1) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash VARCHAR(128) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    revoked TINYINT(1) NOT NULL DEFAULT 0,
    user_agent VARCHAR(512),
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_refresh_tokens_user_id (user_id),
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

`;

const initializeDb = async () => {
    const connection = await mysql.createConnection({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASSWORD,
        multipleStatements: true
    });

    await connection.query("CREATE DATABASE IF NOT EXISTS `" + DB_NAME + "`; ");
    await connection.end();

    const pool = mysql.createPool({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        multipleStatements: true
    });

    await pool.query(schema);

    // MySQL versions before 8.0.29 do not support `ADD COLUMN IF NOT EXISTS`.
    // Check the metadata first so this migration remains safe on both MySQL and MariaDB.
    const columnExists = async (tableName, columnName) => {
        const [rows] = await pool.query(
            `SELECT COLUMN_NAME
             FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
            [DB_NAME, tableName, columnName]
        );
        return rows.length > 0;
    };

    if (!(await columnExists('users', 'email_verified'))) {
        await pool.query(`ALTER TABLE users ADD COLUMN email_verified TINYINT(1) NOT NULL DEFAULT 0`);
    }

    if (!(await columnExists('bookings', 'ground_id'))) {
        await pool.query(`ALTER TABLE bookings ADD COLUMN ground_id INT NULL AFTER court_id`);
        await pool.query(`ALTER TABLE bookings ADD CONSTRAINT fk_bookings_ground FOREIGN KEY (ground_id) REFERENCES grounds(id) ON DELETE SET NULL`);
    }
    if (!(await columnExists('bookings', 'slot_id'))) {
        await pool.query(`ALTER TABLE bookings ADD COLUMN slot_id INT NULL AFTER ground_id`);
        await pool.query(`ALTER TABLE bookings ADD CONSTRAINT fk_bookings_slot FOREIGN KEY (slot_id) REFERENCES slots(id) ON DELETE SET NULL`);
    }
    if (!(await columnExists('equipment', 'sport_id'))) {
        await pool.query(`ALTER TABLE equipment ADD COLUMN sport_id INT NULL AFTER category`);
        await pool.query(`ALTER TABLE equipment ADD CONSTRAINT fk_equipment_sport FOREIGN KEY (sport_id) REFERENCES sports(id) ON DELETE SET NULL`);
    }

    const academicColumns = [
        { name: 'roll_number', definition: 'VARCHAR(64) NULL' },
        { name: 'branch', definition: 'VARCHAR(128) NULL' },
        { name: 'semester', definition: 'TINYINT UNSIGNED NULL' },
        { name: 'department', definition: 'VARCHAR(128) NULL' }
    ];
    const [existingAcademicColumns] = await pool.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
           AND COLUMN_NAME IN ('roll_number', 'branch', 'semester', 'department')`,
        [DB_NAME]
    );
    const existingAcademicColumnNames = new Set(existingAcademicColumns.map((column) => column.COLUMN_NAME));
    for (const column of academicColumns) {
        if (!existingAcademicColumnNames.has(column.name)) {
            await pool.query(`ALTER TABLE users ADD COLUMN ${column.name} ${column.definition}`);
        }
    }
    await pool.query(`INSERT IGNORE INTO roles (name, description) VALUES
        ('admin', 'Administrator account'),
        ('owner', 'Venue owner'),
        ('customer', 'Customer account'),
        ('coordinator', 'Ground coordinator account');
    `);

    const [roles] = await pool.query(`SELECT id, name FROM roles WHERE name IN ('admin', 'owner', 'customer', 'coordinator')`);
    const roleMap = roles.reduce((acc, role) => {
        acc[role.name] = role.id;
        return acc;
    }, {});

    const adminEmail = 'admin@smartcampus.edu';
    const ownerEmail = 'owner@smartcampus.edu';
    const customerEmail = 'student@smartcampus.edu';
    const coordinatorEmail = 'coordinator@smartcampus.edu';

    const [existingUsers] = await pool.query(
        `SELECT email FROM users WHERE email IN (?, ?, ?, ?)`,
        [adminEmail, ownerEmail, customerEmail, coordinatorEmail]
    );

    if (existingUsers.length < 4) {
        const passwordHash = await bcrypt.hash('Password123', 10);
        await pool.query(
            `INSERT IGNORE INTO users (role_id, name, email, password_hash, phone) VALUES
                (?, 'Admin User', ?, ?, '9999999999'),
                (?, 'Venue Owner', ?, ?, '9999999998'),
                (?, 'Demo Customer', ?, ?, '9999999997'),
                (?, 'Ground Coordinator', ?, ?, '9999999996')`,
            [
                roleMap.admin, adminEmail, passwordHash,
                roleMap.owner, ownerEmail, passwordHash,
                roleMap.customer, customerEmail, passwordHash,
                roleMap.coordinator, coordinatorEmail, passwordHash
            ]
        );
    }

    // Demo accounts are seeded for local development and should be usable immediately.
    await pool.query(
        `UPDATE users SET email_verified = 1 WHERE email IN (?, ?, ?, ?)`,
        [adminEmail, ownerEmail, customerEmail, coordinatorEmail]
    );

    await pool.query(`INSERT IGNORE INTO sports (name, description, status) VALUES
        ('Badminton', 'Indoor and outdoor badminton courts for singles and doubles.', 'active'),
        ('Cricket', 'Full-size cricket grounds and practice nets.', 'active'),
        ('Football', 'Full-size football pitches for 11-a-side and training.', 'active'),
        ('Basketball', 'Indoor basketball courts with professional flooring.', 'active')
    `);

    const [sports] = await pool.query(`SELECT id, name FROM sports WHERE name IN (?, ?, ?, ?)`, [
        'Badminton',
        'Cricket',
        'Football',
        'Basketball'
    ]);
    const sportMap = sports.reduce((acc, sport) => {
        acc[sport.name] = sport.id;
        return acc;
    }, {});

    await pool.query(
        `UPDATE equipment SET sport_id = ? WHERE name = 'Badminton Racket'`,
        [sportMap.Badminton]
    );
    await pool.query(
        `UPDATE equipment SET sport_id = ? WHERE name = 'Football'`,
        [sportMap.Football]
    );
    await pool.query(
        `UPDATE equipment SET sport_id = ? WHERE name = 'Cricket Kit'`,
        [sportMap.Cricket]
    );
    await pool.query(
        `UPDATE equipment SET sport_id = ? WHERE name = 'Basketball'`,
        [sportMap.Basketball]
    );

    const [equipmentCount] = await pool.query(`SELECT COUNT(*) AS count FROM equipment`);
    if (equipmentCount[0].count === 0) {
        await pool.query(`INSERT INTO equipment (name, category, description, available_quantity, item_condition) VALUES
            ('Badminton Racket', 'Rackets', 'Campus-standard badminton racket.', 16, 'good'),
            ('Football', 'Balls', 'Training football for ground practice.', 12, 'excellent'),
            ('Cricket Kit', 'Kits', 'Bat, stumps, pads and protective gear.', 6, 'good'),
            ('Basketball', 'Balls', 'Indoor and outdoor practice basketball.', 10, 'good')`);
    }

    const [userRows] = await pool.query(
        `SELECT id, email FROM users WHERE email IN (?, ?, ?, ?)`,
        [adminEmail, ownerEmail, customerEmail, coordinatorEmail]
    );
    const userMap = userRows.reduce((acc, user) => {
        acc[user.email] = user.id;
        return acc;
    }, {});

    const [venueCount] = await pool.query(`SELECT COUNT(*) AS count FROM venues`);
    if (venueCount[0].count === 0) {
        await pool.query(
            `INSERT INTO venues (owner_id, name, description, sport_type, address, city, state, zip_code, latitude, longitude, status)
             VALUES
                (?, 'Sunrise Sports Arena', 'Premium indoor courts for basketball and badminton.', 'Badminton', '12 Sunrise Ave', 'Cityville', 'StateX', '12345', 12.9716, 77.5946, 'approved'),
                (?, 'Downtown Cricket Club', 'Outdoor cricket grounds with lights and seating.', 'Cricket', '34 Central Street', 'Cityville', 'StateX', '12345', 12.9754, 77.6032, 'approved')`,
            [userMap[ownerEmail], userMap[ownerEmail]]
        );
    }

    const [courtCount] = await pool.query(`SELECT COUNT(*) AS count FROM courts`);
    if (courtCount[0].count === 0) {
        const [venues] = await pool.query(`SELECT id, name FROM venues LIMIT 2`);
        const firstVenueId = venues[0]?.id;
        const secondVenueId = venues[1]?.id;

        if (firstVenueId && secondVenueId) {
            await pool.query(
                `INSERT INTO courts (venue_id, name, court_type, price_per_hour, max_players, features)
                 VALUES
                    (?, 'Court A', 'Badminton', 300.00, 4, 'Indoor, air-conditioned'),
                    (?, 'Court B', 'Badminton', 250.00, 4, 'Indoor, non-air-conditioned'),
                    (?, 'Pitch 1', 'Cricket', 1200.00, 22, 'Outdoor, turf pitch')`,
                [firstVenueId, firstVenueId, secondVenueId]
            );
        }
    }

    const [groundCount] = await pool.query(`SELECT COUNT(*) AS count FROM grounds`);
    if (groundCount[0].count === 0) {
        const [venues] = await pool.query(`SELECT id, name FROM venues WHERE name IN (?, ?)`,
            ['Sunrise Sports Arena', 'Downtown Cricket Club']
        );
        const venueMap = venues.reduce((acc, venue) => {
            acc[venue.name] = venue.id;
            return acc;
        }, {});

        await pool.query(
            `INSERT IGNORE INTO grounds (sport_id, coordinator_id, venue_id, name, description, address, city, state, zip_code, latitude, longitude, status)
             VALUES
                (?, ?, ?, 'Sunrise Indoor Courts', 'Multi-sport indoor courts supporting badminton and basketball.', '12 Sunrise Ave', 'Cityville', 'StateX', '12345', 12.9716, 77.5946, 'approved'),
                (?, ?, ?, 'Downtown Cricket Ground', 'Outdoor cricket ground with practice nets and evening lights.', '34 Central Street', 'Cityville', 'StateX', '12345', 12.9754, 77.6032, 'approved')`,
            [
                sportMap.Badminton, userMap[coordinatorEmail], venueMap['Sunrise Sports Arena'],
                sportMap.Cricket, userMap[coordinatorEmail], venueMap['Downtown Cricket Club']
            ]
        );
    }

    const [slotsCount] = await pool.query(`SELECT COUNT(*) AS count FROM slots`);
    if (slotsCount[0].count === 0) {
        const [grounds] = await pool.query(`SELECT id, name FROM grounds WHERE name IN (?, ?)`,
            ['Sunrise Indoor Courts', 'Downtown Cricket Ground']
        );
        const groundMap = grounds.reduce((acc, ground) => {
            acc[ground.name] = ground.id;
            return acc;
        }, {});

        await pool.query(
            `INSERT INTO slots (ground_id, start_time, end_time, price_per_hour, max_players, status)
             VALUES
                (?, '2026-08-20 08:00:00', '2026-08-20 09:30:00', 300.00, 4, 'available'),
                (?, '2026-08-20 10:00:00', '2026-08-20 11:30:00', 300.00, 4, 'available'),
                (?, '2026-08-20 14:00:00', '2026-08-20 18:00:00', 1200.00, 22, 'available')`,
            [groundMap['Sunrise Indoor Courts'], groundMap['Sunrise Indoor Courts'], groundMap['Downtown Cricket Ground']]
        );
    }

    const [studentCount] = await pool.query(`SELECT COUNT(*) AS count FROM students WHERE user_id = ?`, [userMap[customerEmail]]);
    if (studentCount[0].count === 0) {
        await pool.query(
            `INSERT IGNORE INTO students (user_id, roll_number, branch, semester, department, enrollment_year, date_of_birth)
             VALUES (?, 'SC2026001', 'Computer Science', 3, 'CSE', 2023, '2005-01-15')`,
            [userMap[customerEmail]]
        );
    }

    const [coordinatorCount] = await pool.query(`SELECT COUNT(*) AS count FROM coordinators WHERE user_id = ?`, [userMap[coordinatorEmail]]);
    if (coordinatorCount[0].count === 0) {
        const [assignedGroundRows] = await pool.query(`SELECT id FROM grounds WHERE name = ?`, ['Sunrise Indoor Courts']);
        await pool.query(
            `INSERT IGNORE INTO coordinators (user_id, department, phone, assigned_ground_id)
             VALUES (?, 'Campus Sports', '9999999996', ?)`,
            [userMap[coordinatorEmail], assignedGroundRows[0]?.id || null]
        );
    }

    const [adminCount] = await pool.query(`SELECT COUNT(*) AS count FROM admins WHERE user_id = ?`, [userMap[adminEmail]]);
    if (adminCount[0].count === 0) {
        await pool.query(
            `INSERT IGNORE INTO admins (user_id, admin_level) VALUES (?, 1)`,
            [userMap[adminEmail]]
        );
    }

    const [inventoryCount] = await pool.query(`SELECT COUNT(*) AS count FROM inventory`);
    if (inventoryCount[0].count === 0) {
        const [equipment] = await pool.query(`SELECT id, name FROM equipment WHERE name IN (?, ?, ?, ?)`, [
            'Badminton Racket',
            'Football',
            'Cricket Kit',
            'Basketball'
        ]);
        const equipmentMap = equipment.reduce((acc, item) => {
            acc[item.name] = item.id;
            return acc;
        }, {});

        await pool.query(
            `INSERT INTO inventory (equipment_id, transaction_type, quantity, balance, reference, notes)
             VALUES
                (?, 'addition', 16, 16, 'initial-stock', 'Initial badminton racket stock'),
                (?, 'addition', 12, 12, 'initial-stock', 'Initial football stock'),
                (?, 'addition', 6, 6, 'initial-stock', 'Initial cricket kit stock'),
                (?, 'addition', 10, 10, 'initial-stock', 'Initial basketball stock')`,
            [
                equipmentMap['Badminton Racket'],
                equipmentMap['Football'],
                equipmentMap['Cricket Kit'],
                equipmentMap['Basketball']
            ]
        );
    }

    console.log("✅ Database and tables are ready.");
    await pool.end();
};
if (require.main === module) {
    initializeDb().catch((error) => {
        console.error("Database initialization failed:", error);
        process.exit(1);
    });
}

module.exports = { initializeDb };
