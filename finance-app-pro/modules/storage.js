/**
 * Storage Module - Handles data operations with PostgreSQL backend
 * Falls back to localStorage if server is unavailable
 */

const API_BASE = '/api';

// Check if server is available
async function checkServerAvailability() {
  try {
    const response = await fetch(`${API_BASE}/settings`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

let useServer = false; // По умолчанию используем localStorage

// Initialize storage mode - проверяем сервер один раз
async function initStorageMode() {
  if (useServer === null) {
    useServer = await checkServerAvailability();
  }
  return useServer;
}

const STORAGE_KEYS = {
    TRANSACTIONS: 'financepro_transactions',
    CATEGORIES: 'financepro_categories',
    ACCOUNTS: 'financepro_accounts',
    BUDGETS: 'financepro_budgets',
    SETTINGS: 'financepro_settings'
};

const defaultCategories = [
    { id: 'cat_1', type: 'income', name: 'Зарплата', icon: 'cash-outline', color: '#10B981' },
    { id: 'cat_2', type: 'income', name: 'Фриланс', icon: 'laptop-outline', color: '#3B82F6' },
    { id: 'cat_3', type: 'income', name: 'Инвестиции', icon: 'trending-up-outline', color: '#8B5CF6' },
    { id: 'cat_4', type: 'income', name: 'Подарки', icon: 'gift-outline', color: '#EC4899' },
    { id: 'cat_5', type: 'income', name: 'Другое', icon: 'arrow-down-circle-outline', color: '#6B7280' },
    { id: 'cat_6', type: 'expense', name: 'Продукты', icon: 'cart-outline', color: '#F59E0B' },
    { id: 'cat_7', type: 'expense', name: 'Жильё', icon: 'home-outline', color: '#EF4444' },
    { id: 'cat_8', type: 'expense', name: 'Транспорт', icon: 'car-outline', color: '#3B82F6' },
    { id: 'cat_9', type: 'expense', name: 'Здоровье', icon: 'medical-outline', color: '#EC4899' },
    { id: 'cat_10', type: 'expense', name: 'Развлечения', icon: 'film-outline', color: '#8B5CF6' },
    { id: 'cat_11', type: 'expense', name: 'Одежда', icon: 'shirt-outline', color: '#10B981' },
    { id: 'cat_12', type: 'expense', name: 'Образование', icon: 'book-outline', color: '#F59E0B' },
    { id: 'cat_13', type: 'expense', name: 'Связь', icon: 'phone-portrait-outline', color: '#6B7280' },
    { id: 'cat_14', type: 'expense', name: 'Другое', icon: 'ellipsis-horizontal-outline', color: '#9CA3AF' }
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
    // Initialize storage mode on first use
    async init() {
        await initStorageMode();
    },

    // Transaction operations
    async getTransactions() {
        await this.init();
        if (useServer) {
            try {
                const response = await fetch(`${API_BASE}/transactions`);
                if (!response.ok) throw new Error('Failed to fetch transactions');
                return await response.json();
            } catch (error) {
                console.warn('Server unavailable, falling back to localStorage:', error);
                useServer = false;
            }
        }
        // Fallback to localStorage
        const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
        return data ? JSON.parse(data) : [];
    },

    async saveTransactions(transactions) {
        await this.init();
        if (useServer) {
            // Bulk save not supported by API, handled by individual operations
            localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
            return;
        }
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    },

    async addTransaction(transaction) {
        await this.init();
        if (useServer) {
            try {
                const response = await fetch(`${API_BASE}/transactions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(transaction)
                });
                if (!response.ok) throw new Error('Failed to add transaction');
                return await response.json();
            } catch (error) {
                console.warn('Server unavailable, falling back to localStorage:', error);
                useServer = false;
            }
        }
        // Fallback to localStorage
        const transactions = await this.getTransactions();
        transaction.id = 'txn_' + Date.now();
        transaction.createdAt = new Date().toISOString();
        transactions.push(transaction);
        this.saveTransactions(transactions);
        return transaction;
    },

    async updateTransaction(id, updates) {
        await this.init();
        if (useServer) {
            try {
                const response = await fetch(`${API_BASE}/transactions/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updates)
                });
                if (!response.ok) throw new Error('Failed to update transaction');
                return await response.json();
            } catch (error) {
                console.warn('Server unavailable, falling back to localStorage:', error);
                useServer = false;
            }
        }
        // Fallback to localStorage
        const transactions = await this.getTransactions();
        const index = transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            transactions[index] = { ...transactions[index], ...updates, updatedAt: new Date().toISOString() };
            this.saveTransactions(transactions);
            return transactions[index];
        }
        return null;
    },

    async deleteTransaction(id) {
        await this.init();
        if (useServer) {
            try {
                await fetch(`${API_BASE}/transactions/${id}`, { method: 'DELETE' });
                return;
            } catch (error) {
                console.warn('Server unavailable, falling back to localStorage:', error);
                useServer = false;
            }
        }
        // Fallback to localStorage
        const transactions = await this.getTransactions();
        const filtered = transactions.filter(t => t.id !== id);
        this.saveTransactions(filtered);
    },

    // Category operations
    async getCategories() {
        await this.init();
        if (useServer) {
            try {
                const response = await fetch(`${API_BASE}/categories`);
                if (!response.ok) throw new Error('Failed to fetch categories');
                return await response.json();
            } catch (error) {
                console.warn('Server unavailable, falling back to localStorage:', error);
                useServer = false;
            }
        }
        // Fallback to localStorage
        const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
        if (!data) {
            this.saveCategories(defaultCategories);
            return defaultCategories;
        }
        return JSON.parse(data);
    },

    async saveCategories(categories) {
        await this.init();
        if (useServer) {
            localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
            return;
        }
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    },

    async addCategory(category) {
        await this.init();
        if (useServer) {
            try {
                const response = await fetch(`${API_BASE}/categories`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(category)
                });
                if (!response.ok) throw new Error('Failed to add category');
                return await response.json();
            } catch (error) {
                console.warn('Server unavailable, falling back to localStorage:', error);
                useServer = false;
            }
        }
        // Fallback to localStorage
        const categories = await this.getCategories();
        category.id = 'cat_' + Date.now();
        categories.push(category);
        this.saveCategories(categories);
        return category;
    },

    async updateCategory(id, updates) {
        await this.init();
        if (useServer) {
            try {
                const response = await fetch(`${API_BASE}/categories/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updates)
                });
                if (!response.ok) throw new Error('Failed to update category');
                return await response.json();
            } catch (error) {
                console.warn('Server unavailable, falling back to localStorage:', error);
                useServer = false;
            }
        }
        // Fallback to localStorage
        const categories = await this.getCategories();
        const index = categories.findIndex(c => c.id === id);
        if (index !== -1) {
            categories[index] = { ...categories[index], ...updates };
            this.saveCategories(categories);
            return categories[index];
        }
        return null;
    },

    async deleteCategory(id) {
        await this.init();
        if (useServer) {
            try {
                await fetch(`${API_BASE}/categories/${id}`, { method: 'DELETE' });
                return;
            } catch (error) {
                console.warn('Server unavailable, falling back to localStorage:', error);
                useServer = false;
            }
        }
        // Fallback to localStorage
        const categories = await this.getCategories();
        const filtered = categories.filter(c => c.id !== id);
        this.saveCategories(filtered);
    },

    // Account operations
    async getAccounts() {
        await this.init();
        if (useServer) {
            try {
                const response = await fetch(`${API_BASE}/accounts`);
                if (!response.ok) throw new Error('Failed to fetch accounts');
                return await response.json();
            } catch (error) {
                console.warn('Server unavailable, falling back to localStorage:', error);
                useServer = false;
            }
        }
        // Fallback to localStorage
        const data = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
        if (!data) {
            this.saveAccounts(defaultAccounts);
            return defaultAccounts;
        }
        return JSON.parse(data);
    },

    async saveAccounts(accounts) {
        await this.init();
        if (useServer) {
            localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
            return;
        }
        localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    },

    async addAccount(account) {
        await this.init();
        if (useServer) {
            try {
                const response = await fetch(`${API_BASE}/accounts`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(account)
                });
                if (!response.ok) throw new Error('Failed to add account');
                return await response.json();
            } catch (error) {
                console.warn('Server unavailable, falling back to localStorage:', error);
                useServer = false;
            }
        }
        // Fallback to localStorage
        const accountsData = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
        const accounts = accountsData ? JSON.parse(accountsData) : defaultAccounts;
        account.id = 'acc_' + Date.now();
        account.createdAt = new Date().toISOString();
        accounts.push(account);
        localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
        return account;
    },

    async updateAccount(id, updates) {
        await this.init();
        if (useServer) {
            try {
                const response = await fetch(`${API_BASE}/accounts/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updates)
                });
                if (!response.ok) throw new Error('Failed to update account');
                return await response.json();
            } catch (error) {
                console.warn('Server unavailable, falling back to localStorage:', error);
                useServer = false;
            }
        }
        // Fallback to localStorage
        const accounts = await this.getAccounts();
        const index = accounts.findIndex(a => a.id === id);
        if (index !== -1) {
            accounts[index] = { ...accounts[index], ...updates };
            this.saveAccounts(accounts);
            return accounts[index];
        }
        return null;
    },

    async deleteAccount(id) {
        await this.init();
        if (useServer) {
            try {
                await fetch(`${API_BASE}/accounts/${id}`, { method: 'DELETE' });
                return;
            } catch (error) {
                console.warn('Server unavailable, falling back to localStorage:', error);
                useServer = false;
            }
        }
        // Fallback to localStorage
        const accounts = await this.getAccounts();
        const filtered = accounts.filter(a => a.id !== id);
        this.saveAccounts(filtered);
    },

    // Budget operations
    async getBudgets() {
        await this.init();
        if (useServer) {
            try {
                const response = await fetch(`${API_BASE}/budgets`);
                if (!response.ok) throw new Error('Failed to fetch budgets');
                return await response.json();
            } catch (error) {
                console.warn('Server unavailable, falling back to localStorage:', error);
                useServer = false;
            }
        }
        // Fallback to localStorage
        const data = localStorage.getItem(STORAGE_KEYS.BUDGETS);
        return data ? JSON.parse(data) : [];
    },

    async saveBudgets(budgets) {
        await this.init();
        if (useServer) {
            localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
            return;
        }
        localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
    },

    async addBudget(budget) {
        await this.init();
        if (useServer) {
            try {
                const response = await fetch(`${API_BASE}/budgets`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(budget)
                });
                if (!response.ok) throw new Error('Failed to add budget');
                return await response.json();
            } catch (error) {
                console.warn('Server unavailable, falling back to localStorage:', error);
                useServer = false;
            }
        }
        // Fallback to localStorage
        const budgets = await this.getBudgets();
        budget.id = 'bud_' + Date.now();
        budget.createdAt = new Date().toISOString();
        budgets.push(budget);
        this.saveBudgets(budgets);
        return budget;
    },

    async updateBudget(id, updates) {
        await this.init();
        if (useServer) {
            try {
                const response = await fetch(`${API_BASE}/budgets/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updates)
                });
                if (!response.ok) throw new Error('Failed to update budget');
                return await response.json();
            } catch (error) {
                console.warn('Server unavailable, falling back to localStorage:', error);
                useServer = false;
            }
        }
        // Fallback to localStorage
        const budgets = await this.getBudgets();
        const index = budgets.findIndex(b => b.id === id);
        if (index !== -1) {
            budgets[index] = { ...budgets[index], ...updates };
            this.saveBudgets(budgets);
            return budgets[index];
        }
        return null;
    },

    async deleteBudget(id) {
        await this.init();
        if (useServer) {
            try {
                await fetch(`${API_BASE}/budgets/${id}`, { method: 'DELETE' });
                return;
            } catch (error) {
                console.warn('Server unavailable, falling back to localStorage:', error);
                useServer = false;
            }
        }
        // Fallback to localStorage
        const budgets = await this.getBudgets();
        const filtered = budgets.filter(b => b.id !== id);
        this.saveBudgets(filtered);
    },

    // Settings operations
    async getSettings() {
        await this.init();
        if (useServer) {
            try {
                const response = await fetch(`${API_BASE}/settings`);
                if (!response.ok) throw new Error('Failed to fetch settings');
                return await response.json();
            } catch (error) {
                console.warn('Server unavailable, falling back to localStorage:', error);
                useServer = false;
            }
        }
        // Fallback to localStorage
        const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        if (!data) {
            this.saveSettings(defaultSettings);
            return defaultSettings;
        }
        return JSON.parse(data);
    },

    async saveSettings(settings) {
        await this.init();
        if (useServer) {
            try {
                await fetch(`${API_BASE}/settings`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(settings)
                });
            } catch (error) {
                console.warn('Server unavailable, falling back to localStorage:', error);
                useServer = false;
            }
        }
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    },

    async updateSettings(updates) {
        await this.init();
        if (useServer) {
            try {
                const response = await fetch(`${API_BASE}/settings`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updates)
                });
                if (!response.ok) throw new Error('Failed to update settings');
                return await response.json();
            } catch (error) {
                console.warn('Server unavailable, falling back to localStorage:', error);
                useServer = false;
            }
        }
        // Fallback to localStorage
        const settings = await this.getSettings();
        const newSettings = { ...settings, ...updates };
        this.saveSettings(newSettings);
        return newSettings;
    },

    async clearAllData() {
        await this.init();
        if (useServer) {
            // Delete all transactions, categories, budgets via API
            const transactions = await this.getTransactions();
            for (const t of transactions) {
                await this.deleteTransaction(t.id);
            }
            const budgets = await this.getBudgets();
            for (const b of budgets) {
                await this.deleteBudget(b.id);
            }
            // Note: Categories and accounts are typically kept as defaults
        }
        localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
        localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
        localStorage.removeItem(STORAGE_KEYS.ACCOUNTS);
        localStorage.removeItem(STORAGE_KEYS.BUDGETS);
        // Keep settings
    },

    async exportData() {
        return {
            transactions: await this.getTransactions(),
            categories: await this.getCategories(),
            accounts: await this.getAccounts(),
            budgets: await this.getBudgets(),
            settings: await this.getSettings(),
            exportedAt: new Date().toISOString()
        };
    },

    async importData(data) {
        if (data.transactions) await this.saveTransactions(data.transactions);
        if (data.categories) await this.saveCategories(data.categories);
        if (data.accounts) await this.saveAccounts(data.accounts);
        if (data.budgets) await this.saveBudgets(data.budgets);
        if (data.settings) await this.saveSettings(data.settings);
    }
};
