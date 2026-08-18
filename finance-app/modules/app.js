/**
 * App Module
 * Main application logic and event handling
 */

import storage from './storage.js';
import ui from './ui.js';

// Application state
const state = {
    transactions: [],
    budgets: [],
    settings: {},
    currentPage: 1,
    itemsPerPage: 10,
    viewMode: 'list',
    filters: {
        type: 'all',
        category: 'all',
        account: 'all',
        search: '',
        dateFrom: '',
        dateTo: ''
    }
};

// Chart instances
let expenseChart = null;
let trendChart = null;

export const app = {
    /**
     * Initialize the application
     */
    async init() {
        // Initialize theme first (before any rendering)
        ui.initTheme();
        
        // Load data from storage
        state.transactions = storage.getTransactions();
        state.budgets = storage.getBudgets();
        state.settings = storage.getSettings();

        // Apply saved theme from settings (override localStorage if exists)
        if (state.settings.theme) {
            ui.setTheme(state.settings.theme);
        }

        // Set default date in form
        this.setDefaultDate();

        // Setup event listeners
        this.setupEventListeners();

        // Setup modal handlers
        ui.setupModalHandlers('budgetModal');

        // Initial render
        this.renderAll();

        console.log('Finance App initialized successfully!');
    },

    /**
     * Set default date in transaction form to today
     */
    setDefaultDate() {
        const dateInput = document.getElementById('date');
        if (dateInput) {
            dateInput.value = ui.formatDateForInput(new Date());
        }
    },

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Transaction form submission
        const form = document.getElementById('transactionForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleTransactionSubmit(e));
        }

        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.handleThemeToggle());
        }

        // Export button
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.handleExport());
        }

        // Import button and file input
        const importBtn = document.getElementById('importBtn');
        const importFile = document.getElementById('importFile');
        if (importBtn && importFile) {
            importBtn.addEventListener('click', () => importFile.click());
            importFile.addEventListener('change', (e) => this.handleImport(e));
        }

        // View mode toggles
        const viewList = document.getElementById('viewList');
        const viewGrid = document.getElementById('viewGrid');
        if (viewList) {
            viewList.addEventListener('click', () => this.setViewMode('list'));
        }
        if (viewGrid) {
            viewGrid.addEventListener('click', () => this.setViewMode('grid'));
        }

        // Mobile navigation tabs
        const mobileNav = document.getElementById('mobileNav');
        if (mobileNav) {
            mobileNav.addEventListener('click', (e) => {
                const tab = e.target.closest('.nav-tab');
                if (tab) {
                    this.switchMobileSection(tab.dataset.section);
                }
            });
        }

        // Mobile menu toggle
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', () => {
                // Toggle mobile menu - could show a dropdown with header actions
                ui.showToast('Меню: используйте кнопки внизу для навигации', 'info');
            });
        }

        // Filters
        const filterType = document.getElementById('filterType');
        const filterCategory = document.getElementById('filterCategory');
        const filterAccount = document.getElementById('filterAccount');
        const dateFrom = document.getElementById('dateFrom');
        const dateTo = document.getElementById('dateTo');
        const searchInput = document.getElementById('searchInput');
        const clearFilters = document.getElementById('clearFilters');

        if (filterType) filterType.addEventListener('change', (e) => this.handleFilterChange('type', e.target.value));
        if (filterCategory) filterCategory.addEventListener('change', (e) => this.handleFilterChange('category', e.target.value));
        if (filterAccount) filterAccount.addEventListener('change', (e) => this.handleFilterChange('account', e.target.value));
        if (dateFrom) dateFrom.addEventListener('change', (e) => this.handleFilterChange('dateFrom', e.target.value));
        if (dateTo) dateTo.addEventListener('change', (e) => this.handleFilterChange('dateTo', e.target.value));
        if (searchInput) searchInput.addEventListener('input', (e) => this.handleFilterChange('search', e.target.value));
        if (clearFilters) clearFilters.addEventListener('click', () => this.clearFilters());

        // Budget modal
        const addBudgetBtn = document.getElementById('addBudgetBtn');
        if (addBudgetBtn) {
            addBudgetBtn.addEventListener('click', () => ui.openModal('budgetModal'));
        }

        // Budget form
        const budgetForm = document.getElementById('budgetForm');
        if (budgetForm) {
            budgetForm.addEventListener('submit', (e) => this.handleBudgetSubmit(e));
        }

        // Delegated event listener for transaction delete buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-delete') || e.target.closest('.btn-delete')) {
                const btn = e.target.classList.contains('btn-delete') ? e.target : e.target.closest('.btn-delete');
                const id = btn.dataset.id;
                if (id) {
                    this.deleteTransaction(id);
                }
            }

            // Budget delete buttons
            if (e.target.classList.contains('budget-delete')) {
                const id = e.target.dataset.id;
                if (id) {
                    this.deleteBudget(id);
                }
            }
        });
    },

    /**
     * Handle transaction form submission
     * @param {Event} e - Submit event
     */
    handleTransactionSubmit(e) {
        e.preventDefault();

        const form = e.target;
        const formData = new FormData(form);

        const transaction = {
            type: document.getElementById('type').value,
            amount: parseFloat(document.getElementById('amount').value),
            category: document.getElementById('category').value,
            description: document.getElementById('description').value.trim(),
            date: document.getElementById('date').value,
            account: document.getElementById('account').value
        };

        // Validate
        if (!transaction.type || !transaction.amount || !transaction.category || !transaction.date || !transaction.account) {
            ui.showToast('Заполните все обязательные поля', 'error');
            return;
        }

        if (transaction.amount <= 0) {
            ui.showToast('Сумма должна быть больше нуля', 'error');
            return;
        }

        // Add transaction
        if (storage.addTransaction(transaction)) {
            state.transactions = storage.getTransactions();
            this.renderAll();
            ui.clearForm(form);
            ui.showToast('Операция успешно добавлена', 'success');
            ui.scrollTo('.transactions-section');
        } else {
            ui.showToast('Ошибка при сохранении операции', 'error');
        }
    },

    /**
     * Delete a transaction
     * @param {string} id - Transaction ID
     */
    deleteTransaction(id) {
        if (confirm('Вы уверены, что хотите удалить эту операцию?')) {
            if (storage.deleteTransaction(id)) {
                state.transactions = storage.getTransactions();
                this.renderAll();
                ui.showToast('Операция удалена', 'success');
            } else {
                ui.showToast('Ошибка при удалении операции', 'error');
            }
        }
    },

    /**
     * Handle theme toggle
     */
    handleThemeToggle() {
        const newTheme = ui.toggleTheme();
        storage.updateSetting('theme', newTheme);
    },

    /**
     * Set view mode (list or grid)
     * @param {string} mode - View mode
     */
    setViewMode(mode) {
        state.viewMode = mode;
        
        // Update button states
        const viewList = document.getElementById('viewList');
        const viewGrid = document.getElementById('viewGrid');
        
        if (viewList) viewList.classList.toggle('active', mode === 'list');
        if (viewGrid) viewGrid.classList.toggle('active', mode === 'grid');

        // Re-render transactions
        const filtered = this.getFilteredTransactions();
        const paginated = this.paginateTransactions(filtered);
        ui.renderTransactions(paginated, mode);
    },

    /**
     * Handle filter change
     * @param {string} key - Filter key
     * @param {string} value - Filter value
     */
    handleFilterChange(key, value) {
        state.filters[key] = value;
        state.currentPage = 1; // Reset to first page on filter change
        this.renderTransactionsWithPagination();
    },

    /**
     * Clear all filters
     */
    clearFilters() {
        state.filters = {
            type: 'all',
            category: 'all',
            account: 'all',
            search: '',
            dateFrom: '',
            dateTo: ''
        };

        // Reset UI
        document.getElementById('filterType').value = 'all';
        document.getElementById('filterCategory').value = 'all';
        document.getElementById('filterAccount').value = 'all';
        document.getElementById('dateFrom').value = '';
        document.getElementById('dateTo').value = '';
        document.getElementById('searchInput').value = '';

        state.currentPage = 1;
        this.renderAll();
    },

    /**
     * Get filtered transactions based on current filters
     * @returns {Array} Filtered transactions
     */
    getFilteredTransactions() {
        let filtered = [...state.transactions];

        // Sort by date (newest first)
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Apply filters
        if (state.filters.type !== 'all') {
            filtered = filtered.filter(t => t.type === state.filters.type);
        }

        if (state.filters.category !== 'all') {
            filtered = filtered.filter(t => t.category === state.filters.category);
        }

        if (state.filters.account !== 'all') {
            filtered = filtered.filter(t => t.account === state.filters.account);
        }

        if (state.filters.search) {
            const searchLower = state.filters.search.toLowerCase();
            filtered = filtered.filter(t => 
                (t.description && t.description.toLowerCase().includes(searchLower)) ||
                ui.getCategoryName(t.category).toLowerCase().includes(searchLower)
            );
        }

        if (state.filters.dateFrom) {
            filtered = filtered.filter(t => new Date(t.date) >= new Date(state.filters.dateFrom));
        }

        if (state.filters.dateTo) {
            // Add one day to include the end date
            const toDate = new Date(state.filters.dateTo);
            toDate.setDate(toDate.getDate() + 1);
            filtered = filtered.filter(t => new Date(t.date) < toDate);
        }

        return filtered;
    },

    /**
     * Paginate transactions
     * @param {Array} transactions - Transactions to paginate
     * @returns {Array} Paginated transactions
     */
    paginateTransactions(transactions) {
        const start = (state.currentPage - 1) * state.itemsPerPage;
        const end = start + state.itemsPerPage;
        return transactions.slice(start, end);
    },

    /**
     * Render transactions with pagination
     */
    renderTransactionsWithPagination() {
        const filtered = this.getFilteredTransactions();
        const totalPages = Math.ceil(filtered.length / state.itemsPerPage);
        const paginated = this.paginateTransactions(filtered);

        ui.renderTransactions(paginated, state.viewMode);
        ui.renderPagination(state.currentPage, totalPages, (page) => {
            state.currentPage = page;
            this.renderTransactionsWithPagination();
        });
    },

    /**
     * Calculate statistics
     * @returns {Object} Statistics object
     */
    calculateStats() {
        const income = state.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expense = state.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        return {
            income,
            expense,
            balance: income - expense,
            count: state.transactions.length
        };
    },

    /**
     * Get expenses grouped by category for current month
     * @returns {Object} Expenses by category
     */
    getExpensesByCategory() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const expenses = state.transactions
            .filter(t => {
                const date = new Date(t.date);
                return t.type === 'expense' && 
                       date.getMonth() === currentMonth && 
                       date.getFullYear() === currentYear;
            });

        return expenses.reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {});
    },

    /**
     * Get monthly trends for charts
     * @returns {Object} Trends data
     */
    getMonthlyTrends() {
        const months = [];
        const incomeData = [];
        const expenseData = [];

        for (let i = 11; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            
            const month = date.getMonth();
            const year = date.getFullYear();
            
            months.push(date.toLocaleString('ru-RU', { month: 'short' }));

            const monthTransactions = state.transactions.filter(t => {
                const tDate = new Date(t.date);
                return tDate.getMonth() === month && tDate.getFullYear() === year;
            });

            const income = monthTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);

            const expense = monthTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);

            incomeData.push(income);
            expenseData.push(expense);
        }

        return { months, incomeData, expenseData };
    },

    /**
     * Render all components
     */
    renderAll() {
        // Update dashboard
        const stats = this.calculateStats();
        ui.updateDashboard(stats);

        // Update filter categories
        const categories = [...new Set(state.transactions.map(t => t.category))];
        ui.updateFilterCategories(categories);

        // Render transactions
        this.renderTransactionsWithPagination();

        // Render budgets
        const expensesByCategory = this.getExpensesByCategory();
        ui.renderBudgets(state.budgets, expensesByCategory);

        // Render charts
        this.renderCharts();
        
        // Initialize mobile section visibility
        this.initMobileSections();
    },

    /**
     * Initialize mobile sections visibility
     */
    initMobileSections() {
        // Check if we're on mobile
        if (window.innerWidth <= 768) {
            document.body.classList.add('has-mobile-tabs');
            // Show only dashboard by default
            document.querySelectorAll('[data-section]').forEach(section => {
                section.classList.remove('active');
            });
            const dashboard = document.querySelector('[data-section="dashboard"]');
            if (dashboard) {
                dashboard.classList.add('active');
            }
            // Update nav tabs
            document.querySelectorAll('.nav-tab').forEach(tab => {
                tab.classList.toggle('active', tab.dataset.section === 'dashboard');
            });
        } else {
            document.body.classList.remove('has-mobile-tabs');
            // Show all sections on desktop
            document.querySelectorAll('[data-section]').forEach(section => {
                section.style.display = '';
            });
        }
    },

    /**
     * Switch mobile section visibility
     * @param {string} sectionName - Section to show
     */
    switchMobileSection(sectionName) {
        // Only apply on mobile
        if (window.innerWidth > 768) return;
        
        document.body.classList.add('has-mobile-tabs');
        
        // Hide all sections
        document.querySelectorAll('[data-section]').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show target section
        const targetSection = document.querySelector(`[data-section="${sectionName}"]`);
        if (targetSection) {
            targetSection.classList.add('active');
            // Scroll to top when switching sections
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        
        // Update nav tabs active state
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.section === sectionName);
        });
    },

    /**
     * Render analytics charts using Chart.js
     */
    renderCharts() {
        // Check if Chart.js is available
        if (typeof Chart === 'undefined') {
            console.log('Chart.js not loaded, skipping charts');
            return;
        }

        // Destroy existing charts
        if (expenseChart) expenseChart.destroy();
        if (trendChart) trendChart.destroy();

        // Expense by category chart
        const expenseCtx = document.getElementById('expenseChart');
        if (expenseCtx) {
            const expensesByCategory = this.getExpensesByCategory();
            const categories = Object.keys(expensesByCategory);
            const values = Object.values(expensesByCategory);
            const labels = categories.map(cat => ui.getCategoryName(cat));
            const icons = categories.map(cat => ui.getCategoryIcon(cat));

            expenseChart = new Chart(expenseCtx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: values,
                        backgroundColor: [
                            '#4f46e5', '#10b981', '#f59e0b', '#ef4444',
                            '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6',
                            '#f97316', '#6366f1'
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                generateLabels: function(chart) {
                                    const original = Chart.defaults.plugins.legend.labels.generateLabels;
                                    const labels = original.call(this, chart);
                                    labels.forEach((label, index) => {
                                        label.text = icons[index] + ' ' + label.text;
                                    });
                                    return labels;
                                }
                            }
                        }
                    }
                }
            });
        }

        // Trend chart
        const trendCtx = document.getElementById('trendChart');
        if (trendCtx) {
            const trends = this.getMonthlyTrends();

            trendChart = new Chart(trendCtx, {
                type: 'line',
                data: {
                    labels: trends.months,
                    datasets: [
                        {
                            label: 'Доходы',
                            data: trends.incomeData,
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            fill: true,
                            tension: 0.4
                        },
                        {
                            label: 'Расходы',
                            data: trends.expenseData,
                            borderColor: '#ef4444',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            fill: true,
                            tension: 0.4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: (value) => value.toLocaleString('ru-RU') + ' ₽'
                            }
                        }
                    }
                }
            });
        }
    },

    /**
     * Handle budget form submission
     * @param {Event} e - Submit event
     */
    handleBudgetSubmit(e) {
        e.preventDefault();

        const budget = {
            category: document.getElementById('budgetCategory').value,
            amount: parseFloat(document.getElementById('budgetAmount').value),
            period: document.getElementById('budgetPeriod').value
        };

        // Validate
        if (!budget.category || !budget.amount || budget.amount <= 0) {
            ui.showToast('Заполните все поля корректно', 'error');
            return;
        }

        // Check if budget for this category already exists
        const existingIndex = state.budgets.findIndex(b => b.category === budget.category);
        if (existingIndex !== -1) {
            // Update existing budget
            state.budgets[existingIndex] = { ...state.budgets[existingIndex], ...budget };
        } else {
            // Add new budget
            state.budgets.push({
                ...budget,
                id: Date.now().toString(),
                createdAt: new Date().toISOString()
            });
        }

        if (storage.saveBudgets(state.budgets)) {
            ui.closeModal('budgetModal');
            document.getElementById('budgetForm').reset();
            this.renderAll();
            ui.showToast('Бюджет успешно сохранён', 'success');
        } else {
            ui.showToast('Ошибка при сохранении бюджета', 'error');
        }
    },

    /**
     * Delete a budget
     * @param {string} id - Budget ID
     */
    deleteBudget(id) {
        if (confirm('Вы уверены, что хотите удалить этот бюджет?')) {
            if (storage.deleteBudget(id)) {
                state.budgets = storage.getBudgets();
                this.renderAll();
                ui.showToast('Бюджет удалён', 'success');
            } else {
                ui.showToast('Ошибка при удалении бюджета', 'error');
            }
        }
    },

    /**
     * Handle data export
     */
    handleExport() {
        const data = storage.exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `finance-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        ui.showToast('Данные успешно экспортированы', 'success');
    },

    /**
     * Handle data import
     * @param {Event} e - Change event
     */
    handleImport(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (storage.importData(data)) {
                    state.transactions = storage.getTransactions();
                    state.budgets = storage.getBudgets();
                    state.settings = storage.getSettings();
                    
                    if (state.settings.theme) {
                        ui.setTheme(state.settings.theme);
                    }
                    
                    this.renderAll();
                    ui.showToast('Данные успешно импортированы', 'success');
                } else {
                    ui.showToast('Ошибка при импорте данных', 'error');
                }
            } catch (error) {
                ui.showToast('Неверный формат файла', 'error');
                console.error('Import error:', error);
            }
        };
        reader.readAsText(file);
        
        // Reset file input
        e.target.value = '';
    }
};

export default app;
