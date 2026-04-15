const mysql = require('mysql2/promise');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

async function seed() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    const conn = await pool.getConnection();
    console.log('✅ Conectado');

    const users = [
      { id: 'u001', name: 'Super Admin', email: 'superadmin@municipio.mx', password: 'admin123', role: 'superadmin', nfc: 'NFC-001', membership: 'anual' },
      { id: 'u002', name: 'Administrador',  email: 'admin@municipio.mx',      password: 'admin123', role: 'admin',      nfc: 'NFC-002', membership: 'anual' },
      { id: 'u003', name: 'Soporte',        email: 'soporte@municipio.mx',    password: 'admin123', role: 'support',    nfc: 'NFC-003', membership: 'mensual' },
      { id: 'u004', name: 'Usuario Demo',   email: 'usuario@municipio.mx',    password: 'user123',  role: 'user',       nfc: 'NFC-004', membership: 'mensual' },
    ];

    for (const u of users) {
      const hash = await bcrypt.hash(u.password, 10);
      await conn.query(`
        INSERT INTO users (id, name, email, password_hash, role, nfc_card, membership, status, join_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'activo', CURDATE())
        ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), name = VALUES(name)
      `, [u.id, u.name, u.email, hash, u.role, u.nfc, u.membership]);
      console.log(`✅ Usuario "${u.name}" (${u.email}) con contraseña: ${u.password}`);
    }

    conn.release();
    console.log('\n🎉 Usuarios listos. Puedes iniciar sesión con:');
    console.log('  admin@municipio.mx / admin123');
    console.log('  superadmin@municipio.mx / admin123');
    console.log('  soporte@municipio.mx / admin123');
    console.log('  usuario@municipio.mx / user123');
    process.exit(0);
  } catch(err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

seed();
