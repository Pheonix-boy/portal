CREATE DATABASE IF NOT EXISTS myapp;
USE myapp;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    isAdmin BOOLEAN DEFAULT FALSE
);-- Show all databases
SHOW DATABASES;

-- Switch to your database
USE myapp;

-- Show all tables
SHOW TABLES;

-- View table structure
DESCRIBE users;
SELECT * FROM users;
CREATE TABLE IF NOT EXISTS user_activity (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    activity_type ENUM('login', 'forgot_password') NOT NULL,
    activity_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS forgot_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    username VARCHAR(100),
    email VARCHAR(100),
    requestTime DATETIME DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE study_materials
ADD COLUMN chapter VARCHAR(100) NOT NULL AFTER subject;
DESCRIBE study_materials;