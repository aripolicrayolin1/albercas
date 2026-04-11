const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function migrate() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conectado a MySQL. Iniciando migración...');

    // 0. Alterar users: Añadir password_hash si no existe
    try {
      await connection.query('ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) AFTER email');
      console.log('- Columna password_hash añadida a la tabla users.');
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') throw err;
    }

    // 1. Crear tabla payment_types
    await connection.query(`
      CREATE TABLE IF NOT EXISTS payment_types (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        duration VARCHAR(50) NOT NULL,
        category VARCHAR(50) NOT NULL,
        description TEXT
      )
    `);
    console.log('- Tabla payment_types lista.');

    // 2. Crear tabla schedules
    await connection.query(`
      CREATE TABLE IF NOT EXISTS schedules (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        pool VARCHAR(100) NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        days VARCHAR(50) NOT NULL, -- ej: "1,2,3,4,5"
        capacity INT NOT NULL,
        instructor VARCHAR(100),
        category VARCHAR(50) NOT NULL,
        color VARCHAR(20)
      )
    `);
    console.log('- Tabla schedules lista.');

    // 3. Crear tabla events
    await connection.query(`
      CREATE TABLE IF NOT EXISTS events (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        event_date DATE NOT NULL,
        event_time TIME NOT NULL,
        duration VARCHAR(50) NOT NULL,
        pool VARCHAR(100) NOT NULL,
        capacity INT NOT NULL,
        registered INT DEFAULT 0,
        status VARCHAR(20) DEFAULT 'próximo',
        description TEXT
      )
    `);
    console.log('- Tabla events lista.');
 
    // 4. Crear tabla enrollments
    await connection.query(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        activity_id VARCHAR(50) NOT NULL,
        activity_type ENUM('schedule', 'event') NOT NULL,
        enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_enrollment (user_id, activity_id, activity_type),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('- Tabla enrollments lista.');

    // 4. Alterar payments: Añadir created_at (timestamp) si no existe
    try {
      await connection.query('ALTER TABLE payments ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP');
      console.log('- Columna created_at añadida a payments.');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        // Ya existe, todo bien
      } else {
        throw err;
      }
    }

    // 5. Insertar datos iniciales para payment_types
    const paymentTypes = [
      ['pt001', 'Entrada Diaria', 50, '1 día', 'acceso', 'Acceso de un día a todas las albercas'],
      ['pt002', 'Membresía Mensual', 350, '30 días', 'membresía', 'Acceso ilimitado por mes'],
      ['pt003', 'Membresía Anual', 3200, '365 días', 'membresía', 'Acceso ilimitado por año con descuento'],
      ['pt004', 'Clase de Natación', 200, '4 sesiones', 'clase', 'Clases grupales de natación (4 sesiones)'],
      ['pt005', 'Clases para Niños', 180, '4 sesiones', 'clase', 'Natación infantil (4 sesiones)'],
      ['pt006', 'Taller Aqua Fitness', 450, '8 sesiones', 'taller', 'Ejercicio acuático de tonificación (8 sesiones)'],
      ['pt007', 'Natación Competitiva', 600, 'mensual', 'club', 'Entrenamiento competitivo mensual']
    ];
    await connection.query('DELETE FROM payment_types'); // Limpiar antes de poblar (solo para dev)
    for (const pt of paymentTypes) {
      await connection.query('INSERT INTO payment_types (id, name, price, duration, category, description) VALUES (?, ?, ?, ?, ?, ?)', pt);
    }
    console.log('- Datos iniciales insertados en payment_types.');

    // 6. Insertar datos iniciales para schedules
    // Días mapeados a números: lun=1, mar=2, mié=3, jue=4, vie=5, sáb=6, dom=7
    const schedules = [
      ['s001', 'Nado Libre Adultos', 'Alberca Principal', '06:00:00', '08:00:00', '1,2,3,4,5', 40, null, 'acceso', '#3b82f6'],
      ['s002', 'Clases de Natación Infantil', 'Alberca Infantil', '09:00:00', '10:00:00', '1,3,5', 15, 'Prof. García', 'clase', '#10b981'],
      ['s003', 'Aqua Fitness', 'Alberca Recreativa', '10:00:00', '11:00:00', '2,4,6', 20, 'Prof. López', 'taller', '#8b5cf6'],
      ['s004', 'Natación Competitiva', 'Alberca Principal', '07:00:00', '09:00:00', '1,3,5', 12, 'Prof. Ramos', 'club', '#f59e0b'],
      ['s005', 'Nado Libre General', 'Alberca Principal', '16:00:00', '20:00:00', '1,2,3,4,5,6,7', 50, null, 'acceso', '#3b82f6'],
      ['s006', 'Clases Adultos Mayores', 'Alberca Recreativa', '11:00:00', '12:00:00', '2,4', 10, 'Prof. Morales', 'clase', '#10b981'],
    ];
    await connection.query('DELETE FROM schedules');
    for (const sc of schedules) {
      await connection.query('INSERT INTO schedules (id, title, pool, start_time, end_time, days, capacity, instructor, category, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', sc);
    }
    console.log('- Datos iniciales insertados en schedules.');

    // 7. Insertar datos iniciales para events
    const events = [
      ['e001', 'Torneo Municipal de Natación', '2024-08-10', '09:00:00', '6 horas', 'Alberca Principal', 100, 78, 'próximo', 'Competencia abierta categorías infantil, juvenil y adultos.'],
      ['e002', 'Exhibición de Clavados', '2024-08-20', '17:00:00', '2 horas', 'Alberca Principal', 200, 45, 'próximo', 'Demostración de clavados artísticos por atletas seleccionados.'],
      ['e003', 'Curso Intensivo Verano', '2024-07-22', '09:00:00', '10 días', 'Alberca Infantil', 30, 30, 'lleno', 'Curso de natación intensivo para niños de 5 a 12 años.'],
      ['e004', 'Festival del Agua 2024', '2024-09-15', '10:00:00', '5 horas', 'Todas', 500, 120, 'próximo', 'Evento comunitario con actividades acuáticas para toda la familia.'],
    ];
    await connection.query('DELETE FROM events');
    for (const ev of events) {
      await connection.query('INSERT INTO events (id, title, event_date, event_time, duration, pool, capacity, registered, status, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', ev);
    }
    console.log('- Datos iniciales insertados en events.');

    // 8. Hacer que la llave foránea user_id en attendance sea SET NULL ON DELETE (opcional o asegurarnos en app)
    // Para simplificar, implementaremos la baja lógica en index.js en la ruta DELETE /api/users/:id

    connection.release();
    console.log('🎉 Migración completada exitosamente.');
    process.exit(0);

  } catch (err) {
    console.error('❌ Error en migración:', err);
    process.exit(1);
  }
}

migrate();
