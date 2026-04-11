-- ==========================================
-- SCRIPT DE CREACIÓN: SISTEMA MUNICIPAL DE ALBERCAS
-- EJECUTAR EN LARAGON (DB: municipal_pool)
-- ==========================================

CREATE DATABASE IF NOT EXISTS municipal_pool;
USE municipal_pool;

-- Tabla de Usuarios
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) DEFAULT '$2b$10$Eixza7VKjUD6kM4.4K8XG.7GedG/YF.c9U6JvF9G.3.3.3.3.3.3', -- Pass: admin
    role ENUM('superadmin', 'admin', 'support', 'user') DEFAULT 'user',
    nfc_card VARCHAR(50) UNIQUE,
    phone VARCHAR(20),
    membership VARCHAR(20),
    status ENUM('activo', 'inactivo', 'pendiente') DEFAULT 'activo',
    join_date DATE,
    avatar TEXT,
    services TEXT -- Almacenado como string (CSV o JSON)
);

-- Tabla de Pagos
CREATE TABLE payments (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50),
    user_name VARCHAR(100),
    type VARCHAR(100),
    amount DECIMAL(10, 2),
    date DATE,
    method VARCHAR(50),
    status VARCHAR(50),
    reference VARCHAR(50),
    service_id VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Tabla de Asistencia (NFC)
CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50),
    user_name VARCHAR(100),
    nfc_card VARCHAR(50),
    service_name VARCHAR(100),
    pool_name VARCHAR(100),
    scan_date DATE,
    scan_time TIME,
    status ENUM('entrada', 'salida'),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Datos de Ejemplo
INSERT INTO users (id, name, email, role, nfc_card, join_date, status)
VALUES ('u001', 'Administrador Global', 'admin@municipio.mx', 'superadmin', 'NFC-SA-001', CURDATE(), 'activo');

INSERT INTO users (id, name, email, role, nfc_card, join_date, status)
VALUES ('u004', 'Ana Martínez', 'ana@alberca.mx', 'user', 'NFC-US-004', '2024-04-05', 'activo');

INSERT INTO users (id, name, email, role, nfc_card, join_date, status)
VALUES ('u005', 'Luis Hernández', 'luis@alberca.mx', 'user', 'NFC-US-005', '2024-05-20', 'activo');
