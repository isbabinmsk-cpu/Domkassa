// Storage module - handles localStorage operations
export const storage = {
    KEY: 'finance_transactions',

    getTransactions() {
        const data = localStorage.getItem(this.KEY);
        return data ? JSON.parse(data) : [];
    },

    saveTransactions(transactions) {
        localStorage.setItem(this.KEY, JSON.stringify(transactions));
    },

    addTransaction(transaction) {
        const transactions = this.getTransactions();
        transactions.push(transaction);
        this.saveTransactions(transactions);
        return transaction;
    },

    deleteTransaction(id) {
        const transactions = this.getTransactions();
        const filtered = transactions.filter(t => t.id !== id);
        this.saveTransactions(filtered);
    },

    clearAll() {
        localStorage.removeItem(this.KEY);
    }
};
