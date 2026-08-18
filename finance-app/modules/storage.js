/**
 * Storage Module
 * Handles all localStorage operations for the finance app
 */

const STORAGE_KEYS = {
    TRANSACTIONS: 'finance_transactions',
    BUDGETS: 'finance_budgets',
    SETTINGS: 'finance_settings'
};

export const storage = {
    /**
     * Get data from localStorage
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default value if key doesn't exist
     * @returns {*} Parsed data or default value
     */
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error(`Error reading from localStorage (${key}):`, error);
            return defaultValue;
        }
    },

    /**
     * Save data to localStorage
     * @param {string} key - Storage key
     * @param {*} value - Data to save
     * @returns {boolean} Success status
     */
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Error writing to localStorage (${key}):`, error);
            return false;
        }
    },

    /**
     * Remove data from localStorage
     * @param {string} key - Storage key
     * @returns {boolean} Success status
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Error removing from localStorage (${key}):`, error);
            return false;
        }
    },

    /**
     * Clear all finance-related data
     * @returns {boolean} Success status
     */
    clearAll() {
        try {
            Object.values(STORAGE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    },

    // Transaction-specific methods
    getTransactions() {
        return this.get(STORAGE_KEYS.TRANSACTIONS, []);
    },

    saveTransactions(transactions) {
        return this.set(STORAGE_KEYS.TRANSACTIONS, transactions);
    },

    addTransaction(transaction) {
        const transactions = this.getTransactions();
        transactions.push({
            ...transaction,
            id: Date.now().toString(),
            createdAt: new Date().toISOString()
        });
        return this.saveTransactions(transactions);
    },

    updateTransaction(id, updates) {
        const transactions = this.getTransactions();
        const index = transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            transactions[index] = { ...transactions[index], ...updates };
            return this.saveTransactions(transactions);
        }
        return false;
    },

    deleteTransaction(id) {
        const transactions = this.getTransactions();
        const filtered = transactions.filter(t => t.id !== id);
        return this.saveTransactions(filtered);
    },

    // Budget-specific methods
    getBudgets() {
        return this.get(STORAGE_KEYS.BUDGETS, []);
    },

    saveBudgets(budgets) {
        return this.set(STORAGE_KEYS.BUDGETS, budgets);
    },

    addBudget(budget) {
        const budgets = this.getBudgets();
        budgets.push({
            ...budget,
            id: Date.now().toString(),
            createdAt: new Date().toISOString()
        });
        return this.saveBudgets(budgets);
    },

    updateBudget(id, updates) {
        const budgets = this.getBudgets();
        const index = budgets.findIndex(b => b.id === id);
        if (index !== -1) {
            budgets[index] = { ...budgets[index], ...updates };
            return this.saveBudgets(budgets);
        }
        return false;
    },

    deleteBudget(id) {
        const budgets = this.getBudgets();
        const filtered = budgets.filter(b => b.id !== id);
        return this.saveBudgets(filtered);
    },

    // Settings-specific methods
    getSettings() {
        return this.get(STORAGE_KEYS.SETTINGS, {
            theme: 'light',
            currency: 'RUB',
            locale: 'ru-RU'
        });
    },

    saveSettings(settings) {
        return this.set(STORAGE_KEYS.SETTINGS, settings);
    },

    updateSetting(key, value) {
        const settings = this.getSettings();
        settings[key] = value;
        return this.saveSettings(settings);
    },

    // Export/Import
    exportData() {
        return {
            transactions: this.getTransactions(),
            budgets: this.getBudgets(),
            settings: this.getSettings(),
            exportedAt: new Date().toISOString()
        };
    },

    importData(data) {
        try {
            if (data.transactions) {
                this.saveTransactions(data.transactions);
            }
            if (data.budgets) {
                this.saveBudgets(data.budgets);
            }
            if (data.settings) {
                this.saveSettings(data.settings);
            }
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
};

export default storage;
