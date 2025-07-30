// app.js

const express = require('express');
const session = require('express-session');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const path = require('path');
const app = express();

// HAAD - UI SETUP
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ALICIA & FIONA - SESSION CONFIG
app.use(session({
  secret: 'rp_resource_centre_secret',
  resave: false,
  saveUninitialized: true
}));

// WEN YI & QUSYARI - MYSQL DB CONNECTION
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Republic_C207',
  database: 'rp_resource_centre'
});

// ALICIA & FIONA - AUTH MIDDLEWARE
function isLoggedIn(req, res, next) {
  if (req.session.user) return next();
  res.redirect('/login');
}

function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') return next();
  res.status(403).send('Forbidden');
}

// ROUTES
app.get('/', (req, res) => res.redirect('/login'));

app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const sql = 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)';
  db.query(sql, [name, email, hashedPassword, role || 'student'], (err) => {
    if (err) return res.send('Registration failed.');
    res.redirect('/login');
  });
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const sql = 'SELECT * FROM users WHERE email = ?';
  db.query(sql, [email], async (err, results) => {
    if (err || results.length === 0) return res.send('Email not found.');
    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.send('Incorrect password.');
    req.session.user = { id: user.id, name: user.name, role: user.role };
    res.redirect('/dashboard');
  });
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

app.get('/dashboard', isLoggedIn, (req, res) => {
  const user = req.session.user;
  let sql = 'SELECT loans.*, laptops.model FROM loan_requests AS loans JOIN laptops ON loans.laptop_id = laptops.id';
  if (user.role === 'student') {
    sql += ' WHERE loans.user_id = ?';
    db.query(sql, [user.id], (err, loans) => {
      if (err) return res.send('Error loading dashboard');
      res.render('dashboard', { user, loans });
    });
  } else {
    db.query(sql, (err, loans) => {
      if (err) return res.send('Error loading dashboard');
      res.render('dashboard', { user, loans });
    });
  }
});

app.get('/loan', isLoggedIn, (req, res) => {
  db.query('SELECT * FROM laptops WHERE status = "available"', (err, laptops) => {
    if (err) return res.send('Error loading laptops');
    res.render('loan-form', { laptops });
  });
});

app.post('/loan', isLoggedIn, (req, res) => {
  const { laptop_id, loan_date, return_date } = req.body;
  const sql = 'INSERT INTO loan_requests (user_id, laptop_id, loan_date, return_date) VALUES (?, ?, ?, ?)';
  db.query(sql, [req.session.user.id, laptop_id, loan_date, return_date], (err) => {
    if (err) {
      console.error('SQL ERROR:', err);  // ✅ Proper logging inside if block
      return res.send('Loan request failed.');
    }
    db.query('UPDATE laptops SET status = "in use" WHERE id = ?', [laptop_id]);
    res.redirect('/dashboard');
  });
});


//PinHao - Search and Filter
app.get('/search', isLoggedIn, (req, res) => {
  const { status } = req.query;
  const sql = 'SELECT loans.*, laptops.model FROM loan_requests AS loans JOIN laptops ON loans.laptop_id = laptops.id WHERE loans.status = ?';
  db.query(sql, [status], (err, loans) => {
    if (err) return res.send('Search error.');
    res.render('dashboard', { user: req.session.user, loans });
  });
});

// DELETE (Admin only)
app.get('/delete/:id', isLoggedIn, isAdmin, (req, res) => {
  db.query('DELETE FROM loan_requests WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.send('Delete failed.');
    res.redirect('/dashboard');
  });
});

// SERVER START
app.listen(3000, () => console.log('http://localhost:3000'));
