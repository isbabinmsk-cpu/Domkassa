/**
 * App Module - Main application logic and event handlers
 */

import { storage } from './storage.js';
import { ui } from './ui.js';

export const app = {
    init() {
        // Initialize theme first
        ui.initTheme();
        
        // Initialize data if needed
        this.ensureDefaultData();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initial render
        this.renderAll();
        
        // Expose functions to window for inline onclick handlers
        this.exposeFunctions();
    },

    ensureDefaultData() {
        // Ensure categories exist
        const categories = storage.getCategories();
        if (categories.length === 0) {
            // Categories will be created by storage module automatically
        }
        
        // Ensure accounts exist
        const accounts = storage.getAccounts();
        if (accounts.length === 0) {
            // Accounts will be created by storage module automatically
        }
    },

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabId = e.currentTarget.dataset.tab;
                ui.switchTab(tabId);
                
                // Render charts when switching to analytics tab
                if (tabId === 'analytics') {
                    const period = document.getElementById('analytics-period')?.value || 'month';
                    ui.renderAnalyticsCharts(period);
                }
                
                // Refresh budgets when switching to budgets tab
                if (tabId === 'budgets') {
                    ui.renderBudgets();
                }
            });
        });

        // Theme toggle
        document.getElementById('theme-toggle')?.addEventListener('click', () => {
            ui.toggleTheme();
        });

        // Add transaction buttons
        document.getElementById('add-transaction-btn')?.addEventListener('click', () => {
            this.openTransactionModal();
        });
        
        document.getElementById('add-transaction-btn-2')?.addEventListener('click', () => {
            this.openTransactionModal();
        });

        // Add budget button
        document.getElementById('add-budget-btn')?.addEventListener('click', () => {
            this.openBudgetModal();
        });

        // Add category button
        document.getElementById('add-category-btn')?.addEventListener('click', () => {
            this.openCategoryModal();
        });

        // Add account button
        document.getElementById('add-account-btn')?.addEventListener('click', () => {
            this.openAccountModal();
        });

        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    ui.closeModal(modal.id);
                }
            });
        });

        // Close modal on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    ui.closeModal(modal.id);
                }
            });
        });

        // Transaction form submit
        document.getElementById('transaction-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleTransactionSubmit();
        });

        // Budget form submit
        document.getElementById('budget-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleBudgetSubmit();
        });

        // Category form submit
        document.getElementById('category-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCategorySubmit();
        });

        // Account form submit
        document.getElementById('account-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAccountSubmit();
        });

        // Filter apply
        document.getElementById('apply-filters')?.addEventListener('click', () => {
            this.applyFilters();
        });

        // Filter reset
        document.getElementById('reset-filters')?.addEventListener('click', () => {
            this.resetFilters();
        });

        // View all transactions button
        document.querySelector('.view-all-btn')?.addEventListener('click', (e) => {
            const tabId = e.target.dataset.tab;
            if (tabId) {
                ui.switchTab(tabId);
            }
        });

        // Analytics period change
        document.getElementById('analytics-period')?.addEventListener('change', (e) => {
            ui.renderAnalyticsCharts(e.target.value);
        });

        // Export report
        document.getElementById('export-report')?.addEventListener('click', () => {
            this.exportReport();
        });

        // Settings - theme change
        document.getElementById('setting-theme')?.addEventListener('change', (e) => {
            ui.setTheme(e.target.value);
        });

        // Settings - currency change
        document.getElementById('setting-currency')?.addEventListener('change', (e) => {
            storage.updateSettings({ currency: e.target.value });
            this.renderAll();
        });

        // Settings - language change
        document.getElementById('setting-language')?.addEventListener('change', (e) => {
            storage.updateSettings({ language: e.target.value });
            // Language switching would require full i18n implementation
            alert('Переключение языка будет доступно в следующей версии');
        });

        // Export data
        document.getElementById('export-data')?.addEventListener('click', () => {
            this.exportData();
        });

        // Import data
        document.getElementById('import-data')?.addEventListener('click', () => {
            document.getElementById('import-file')?.click();
        });

        document.getElementById('import-file')?.addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
        });

        // Clear all data
        document.getElementById('clear-all-data')?.addEventListener('click', () => {
            if (confirm('Вы уверены? Все данные будут удалены без возможности восстановления!')) {
                storage.clearAllData();
                this.renderAll();
                alert('Все данные удалены');
            }
        });
    },

    exposeFunctions() {
        // Make functions available globally for inline onclick handlers
        window.editTransaction = (id) => this.openTransactionModal(id);
        window.deleteTransaction = (id) => this.deleteTransaction(id);
        window.editBudget = (id) => this.openBudgetModal(id);
        window.deleteBudget = (id) => this.deleteBudget(id);
        window.editCategory = (id) => this.openCategoryModal(id);
        window.deleteCategory = (id) => this.deleteCategory(id);
        window.editAccount = (id) => this.openAccountModal(id);
        window.deleteAccount = (id) => this.deleteAccount(id);
    },

    renderAll() {
        ui.renderSummaryCards();
        ui.renderRecentTransactions();
        ui.renderTransactionsTable();
        ui.renderCategorySelects();
        ui.renderAccountSelects();
        ui.renderBudgets();
        ui.renderMainChart();
        ui.renderExpensePieChart();
        
        // Load settings into form
        const settings = storage.getSettings();
        document.getElementById('setting-theme').value = settings.theme;
        document.getElementById('setting-currency').value = settings.currency;
        document.getElementById('setting-language').value = settings.language;
    },

    openTransactionModal(id = null) {
        const modal = document.getElementById('transaction-modal');
        const title = document.getElementById('transaction-modal-title');
        const form = document.getElementById('transaction-form');
        
        // Set today's date as default
        document.getElementById('transaction-date').valueAsDate = new Date();
        
        if (id) {
            // Edit mode
            title.textContent = 'Редактировать операцию';
            const transaction = storage.getTransactions().find(t => t.id === id);
            if (transaction) {
                document.getElementById('transaction-id').value = transaction.id;
                document.querySelector(`input[name="type"][value="${transaction.type}"]`).checked = true;
                document.getElementById('transaction-amount').value = transaction.amount;
                document.getElementById('transaction-category').value = transaction.categoryId;
                document.getElementById('transaction-account').value = transaction.accountId;
                document.getElementById('transaction-date').value = transaction.date;
                document.getElementById('transaction-description').value = transaction.description || '';
            }
        } else {
            // Add mode
            title.textContent = 'Добавить операцию';
            form.reset();
            document.getElementById('transaction-id').value = '';
            document.querySelector('input[name="type"][value="expense"]').checked = true;
            document.getElementById('transaction-date').valueAsDate = new Date();
        }
        
        ui.openModal('transaction-modal');
    },

    handleTransactionSubmit() {
        const id = document.getElementById('transaction-id').value;
        const type = document.querySelector('input[name="type"]:checked').value;
        const amountInput = document.getElementById('transaction-amount');
        const amount = parseFloat(amountInput.value);
        const categoryId = document.getElementById('transaction-category').value;
        const accountId = document.getElementById('transaction-account').value;
        const date = document.getElementById('transaction-date').value;
        const description = document.getElementById('transaction-description').value;

        // Валидация суммы
        if (isNaN(amount) || amount <= 0) {
            alert('Пожалуйста, введите корректную сумму (больше 0)');
            amountInput.focus();
            return;
        }

        // Валидация категории
        if (!categoryId) {
            alert('Пожалуйста, выберите категорию');
            return;
        }

        // Валидация счёта
        if (!accountId) {
            alert('Пожалуйста, выберите счёт');
            return;
        }

        // Валидация даты
        if (!date) {
            alert('Пожалуйста, выберите дату');
            return;
        }

        const transactionData = {
            type,
            amount,
            categoryId,
            accountId,
            date,
            description
        };

        if (id) {
            storage.updateTransaction(id, transactionData);
        } else {
            storage.addTransaction(transactionData);
        }

        ui.closeModal('transaction-modal');
        ui.resetForm('transaction-form');
        this.renderAll();
    },

    deleteTransaction(id) {
        if (confirm('Удалить эту операцию?')) {
            storage.deleteTransaction(id);
            this.renderAll();
        }
    },

    openBudgetModal(id = null) {
        const modal = document.getElementById('budget-modal');
        const title = document.getElementById('budget-modal-title');
        
        if (id) {
            title.textContent = 'Редактировать бюджет';
            const budget = storage.getBudgets().find(b => b.id === id);
            if (budget) {
                document.getElementById('budget-id').value = budget.id;
                document.getElementById('budget-category').value = budget.categoryId;
                document.getElementById('budget-limit').value = budget.limit;
                document.getElementById('budget-color').value = budget.color || '#4CAF50';
            }
        } else {
            title.textContent = 'Создать бюджет';
            document.getElementById('budget-form').reset();
            document.getElementById('budget-id').value = '';
        }
        
        ui.openModal('budget-modal');
    },

    handleBudgetSubmit() {
        const id = document.getElementById('budget-id').value;
        const categoryId = document.getElementById('budget-category').value;
        const limitInput = document.getElementById('budget-limit');
        const limit = parseFloat(limitInput.value);
        const color = document.getElementById('budget-color').value;

        // Валидация лимита
        if (isNaN(limit) || limit <= 0) {
            alert('Пожалуйста, введите корректный лимит бюджета (больше 0)');
            limitInput.focus();
            return;
        }

        // Валидация категории
        if (!categoryId) {
            alert('Пожалуйста, выберите категорию');
            return;
        }

        const budgetData = { categoryId, limit, color };

        if (id) {
            storage.updateBudget(id, budgetData);
        } else {
            storage.addBudget(budgetData);
        }

        ui.closeModal('budget-modal');
        ui.resetForm('budget-form');
        ui.renderBudgets();
    },

    deleteBudget(id) {
        if (confirm('Удалить этот бюджет?')) {
            storage.deleteBudget(id);
            ui.renderBudgets();
        }
    },

    openCategoryModal(id = null) {
        const modal = document.getElementById('category-modal');
        const title = document.getElementById('category-modal-title');
        
        if (id) {
            title.textContent = 'Редактировать категорию';
            const category = storage.getCategories().find(c => c.id === id);
            if (category) {
                document.getElementById('category-id').value = category.id;
                document.getElementById('category-type').value = category.type;
                document.getElementById('category-name').value = category.name;
                document.getElementById('category-icon').value = category.icon || '';
                document.getElementById('category-color').value = category.color || '#2196F3';
            }
        } else {
            title.textContent = 'Добавить категорию';
            document.getElementById('category-form').reset();
            document.getElementById('category-id').value = '';
        }
        
        ui.openModal('category-modal');
    },

    handleCategorySubmit() {
        const id = document.getElementById('category-id').value;
        const type = document.getElementById('category-type').value;
        const nameInput = document.getElementById('category-name');
        const name = nameInput.value.trim();
        const icon = document.getElementById('category-icon').value || '📁';
        const color = document.getElementById('category-color').value;

        // Валидация имени категории
        if (!name || name.length < 2) {
            alert('Название категории должно содержать минимум 2 символа');
            nameInput.focus();
            return;
        }

        const categoryData = { type, name, icon, color };

        if (id) {
            storage.updateCategory(id, categoryData);
        } else {
            storage.addCategory(categoryData);
        }

        ui.closeModal('category-modal');
        ui.resetForm('category-form');
        ui.renderCategorySelects();
    },

    deleteCategory(id) {
        if (confirm('Удалить эту категорию? Это может повлиять на существующие операции.')) {
            storage.deleteCategory(id);
            ui.renderCategorySelects();
        }
    },

    openAccountModal(id = null) {
        const modal = document.getElementById('account-modal');
        const title = document.getElementById('account-modal-title');
        
        if (id) {
            title.textContent = 'Редактировать счет';
            const account = storage.getAccounts().find(a => a.id === id);
            if (account) {
                document.getElementById('account-id').value = account.id;
                document.getElementById('account-name').value = account.name;
                document.getElementById('account-type').value = account.type;
                document.getElementById('account-balance').value = account.balance || 0;
                document.getElementById('account-currency').value = account.currency || 'RUB';
                document.getElementById('account-color').value = account.color || '#4CAF50';
            }
        } else {
            title.textContent = 'Добавить счет';
            document.getElementById('account-form').reset();
            document.getElementById('account-id').value = '';
        }
        
        ui.openModal('account-modal');
    },

    handleAccountSubmit() {
        const id = document.getElementById('account-id').value;
        const nameInput = document.getElementById('account-name');
        const name = nameInput.value.trim();
        const type = document.getElementById('account-type').value;
        const balanceInput = document.getElementById('account-balance');
        const balance = parseFloat(balanceInput.value) || 0;
        const currency = document.getElementById('account-currency').value;
        const color = document.getElementById('account-color').value;

        // Валидация имени счёта
        if (!name || name.length < 2) {
            alert('Название счёта должно содержать минимум 2 символа');
            nameInput.focus();
            return;
        }

        // Валидация баланса
        if (balance < 0) {
            alert('Баланс не может быть отрицательным');
            balanceInput.focus();
            return;
        }

        const accountData = { name, type, balance, currency, color };

        if (id) {
            storage.updateAccount(id, accountData);
        } else {
            storage.addAccount(accountData);
        }

        ui.closeModal('account-modal');
        ui.resetForm('account-form');
        ui.renderAccountSelects();
        ui.renderSummaryCards();
    },

    deleteAccount(id) {
        if (confirm('Удалить этот счет?')) {
            storage.deleteAccount(id);
            ui.renderAccountSelects();
            ui.renderSummaryCards();
        }
    },

    applyFilters() {
        const type = document.getElementById('filter-type').value;
        const categoryId = document.getElementById('filter-category').value;
        const accountId = document.getElementById('filter-account').value;
        const dateFrom = document.getElementById('filter-date-from').value;
        const dateTo = document.getElementById('filter-date-to').value;

        let transactions = storage.getTransactions();

        if (type !== 'all') {
            transactions = transactions.filter(t => t.type === type);
        }

        if (categoryId) {
            transactions = transactions.filter(t => t.categoryId === categoryId);
        }

        if (accountId) {
            transactions = transactions.filter(t => t.accountId === accountId);
        }

        if (dateFrom) {
            transactions = transactions.filter(t => t.date >= dateFrom);
        }

        if (dateTo) {
            transactions = transactions.filter(t => t.date <= dateTo);
        }

        ui.renderTransactionsTable(transactions);
    },

    resetFilters() {
        document.getElementById('filter-type').value = 'all';
        document.getElementById('filter-category').value = '';
        document.getElementById('filter-account').value = '';
        document.getElementById('filter-date-from').value = '';
        document.getElementById('filter-date-to').value = '';
        ui.renderTransactionsTable();
    },

    exportReport() {
        const data = storage.exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `finance-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    exportData() {
        this.exportReport();
    },

    importData(file) {
        if (!file) return;

        // Проверка типа файла
        if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
            alert('Пожалуйста, выберите JSON файл');
            return;
        }

        // Проверка размера файла (максимум 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            alert('Размер файла не должен превышать 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                // Валидация структуры данных
                if (!data.transactions || !data.categories || !data.accounts) {
                    throw new Error('Неверная структура файла');
                }
                
                storage.importData(data);
                this.renderAll();
                alert('Данные успешно импортированы!');
            } catch (error) {
                console.error('Import error:', error);
                alert('Ошибка при импорте данных. Проверьте файл.');
            }
        };
        reader.onerror = () => {
            alert('Ошибка чтения файла');
        };
        reader.readAsText(file);
    }
};
