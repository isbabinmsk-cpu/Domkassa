# FinancePRO с поддержкой PostgreSQL

Профессиональная система учёта домашних финансов с использованием базы данных PostgreSQL.

## Версия 3.0.0

### Новые возможности:
- 🗄️ **Поддержка PostgreSQL** - надёжное хранение данных в базе данных
- 🔄 **Автоматическое переключение** - работа через API с резервным режимом localStorage
- 🌐 **REST API** - полный набор конечных точек для управления данными
- 📊 **Масштабируемость** - готовность к работе с большими объёмами данных

## Структура проекта

```
finance-app-pro/
├── index.html              # Главный HTML файл
├── css/
│   └── styles.css          # Стили приложения
├── js/
│   └── main.js             # Точка входа JavaScript
├── modules/
│   ├── app.js              # Основная логика приложения
│   ├── storage.js          # Модуль хранения (PostgreSQL + localStorage)
│   └── ui.js               # UI компоненты
├── server/
│   ├── server.js           # Express сервер
│   └── database.js         # Подключение к PostgreSQL и операции БД
├── package.json            # Зависимости Node.js
└── .env.example            # Пример конфигурации окружения
```

## Установка

### 1. Требования
- Node.js 16+ 
- PostgreSQL 12+

### 2. Установка зависимостей

```bash
cd finance-app-pro
npm install
```

### 3. Настройка базы данных PostgreSQL

Создайте базу данных:

```sql
CREATE DATABASE financepro;
```

Скопируйте файл конфигурации:

```bash
cp .env.example .env
```

Отредактируйте `.env` и укажите ваши параметры подключения:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/financepro
PORT=3000
```

### 4. Запуск приложения

```bash
npm start
```

Приложение будет доступно по адресу: http://localhost:3000

## Режимы работы

### С PostgreSQL (рекомендуется)
- Все данные хранятся в базе данных PostgreSQL
- Поддержка многопользовательской работы (при доработке)
- Надёжное хранение и резервное копирование

### Без PostgreSQL (резервный режим)
- Если сервер недоступен, приложение автоматически переключается на localStorage
- Данные сохраняются в браузере пользователя
- Работает без установки серверной части

## API Конечные точки

### Транзакции
- `GET /api/transactions` - получить все транзакции
- `POST /api/transactions` - создать транзакцию
- `PUT /api/transactions/:id` - обновить транзакцию
- `DELETE /api/transactions/:id` - удалить транзакцию

### Категории
- `GET /api/categories` - получить все категории
- `POST /api/categories` - создать категорию
- `PUT /api/categories/:id` - обновить категорию
- `DELETE /api/categories/:id` - удалить категорию

### Счета
- `GET /api/accounts` - получить все счета
- `POST /api/accounts` - создать счет
- `PUT /api/accounts/:id` - обновить счет
- `DELETE /api/accounts/:id` - удалить счет

### Бюджеты
- `GET /api/budgets` - получить все бюджеты
- `POST /api/budgets` - создать бюджет
- `PUT /api/budgets/:id` - обновить бюджет
- `DELETE /api/budgets/:id` - удалить бюджет

### Настройки
- `GET /api/settings` - получить настройки
- `PUT /api/settings` - обновить настройки

## Схема базы данных

### Таблица transactions
```sql
- id VARCHAR(50) PRIMARY KEY
- type VARCHAR(20) CHECK (type IN ('income', 'expense'))
- amount DECIMAL(15, 2)
- category_id VARCHAR(50)
- account_id VARCHAR(50)
- date DATE
- description TEXT
- created_at TIMESTAMP
- updated_at TIMESTAMP
```

### Таблица categories
```sql
- id VARCHAR(50) PRIMARY KEY
- type VARCHAR(20) CHECK (type IN ('income', 'expense'))
- name VARCHAR(100)
- icon VARCHAR(10)
- color VARCHAR(7)
```

### Таблица accounts
```sql
- id VARCHAR(50) PRIMARY KEY
- name VARCHAR(100)
- type VARCHAR(20)
- balance DECIMAL(15, 2)
- currency VARCHAR(3)
- color VARCHAR(7)
- created_at TIMESTAMP
```

### Таблица budgets
```sql
- id VARCHAR(50) PRIMARY KEY
- category_id VARCHAR(50)
- limit_amount DECIMAL(15, 2)
- color VARCHAR(7)
- created_at TIMESTAMP
```

### Таблица settings
```sql
- id SERIAL PRIMARY KEY
- theme VARCHAR(20)
- currency VARCHAR(3)
- language VARCHAR(5)
```

## Разработка

Запуск в режиме разработки с автоперезагрузкой:

```bash
npm run dev
```

## Особенности архитектуры

1. **Гибридное хранение**: Модуль storage.js автоматически определяет доступность сервера и переключается между API и localStorage.

2. **Инициализация БД**: При первом запуске сервер автоматически создаёт таблицы и заполняет их данными по умолчанию.

3. **Миграция данных**: Приложение сохраняет обратную совместимость с данными из localStorage.

## Лицензия

MIT
