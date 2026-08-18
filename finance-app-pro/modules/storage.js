/**
 * Storage Module - Handles localStorage operations
 */

const STORAGE_KEYS = {
    TRANSACTIONS: 'financepro_transactions',
    CATEGORIES: 'financepro_categories',
    ACCOUNTS: 'financepro_accounts',
    BUDGETS: 'financepro_budgets',
    SETTINGS: 'financepro_settings'
};

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

const defaultAccounts = [
    { id: 'acc_1', name: 'Наличные', type: 'cash', balance: 0, currency: 'RUB', color: '#4CAF50' },
    { id: 'acc_2', name: 'Банковская карта', type: 'card', balance: 0, currency: 'RUB', color: '#2196F3' },
    { id: 'acc_3', name: 'Сберегательный счёт', type: 'bank', balance: 0, currency: 'RUB', color: '#9C27B0' }
];

const defaultSettings = {
    theme: 'light',
    currency: 'RUB',
    language: 'ru'
};

export const storage = {
    getTransactions() {
        const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
        return data ? JSON.parse(data) : [];
    },

    saveTransactions(transactions) {
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    },

    addTransaction(transaction) {
        const transactions = this.getTransactions();
        transaction.id = 'txn_' + Date.now();
        transaction.createdAt = new Date().toISOString();
        transactions.push(transaction);
        this.saveTransactions(transactions);
        return transaction;
    },

    updateTransaction(id, updates) {
        const transactions = this.getTransactions();
        const index = transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            transactions[index] = { ...transactions[index], ...updates, updatedAt: new Date().toISOString() };
            this.saveTransactions(transactions);
            return transactions[index];
        }
        return null;
    },

    deleteTransaction(id) {
        const transactions = this.getTransactions();
        const filtered = transactions.filter(t => t.id !== id);
        this.saveTransactions(filtered);
    },

    getCategories() {
        const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
        if (!data) {
            this.saveCategories(defaultCategories);
            return defaultCategories;
        }
        return JSON.parse(data);
    },

    saveCategories(categories) {
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    },

    addCategory(category) {
        const categories = this.getCategories();
        category.id = 'cat_' + Date.now();
        categories.push(category);
        this.saveCategories(categories);
        return category;
    },

    updateCategory(id, updates) {
        const categories = this.getCategories();
        const index = categories.findIndex(c => c.id === id);
        if (index !== -1) {
            categories[index] = { ...categories[index], ...updates };
            this.saveCategories(categories);
            return categories[index];
        }
        return null;
    },

    deleteCategory(id) {
        const categories = this.getCategories();
        const filtered = categories.filter(c => c.id !== id);
        this.saveCategories(filtered);
    },

    getAccounts() {
        const data = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
        if (!data) {
            this.saveAccounts(defaultAccounts);
            return defaultAccounts;
        }
        return JSON.parse(data);
    },

    saveAccounts(accounts) {
        localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    },

    addAccount(account) {
        const accounts = this.getAccounts();
        account.id = 'acc_' + Date.now();
        account.createdAt = new Date().toISOString();
        accounts.push(account);
        this.saveAccounts(accounts);
        return account;
    },

    updateAccount(id, updates) {
        const accounts = this.getAccounts();
        const index = accounts.findIndex(a => a.id === id);
        if (index !== -1) {
            accounts[index] = { ...accounts[index], ...updates };
            this.saveAccounts(accounts);
            return accounts[index];
        }
        return null;
    },

    deleteAccount(id) {
        const accounts = this.getAccounts();
        const filtered = accounts.filter(a => a.id !== id);
        this.saveAccounts(filtered);
    },

    getBudgets() {
        const data = localStorage.getItem(STORAGE_KEYS.BUDGETS);
        return data ? JSON.parse(data) : [];
    },

    saveBudgets(budgets) {
        localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
    },

    addBudget(budget) {
        const budgets = this.getBudgets();
        budget.id = 'bud_' + Date.now();
        budget.createdAt = new Date().toISOString();
        budgets.push(budget);
        this.saveBudgets(budgets);
        return budget;
    },

    updateBudget(id, updates) {
        const budgets = this.getBudgets();
        const index = budgets.findIndex(b => b.id === id);
        if (index !== -1) {
            budgets[index] = { ...budgets[index], ...updates };
            this.saveBudgets(budgets);
            return budgets[index];
        }
        return null;
    },

    deleteBudget(id) {
        const budgets = this.getBudgets();
        const filtered = budgets.filter(b => b.id !== id);
        this.saveBudgets(filtered);
    },

    getSettings() {
        const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        if (!data) {
            this.saveSettings(defaultSettings);
            return defaultSettings;
        }
        return JSON.parse(data);
    },

    saveSettings(settings) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    },

    updateSettings(updates) {
        const settings = this.getSettings();
        const newSettings = { ...settings, ...updates };
        this.saveSettings(newSettings);
        return newSettings;
    },

    clearAllData() {
        localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
        localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
        localStorage.removeItem(STORAGE_KEYS.ACCOUNTS);
        localStorage.removeItem(STORAGE_KEYS.BUDGETS);
        // Keep settings
    },

    exportData() {
        return {
            transactions: this.getTransactions(),
            categories: this.getCategories(),
            accounts: this.getAccounts(),
            budgets: this.getBudgets(),
            settings: this.getSettings(),
            exportedAt: new Date().toISOString()
        };
    },

    importData(data) {
        if (data.transactions) this.saveTransactions(data.transactions);
        if (data.categories) this.saveCategories(data.categories);
        if (data.accounts) this.saveAccounts(data.accounts);
        if (data.budgets) this.saveBudgets(data.budgets);
        if (data.settings) this.saveSettings(data.settings);
    }
};
