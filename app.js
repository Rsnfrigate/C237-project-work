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
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// ALICIA & FIONA - SESSION CONFIG
app.use(session({
  secret: 'rp_resource_centre_secret',
  resave: false,
  saveUninitialized: true
}));

// WEN YI & QUSYARI - MYSQL DB CONNECTION
const db = mysql.createConnection({
  host: 'mebqsc.h.filess.io',
  port: 3307,
  user: 'ca2project_chargemice',
  password: '05a81242deaf40e2e22709e2c6f28311f2dc92fd',
  database: 'ca2project_chargemice'
});

db.connect((err) => {
  if (err) console.error("Error connecting to MySQL:", err);
  else console.log("Connected to MySQL database");
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

// DASHBOARD ROUTE (Wen Yi)
app.get('/dashboard', isLoggedIn, (req, res) => {

  const user = req.session.user;

  let sql = 'SELECT * FROM laptops'

  db.query(sql, (error, results) => {

    if (error) {

      console.error('Error fetching laptops', error.message);
      return res.status(500).send('Error fetching laptops');

    }

    res.render('dashboard', { user, laptops: results, status: ' ' });

  })

})

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

// SEARCH (Wen Yi)
app.get('/search', isLoggedIn, (req, res) => {
  const { status } = req.query;
  const user = req.session.user;  
  const sql = 'SELECT * FROM laptops WHERE status = ?';

  db.query(sql, [status], (err, results) => {

    if (err) return res.send('Search error.');
    res.render('dashboard', { user, laptops: results , status});

  });

});

// DELETE (Admin only) (Wen Yi)

app.get('/delete/:id', isLoggedIn, isAdmin, (req, res) => {

  db.query('DELETE FROM laptops WHERE id = ?', [req.params.id], (err) => {

    if (err) return res.send('Delete failed.');
    res.redirect('/dashboard');

  });

});

// ADD PRODUCT PAGE (WEN YI)
app.get('/addProduct', isLoggedIn, (req, res) => {
  
  const user = req.session.user;

  if (user.role === 'admin') {

    res.render('addProduct');

  } else {

    res.status(403).send('Access denied: Admins only');

  }
});

// ADD PRODUCT ACTION (WEN YI)
app.post('/addProduct', isLoggedIn, (req, res) => {

  const user = req.session.user;

  if (user.role === 'admin') {
    const { model, status } = req.body;

    const sql = 'INSERT INTO laptops (model, status) VALUES (?, ?)';
    db.query(sql, [model, status], (error, results) => {

      if (error) {

        console.error('Error adding laptop:', error.message);
        return res.status(500).send('Error adding laptop');

      } else {

        res.redirect('/dashboard');

      }

    });

  } else {

    res.status(403).send('Access denied: Admins only');

  }
});

//EDIT PRODUCT PAGE (WEN YI)
app.get('/editProduct/:id', isLoggedIn, (req,res) => {

  const id = req.params.id;
  const sql = 'SELECT * FROM laptops WHERE id = ?';

  db.query(sql, [id], (error, results) => {

    if (error) {

      console.error('Database Error', error.message);
      return res.status(500).send('Error fetching product');

    } else if (results.length > 0) {

      res.render('edititem', { laptops: results[0] });

    }else {

      res.status(404).send('laptops not found');

    }

  })

})

app.post('/editProduct/:id', isLoggedIn, (req,res) => {

  const id = req.params.id;

  const { model, status } = req.body;

  const sql = 'UPDATE laptops SET model = ?, status = ? WHERE id = ?';

  db.query(sql, [model, status, id], (error, results) => {

    if (error) {

      console.error('Error updating product:', error.message);
      return res.status(500).send('Error updating product');

    }

    res.redirect('/dashboard');

  })

})


// FILTER BUTTON FOR LOAN REQUEST (Wen Yi)
app.get('/searchLoanRequest', isLoggedIn, (req, res) => {
  const { status } = req.query;
  const sql = 'SELECT loans.*, laptops.model FROM loan_requests AS loans JOIN laptops ON loans.laptop_id = laptops.id WHERE loans.status = ?';
  db.query(sql, [status], (err, loans) => {
    if (err) return res.send('Search error.');
    res.render('LoanRequest', { user: req.session.user, loans, status });
  });
});



//LOAN REQUEST PAGE (WEN YI)
app.get('/LoanRequest', isLoggedIn, (req, res) => {

  const user = req.session.user;
  
  let sql = 'SELECT loans.*, laptops.model FROM loan_requests AS loans JOIN laptops ON loans.laptop_id = laptops.id';

  db.query(sql, [user.id], (err, loans) => {
      
    if (err) {
      
      console.error('Error loading Loan Requests', err.message);
      return res.send('Error loading Loan Requests');

    } 

      res.render('LoanRequest', { user, loans, status: '' });


  })

})  

// Loan Request Status Update (Wen Yi)

app.get('/editLoanRequest/:id', isLoggedIn, (req,res) => {

  const id = req.params.id;
  const sql = 'SELECT * FROM loan_requests WHERE id = ?';

  db.query(sql, [id], (error, results) => {

    if (error) {

      console.error('Database Error', error.message);
      return res.status(500).send('Error fetching Loan request');

    } else if (results.length > 0) {

      res.render('editLoanRequest', { loan : results[0], status: results[0].status });

    }else {

      res.status(404).send('Loan Request not found');

    }

  })

})

app.post('/editLoanRequest/:id', isLoggedIn, (req,res) => {

  const id = req.params.id;

  const { status } = req.body;

  const sql = 'UPDATE loan_requests SET status = ? WHERE id = ?';

  db.query(sql, [status, id], (error, result) => {

    if (error) {

      console.error('Error updating loan request:', error.message);
      return res.status(500).send('Error updating loan request');

    }

    res.redirect('/LoanRequest');

  })

})

// SERVER START
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
