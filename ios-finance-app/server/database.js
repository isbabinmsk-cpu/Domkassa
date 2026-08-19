const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'finance.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  -- Users table for authentication
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Categories table with support for subcategories
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    icon TEXT DEFAULT 'pricetag',
    color TEXT DEFAULT '#007AFF',
    parent_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
  );

  -- Accounts table
  CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'cash' CHECK(type IN ('cash', 'bank', 'card', 'investment')),
    balance REAL DEFAULT 0,
    currency TEXT DEFAULT 'RUB',
    icon TEXT DEFAULT 'wallet',
    color TEXT DEFAULT '#007AFF',
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Transactions table
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    description TEXT,
    category_id INTEGER NOT NULL,
    account_id INTEGER NOT NULL,
    transaction_date DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT
  );

  -- Budgets table
  CREATE TABLE IF NOT EXISTS budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    amount_limit REAL NOT NULL,
    amount_spent REAL DEFAULT 0,
    category_id INTEGER,
    period TEXT DEFAULT 'monthly' CHECK(period IN ('weekly', 'monthly', 'yearly')),
    start_date DATE,
    end_date DATE,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
  );

  -- Create indexes for better performance
  CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
  CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
  CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
  CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
  CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
`);

// Create default user if not exists (username: admin, password: admin123)
const stmt = db.prepare('SELECT COUNT(*) as count FROM users');
const result = stmt.get();
if (result.count === 0) {
  const passwordHash = bcrypt.hashSync('admin123', 10);
  const insert = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)');
  insert.run('admin', passwordHash);
  console.log('Default user created: admin / admin123');
}

// Insert default categories if not exists
const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get();
if (categoryCount.count === 0) {
  // Income categories
  const incomeCategories = [
    { name: 'Зарплата', icon: 'cash', color: '#34C759' },
    { name: 'Бизнес', icon: 'briefcase', color: '#FF9500' },
    { name: 'Инвестиции', icon: 'trending-up', color: '#5856D6' },
    { name: 'Подарки', icon: 'gift', color: '#FF2D55' },
    { name: 'Возвраты', icon: 'return-left', color: '#FFCC00' },
    { name: 'Другое', icon: 'ellipsis-horizontal', color: '#8E8E93' }
  ];

  // Expense categories with subcategories
  const expenseCategories = [
    { 
      name: 'Еда', icon: 'cart', color: '#FF9500',
      subcategories: ['Продукты', 'Рестораны', 'Доставка', 'Кофе']
    },
    { 
      name: 'Транспорт', icon: 'car', color: '#007AFF',
      subcategories: ['Бензин', 'Такси', 'Общественный транспорт', 'Парковка']
    },
    { 
      name: 'Жильё', icon: 'home', color: '#5856D6',
      subcategories: ['Аренда', 'Коммунальные услуги', 'Интернет', 'Ремонт']
    },
    { 
      name: 'Развлечения', icon: 'film', color: '#FF2D55',
      subcategories: ['Кино', 'Концерты', 'Подписки', 'Хобби']
    },
    { 
      name: 'Здоровье', icon: 'heart', color: '#FF3B30',
      subcategories: ['Лекарства', 'Врачи', 'Спорт', 'Красота']
    },
    { 
      name: 'Одежда', icon: 'shirt', color: '#AF52DE',
      subcategories: ['Обувь', 'Аксессуары', 'Уход']
    },
    { 
      name: 'Образование', icon: 'book', color: '#00CED1',
      subcategories: ['Курсы', 'Книги', 'Вебинары']
    },
    { 
      name: 'Техника', icon: 'phone', color: '#64D2FF',
      subcategories: ['Электроника', 'Приложения', 'Ремонт']
    },
    { 
      name: 'Дети', icon: 'people', color: '#FFD60A',
      subcategories: ['Игрушки', 'Одежда', 'Обучение', 'Кружки']
    },
    { 
      name: 'Другое', icon: 'ellipsis-horizontal', color: '#8E8E93',
      subcategories: []
    }
  ];

  const insertCategory = db.prepare(`
    INSERT INTO categories (name, type, icon, color, parent_id) VALUES (?, ?, ?, ?, ?)
  `);

  // Insert income categories
  incomeCategories.forEach(cat => {
    insertCategory.run(cat.name, 'income', cat.icon, cat.color, null);
  });

  // Insert expense categories with subcategories
  expenseCategories.forEach(cat => {
    const parentIdResult = insertCategory.run(cat.name, 'expense', cat.icon, cat.color, null);
    const parentId = parentIdResult.lastInsertRowid;
    
    if (cat.subcategories && cat.subcategories.length > 0) {
      cat.subcategories.forEach(subcat => {
        insertCategory.run(subcat, 'expense', 'pricetag', cat.color, parentId);
      });
    }
  });

  console.log('Default categories created');
}

// Insert default accounts if not exists
const accountCount = db.prepare('SELECT COUNT(*) as count FROM accounts').get();
if (accountCount.count === 0) {
  const defaultAccounts = [
    { name: 'Наличные', type: 'cash', icon: 'cash', color: '#34C759' },
    { name: 'Банковская карта', type: 'card', icon: 'card', color: '#007AFF' },
    { name: 'Сберкнижка', type: 'bank', icon: 'bank', color: '#5856D6' }
  ];

  const insertAccount = db.prepare(`
    INSERT INTO accounts (name, type, icon, color, balance) VALUES (?, ?, ?, ?, ?)
  `);

  defaultAccounts.forEach(acc => {
    insertAccount.run(acc.name, acc.type, acc.icon, acc.color, 0);
  });

  console.log('Default accounts created');
}

console.log('Database initialized successfully at:', dbPath);

module.exports = db;
