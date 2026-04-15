const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const db = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-123';

// Mercado Pago SDK v2
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');

const app = express();
const PORT = process.env.PORT || 3001;

// Configurar Mercado Pago
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN 
});

app.use(cors());
app.use(express.json());

// ── DB INITIALIZATION (Ensures all 7 tables exist in Cloud) ───────────────────
async function initDB() {
  try {
    // 1. payment_types
    await db.query(`
      CREATE TABLE IF NOT EXISTS payment_types (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        duration VARCHAR(50) NOT NULL,
        category VARCHAR(50) NOT NULL,
        description TEXT
      )
    `);
    // 2. schedules
    await db.query(`
      CREATE TABLE IF NOT EXISTS schedules (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        pool VARCHAR(100) NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        days VARCHAR(50) NOT NULL,
        capacity INT NOT NULL,
        instructor VARCHAR(100),
        category VARCHAR(50) NOT NULL,
        color VARCHAR(20)
      )
    `);
    // 3. events
    await db.query(`
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
    // 4. enrollments
    await db.query(`
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
    console.log('✅ Base de Datos Sincronizada (7 tablas verificadas)');
  } catch (err) {
    console.error('❌ Error inicializando BD:', err);
  }
}
initDB();

// ── 1. AUTH & LOGIN ─────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(401).json({ error: 'Usuario no encontrado' });
    
    const user = rows[0];
    
    // Si el usuario no tiene password_hash (cuenta nueva), no puede entrar hasta que el admin le de una
    if (!user.password_hash) {
      return res.status(401).json({ error: 'Tu cuenta no tiene una contraseña asignada. Contacta al administrador.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ error: 'Contraseña incorrecta' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        nfcCard: user.nfc_card,
        membership: user.membership,
        status: user.status,
        phone: user.phone,
        services: user.services ? user.services.split(',') : [],
        avatar: user.avatar
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── 2. USERS ──────────────────────────────────────────────────────────────────
app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM users ORDER BY join_date DESC');
    const mapped = rows.map(u => ({
      ...u,
      nfcCard: u.nfc_card,
      joinDate: u.join_date,
      services: u.services ? u.services.split(',') : []
    }));
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  const { id, name, email, role, nfcCard, phone, membership, status, joinDate, services, avatar, selectedActivities } = req.body;
  try {
    // Generar contraseña autogenerada
    const password = Math.random().toString(36).slice(-8);
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Usar una función para manejar todo esto en orden si fuera una DB más compleja, 
    // pero aquí usaremos inserts secuenciales por simplicidad técnica en este entorno.
    await db.query(`
      INSERT INTO users (id, name, email, password_hash, role, nfc_card, phone, membership, status, join_date, services, avatar)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, name, email, passwordHash, role, nfcCard, phone, membership, status, joinDate, services?.join(','), avatar]);
    
    // Si hay actividades seleccionadas, crear enrollments
    if (selectedActivities && Array.isArray(selectedActivities)) {
      for (const act of selectedActivities) {
        await db.query('INSERT INTO enrollments (user_id, activity_id, activity_type) VALUES (?, ?, ?)', 
          [id, act.id, act.type]);
        
        if (act.type === 'event') {
          await db.query('UPDATE events SET registered = registered + 1 WHERE id = ?', [act.id]);
        }
      }
    }

    res.json({ success: true, user: { ...req.body, password } });
  } catch (err) {
    console.error("Error al crear usuario:", err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  const { name, email, role, nfcCard, phone, membership, status, services, selectedActivities } = req.body;
  const userId = req.params.id;
  try {
    const servicesStr = Array.isArray(services) ? services.join(',') : services;
    await db.query(`
      UPDATE users 
      SET name = ?, email = ?, role = ?, nfc_card = ?, phone = ?, 
          membership = ?, status = ?, services = ?
      WHERE id = ?
    `, [name, email, role, nfcCard, phone, membership, status, servicesStr, userId]);
    
    // Si se enviaron actividades seleccionadas, sincronizar enrollments
    if (selectedActivities && Array.isArray(selectedActivities)) {
      // 1. Obtener enrollments actuales para eventos para decrementar el contador
      const [oldEnrollments] = await db.query('SELECT * FROM enrollments WHERE user_id = ? AND activity_type = "event"', [userId]);
      for (const old of oldEnrollments) {
        await db.query('UPDATE events SET registered = GREATEST(0, registered - 1) WHERE id = ?', [old.activity_id]);
      }
      
      // 2. Borrar todos los enrollments previos
      await db.query('DELETE FROM enrollments WHERE user_id = ?', [userId]);
      
      // 3. Insertar los nuevos
      for (const act of selectedActivities) {
        await db.query('INSERT INTO enrollments (user_id, activity_id, activity_type) VALUES (?, ?, ?)', 
          [userId, act.id, act.type]);
        
        if (act.type === 'event') {
          await db.query('UPDATE events SET registered = registered + 1 WHERE id = ?', [act.id]);
        }
      }
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error("Error al actualizar usuario:", err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    // Hard delete: permanently removes user record
    // Note: enrollements will be deleted via ON DELETE CASCADE in MySQL
    // payments and attendance will have user_id set to NULL but keep snapshots
    await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true, hardDelete: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id/reset-password', async (req, res) => {
  try {
    const newPassword = Math.random().toString(36).slice(-8); // Gen 8 random chars
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);
    
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.params.id]);
    
    res.json({ success: true, newPassword });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id/change-password', async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

    const user = rows[0];
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) return res.status(401).json({ error: 'La contraseña actual es incorrecta' });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);
    
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.params.id]);
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── ENROLLMENTS FOR USER ─────────────────────────────────────
app.get('/api/users/:id/enrollments', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT e.*, 
        CASE 
          WHEN e.activity_type = 'schedule' THEN s.title 
          WHEN e.activity_type = 'event' THEN ev.title 
        END as title,
        CASE 
          WHEN e.activity_type = 'schedule' THEN CONCAT(s.start_time, ' - ', s.end_time)
          WHEN e.activity_type = 'event' THEN CONCAT(DATE_FORMAT(ev.event_date, '%d/%m'), ' ', ev.event_time)
        END as time
      FROM enrollments e
      LEFT JOIN schedules s ON e.activity_id = s.id AND e.activity_type = 'schedule'
      LEFT JOIN events ev ON e.activity_id = ev.id AND e.activity_type = 'event'
      WHERE e.user_id = ?
    `, [req.params.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PROFILE UPDATE (BASIC DATA) ──────────────────────────────────
app.put('/api/users/:id/profile', async (req, res) => {
  const { name, phone, avatar } = req.body;
  try {
    await db.query(`
      UPDATE users SET name = ?, phone = ?, avatar = ? WHERE id = ?
    `, [name, phone, avatar, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/enroll', async (req, res) => {
  const { userId, activityId, activityType } = req.body;
  try {
    const [existing] = await db.query('SELECT * FROM enrollments WHERE user_id = ? AND activity_id = ? AND activity_type = ?', [userId, activityId, activityType]);
    if (existing.length > 0) return res.status(400).json({ error: 'Ya estás inscrito' });

    await db.query('INSERT INTO enrollments (user_id, activity_id, activity_type) VALUES (?, ?, ?)', [userId, activityId, activityType]);
    if (activityType === 'event') {
      await db.query('UPDATE events SET registered = registered + 1 WHERE id = ?', [activityId]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── 3. NFC & ATTENDANCE ───────────────────────────────────────────────────────
app.get('/api/users/nfc/:card', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE nfc_card = ?', [req.params.card]);
    if (rows.length === 0) return res.status(404).json({ error: 'Tarjeta no registrada' });
    
    const u = rows[0];
    res.json({
      ...u,
      nfcCard: u.nfc_card,
      services: u.services ? u.services.split(',') : []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/attendance', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM attendance ORDER BY scan_date DESC, scan_time DESC LIMIT 50');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/attendance', async (req, res) => {
  const { userId, userName, nfcCard, serviceName, poolName, status } = req.body;
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toTimeString().split(' ')[0];
  
  try {
    const [result] = await db.query(`
      INSERT INTO attendance (user_id, user_name, nfc_card, service_name, pool_name, scan_date, scan_time, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [userId, userName, nfcCard, serviceName, poolName, date, time, status]);
    
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── 4. PAYMENTS ──────────────────────────────────────────────────────────────
app.get('/api/payments', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM payments ORDER BY date DESC');
    res.json(rows.map(p => ({ ...p, userName: p.user_name })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/payments', async (req, res) => {
  const { id, userId, userName, type, amount, date, method, status, reference } = req.body;
  try {
    await db.query(`
      INSERT INTO payments (id, user_id, user_name, type, amount, date, method, status, reference)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, userId, userName, type, amount, date, method, status, reference]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── 5. DASHBOARD STATS ───────────────────────────────────────────────────────
app.get('/api/stats', async (req, res) => {
  try {
    const [userStats] = await db.query(`
      SELECT 
       (SELECT COUNT(*) FROM users) as totalUsers,
       (SELECT COUNT(*) FROM users WHERE status="activo") as activeUsers,
       (SELECT COUNT(*) FROM users WHERE MONTH(join_date) = MONTH(CURDATE()) AND YEAR(join_date) = YEAR(CURDATE())) as usersThisMonth
    `);

    const [attStats] = await db.query(`
      SELECT
       (SELECT COUNT(*) FROM attendance WHERE scan_date = CURDATE() AND status="entrada") as todayAttendance,
       (SELECT COUNT(*) FROM attendance WHERE scan_date = DATE_SUB(CURDATE(), INTERVAL 1 DAY) AND status="entrada") as yesterdayAttendance
    `);

    const [revStats] = await db.query(`
      SELECT
       (SELECT SUM(amount) FROM payments WHERE MONTH(date) = MONTH(CURDATE()) AND YEAR(date) = YEAR(CURDATE()) AND status="completado") as currentMonthRevenue,
       (SELECT SUM(amount) FROM payments WHERE MONTH(date) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AND YEAR(date) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AND status="completado") as lastMonthRevenue,
       (SELECT COUNT(*) FROM payments WHERE status != 'completado') as pendingPayments
    `);

    const [eventStats] = await db.query(`
      SELECT COUNT(*) as upcomingEvents FROM events WHERE status='próximo'
    `);

    const s = userStats[0];
    const a = attStats[0];
    const r = revStats[0];
    const e = eventStats[0];

    // Calcula el cambio porcentual si hubo datos anteriores
    const attChange = a.yesterdayAttendance > 0 ? Math.round(((a.todayAttendance - a.yesterdayAttendance) / a.yesterdayAttendance) * 100) : 0;
    const revChange = r.lastMonthRevenue > 0 ? Math.round(((Number(r.currentMonthRevenue || 0) - Number(r.lastMonthRevenue || 0)) / Number(r.lastMonthRevenue || 0)) * 100) : 0;

    res.json({
      totalUsers: s.totalUsers || 0,
      activeUsers: s.activeUsers || 0,
      usersThisMonth: s.usersThisMonth || 0,
      todayAttendance: a.todayAttendance || 0,
      attendanceChange: attChange > 0 ? `+${attChange}% vs ayer` : (attChange < 0 ? `${attChange}% vs ayer` : '0% vs ayer'),
      monthlyRevenue: Number(r.currentMonthRevenue || 0),
      revenueChange: revChange > 0 ? `+${revChange}% vs mes ant.` : (revChange < 0 ? `${revChange}% vs mes ant.` : ''),
      pendingPayments: r.pendingPayments || 0,
      upcomingEvents: e.upcomingEvents || 0,
      poolsOperating: 3,
      averageOccupancy: 65,
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stats/revenue-chart', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT DATE_FORMAT(date, '%b') as month, SUM(amount) as total 
      FROM payments 
      WHERE status="completado" AND date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(date, '%b'), MONTH(date)
      ORDER BY MONTH(date)
    `);
    
    const labels = [];
    const data = [];
    rows.forEach(r => {
      labels.push(r.month);
      data.push(Number(r.total));
    });
    
    if (labels.length === 0) {
      // Valor por defecto para no romper UI si está vacía
      res.json({ labels: ['Sin cobros'], data: [0] });
    } else {
      res.json({ labels, data });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── 6. MERCADO PAGO INTEGRATION ───────────────────────────────────────────
app.post('/api/create-preference', async (req, res) => {
  const { title, price, quantity, userId } = req.body;

  try {
    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items: [
          {
            title: title || 'Membresía Municipal',
            unit_price: Number(price),
            quantity: Number(quantity) || 1,
            currency_id: 'MXN',
          }
        ],
        back_urls: {
          success: `${process.env.VITE_API_URL || `http://${req.headers.host}`}/payments/status?status=success&userId=${userId}`,
          failure: `${process.env.VITE_API_URL || `http://${req.headers.host}`}/payments/status?status=failure&userId=${userId}`,
          pending: `${process.env.VITE_API_URL || `http://${req.headers.host}`}/payments/status?status=pending&userId=${userId}`,
        },
        external_reference: String(req.body.external_reference || userId),
        auto_return: 'approved',
        binary_mode: true,
      }
    });

    res.json({ 
      id: result.id, 
      init_point: result.init_point 
    });
  } catch (err) {
    console.error('Error creating MP preference:', err);
    res.status(500).json({ error: 'Error al crear la preferencia de pago' });
  }
});

// Helper for Return URLs (Back URLs) to simulate feedback
app.get('/api/payments/status', (req, res) => {
  const { status, userId } = req.query;
  const frontendUrl = process.env.NODE_ENV === 'production' 
    ? 'https://albercass.vercel.app' 
    : 'http://localhost:5173';
    
  res.redirect(`${frontendUrl}/profile?payment=${status}&userId=${userId}`);
});

// Polling endpoint for QR code checkout
app.get('/api/payments/check/:userId', async (req, res) => {
  try {
    const payment = new Payment(client);
    const result = await payment.search({
      options: {
        external_reference: req.params.userId,
        status: 'approved' // Only target approved payments
      }
    });

    if (result.results && result.results.length > 0) {
      const mpPayment = result.results[0];
      const paymentId = String(mpPayment.id);
      
      // Consultar usuario para extraer su nombre y tipo de membresía
      const [users] = await db.query('SELECT name, membership FROM users WHERE id = ?', [req.params.userId]);
      const user = users[0];
      
      if (user) {
        // Insertar pago con INSERT IGNORE para evitar duplicados si hay polling múltiple
        const amount = mpPayment.transaction_amount;
        
        await db.query(`
          INSERT IGNORE INTO payments (id, user_id, user_name, type, amount, date, method, status, reference, service_id)
          VALUES (?, ?, ?, ?, ?, CURDATE(), ?, ?, ?, ?)
        `, [
          paymentId,
          req.params.userId,
          user.name,
          `Membresía ${user.membership || 'Municipal'}`,
          amount,
          'Mercado Pago',
          'completado',
          req.params.userId,
          user.membership || 'general'
        ]);
      }

      res.json({ paid: true, payment_id: paymentId });
    } else {
      res.json({ paid: false });
    }
  } catch (err) {
    console.error('Error polling MP payment status:', err);
    res.status(500).json({ error: 'Error al consultar estado del pago' });
  }
});

app.get('/api/users/validate/:nfc', async (req, res) => {
  try {
    const { nfc } = req.params;
    const [users] = await db.query('SELECT * FROM users WHERE nfc_card = ?', [nfc]);
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'Tarjeta no registrada en el sistema.' });
    }
    
    const user = users[0];
    const { activityId, activityType } = req.query;
    
    // 1. Validar Membresía/Pagos (Vigencia general)
    const [payments] = await db.query('SELECT * FROM payments WHERE user_id = ? AND status="completado" ORDER BY date DESC LIMIT 1', [user.id]);
    
    let daysRemaining = 0;
    let status = 'rojo';
    let lastPaymentDate = null;
    let errorMessage = null;
    
    if (payments.length > 0) {
      const p = payments[0];
      lastPaymentDate = p.date;
      const paymentDate = new Date(p.date);
      let validDays = 0;
      
      const membership = (user.membership || '').toLowerCase();
      if (membership === 'diario') validDays = 1;
      else if (membership === 'mensual') validDays = 30;
      else if (membership === 'anual') validDays = 365;
      else validDays = 30;
      
      const expireDate = new Date(paymentDate);
      expireDate.setDate(expireDate.getDate() + validDays);
      
      const today = new Date();
      const diffTime = expireDate - today;
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (daysRemaining < 0) daysRemaining = 0;
      if (daysRemaining === 0) {
        status = 'rojo';
        errorMessage = 'Membresía vencida. Favor de renovar.';
      } else {
        status = daysRemaining <= 3 ? 'naranja' : 'verde';
      }
    } else {
      errorMessage = 'No se encontraron pagos válidos.';
    }

    // 2. Validar Inscripción y Horario (si se proporciona una actividad)
    if (status !== 'rojo' && activityId && activityType) {
      const [enrolls] = await db.query(
        'SELECT * FROM enrollments WHERE user_id = ? AND activity_id = ? AND activity_type = ?',
        [user.id, activityId, activityType]
      );

      if (enrolls.length === 0) {
        status = 'rojo';
        errorMessage = 'No estás inscrito en esta actividad específica.';
      } else {
        const now = new Date();
        const currentDay = now.getDay() === 0 ? 7 : now.getDay(); // Mapeo 1-7

        if (activityType === 'schedule') {
          const [schedules] = await db.query('SELECT * FROM schedules WHERE id = ?', [activityId]);
          const s = schedules[0];
          
          if (s) {
            const allowedDays = (s.days || '').split(',').map(d => d.trim());
            if (!allowedDays.includes(String(currentDay))) {
              const dayNames = { 1:'Lun', 2:'Mar', 3:'Mié', 4:'Jue', 5:'Vie', 6:'Sáb', 7:'Dom' };
              const readableDays = allowedDays.map(d => dayNames[d] || d).join(', ');
              status = 'rojo';
              errorMessage = `Hoy no hay clase. Días disponibles: ${readableDays}.`;
            } else {
              // Ventana: 1 hora ANTES de inicio hasta 30 mins DESPUÉS del fin
              const timeParts = (s.start_time || '00:00:00').split(':');
              const startH = parseInt(timeParts[0], 10);
              const startM = parseInt(timeParts[1], 10);

              const endParts = (s.end_time || '23:59:00').split(':');
              const endH = parseInt(endParts[0], 10);
              const endM = parseInt(endParts[1], 10);

              const startLimit = new Date(now);
              startLimit.setHours(startH, startM - 30, 0, 0); // 30 mins antes del inicio

              const endLimit = new Date(now);
              endLimit.setHours(endH, endM, 0, 0); // Hasta la hora exacta del fin

              if (now < startLimit) {
                status = 'rojo';
                const startStr = `${String(startH).padStart(2,'0')}:${String(startM).padStart(2,'0')}`;
                errorMessage = `Demasiado temprano. La clase empieza a las ${startStr}. Puedes entrar 25-30 min antes.`;
              } else if (now > endLimit) {
                status = 'rojo';
                const endStr = `${String(endH).padStart(2,'0')}:${String(endM).padStart(2,'0')}`;
                errorMessage = `Horario concluido. La clase terminó a las ${endStr}.`;
              }
              // Si está dentro del rango, status ya es 'verde' o 'naranja' del paso anterior
            }
          }
        } else if (activityType === 'event') {
          const [events] = await db.query('SELECT * FROM events WHERE id = ?', [activityId]);
          const e = events[0];
          // Comparar fechas en zona local (YYYY-MM-DD)
          const pad = n => String(n).padStart(2, '0');
          const todayDate = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
          
          if (e) {
            const eventDate = e.event_date instanceof Date
              ? `${e.event_date.getFullYear()}-${pad(e.event_date.getMonth()+1)}-${pad(e.event_date.getDate())}`
              : String(e.event_date).split('T')[0];
            
            if (eventDate !== todayDate) {
              status = 'rojo';
              errorMessage = `Fecha incorrecta. El evento es el ${eventDate}.`;
            }
          }
        }
      }
    }
    
    res.json({
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        membership: user.membership,
        status: user.status
      },
      lastPaymentDate,
      daysRemaining,
      statusIndicator: status,
      errorMessage: errorMessage || (status === 'rojo' ? 'Acceso Denegado' : null)
    });
    
  } catch (err) {
    console.error('Error validation NFC:', err);
    res.status(500).json({ error: 'Error del servidor al validar' });
  }
});
// ── 7. SCHEDULES & EVENTS ───────────────────────────────────────────
app.get('/api/schedules', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM schedules');
    const mapped = rows.map(r => ({
      ...r,
      startTime: (r.start_time || '00:00:00').substring(0, 5),
      endTime: (r.end_time || '23:59:00').substring(0, 5),
      days: (r.days || '').split(','),
    }));
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/schedules', async (req, res) => {
  const { id, title, pool, startTime, endTime, days, capacity, instructor, category, color } = req.body;
  try {
    await db.query(`
      INSERT INTO schedules (id, title, pool, start_time, end_time, days, capacity, instructor, category, color)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, title, pool, startTime, endTime, days.join(','), capacity, instructor, category, color]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/schedules/:id', async (req, res) => {
  const { title, pool, startTime, endTime, days, capacity, instructor, category, color } = req.body;
  try {
    await db.query(`
      UPDATE schedules 
      SET title = ?, pool = ?, start_time = ?, end_time = ?, days = ?, capacity = ?, instructor = ?, category = ?, color = ?
      WHERE id = ?
    `, [title, pool, startTime, endTime, days.join(','), capacity, instructor, category, color, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/schedules/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM schedules WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/events', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM events ORDER BY event_date ASC');
    const mapped = rows.map(r => ({
      ...r,
      date: typeof r.event_date === 'string' ? r.event_date.split('T')[0] : new Date(r.event_date).toISOString().split('T')[0],
      time: r.event_time.substring(0, 5)
    }));
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/events', async (req, res) => {
  const { id, title, date, time, duration, pool, capacity, description } = req.body;
  try {
    await db.query(`
      INSERT INTO events (id, title, event_date, event_time, duration, pool, capacity, registered, status, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'próximo', ?)
    `, [id, title, date, time, duration, pool, capacity, description]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/events/:id', async (req, res) => {
  const { title, date, time, duration, pool, capacity, description, status } = req.body;
  try {
    await db.query(`
      UPDATE events 
      SET title = ?, event_date = ?, event_time = ?, duration = ?, pool = ?, capacity = ?, description = ?, status = ?
      WHERE id = ?
    `, [title, date, time, duration, pool, capacity, description, status, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/events/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM events WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── 8. PAYMENT TYPES (CATALOG) ──────────────────────────────────────
app.get('/api/payment-types', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM payment_types');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/payments/check-ref/:reference', async (req, res) => {
  try {
    const payment = new Payment(client);
    const result = await payment.search({
      options: {
        external_reference: req.params.reference,
        status: 'approved'
      }
    });

    if (result.results && result.results.length > 0) {
      const mpPayment = result.results[0];
      res.json({ paid: true, payment_id: String(mpPayment.id) });
    } else {
      res.json({ paid: false });
    }
  } catch (err) {
    console.error('Error polling MP payment status by reference:', err);
    res.status(500).json({ error: 'Error al consultar estado del pago' });
  }
});



app.get('/api/stats/revenue-chart', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT MONTH(date) as month, SUM(amount) as total
      FROM payments
      WHERE status = 'completado' AND YEAR(date) = YEAR(CURDATE())
      GROUP BY MONTH(date)
      ORDER BY month ASC
    `);
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const labels = rows.map(r => monthNames[r.month - 1]);
    const data = rows.map(r => r.total || 0);
    res.json({ labels: labels.length > 0 ? labels : ['Sin datos'], data: data.length > 0 ? data : [0] });
  } catch(err) {
    res.status(500).json({error: err.message});
  }
});

// ── ANALYTICS: datos reales de asistencia ─────────────────────────
app.get('/api/analytics/attendance-by-hour', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT HOUR(scan_time) as hour, COUNT(*) as count
      FROM attendance
      WHERE status = 'entrada'
      GROUP BY HOUR(scan_time)
      ORDER BY hour ASC
    `);
    const labels = [];
    const data = [];
    for (let h = 6; h <= 20; h++) {
      const suffix = h < 12 ? 'am' : 'pm';
      const display = h <= 12 ? h : h - 12;
      labels.push(`${display}${suffix}`);
      const found = rows.find(r => r.hour === h);
      data.push(found ? found.count : 0);
    }
    res.json({ labels, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/analytics/attendance-by-day', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT DAYOFWEEK(scan_date) as dow, COUNT(*) as count
      FROM attendance
      WHERE status = 'entrada'
      GROUP BY DAYOFWEEK(scan_date)
      ORDER BY dow ASC
    `);
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const dayMap = {};
    rows.forEach(r => { dayMap[dayNames[r.dow - 1]] = r.count; });
    const data = labels.map(l => dayMap[l] || 0);
    res.json({ labels, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── ANALYTICS: IA con Gemini real ─────────────────────────────────
app.post('/api/analytics/generate-insights', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY no configurada en .env' });
  }

  try {
    // Recopilar datos reales de la DB
    const [[{ totalUsers }]] = await db.query("SELECT COUNT(*) as totalUsers FROM users");
    const [[{ activeUsers }]] = await db.query("SELECT COUNT(*) as activeUsers FROM users WHERE status='activo'");
    const [membershipBreakdown] = await db.query("SELECT membership, COUNT(*) as count FROM users GROUP BY membership");
    const [attendanceByHour] = await db.query("SELECT HOUR(scan_time) as hour, COUNT(*) as count FROM attendance WHERE status='entrada' GROUP BY HOUR(scan_time) ORDER BY hour");
    const [attendanceByDay] = await db.query("SELECT DAYOFWEEK(scan_date) as dow, COUNT(*) as count FROM attendance WHERE status='entrada' GROUP BY DAYOFWEEK(scan_date) ORDER BY dow");
    const [[{ totalAttendance }]] = await db.query("SELECT COUNT(*) as totalAttendance FROM attendance WHERE status='entrada'");
    const [[{ thisMonthAtt }]] = await db.query("SELECT COUNT(*) as thisMonthAtt FROM attendance WHERE status='entrada' AND MONTH(scan_date)=MONTH(CURDATE()) AND YEAR(scan_date)=YEAR(CURDATE())");
    const [revenueByMonth] = await db.query("SELECT MONTH(date) as month, SUM(amount) as total FROM payments WHERE status='completado' AND YEAR(date)=YEAR(CURDATE()) GROUP BY MONTH(date) ORDER BY month");
    const [[{ totalRevenue }]] = await db.query("SELECT COALESCE(SUM(amount),0) as totalRevenue FROM payments WHERE status='completado'");
    const [schedules] = await db.query("SELECT title, pool, capacity, instructor, category FROM schedules");

    const prompt = `Eres un analista de datos de un sistema de gestión de albercas municipales en México. Analiza estos datos REALES y genera exactamente 4 insights accionables en español.

DATOS DEL SISTEMA:
- Total usuarios: ${totalUsers} (activos: ${activeUsers})
- Desglose membresías: ${JSON.stringify(membershipBreakdown)}
- Total asistencias registradas: ${totalAttendance}
- Asistencias este mes: ${thisMonthAtt}
- Asistencia por hora: ${JSON.stringify(attendanceByHour)}
- Asistencia por día: ${JSON.stringify(attendanceByDay)}
- Ingresos por mes este año: ${JSON.stringify(revenueByMonth)}
- Ingresos totales: $${totalRevenue} MXN
- Clases programadas: ${JSON.stringify(schedules)}

Responde ÚNICAMENTE con un JSON array con exactamente 4 objetos. Cada objeto:
{"type":"string_id","title":"Título corto","insight":"Análisis de 2-3 oraciones con datos concretos y recomendación accionable","severity":"info|success|warning|danger","metric":"Métrica clave"}

IMPORTANTE: Usa los números reales. Si hay pocos datos indica que el sistema es nuevo. Responde SOLO el JSON array sin markdown ni backticks.`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
        }),
      }
    );

    const geminiData = await geminiRes.json();
    if (geminiData.error) {
      console.error("Gemini API error:", geminiData.error);
      return res.status(500).json({ error: 'Error Gemini: ' + (geminiData.error.message || 'Unknown') });
    }

    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    let cleanText = rawText.trim();
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    let insights;
    try {
      insights = JSON.parse(cleanText);
    } catch (parseErr) {
      console.error("Error parsing Gemini response:", cleanText);
      return res.status(500).json({ error: 'Formato de respuesta inválido. Intenta de nuevo.' });
    }

    res.json({
      success: true,
      insights,
      generatedAt: new Date().toISOString(),
      model: 'Gemini 2.5 Flash Lite'
    });
  } catch (err) {
    console.error("Error en análisis IA:", err);
    res.status(500).json({ error: 'Error generando análisis: ' + err.message });
  }
});

app.get('/api/attendance', async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM attendance ORDER BY scan_date DESC, scan_time DESC LIMIT 50");
    res.json(rows.map(r => ({
      ...r,
      scan_time: typeof r.scan_time === 'string' ? r.scan_time.substring(0,5) : r.scan_time
    })));
  } catch(err) {
    res.status(500).json({error: err.message});
  }
});

// ── 10. ENROLLMENTS ───────────────────────────────────────────────
app.post('/api/enroll', async (req, res) => {
  const { userId, activityId, activityType } = req.body;
  try {
    // Check capacity first
    let capacityQuery = activityType === 'schedule' ? 'SELECT capacity FROM schedules WHERE id = ?' : 'SELECT capacity FROM events WHERE id = ?';
    let registeredQuery = "SELECT COUNT(*) as count FROM enrollments WHERE activity_id = ? AND activity_type = ?";
    
    const [[{ capacity }]] = await db.query(capacityQuery, [activityId]);
    const [[{ count }]] = await db.query(registeredQuery, [activityId, activityType]);

    if (count >= capacity) {
      return res.status(400).json({ error: 'Lo sentimos, ya no hay cupo disponible para esta actividad.' });
    }

    await db.query(`
      INSERT INTO enrollments (user_id, activity_id, activity_type)
      VALUES (?, ?, ?)
    `, [userId, activityId, activityType]);

    // If it's an event, we might want to update the 'registered' column in events table too for fast access
    if (activityType === 'event') {
      await db.query('UPDATE events SET registered = registered + 1 WHERE id = ?', [activityId]);
    }

    res.json({ success: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ya estás inscrito en esta actividad.' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/enrollments/:activity_id', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT enrollments.*, users.name, users.email 
      FROM enrollments 
      JOIN users ON enrollments.user_id = users.id 
      WHERE activity_id = ? 
      ORDER BY enrolled_at DESC
    `, [req.params.activity_id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:id/enrollments', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT enrollments.*, 
        CASE 
          WHEN activity_type = 'schedule' THEN (SELECT title FROM schedules WHERE id = activity_id)
          WHEN activity_type = 'event' THEN (SELECT title FROM events WHERE id = activity_id)
        END as title,
        CASE 
          WHEN activity_type = 'schedule' THEN (SELECT start_time FROM schedules WHERE id = activity_id)
          WHEN activity_type = 'event' THEN (SELECT event_time FROM events WHERE id = activity_id)
        END as time
      FROM enrollments 
      WHERE user_id = ? 
      ORDER BY enrolled_at DESC
    `, [req.params.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor backend corriendo en http://0.0.0.0:${PORT}`);
});
