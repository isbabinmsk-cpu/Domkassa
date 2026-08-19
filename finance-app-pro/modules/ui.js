/**
 * UI Module - Handles DOM manipulation and rendering
 */

import { storage } from './storage.js';

let charts = {};

export const ui = {
    initTheme() {
        // First check localStorage for saved theme, then settings
        let savedTheme = localStorage.getItem('financepro_theme');
        
        if (!savedTheme) {
            const settings = storage.getSettings();
            savedTheme = settings.theme;
        }
        
        let theme = savedTheme || 'light';
        
        if (theme === 'auto') {
            theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        
        document.documentElement.setAttribute('data-theme', theme);
        this.updateThemeIcon(theme);
        
        // Restore active tab from localStorage
        const savedTab = localStorage.getItem('financepro_activeTab');
        if (savedTab) {
            // Switch to saved tab WITHOUT calling event listeners
            // Event listeners are already set up in app.init()
            this.switchTab(savedTab);
        } else {
            // Default to dashboard if no saved tab
            this.switchTab('dashboard');
        }
    },

    async setTheme(theme) {
        if (theme === 'auto') {
            theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        
        document.documentElement.setAttribute('data-theme', theme);
        // Save to both settings and localStorage for persistence
        localStorage.setItem('financepro_theme', theme);
        await storage.updateSettings({ theme: theme === 'auto' ? 'auto' : theme });
        this.updateThemeIcon(theme);
    },

    updateThemeIcon(theme) {
        const icon = document.querySelector('#theme-toggle ion-icon');
        if (icon) {
            icon.setAttribute('name', theme === 'dark' ? 'sunny-outline' : 'moon-outline');
        }
        // Also update the select in settings
        const themeSelect = document.getElementById('setting-theme');
        if (themeSelect) {
            themeSelect.value = theme;
        }
    },

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    },

    switchTab(tabId) {
        // Remove active class from all nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Add active class to clicked button
        const activeBtn = document.querySelector(`[data-tab="${tabId}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Show selected tab content
        const tabContent = document.getElementById(tabId);
        if (tabContent) {
            tabContent.classList.add('active');
        }
        
        // Save active tab to localStorage
        localStorage.setItem('financepro_activeTab', tabId);
    },

    formatCurrency(amount, currency = 'RUB') {
        const symbols = { RUB: '₽', USD: '$', EUR: '€' };
        const symbol = symbols[currency] || '₽';
        return new Intl.NumberFormat('ru-RU').format(amount) + ' ' + symbol;
    },

    formatDate(dateString) {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(date);
    },

    async renderSummaryCards() {
        const transactions = await storage.getTransactions();
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        let totalIncome = 0;
        let totalExpense = 0;
        let totalBalance = 0;

        transactions.forEach(t => {
            const tDate = new Date(t.date);
            if (t.type === 'income') {
                totalIncome += parseFloat(t.amount);
                totalBalance += parseFloat(t.amount);
            } else {
                totalExpense += parseFloat(t.amount);
                totalBalance -= parseFloat(t.amount);
            }
        });

        const accounts = await storage.getAccounts();
        accounts.forEach(acc => {
            totalBalance += parseFloat(acc.balance || 0);
        });

        const budgets = await storage.getBudgets();
        const totalSavings = budgets.reduce((sum, b) => sum + (parseFloat(b.limit) || 0), 0);

        document.getElementById('total-income').textContent = this.formatCurrency(totalIncome);
        document.getElementById('total-expense').textContent = this.formatCurrency(totalExpense);
        document.getElementById('total-balance').textContent = this.formatCurrency(totalBalance);
        document.getElementById('total-savings').textContent = this.formatCurrency(totalSavings);
    },

    async renderRecentTransactions(limit = 5) {
        const transactions = await storage.getTransactions();
        const sorted = transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        const recent = sorted.slice(0, limit);
        
        const container = document.getElementById('recent-transactions-list');
        if (!container) return;

        if (recent.length === 0) {
            container.innerHTML = '<p style="color: var(--text-tertiary); text-align: center; padding: 2rem;">Нет операций</p>';
            return;
        }

        const categories = await storage.getCategories();
        const accounts = await storage.getAccounts();

        container.innerHTML = recent.map(t => {
            const category = categories.find(c => c.id === t.categoryId) || { name: 'Без категории', icon: 'help-circle-outline' };
            const account = accounts.find(a => a.id === t.accountId) || { name: 'Неизвестно' };
            
            return `
                <div class="transaction-item">
                    <div class="transaction-info">
                        <div class="transaction-icon"><ion-icon name="${category.icon}"></ion-icon></div>
                        <div class="transaction-details">
                            <h4>${t.description || category.name}</h4>
                            <p>${this.formatDate(t.date)} • ${account.name}</p>
                        </div>
                    </div>
                    <div class="transaction-amount ${t.type}">
                        ${t.type === 'income' ? '+' : '-'}${this.formatCurrency(t.amount)}
                    </div>
                </div>
            `;
        }).join('');
    },

    async renderTransactionsTable(transactions = null) {
        const txnList = transactions || await storage.getTransactions();
        const tbody = document.getElementById('transactions-table-body');
        if (!tbody) return;

        if (txnList.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-tertiary);">Нет операций</td></tr>';
            return;
        }

        const categories = await storage.getCategories();
        const accounts = await storage.getAccounts();

        tbody.innerHTML = txnList.map(t => {
            const category = categories.find(c => c.id === t.categoryId) || { name: 'Без категории', icon: 'help-circle-outline' };
            const account = accounts.find(a => a.id === t.accountId) || { name: 'Неизвестно' };
            
            return `
                <tr>
                    <td>${this.formatDate(t.date)}</td>
                    <td>${t.description || '-'}</td>
                    <td><span style="display: inline-flex; align-items: center; gap: 0.5rem;"><ion-icon name="${category.icon}"></ion-icon> ${category.name}</span></td>
                    <td>${account.name}</td>
                    <td class="amount-cell ${t.type}">${t.type === 'income' ? '+' : '-'}${this.formatCurrency(t.amount)}</td>
                    <td>
                        <div class="action-btns">
                            <button class="action-btn edit" onclick="window.editTransaction('${t.id}')"><ion-icon name="create-outline" style="font-size: 0.875rem;"></ion-icon></button>
                            <button class="action-btn delete" onclick="window.deleteTransaction('${t.id}')"><ion-icon name="trash-outline" style="font-size: 0.875rem;"></ion-icon></button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    async renderCategorySelects() {
        const categories = await storage.getCategories();
        const incomeCategories = categories.filter(c => c.type === 'income');
        const expenseCategories = categories.filter(c => c.type === 'expense');

        // Transaction form select
        const txnSelect = document.getElementById('transaction-category');
        if (txnSelect) {
            txnSelect.innerHTML = categories.map(c => 
                `<option value="${c.id}">${c.icon} ${c.name}</option>`
            ).join('');
        }

        // Filter select
        const filterSelect = document.getElementById('filter-category');
        if (filterSelect) {
            filterSelect.innerHTML = '<option value="">Все</option>' + 
                categories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
        }

        // Budget category select
        const budgetSelect = document.getElementById('budget-category');
        if (budgetSelect) {
            budgetSelect.innerHTML = expenseCategories.map(c => 
                `<option value="${c.id}">${c.icon} ${c.name}</option>`
            ).join('');
        }

        // Render categories lists
        await this.renderCategoriesList();
    },

    async renderAccountSelects() {
        const accounts = await storage.getAccounts();

        // Transaction form select
        const txnSelect = document.getElementById('transaction-account');
        if (txnSelect) {
            txnSelect.innerHTML = accounts.map(a => 
                `<option value="${a.id}">${a.name}</option>`
            ).join('');
        }

        // Filter select
        const filterSelect = document.getElementById('filter-account');
        if (filterSelect) {
            filterSelect.innerHTML = '<option value="">Все</option>' + 
                accounts.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
        }

        // Render accounts grid
        this.renderAccountsGrid();
    },

    async renderCategoriesList() {
        const categories = await storage.getCategories();
        const incomeCats = categories.filter(c => c.type === 'income');
        const expenseCats = categories.filter(c => c.type === 'expense');

        const incomeContainer = document.getElementById('income-categories');
        const expenseContainer = document.getElementById('expense-categories');

        if (incomeContainer) {
            incomeContainer.innerHTML = incomeCats.map(c => this.renderCategoryItem(c)).join('');
        }

        if (expenseContainer) {
            expenseContainer.innerHTML = expenseCats.map(c => this.renderCategoryItem(c)).join('');
        }
    },

    renderCategoryItem(category) {
        return `
            <div class="category-item" style="border-left-color: ${category.color}">
                <div class="category-info">
                    <span class="category-icon-preview"><ion-icon name="${category.icon}"></ion-icon></span>
                    <span>${category.name}</span>
                    <div class="category-color-dot" style="background: ${category.color}"></div>
                </div>
                <div class="action-btns">
                    <button class="action-btn edit" onclick="window.editCategory('${category.id}')"><ion-icon name="create-outline" style="font-size: 0.875rem;"></ion-icon></button>
                    <button class="action-btn delete" onclick="window.deleteCategory('${category.id}')"><ion-icon name="trash-outline" style="font-size: 0.875rem;"></ion-icon></button>
                </div>
            </div>
        `;
    },

    async renderAccountsGrid() {
        const accounts = await storage.getAccounts();
        const container = document.getElementById('accounts-container');
        
        if (!container) return;

        if (accounts.length === 0) {
            container.innerHTML = '<p style="color: var(--text-tertiary); text-align: center; padding: 2rem;">Нет счетов</p>';
            return;
        }

        const typeLabels = { cash: 'Наличные', bank: 'Банковский', card: 'Карта', investment: 'Инвестиции', other: 'Другой' };

        container.innerHTML = accounts.map(a => `
            <div class="card account-card" style="border-top: 4px solid ${a.color}">
                <div class="account-header">
                    <div>
                        <h3>${a.name}</h3>
                        <span class="account-type-badge">${typeLabels[a.type] || a.type}</span>
                    </div>
                    <div class="action-btns">
                        <button class="action-btn edit" onclick="window.editAccount('${a.id}')"><ion-icon name="create-outline" style="font-size: 0.875rem;"></ion-icon></button>
                        <button class="action-btn delete" onclick="window.deleteAccount('${a.id}')"><ion-icon name="trash-outline" style="font-size: 0.875rem;"></ion-icon></button>
                    </div>
                </div>
                <div class="account-balance">${this.formatCurrency(a.balance || 0, a.currency)}</div>
                <div class="account-details">Валюта: ${a.currency}</div>
            </div>
        `).join('');
    },

    async renderBudgets() {
        const budgets = await storage.getBudgets();
        const container = document.getElementById('budgets-container');
        const categories = await storage.getCategories();
        const transactions = await storage.getTransactions();
        
        if (!container) return;

        if (budgets.length === 0) {
            container.innerHTML = '<p style="color: var(--text-tertiary); text-align: center; padding: 2rem; grid-column: 1/-1;">Нет бюджетов</p>';
            return;
        }

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        container.innerHTML = budgets.map(b => {
            const category = categories.find(c => c.id === b.categoryId) || { name: 'Неизвестно', icon: 'help-circle-outline' };
            const spent = transactions
                .filter(t => {
                    const tDate = new Date(t.date);
                    return t.categoryId === b.categoryId && 
                           t.type === 'expense' &&
                           tDate.getMonth() === currentMonth &&
                           tDate.getFullYear() === currentYear;
                })
                .reduce((sum, t) => sum + parseFloat(t.amount), 0);

            const percentage = Math.min((spent / b.limit) * 100, 100);
            const remaining = b.limit - spent;
            const isOverBudget = spent > b.limit;

            return `
                <div class="card budget-card">
                    <div class="budget-header">
                        <div class="budget-category">
                            <span><ion-icon name="${category.icon}" style="font-size: 1.25rem; margin-right: 0.5rem;"></ion-icon></span>
                            <span>${category.name}</span>
                        </div>
                        <div class="budget-actions">
                            <button class="action-btn edit" onclick="window.editBudget('${b.id}')"><ion-icon name="create-outline" style="font-size: 0.875rem;"></ion-icon></button>
                            <button class="action-btn delete" onclick="window.deleteBudget('${b.id}')"><ion-icon name="trash-outline" style="font-size: 0.875rem;"></ion-icon></button>
                        </div>
                    </div>
                    <div class="budget-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${percentage}%; background: ${isOverBudget ? 'var(--danger-color)' : b.color || 'var(--primary-color)'}"></div>
                        </div>
                        <div class="budget-stats">
                            <span>${this.formatCurrency(spent)}</span>
                            <span>из ${this.formatCurrency(b.limit)}</span>
                        </div>
                    </div>
                    <div class="budget-remaining ${isOverBudget ? 'negative' : 'positive'}">
                        ${isOverBudget ? 'Превышен на' : 'Осталось'}: ${this.formatCurrency(Math.abs(remaining))}
                    </div>
                </div>
            `;
        }).join('');
    },

    renderMainChart() {
        const ctx = document.getElementById('main-chart');
        if (!ctx) return;

        const transactions = storage.getTransactions();
        const last7Days = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            last7Days.push(date.toISOString().split('T')[0]);
        }

        const incomeData = last7Days.map(date => {
            return transactions
                .filter(t => t.date === date && t.type === 'income')
                .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        });

        const expenseData = last7Days.map(date => {
            return transactions
                .filter(t => t.date === date && t.type === 'expense')
                .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        });

        if (charts.main) charts.main.destroy();

        charts.main = new Chart(ctx, {
            type: 'line',
            data: {
                labels: last7Days.map(d => {
                    const date = new Date(d);
                    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
                }),
                datasets: [
                    {
                        label: 'Доходы',
                        data: incomeData,
                        borderColor: '#10B981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Расходы',
                        data: expenseData,
                        borderColor: '#EF4444',
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
                        beginAtZero: true
                    }
                }
            }
        });
    },

    renderExpensePieChart() {
        const ctx = document.getElementById('expense-pie-chart');
        if (!ctx) return;

        const transactions = storage.getTransactions();
        const categories = storage.getCategories();
        
        const expensesByCategory = {};
        
        transactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                if (!expensesByCategory[t.categoryId]) {
                    expensesByCategory[t.categoryId] = 0;
                }
                expensesByCategory[t.categoryId] += parseFloat(t.amount);
            });

        const labels = [];
        const data = [];
        const colors = [];

        Object.entries(expensesByCategory).forEach(([catId, amount]) => {
            const category = categories.find(c => c.id === catId);
            if (category) {
                labels.push(category.name);
                data.push(amount);
                colors.push(category.color);
            }
        });

        if (charts.expensePie) charts.expensePie.destroy();

        charts.expensePie = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    },

    async renderAnalyticsCharts(period = 'month') {
        // Line chart - monthly dynamics
        const lineCtx = document.getElementById('analytics-line-chart');
        if (lineCtx) {
            if (charts.analyticsLine) charts.analyticsLine.destroy();
            
            const monthlyData = await this.getMonthlyData(period);
            
            charts.analyticsLine = new Chart(lineCtx, {
                type: 'line',
                data: {
                    labels: monthlyData.labels,
                    datasets: [
                        {
                            label: 'Доходы',
                            data: monthlyData.income,
                            borderColor: '#10B981',
                            tension: 0.4
                        },
                        {
                            label: 'Расходы',
                            data: monthlyData.expense,
                            borderColor: '#EF4444',
                            tension: 0.4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }

        // Bar chart - income vs expense
        const barCtx = document.getElementById('analytics-bar-chart');
        if (barCtx) {
            if (charts.analyticsBar) charts.analyticsBar.destroy();
            
            const totals = await this.getTotalsByPeriod(period);
            
            charts.analyticsBar = new Chart(barCtx, {
                type: 'bar',
                data: {
                    labels: ['Доходы', 'Расходы', 'Баланс'],
                    datasets: [{
                        data: [totals.income, totals.expense, totals.income - totals.expense],
                        backgroundColor: ['#10B981', '#EF4444', '#4F46E5']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }

        // Top categories
        const topCtx = document.getElementById('analytics-top-categories');
        if (topCtx) {
            if (charts.topCategories) charts.topCategories.destroy();
            
            const topCategories = await this.getTopCategories(period);
            
            charts.topCategories = new Chart(topCtx, {
                type: 'bar',
                data: {
                    labels: topCategories.labels,
                    datasets: [{
                        data: topCategories.data,
                        backgroundColor: topCategories.colors
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }

        // Stats
        await this.renderAnalyticsStats(period);
    },

    async getMonthlyData(period) {
        const transactions = await storage.getTransactions();
        const months = [];
        const count = period === 'week' ? 1 : period === 'quarter' ? 3 : period === 'year' ? 12 : 1;
        
        for (let i = count - 1; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            months.push(date.toLocaleDateString('ru-RU', { month: 'short', year: '2-digit' }));
        }

        const income = months.map(() => 0);
        const expense = months.map(() => 0);

        transactions.forEach(t => {
            const tDate = new Date(t.date);
            months.forEach((label, idx) => {
                const monthDate = new Date();
                monthDate.setMonth(monthDate.getMonth() - (count - 1 - idx));
                if (tDate.getMonth() === monthDate.getMonth() && tDate.getFullYear() === monthDate.getFullYear()) {
                    if (t.type === 'income') income[idx] += parseFloat(t.amount);
                    else expense[idx] += parseFloat(t.amount);
                }
            });
        });

        return { labels: months, income, expense };
    },

    async getTotalsByPeriod(period) {
        const transactions = await storage.getTransactions();
        const now = new Date();
        let startDate = new Date();
        
        if (period === 'week') startDate.setDate(now.getDate() - 7);
        else if (period === 'quarter') startDate.setMonth(now.getMonth() - 3);
        else if (period === 'year') startDate.setFullYear(now.getFullYear() - 1);
        else startDate.setMonth(now.getMonth() - 1);

        let income = 0;
        let expense = 0;

        transactions.forEach(t => {
            const tDate = new Date(t.date);
            if (tDate >= startDate) {
                if (t.type === 'income') income += parseFloat(t.amount);
                else expense += parseFloat(t.amount);
            }
        });

        return { income, expense };
    },

    async getTopCategories(period, limit = 5) {
        const transactions = await storage.getTransactions();
        const categories = await storage.getCategories();
        const now = new Date();
        let startDate = new Date();
        
        if (period === 'week') startDate.setDate(now.getDate() - 7);
        else if (period === 'quarter') startDate.setMonth(now.getMonth() - 3);
        else if (period === 'year') startDate.setFullYear(now.getFullYear() - 1);
        else startDate.setMonth(now.getMonth() - 1);

        const expensesByCategory = {};

        transactions
            .filter(t => {
                const tDate = new Date(t.date);
                return t.type === 'expense' && tDate >= startDate;
            })
            .forEach(t => {
                if (!expensesByCategory[t.categoryId]) expensesByCategory[t.categoryId] = 0;
                expensesByCategory[t.categoryId] += parseFloat(t.amount);
            });

        const sorted = Object.entries(expensesByCategory)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit);

        return {
            labels: sorted.map(([id]) => {
                const cat = categories.find(c => c.id === id);
                return cat ? cat.name : 'Неизвестно';
            }),
            data: sorted.map(([, amount]) => amount),
            colors: sorted.map(([id]) => {
                const cat = categories.find(c => c.id === id);
                return cat ? cat.color : '#9CA3AF';
            })
        };
    },

    async renderAnalyticsStats(period) {
        const container = document.getElementById('analytics-stats');
        if (!container) return;

        const totals = await this.getTotalsByPeriod(period);
        const avgDaily = totals.expense / (period === 'week' ? 7 : period === 'month' ? 30 : period === 'quarter' ? 90 : 365);
        const savingsRate = totals.income > 0 ? ((totals.income - totals.expense) / totals.income * 100) : 0;

        container.innerHTML = `
            <div class="stat-item">
                <div class="stat-label">Общий доход</div>
                <div class="stat-value text-success">${this.formatCurrency(totals.income)}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Общие расходы</div>
                <div class="stat-value text-danger">${this.formatCurrency(totals.expense)}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Среднедневные расходы</div>
                <div class="stat-value">${this.formatCurrency(avgDaily)}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Уровень накоплений</div>
                <div class="stat-value ${savingsRate >= 0 ? 'text-success' : 'text-danger'}">${savingsRate.toFixed(1)}%</div>
            </div>
        `;
    },

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    },

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    },

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    },

    resetForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
            // Clear hidden ID fields
            form.querySelectorAll('input[type="hidden"]').forEach(input => {
                input.value = '';
            });
        }
    }
};
