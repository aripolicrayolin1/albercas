const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' || process.env.DB_PORT ? { rejectUnauthorized: false } : null,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test connection
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión exitosa a MySQL (Laragon)');
    connection.release();
  } catch (err) {
    console.error('❌ Error conectando a MySQL:', err.message);
    console.error('Asegúrate de que Laragon esté encendido y la base de datos "municipal_pool" creada.');
  }
})();

module.exports = pool;
