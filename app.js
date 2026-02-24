// app.js
const express = require('express');
const mysql = require('mysql2');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware to parse form data and JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Root route - redirect to login (MUST be before static file serving)
app.get('/', (req, res) => {
  res.redirect('/login.html');
});

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// MySQL connection (update user/password if needed)
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',             // your MySQL username
  password: 'nishu@2005',   // your MySQL password
  database: 'farm_db'       // database name
});

db.connect(err => {
  if (err) {
    console.error('❌ DB connection error:', err);
  } else {
    console.log('✅ Connected to MySQL');
  }
});

/* ========== LOGIN ========== */

// Login endpoint with demo credentials
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Demo credentials
  const DEMO_USERNAME = 'admin';
  const DEMO_PASSWORD = '123';

  if (username === DEMO_USERNAME && password === DEMO_PASSWORD) {
    res.json({ success: true, message: 'Login successful!' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid username or password' });
  }
});

/* ========== FARMERS ========== */

// Get all farmers
app.get('/farmers', (req, res) => {
  db.query('SELECT * FROM farmers', (err, rows) => {
    if (err) return res.status(500).send('Error fetching farmers');
    res.json(rows);
  });
});

// Insert farmer
app.post('/farmers', (req, res) => {
  const { name, email, phone, address } = req.body;
  const sql = 'INSERT INTO farmers (name, email, phone, address) VALUES (?, ?, ?, ?)';
  db.execute(sql, [name, email, phone, address], err => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error inserting farmer');
    }
    res.redirect('/farmers.html');
  });
});

// Delete farmer
app.delete('/farmers/:id', (req, res) => {
  db.execute('DELETE FROM farmers WHERE id = ?', [req.params.id], err => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error deleting farmer');
    }
    res.sendStatus(200);
  });
});
app.delete('/farmers/:id', (req, res) => {
  const farmerId = req.params.id;

  // Order matters: delete child rows first, then the farmer
  const queries = [
    'DELETE FROM crops WHERE farmer_id = ?',
    'DELETE FROM resources WHERE farmer_id = ?',
    'DELETE FROM expenses WHERE farmer_id = ?',
    'DELETE FROM incomes WHERE farmer_id = ?',
    'DELETE FROM farmers WHERE id = ?'
  ];

  function runQuery(index) {
    if (index >= queries.length) {
      // All queries done successfully
      return res.sendStatus(200);
    }

    db.execute(queries[index], [farmerId], (err) => {
      if (err) {
        console.error('Error in delete step', index, err);
        return res.status(500).send('Error deleting farmer and related data');
      }
      runQuery(index + 1);
    });
  }

  runQuery(0);
});




/* ========== CROPS ========== */

// Get all crops
app.get('/crops', (req, res) => {
  db.query('SELECT * FROM crops', (err, rows) => {
    if (err) return res.status(500).send('Error fetching crops');
    res.json(rows);
  });
});

// Insert crop
app.post('/crops', (req, res) => {
  const { name, variety, planting_date, harvest_date, farmer_id } = req.body;
  const sql = `
    INSERT INTO crops (name, variety, planting_date, harvest_date, farmer_id)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.execute(sql, [name, variety, planting_date, harvest_date, farmer_id], err => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error inserting crop');
    }
    res.redirect('/crops.html');
  });
});

// Delete crop
app.delete('/crops/:id', (req, res) => {
  db.execute('DELETE FROM crops WHERE id = ?', [req.params.id], err => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error deleting crop');
    }
    res.sendStatus(200);
  });
});

/* ========== RESOURCES ========== */

// Get all resources
app.get('/resources', (req, res) => {
  db.query('SELECT * FROM resources', (err, rows) => {
    if (err) return res.status(500).send('Error fetching resources');
    res.json(rows);
  });
});

// Insert resource
app.post('/resources', (req, res) => {
  const { name, type, quantity, cost, farmer_id } = req.body;
  const sql = `
    INSERT INTO resources (name, type, quantity, cost, farmer_id)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.execute(sql, [name, type, quantity, cost, farmer_id], err => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error inserting resource');
    }
    res.redirect('/resources.html');
  });
});

// Delete resource
app.delete('/resources/:id', (req, res) => {
  db.execute('DELETE FROM resources WHERE id = ?', [req.params.id], err => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error deleting resource');
    }
    res.sendStatus(200);
  });
});

/* ========== EXPENSES ========== */

// Get all expenses
app.get('/expenses', (req, res) => {
  const sql = `
    SELECT 
      id,
      description,
      amount,
      \`date\` AS expense_date,  -- alias to match frontend field name
      farmer_id,
      crop_id
    FROM expenses
  `;
  db.query(sql, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error fetching expenses');
    }
    res.json(rows);
  });
});

// Insert expense
app.post('/expenses', (req, res) => {
  const { description, amount, expense_date, farmer_id, crop_id } = req.body;

  const sql = `
    INSERT INTO expenses (description, amount, \`date\`, farmer_id, crop_id)
    VALUES (?, ?, ?, ?, ?)
  `;

  // crop_id might be empty from form → convert "" to null
  const cropIdValue = crop_id ? crop_id : null;

  db.execute(sql, [description, amount, expense_date || null, farmer_id, cropIdValue], err => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error inserting expense');
    }
    res.redirect('/expenses.html');
  });
});

// Delete expense
app.delete('/expenses/:id', (req, res) => {
  db.execute('DELETE FROM expenses WHERE id = ?', [req.params.id], err => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error deleting expense');
    }
    res.sendStatus(200);
  });
});

// Get expense summary
app.get('/expense-summary', (req, res) => {
  const sql = `
    SELECT
      farmer_id,
      SUM(amount) AS total_amount,
      COUNT(*) AS expense_count,
      MAX(\`date\`) AS last_expense_date
    FROM expenses
    GROUP BY farmer_id
  `;
  db.query(sql, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error fetching expense summary');
    }
    res.json(rows);
  });
});


/* ========== INCOMES ========== */

// Get all incomes
app.get('/incomes', (req, res) => {
  db.query('SELECT * FROM incomes', (err, rows) => {
    if (err) return res.status(500).send('Error fetching incomes');
    res.json(rows);
  });
});

// Insert income
app.post('/incomes', (req, res) => {
  const { description, amount, income_date, farmer_id } = req.body;
  const sql = `
    INSERT INTO incomes (description, amount, income_date, farmer_id)
    VALUES (?, ?, ?, ?)
  `;
  db.execute(sql, [description, amount, income_date, farmer_id], err => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error inserting income');
    }
    res.redirect('/incomes.html');
  });
});

// Delete income
app.delete('/incomes/:id', (req, res) => {
  db.execute('DELETE FROM incomes WHERE id = ?', [req.params.id], err => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error deleting income');
    }
    res.sendStatus(200);
  });
});

/* ========== START SERVER ========== */

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
