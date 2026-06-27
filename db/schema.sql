-- CALdo database schema
-- Normalized schema: tasks and events kept separate since they have
-- different shapes (tasks have status/priority, events are point-in-time)

CREATE DATABASE IF NOT EXISTS caldo;
USE caldo;

CREATE TABLE IF NOT EXISTS tasks (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    title         VARCHAR(255) NOT NULL,
    description   TEXT,
    due_date      DATE,
    status        ENUM('pending', 'in_progress', 'completed') NOT NULL DEFAULT 'pending',
    priority      ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_due_date (due_date),
    INDEX idx_status (status)
);

CREATE TABLE IF NOT EXISTS events (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    title         VARCHAR(255) NOT NULL,
    event_date    DATE NOT NULL,
    event_time    TIME,
    notes         TEXT,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_event_date (event_date)
);

-- Simple cache table so we don't hit the holiday API on every page load
CREATE TABLE IF NOT EXISTS holiday_cache (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    country_code  VARCHAR(5) NOT NULL,
    year          INT NOT NULL,
    payload       JSON NOT NULL,
    fetched_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_country_year (country_code, year)
);
