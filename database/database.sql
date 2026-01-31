-- NIT University Dar es Salaam - PROJECT KALI ITVMS
-- Complete Database Schema and Initialization
-- Single file for all database operations

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS nit_vehicle_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE nit_vehicle_management;

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(100) UNIQUE,
  full_name VARCHAR(100),
  role ENUM('admin', 'manager', 'driver', 'user') DEFAULT 'user',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_role (role)
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plate_number VARCHAR(20) UNIQUE NOT NULL,
  vehicle_type ENUM('Bus', 'Minibus', 'SUV', 'Sedan', 'Pickup', 'Van') NOT NULL,
  model VARCHAR(100) NOT NULL,
  manufacture_year INT,
  capacity INT,
  status ENUM('Active', 'Under Maintenance', 'Inactive') DEFAULT 'Active',
  fuel_type ENUM('Diesel', 'Petrol', 'Electric', 'Hybrid') DEFAULT 'Diesel',
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  insurance_expiry DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_plate_number (plate_number),
  INDEX idx_status (status),
  INDEX idx_vehicle_type (vehicle_type)
);

-- Drivers table
CREATE TABLE IF NOT EXISTS drivers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  license_number VARCHAR(50) UNIQUE NOT NULL,
  phone_number VARCHAR(20),
  email VARCHAR(100),
  experience_years INT DEFAULT 0,
  license_expiry DATE,
  assigned_vehicle_id INT NULL,
  status ENUM('Active', 'On Leave', 'Inactive') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
  INDEX idx_license_number (license_number),
  INDEX idx_status (status),
  INDEX idx_assigned_vehicle (assigned_vehicle_id)
);

-- Trips table
CREATE TABLE IF NOT EXISTS trips (
  id INT AUTO_INCREMENT PRIMARY KEY,
  route_from VARCHAR(200) NOT NULL,
  route_to VARCHAR(200) NOT NULL,
  driver_id INT NOT NULL,
  vehicle_id INT NOT NULL,
  trip_date DATE NOT NULL,
  departure_time TIME,
  arrival_time TIME,
  distance_km DECIMAL(10,2),
  fuel_consumed DECIMAL(10,2),
  passenger_count INT DEFAULT 0,
  notes TEXT,
  status ENUM('Scheduled', 'In Progress', 'Completed', 'Cancelled') DEFAULT 'Scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (driver_id) REFERENCES drivers(id),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  INDEX idx_trip_date (trip_date),
  INDEX idx_status (status),
  INDEX idx_driver (driver_id),
  INDEX idx_vehicle (vehicle_id)
);

-- Maintenance records table
CREATE TABLE IF NOT EXISTS maintenance_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  service_date DATE NOT NULL,
  service_type ENUM('Routine Maintenance', 'Oil Change', 'Brake Repair', 'Tire Replacement', 'Engine Repair') NOT NULL,
  description TEXT,
  cost DECIMAL(10,2),
  mileage INT,
  next_service_date DATE,
  performed_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  INDEX idx_vehicle_maintenance (vehicle_id),
  INDEX idx_service_date (service_date),
  INDEX idx_service_type (service_type)
);

-- Fuel records table
CREATE TABLE IF NOT EXISTS fuel_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  driver_id INT NOT NULL,
  fuel_date DATE NOT NULL,
  fuel_type ENUM('Diesel', 'Petrol', 'Electric', 'Hybrid') NOT NULL,
  quantity_liters DECIMAL(10,2) NOT NULL,
  cost_per_liter DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  mileage INT,
  fuel_station VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  FOREIGN KEY (driver_id) REFERENCES drivers(id),
  INDEX idx_vehicle_fuel (vehicle_id),
  INDEX idx_fuel_date (fuel_date),
  INDEX idx_driver_fuel (driver_id)
);

-- Insert default admin user (password: nit2023)
INSERT IGNORE INTO users (username, password, email, full_name, role) 
VALUES ('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@nit.ac.tz', 'System Administrator', 'admin');

-- Insert sample vehicles
INSERT IGNORE INTO vehicles (plate_number, vehicle_type, model, manufacture_year, capacity) VALUES
('T 123 ABC', 'Bus', 'Toyota Coaster', 2020, 30),
('T 456 DEF', 'Minibus', 'Toyota Hiace', 2021, 15),
('T 789 GHI', 'SUV', 'Toyota Land Cruiser', 2019, 7);

-- Insert sample drivers
INSERT IGNORE INTO drivers (full_name, license_number, phone_number, experience_years) VALUES
('John Mwambene', 'DL-123456', '255-789-456123', 5),
('Grace Joseph', 'DL-789012', '255-756-789012', 3),
('Michael Kimaro', 'DL-345678', '255-712-345678', 7);

-- Insert sample trips
INSERT IGNORE INTO trips (route_from, route_to, driver_id, vehicle_id, trip_date, departure_time, status) VALUES
('NIT Campus', 'City Center', 1, 1, '2024-01-15', '08:00', 'Completed'),
('City Center', 'NIT Campus', 2, 2, '2024-01-15', '17:00', 'Completed'),
('NIT Campus', 'Airport', 3, 3, '2024-01-16', '06:00', 'Scheduled');

-- Insert sample maintenance records
INSERT IGNORE INTO maintenance_records (vehicle_id, service_date, service_type, description, cost, performed_by) VALUES
(1, '2024-01-10', 'Routine Maintenance', 'Regular service check', 150000, 'Auto Garage Ltd'),
(2, '2024-01-12', 'Oil Change', 'Engine oil replacement', 50000, 'Quick Service'),
(3, '2024-01-08', 'Brake Repair', 'Front brake pads replacement', 80000, 'Brake Experts');

-- Insert sample fuel records
INSERT IGNORE INTO fuel_records (vehicle_id, driver_id, fuel_date, fuel_type, quantity_liters, cost_per_liter, total_cost, fuel_station) VALUES
(1, 1, '2024-01-15', 'Diesel', 45.5, 2400, 109200, 'BP Station'),
(2, 2, '2024-01-15', 'Diesel', 25.0, 2400, 60000, 'Shell Station'),
(3, 3, '2024-01-14', 'Petrol', 35.2, 2600, 91520, 'Total Station');
