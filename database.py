import sqlite3
import os
from datetime import datetime

# Путь к файлу базы данных (хранится в репозитории)
DB_PATH = os.path.join(os.path.dirname(__file__), 'domkassa.db')

def get_connection():
    """Получить соединение с базой данных"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Доступ к полям по имени
    return conn

def init_db():
    """Инициализировать базу данных (создать таблицы)"""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Таблица пользователей
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            email TEXT UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Таблица транзакций (для финансового приложения)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            category TEXT,
            description TEXT,
            transaction_type TEXT CHECK(transaction_type IN ('income', 'expense')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    
    # Таблица категорий
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT CHECK(type IN ('income', 'expense')),
            user_id INTEGER,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    
    conn.commit()
    conn.close()
    print("База данных успешно инициализирована!")

def add_user(username, email=None):
    """Добавить нового пользователя"""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            'INSERT INTO users (username, email) VALUES (?, ?)',
            (username, email)
        )
        conn.commit()
        user_id = cursor.lastrowid
        print(f"Пользователь {username} добавлен с ID: {user_id}")
        return user_id
    except sqlite3.IntegrityError as e:
        print(f"Ошибка: пользователь уже существует - {e}")
        return None
    finally:
        conn.close()

def add_transaction(user_id, amount, category=None, description=None, transaction_type='expense'):
    """Добавить транзакцию"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO transactions (user_id, amount, category, description, transaction_type) VALUES (?, ?, ?, ?, ?)',
        (user_id, amount, category, description, transaction_type)
    )
    conn.commit()
    transaction_id = cursor.lastrowid
    conn.close()
    print(f"Транзакция #{transaction_id} добавлена")
    return transaction_id

def get_user_transactions(user_id, limit=10):
    """Получить последние транзакции пользователя"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        '''SELECT id, amount, category, description, transaction_type, created_at 
           FROM transactions 
           WHERE user_id = ? 
           ORDER BY created_at DESC 
           LIMIT ?''',
        (user_id, limit)
    )
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_balance(user_id):
    """Получить баланс пользователя"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        '''SELECT 
            SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END) as income,
            SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END) as expense
           FROM transactions 
           WHERE user_id = ?''',
        (user_id,)
    )
    row = cursor.fetchone()
    conn.close()
    
    if row:
        income = row['income'] or 0
        expense = row['expense'] or 0
        return income - expense
    return 0

if __name__ == '__main__':
    # Инициализация БД
    init_db()
    
    # Пример использования
    print("\n--- Пример использования ---")
    
    # Добавляем пользователя
    user_id = add_user("test_user", "test@example.com")
    
    if user_id:
        # Добавляем транзакции
        add_transaction(user_id, 1000, "Зарплата", "Начисление зарплаты", "income")
        add_transaction(user_id, 500, "Еда", "Продукты", "expense")
        add_transaction(user_id, 200, "Транспорт", "Такси", "expense")
        
        # Получаем транзакции
        transactions = get_user_transactions(user_id)
        print(f"\nПоследние транзакции:")
        for t in transactions:
            print(f"  {t['transaction_type']}: {t['amount']} руб. ({t['category']}) - {t['description']}")
        
        # Получаем баланс
        balance = get_balance(user_id)
        print(f"\nБаланс: {balance} руб.")
