import initSqlJs from 'sql.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database path - can be committed to GitHub
const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../../domkassa.db');

let db = null;

// Database initialization
export const initDatabase = async () => {
  try {
    const SQL = await initSqlJs();
    
    // Load existing database or create new one
    if (fs.existsSync(DB_PATH)) {
      const fileBuffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(fileBuffer);
      console.log('✅ Loaded SQLite database from', DB_PATH);
    } else {
      db = new SQL.Database();
      console.log('✅ Created new SQLite database at', DB_PATH);
    }
    
    // Create tables
    db.run(`CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      amount REAL NOT NULL CHECK (amount > 0),
      category_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      date TEXT NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      name TEXT NOT NULL,
      icon TEXT,
      color TEXT DEFAULT '#2196F3'
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      balance REAL DEFAULT 0,
      currency TEXT DEFAULT 'RUB',
      color TEXT DEFAULT '#4CAF50',
      created_at TEXT DEFAULT (datetime('now'))
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL,
      limit_amount REAL NOT NULL CHECK (limit_amount > 0),
      color TEXT DEFAULT '#4CAF50',
      created_at TEXT DEFAULT (datetime('now'))
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      theme TEXT DEFAULT 'light',
      currency TEXT DEFAULT 'RUB',
      language TEXT DEFAULT 'ru'
    )`);

    // Insert default settings if not exists
    const settingsResult = db.exec('SELECT * FROM settings WHERE id = 1');
    if (settingsResult.length === 0 || settingsResult[0].values.length === 0) {
      db.run(`INSERT INTO settings (theme, currency, language) VALUES ('light', 'RUB', 'ru')`);
    }

    // Insert default categories if not exists
    const defaultCategories = [
      { id: 'cat_1', type: 'income', name: 'Зарплата', icon: '💰', color: '#10B981' },
      { id: 'cat_2', type: 'income', name: 'Фриланс', icon: '💻', color: '#3B82F6' },
      { id: 'cat_3', type: 'income', name: 'Инвестиции', icon: '📈', color: '#8B5CF6' },
      { id: 'cat_4', type: 'income', name: 'Подарки', icon: '🎁', color: '#EC4899' },
      { id: 'cat_5', type: 'income', name: 'Другое', icon: '📥', color: '#6B7280' },
      { id: 'cat_6', type: 'expense', name: 'Продукты', icon: '🛒', color: '#F59E0B' },
      { id: 'cat_7', type: 'expense', name: 'Жильё', icon: '🏠', color: '#EF4444' },
      { id: 'cat_8', type: 'expense', name: 'Транспорт', icon: '🚗', color: '#3B82F6' },
      { id: 'cat_9', type: 'expense', name: 'Здоровье', icon: '🏥', color: '#EC4899' },
      { id: 'cat_10', type: 'expense', name: 'Развлечения', icon: '🎬', color: '#8B5CF6' },
      { id: 'cat_11', type: 'expense', name: 'Одежда', icon: '👕', color: '#10B981' },
      { id: 'cat_12', type: 'expense', name: 'Образование', icon: '📚', color: '#F59E0B' },
      { id: 'cat_13', type: 'expense', name: 'Связь', icon: '📱', color: '#6B7280' },
      { id: 'cat_14', type: 'expense', name: 'Другое', icon: '📤', color: '#9CA3AF' }
    ];

    for (const cat of defaultCategories) {
      db.run(`INSERT OR IGNORE INTO categories (id, type, name, icon, color) VALUES (?, ?, ?, ?, ?)`,
        [cat.id, cat.type, cat.name, cat.icon, cat.color]);
    }

    // Insert default accounts if not exists
    const defaultAccounts = [
      { id: 'acc_1', name: 'Наличные', type: 'cash', balance: 0, currency: 'RUB', color: '#4CAF50' },
      { id: 'acc_2', name: 'Банковская карта', type: 'card', balance: 0, currency: 'RUB', color: '#2196F3' },
      { id: 'acc_3', name: 'Сберегательный счёт', type: 'bank', balance: 0, currency: 'RUB', color: '#9C27B0' }
    ];

    for (const acc of defaultAccounts) {
      db.run(`INSERT OR IGNORE INTO accounts (id, name, type, balance, currency, color) VALUES (?, ?, ?, ?, ?, ?)`,
        [acc.id, acc.name, acc.type, acc.balance, acc.currency, acc.color]);
    }

    // Save database to file
    saveDatabase();
    
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
};

// Helper function to save database to file
const saveDatabase = () => {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
};

// Helper function to convert query results to array of objects
const queryToObjects = (stmt) => {
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
};

// Transaction operations
export const dbTransactions = {
  async getAll() {
    const stmt = db.prepare('SELECT * FROM transactions ORDER BY date DESC, created_at DESC');
    return queryToObjects(stmt);
  },

  async getById(id) {
    const stmt = db.prepare('SELECT * FROM transactions WHERE id = ?');
    stmt.bind([id]);
    const result = queryToObjects(stmt);
    return result[0] || null;
  },

  async create(transaction) {
    const { id, type, amount, categoryId, accountId, date, description } = transaction;
    db.run(`INSERT INTO transactions (id, type, amount, category_id, account_id, date, description, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [id, type, amount, categoryId, accountId, date, description]
    );
    saveDatabase();
    return this.getById(id);
  },

  async update(id, updates) {
    const { type, amount, categoryId, accountId, date, description } = updates;
    db.run(`UPDATE transactions 
            SET type = COALESCE(?, type),
                amount = COALESCE(?, amount),
                category_id = COALESCE(?, category_id),
                account_id = COALESCE(?, account_id),
                date = COALESCE(?, date),
                description = COALESCE(?, description),
                updated_at = datetime('now')
            WHERE id = ?`,
      [type, amount, categoryId, accountId, date, description, id]
    );
    saveDatabase();
    return this.getById(id);
  },

  async delete(id) {
    db.run('DELETE FROM transactions WHERE id = ?', [id]);
    saveDatabase();
  }
};

// Category operations
export const dbCategories = {
  async getAll() {
    const stmt = db.prepare('SELECT * FROM categories ORDER BY type, name');
    return queryToObjects(stmt);
  },

  async create(category) {
    const { id, type, name, icon, color } = category;
    db.run(`INSERT INTO categories (id, type, name, icon, color) VALUES (?, ?, ?, ?, ?)`,
      [id, type, name, icon, color]
    );
    saveDatabase();
    return this.getById(id);
  },

  async update(id, updates) {
    const { type, name, icon, color } = updates;
    db.run(`UPDATE categories 
            SET type = COALESCE(?, type),
                name = COALESCE(?, name),
                icon = COALESCE(?, icon),
                color = COALESCE(?, color)
            WHERE id = ?`,
      [type, name, icon, color, id]
    );
    saveDatabase();
    return this.getById(id);
  },

  async delete(id) {
    db.run('DELETE FROM categories WHERE id = ?', [id]);
    saveDatabase();
  },
  
  async getById(id) {
    const stmt = db.prepare('SELECT * FROM categories WHERE id = ?');
    stmt.bind([id]);
    const result = queryToObjects(stmt);
    return result[0] || null;
  }
};

// Account operations
export const dbAccounts = {
  async getAll() {
    const stmt = db.prepare('SELECT * FROM accounts ORDER BY name');
    return queryToObjects(stmt);
  },

  async create(account) {
    const { id, name, type, balance, currency, color } = account;
    db.run(`INSERT INTO accounts (id, name, type, balance, currency, color, created_at)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
      [id, name, type, balance, currency, color]
    );
    saveDatabase();
    return this.getById(id);
  },

  async update(id, updates) {
    const { name, type, balance, currency, color } = updates;
    db.run(`UPDATE accounts 
            SET name = COALESCE(?, name),
                type = COALESCE(?, type),
                balance = COALESCE(?, balance),
                currency = COALESCE(?, currency),
                color = COALESCE(?, color)
            WHERE id = ?`,
      [name, type, balance, currency, color, id]
    );
    saveDatabase();
    return this.getById(id);
  },

  async delete(id) {
    db.run('DELETE FROM accounts WHERE id = ?', [id]);
    saveDatabase();
  },
  
  async getById(id) {
    const stmt = db.prepare('SELECT * FROM accounts WHERE id = ?');
    stmt.bind([id]);
    const result = queryToObjects(stmt);
    return result[0] || null;
  }
};

// Budget operations
export const dbBudgets = {
  async getAll() {
    const stmt = db.prepare('SELECT * FROM budgets ORDER BY created_at DESC');
    return queryToObjects(stmt);
  },

  async create(budget) {
    const { id, categoryId, limit: limitAmount, color } = budget;
    db.run(`INSERT INTO budgets (id, category_id, limit_amount, color, created_at)
            VALUES (?, ?, ?, ?, datetime('now'))`,
      [id, categoryId, limitAmount, color]
    );
    saveDatabase();
    return this.getById(id);
  },

  async update(id, updates) {
    const { categoryId, limit: limitAmount, color } = updates;
    db.run(`UPDATE budgets 
            SET category_id = COALESCE(?, category_id),
                limit_amount = COALESCE(?, limit_amount),
                color = COALESCE(?, color)
            WHERE id = ?`,
      [categoryId, limitAmount, color, id]
    );
    saveDatabase();
    return this.getById(id);
  },

  async delete(id) {
    db.run('DELETE FROM budgets WHERE id = ?', [id]);
    saveDatabase();
  },
  
  async getById(id) {
    const stmt = db.prepare('SELECT * FROM budgets WHERE id = ?');
    stmt.bind([id]);
    const result = queryToObjects(stmt);
    return result[0] || null;
  }
};

// Settings operations
export const dbSettings = {
  async get() {
    const stmt = db.prepare('SELECT theme, currency, language FROM settings WHERE id = 1');
    const result = queryToObjects(stmt);
    return result[0] || { theme: 'light', currency: 'RUB', language: 'ru' };
  },

  async update(updates) {
    const { theme, currency, language } = updates;
    db.run(`UPDATE settings 
            SET theme = COALESCE(?, theme),
                currency = COALESCE(?, currency),
                language = COALESCE(?, language)
            WHERE id = 1`,
      [theme, currency, language]
    );
    saveDatabase();
    return this.get();
  }
};

export default db;
