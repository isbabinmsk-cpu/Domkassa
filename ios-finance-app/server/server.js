const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// Session storage (in production, use proper sessions)
const sessions = new Map();

// Auth middleware
const requireAuth = (req, res, next) => {
  const sessionId = req.headers['x-session-id'];
  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.user = sessions.get(sessionId);
  next();
};

// ============ AUTH ROUTES ============

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const sessionId = Math.random().toString(36).substring(2);
  sessions.set(sessionId, { id: user.id, username: user.username });

  res.json({ 
    success: true, 
    sessionId,
    user: { id: user.id, username: user.username }
  });
});

app.post('/api/auth/logout', (req, res) => {
  const sessionId = req.headers['x-session-id'];
  if (sessionId) {
    sessions.delete(sessionId);
  }
  res.json({ success: true });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// ============ CATEGORIES ROUTES ============

app.get('/api/categories', requireAuth, (req, res) => {
  const { type } = req.query;
  let query;
  
  if (type) {
    query = db.prepare('SELECT * FROM categories WHERE type = ? ORDER BY name');
    res.json(query.all(type));
  } else {
    query = db.prepare('SELECT * FROM categories ORDER BY type, name');
    res.json(query.all());
  }
});

app.get('/api/categories/:id/subcategories', requireAuth, (req, res) => {
  const query = db.prepare('SELECT * FROM categories WHERE parent_id = ? ORDER BY name');
  res.json(query.all(req.params.id));
});

app.post('/api/categories', requireAuth, (req, res) => {
  const { name, type, icon, color, parentId } = req.body;
  
  if (!name || !type) {
    return res.status(400).json({ error: 'Name and type required' });
  }

  const stmt = db.prepare(`
    INSERT INTO categories (name, type, icon, color, parent_id) VALUES (?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(name, type, icon || 'pricetag', color || '#007AFF', parentId || null);
  res.json({ id: result.lastInsertRowid, ...req.body });
});

app.put('/api/categories/:id', requireAuth, (req, res) => {
  const { name, icon, color } = req.body;
  
  const stmt = db.prepare(`
    UPDATE categories SET name = ?, icon = ?, color = ? WHERE id = ?
  `);
  
  stmt.run(name, icon, color, req.params.id);
  res.json({ success: true });
});

app.delete('/api/categories/:id', requireAuth, (req, res) => {
  const stmt = db.prepare('DELETE FROM categories WHERE id = ?');
  stmt.run(req.params.id);
  res.json({ success: true });
});

// ============ ACCOUNTS ROUTES ============

app.get('/api/accounts', requireAuth, (req, res) => {
  const query = db.prepare('SELECT * FROM accounts WHERE is_active = 1 ORDER BY name');
  res.json(query.all());
});

app.post('/api/accounts', requireAuth, (req, res) => {
  const { name, type, icon, color, balance } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Name required' });
  }

  const stmt = db.prepare(`
    INSERT INTO accounts (name, type, icon, color, balance) VALUES (?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(name, type || 'cash', icon || 'wallet', color || '#007AFF', balance || 0);
  res.json({ id: result.lastInsertRowid, ...req.body });
});

app.put('/api/accounts/:id', requireAuth, (req, res) => {
  const { name, type, icon, color, balance, is_active } = req.body;
  
  const stmt = db.prepare(`
    UPDATE accounts SET name = ?, type = ?, icon = ?, color = ?, balance = ?, is_active = ? WHERE id = ?
  `);
  
  stmt.run(name, type, icon, color, balance, is_active !== undefined ? is_active : 1, req.params.id);
  res.json({ success: true });
});

app.delete('/api/accounts/:id', requireAuth, (req, res) => {
  const stmt = db.prepare('UPDATE accounts SET is_active = 0 WHERE id = ?');
  stmt.run(req.params.id);
  res.json({ success: true });
});

// ============ TRANSACTIONS ROUTES ============

app.get('/api/transactions', requireAuth, (req, res) => {
  const { type, categoryId, accountId, startDate, endDate, limit } = req.query;
  
  let query = `
    SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color,
           a.name as account_name, a.icon as account_icon
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    JOIN accounts a ON t.account_id = a.id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (type) {
    query += ' AND t.type = ?';
    params.push(type);
  }
  
  if (categoryId) {
    query += ' AND t.category_id = ?';
    params.push(categoryId);
  }
  
  if (accountId) {
    query += ' AND t.account_id = ?';
    params.push(accountId);
  }
  
  if (startDate) {
    query += ' AND t.transaction_date >= ?';
    params.push(startDate);
  }
  
  if (endDate) {
    query += ' AND t.transaction_date <= ?';
    params.push(endDate);
  }
  
  query += ' ORDER BY t.transaction_date DESC';
  
  if (limit) {
    query += ' LIMIT ?';
    params.push(parseInt(limit));
  }
  
  const stmt = db.prepare(query);
  res.json(stmt.all(...params));
});

app.get('/api/transactions/:id', requireAuth, (req, res) => {
  const query = `
    SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color,
           a.name as account_name, a.icon as account_icon
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    JOIN accounts a ON t.account_id = a.id
    WHERE t.id = ?
  `;
  
  const stmt = db.prepare(query);
  const transaction = stmt.get(req.params.id);
  
  if (!transaction) {
    return res.status(404).json({ error: 'Transaction not found' });
  }
  
  res.json(transaction);
});

app.post('/api/transactions', requireAuth, (req, res) => {
  const { amount, type, description, categoryId, accountId, transactionDate } = req.body;
  
  if (!amount || !type || !categoryId || !accountId || !transactionDate) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Update account balance
  const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(accountId);
  const newBalance = type === 'income' 
    ? account.balance + parseFloat(amount)
    : account.balance - parseFloat(amount);
  
  db.prepare('UPDATE accounts SET balance = ? WHERE id = ?').run(newBalance, accountId);

  const stmt = db.prepare(`
    INSERT INTO transactions (amount, type, description, category_id, account_id, transaction_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    parseFloat(amount),
    type,
    description || '',
    categoryId,
    accountId,
    transactionDate
  );
  
  res.json({ id: result.lastInsertRowid, ...req.body });
});

app.put('/api/transactions/:id', requireAuth, (req, res) => {
  const { amount, type, description, categoryId, accountId, transactionDate } = req.body;
  
  // Get old transaction to revert balance change
  const oldTransaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id);
  
  if (!oldTransaction) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  // Revert old balance change
  const oldAccount = db.prepare('SELECT * FROM accounts WHERE id = ?').get(oldTransaction.account_id);
  let revertedBalance = oldTransaction.type === 'income'
    ? oldAccount.balance - parseFloat(oldTransaction.amount)
    : oldAccount.balance + parseFloat(oldTransaction.amount);
  
  db.prepare('UPDATE accounts SET balance = ? WHERE id = ?').run(revertedBalance, oldTransaction.account_id);
  
  // Apply new balance change
  const newAccount = db.prepare('SELECT * FROM accounts WHERE id = ?').get(accountId);
  const newBalance = type === 'income'
    ? newAccount.balance + parseFloat(amount)
    : newAccount.balance - parseFloat(amount);
  
  db.prepare('UPDATE accounts SET balance = ? WHERE id = ?').run(newBalance, accountId);

  const stmt = db.prepare(`
    UPDATE transactions 
    SET amount = ?, type = ?, description = ?, category_id = ?, account_id = ?, transaction_date = ?
    WHERE id = ?
  `);
  
  stmt.run(parseFloat(amount), type, description || '', categoryId, accountId, transactionDate, req.params.id);
  res.json({ success: true });
});

app.delete('/api/transactions/:id', requireAuth, (req, res) => {
  const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id);
  
  if (!transaction) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  // Revert balance change
  const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(transaction.account_id);
  const newBalance = transaction.type === 'income'
    ? account.balance - parseFloat(transaction.amount)
    : account.balance + parseFloat(transaction.amount);
  
  db.prepare('UPDATE accounts SET balance = ? WHERE id = ?').run(newBalance, transaction.account_id);
  
  const stmt = db.prepare('DELETE FROM transactions WHERE id = ?');
  stmt.run(req.params.id);
  res.json({ success: true });
});

// ============ SUMMARY & ANALYTICS ROUTES ============

app.get('/api/summary', requireAuth, (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  
  const incomeQuery = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM transactions
    WHERE type = 'income' AND transaction_date >= ? AND transaction_date <= ?
  `);
  
  const expenseQuery = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM transactions
    WHERE type = 'expense' AND transaction_date >= ? AND transaction_date <= ?
  `);
  
  const balanceQuery = db.prepare('SELECT COALESCE(SUM(balance), 0) as total FROM accounts WHERE is_active = 1');
  
  const income = incomeQuery.get(startOfMonth, endOfMonth);
  const expense = expenseQuery.get(startOfMonth, endOfMonth);
  const balance = balanceQuery.get();
  
  res.json({
    income: income.total,
    expense: expense.total,
    balance: balance.total,
    period: { start: startOfMonth, end: endOfMonth }
  });
});

app.get('/api/analytics/monthly', requireAuth, (req, res) => {
  const months = req.query.months || 6;
  
  const query = db.prepare(`
    SELECT 
      strftime('%Y-%m', transaction_date) as month,
      type,
      SUM(amount) as total
    FROM transactions
    WHERE transaction_date >= date('now', '-' || ? || ' months')
    GROUP BY strftime('%Y-%m', transaction_date), type
    ORDER BY month DESC
  `);
  
  res.json(query.all(months));
});

app.get('/api/analytics/categories', requireAuth, (req, res) => {
  const { type, startDate, endDate } = req.query;
  
  let query = `
    SELECT 
      c.id,
      c.name,
      c.icon,
      c.color,
      c.parent_id,
      SUM(t.amount) as total
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (type) {
    query += ' AND t.type = ?';
    params.push(type);
  }
  
  if (startDate) {
    query += ' AND t.transaction_date >= ?';
    params.push(startDate);
  }
  
  if (endDate) {
    query += ' AND t.transaction_date <= ?';
    params.push(endDate);
  }
  
  query += ' GROUP BY c.id ORDER BY total DESC';
  
  const stmt = db.prepare(query);
  res.json(stmt.all(...params));
});

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
