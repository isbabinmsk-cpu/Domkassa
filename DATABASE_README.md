# База данных для DomKassa

## Описание

Это легковесная база данных на основе **SQLite**, которая:
- ✅ **Не требует установки** - работает из коробки с Python
- ✅ **Работает с GitHub** - файл БД хранится прямо в репозитории
- ✅ **Простая интеграция** - всего один файл `database.py`

## Быстрый старт

### 1. Инициализация базы данных

```bash
python database.py
```

Это создаст файл `domkassa.db` в корне репозитория и таблицы:
- `users` - пользователи
- `transactions` - транзакции (доходы/расходы)
- `categories` - категории

### 2. Использование в коде

```python
from database import init_db, add_user, add_transaction, get_balance

# Инициализация
init_db()

# Добавление пользователя
user_id = add_user("username", "email@example.com")

# Добавление транзакции
add_transaction(
    user_id=user_id,
    amount=1000,
    category="Зарплата",
    description="Начисление зарплаты",
    transaction_type="income"  # или "expense"
)

# Получение баланса
balance = get_balance(user_id)
print(f"Баланс: {balance} руб.")
```

## API Функции

| Функция | Описание |
|---------|----------|
| `init_db()` | Создаёт таблицы в БД |
| `add_user(username, email)` | Добавляет нового пользователя |
| `add_transaction(user_id, amount, category, description, transaction_type)` | Добавляет транзакцию |
| `get_user_transactions(user_id, limit)` | Получает последние транзакции |
| `get_balance(user_id)` | Возвращает текущий баланс |

## Структура базы данных

### Таблица `users`
- `id` - уникальный идентификатор
- `username` - имя пользователя (уникальное)
- `email` - email (уникальный)
- `created_at` - дата создания

### Таблица `transactions`
- `id` - уникальный идентификатор
- `user_id` - ссылка на пользователя
- `amount` - сумма
- `category` - категория
- `description` - описание
- `transaction_type` - тип (income/expense)
- `created_at` - дата создания

### Таблица `categories`
- `id` - уникальный идентификатор
- `name` - название категории
- `type` - тип (income/expense)
- `user_id` - владелец (опционально)

## Работа с Git

⚠️ **Важно**: Файл базы данных `domkassa.db` уже добавлен в `.gitignore`, чтобы не коммитить изменения данных.

Если вы хотите хранить БД в репозитории:
```bash
git add domkassa.db
git commit -m "Add database"
git push
```

Если хотите игнорировать (рекомендуется для production):
Убедитесь, что в `.gitignore` есть строка:
```
*.db
```

## Преимущества SQLite

- 📦 **Без сервера** - не нужно устанавливать MySQL, PostgreSQL и т.д.
- 🚀 **Быстро** - работает напрямую с файлом
- 📱 **Портативно** - один файл, который можно легко перенести
- 🔧 **Встроен в Python** - модуль `sqlite3` доступен по умолчанию
- 🌐 **GitHub-friendly** - файл можно закоммитить в репозиторий

## Примеры использования

### Добавить расход
```python
add_transaction(1, 500, "Еда", "Продукты в магазине", "expense")
```

### Добавить доход
```python
add_transaction(1, 2000, "Зарплата", "Аванс", "income")
```

### Получить историю операций
```python
transactions = get_user_transactions(1, limit=20)
for t in transactions:
    print(f"{t['transaction_type']}: {t['amount']} руб.")
```
