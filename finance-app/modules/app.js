// App module - main application logic and event handling
import { storage } from './storage.js';
import { ui } from './ui.js';

export const app = {
    currentFilter: 'all',

    init() {
        this.bindEvents();
        this.loadTransactions();
    },

    bindEvents() {
        // Form submission
        const form = document.getElementById('transaction-form');
        form.addEventListener('submit', (e) => this.handleFormSubmit(e));

        // Delete transaction (event delegation)
        document.getElementById('transaction-list').addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-delete')) {
                const id = parseInt(e.target.dataset.id);
                this.deleteTransaction(id);
            }
        });

        // Filter buttons
        document.getElementById('filter-all').addEventListener('click', () => this.setFilter('all'));
        document.getElementById('filter-income').addEventListener('click', () => this.setFilter('income'));
        document.getElementById('filter-expense').addEventListener('click', () => this.setFilter('expense'));

        // Clear all button
        document.getElementById('clear-all').addEventListener('click', () => this.clearAll());
    },

    handleFormSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const data = ui.getFormData(form);

        if (!data.description || !data.amount || data.amount <= 0) {
            alert('Пожалуйста, заполните все поля корректно');
            return;
        }

        const transaction = {
            id: Date.now(),
            description: data.description,
            amount: data.amount,
            type: data.type,
            category: data.category,
            date: new Date().toISOString()
        };

        storage.addTransaction(transaction);
        ui.resetForm(form);
        this.loadTransactions();
    },

    deleteTransaction(id) {
        if (confirm('Вы уверены, что хотите удалить эту операцию?')) {
            storage.deleteTransaction(id);
            this.loadTransactions();
        }
    },

    clearAll() {
        if (confirm('Вы уверены, что хотите удалить все операции? Это действие нельзя отменить.')) {
            storage.clearAll();
            this.loadTransactions();
        }
    },

    setFilter(filter) {
        this.currentFilter = filter;
        ui.setActiveFilter(filter);
        this.loadTransactions();
    },

    loadTransactions() {
        const transactions = storage.getTransactions();
        ui.renderTransactions(transactions, this.currentFilter);
        ui.updateSummary(transactions);
    }
};
