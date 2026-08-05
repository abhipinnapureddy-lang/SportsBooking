-- schema-updates.sql
-- Add missing tables and columns for Students, Sports, Grounds, Inventory, Slots, Coordinators, Admins, and related booking relationships.

-- 1. Sports table: canonical list of sport categories.
CREATE TABLE IF NOT EXISTS sports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(128) NOT NULL UNIQUE,
    description TEXT,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Grounds table: physical playing areas mapped to sports and optional existing venues.
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

-- 3. Slots table: available booking windows for each ground.
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

-- 4. Students table: student-specific profiles linked to the generic users table.
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

-- 5. Coordinators table: coordinator metadata for users with coordinator responsibilities.
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

-- 6. Admins table: admin metadata for users with the administrator role.
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    admin_level TINYINT UNSIGNED NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_admins_user_id (user_id),
    CONSTRAINT fk_admins_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Inventory table: stock movement log for equipment.
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

-- 8. Booking relationship updates: add optional slot and ground linkage.
ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS ground_id INT NULL AFTER court_id,
    ADD COLUMN IF NOT EXISTS slot_id INT NULL AFTER ground_id,
    ADD INDEX IF NOT EXISTS idx_bookings_ground_id (ground_id),
    ADD INDEX IF NOT EXISTS idx_bookings_slot_id (slot_id);

ALTER TABLE bookings
    ADD CONSTRAINT IF NOT EXISTS fk_bookings_ground FOREIGN KEY (ground_id) REFERENCES grounds(id) ON DELETE SET NULL,
    ADD CONSTRAINT IF NOT EXISTS fk_bookings_slot FOREIGN KEY (slot_id) REFERENCES slots(id) ON DELETE SET NULL;

-- 9. Link equipment to sports when needed.
ALTER TABLE equipment
    ADD COLUMN IF NOT EXISTS sport_id INT NULL AFTER category,
    ADD INDEX IF NOT EXISTS idx_equipment_sport_id (sport_id);

ALTER TABLE equipment
    ADD CONSTRAINT IF NOT EXISTS fk_equipment_sport FOREIGN KEY (sport_id) REFERENCES sports(id) ON DELETE SET NULL;

-- 10. Notifications indexes for faster user queries.
ALTER TABLE notifications
    ADD INDEX IF NOT EXISTS idx_notifications_user_id (user_id),
    ADD INDEX IF NOT EXISTS idx_notifications_user_read (user_id, is_read);
