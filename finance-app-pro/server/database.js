import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Database initialization
export const initDatabase = async () => {
  try {
    // Create transactions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(50) PRIMARY KEY,
        type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
        amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
        category_id VARCHAR(50) NOT NULL,
        account_id VARCHAR(50) NOT NULL,
        date DATE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create categories table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(50) PRIMARY KEY,
        type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
        name VARCHAR(100) NOT NULL,
        icon VARCHAR(10),
        color VARCHAR(7) DEFAULT '#2196F3'
      )
    `);

    // Create accounts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(20) NOT NULL,
        balance DECIMAL(15, 2) DEFAULT 0,
        currency VARCHAR(3) DEFAULT 'RUB',
        color VARCHAR(7) DEFAULT '#4CAF50',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create budgets table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS budgets (
        id VARCHAR(50) PRIMARY KEY,
        category_id VARCHAR(50) NOT NULL,
        limit_amount DECIMAL(15, 2) NOT NULL CHECK (limit_amount > 0),
        color VARCHAR(7) DEFAULT '#4CAF50',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        theme VARCHAR(20) DEFAULT 'light',
        currency VARCHAR(3) DEFAULT 'RUB',
        language VARCHAR(5) DEFAULT 'ru'
      )
    `);

    // Insert default settings if not exists
    await pool.query(`
      INSERT INTO settings (theme, currency, language)
      SELECT 'light', 'RUB', 'ru'
      WHERE NOT EXISTS (SELECT 1 FROM settings)
    `);

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
      await pool.query(`
        INSERT INTO categories (id, type, name, icon, color)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO NOTHING
      `, [cat.id, cat.type, cat.name, cat.icon, cat.color]);
    }

    // Insert default accounts if not exists
    const defaultAccounts = [
      { id: 'acc_1', name: 'Наличные', type: 'cash', balance: 0, currency: 'RUB', color: '#4CAF50' },
      { id: 'acc_2', name: 'Банковская карта', type: 'card', balance: 0, currency: 'RUB', color: '#2196F3' },
      { id: 'acc_3', name: 'Сберегательный счёт', type: 'bank', balance: 0, currency: 'RUB', color: '#9C27B0' }
    ];

    for (const acc of defaultAccounts) {
      await pool.query(`
        INSERT INTO accounts (id, name, type, balance, currency, color)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO NOTHING
      `, [acc.id, acc.name, acc.type, acc.balance, acc.currency, acc.color]);
    }

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
};

// Transaction operations
export const dbTransactions = {
  async getAll() {
    const result = await pool.query('SELECT * FROM transactions ORDER BY date DESC, created_at DESC');
    return result.rows;
  },

  async getById(id) {
    const result = await pool.query('SELECT * FROM transactions WHERE id = $1', [id]);
    return result.rows[0];
  },

  async create(transaction) {
    const { id, type, amount, categoryId, accountId, date, description } = transaction;
    const result = await pool.query(`
      INSERT INTO transactions (id, type, amount, category_id, account_id, date, description, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      RETURNING *
    `, [id, type, amount, categoryId, accountId, date, description]);
    return result.rows[0];
  },

  async update(id, updates) {
    const { type, amount, categoryId, accountId, date, description } = updates;
    const result = await pool.query(`
      UPDATE transactions 
      SET type = COALESCE($2, type),
          amount = COALESCE($3, amount),
          category_id = COALESCE($4, category_id),
          account_id = COALESCE($5, account_id),
          date = COALESCE($6, date),
          description = COALESCE($7, description),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id, type, amount, categoryId, accountId, date, description]);
    return result.rows[0];
  },

  async delete(id) {
    await pool.query('DELETE FROM transactions WHERE id = $1', [id]);
  }
};

// Category operations
export const dbCategories = {
  async getAll() {
    const result = await pool.query('SELECT * FROM categories ORDER BY type, name');
    return result.rows;
  },

  async create(category) {
    const { id, type, name, icon, color } = category;
    const result = await pool.query(`
      INSERT INTO categories (id, type, name, icon, color)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [id, type, name, icon, color]);
    return result.rows[0];
  },

  async update(id, updates) {
    const { type, name, icon, color } = updates;
    const result = await pool.query(`
      UPDATE categories 
      SET type = COALESCE($2, type),
          name = COALESCE($3, name),
          icon = COALESCE($4, icon),
          color = COALESCE($5, color)
      WHERE id = $1
      RETURNING *
    `, [id, type, name, icon, color]);
    return result.rows[0];
  },

  async delete(id) {
    await pool.query('DELETE FROM categories WHERE id = $1', [id]);
  }
};

// Account operations
export const dbAccounts = {
  async getAll() {
    const result = await pool.query('SELECT * FROM accounts ORDER BY name');
    return result.rows;
  },

  async create(account) {
    const { id, name, type, balance, currency, color } = account;
    const result = await pool.query(`
      INSERT INTO accounts (id, name, type, balance, currency, color, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      RETURNING *
    `, [id, name, type, balance, currency, color]);
    return result.rows[0];
  },

  async update(id, updates) {
    const { name, type, balance, currency, color } = updates;
    const result = await pool.query(`
      UPDATE accounts 
      SET name = COALESCE($2, name),
          type = COALESCE($3, type),
          balance = COALESCE($4, balance),
          currency = COALESCE($5, currency),
          color = COALESCE($6, color)
      WHERE id = $1
      RETURNING *
    `, [id, name, type, balance, currency, color]);
    return result.rows[0];
  },

  async delete(id) {
    await pool.query('DELETE FROM accounts WHERE id = $1', [id]);
  }
};

// Budget operations
export const dbBudgets = {
  async getAll() {
    const result = await pool.query('SELECT * FROM budgets ORDER BY created_at DESC');
    return result.rows;
  },

  async create(budget) {
    const { id, categoryId, limit: limitAmount, color } = budget;
    const result = await pool.query(`
      INSERT INTO budgets (id, category_id, limit_amount, color, created_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      RETURNING *
    `, [id, categoryId, limitAmount, color]);
    return result.rows[0];
  },

  async update(id, updates) {
    const { categoryId, limit: limitAmount, color } = updates;
    const result = await pool.query(`
      UPDATE budgets 
      SET category_id = COALESCE($2, category_id),
          limit_amount = COALESCE($3, limit_amount),
          color = COALESCE($4, color)
      WHERE id = $1
      RETURNING *
    `, [id, categoryId, limitAmount, color]);
    return result.rows[0];
  },

  async delete(id) {
    await pool.query('DELETE FROM budgets WHERE id = $1', [id]);
  }
};

// Settings operations
export const dbSettings = {
  async get() {
    const result = await pool.query('SELECT theme, currency, language FROM settings WHERE id = 1');
    return result.rows[0] || { theme: 'light', currency: 'RUB', language: 'ru' };
  },

  async update(updates) {
    const { theme, currency, language } = updates;
    const result = await pool.query(`
      UPDATE settings 
      SET theme = COALESCE($2, theme),
          currency = COALESCE($3, currency),
          language = COALESCE($4, language)
      WHERE id = 1
      RETURNING *
    `, [1, theme, currency, language]);
    return result.rows[0];
  }
};

export default pool;
