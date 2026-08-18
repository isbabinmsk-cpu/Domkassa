/**
 * UI Module
 * Handles DOM manipulation, rendering, and user interface updates
 */

// Category icons mapping
const categoryIcons = {
    salary: '💼',
    freelance: '💻',
    investments: '📈',
    gifts: '🎁',
    other_income: '💰',
    food: '🍔',
    transport: '🚗',
    utilities: '🏠',
    entertainment: '🎬',
    shopping: '🛍️',
    health: '🏥',
    education: '📚',
    travel: '✈️',
    other_expense: '📦'
};

// Category names mapping (Russian)
const categoryNames = {
    salary: 'Зарплата',
    freelance: 'Фриланс',
    investments: 'Инвестиции',
    gifts: 'Подарки',
    other_income: 'Другой доход',
    food: 'Продукты',
    transport: 'Транспорт',
    utilities: 'Коммунальные услуги',
    entertainment: 'Развлечения',
    shopping: 'Покупки',
    health: 'Здоровье',
    education: 'Образование',
    travel: 'Путешествия',
    other_expense: 'Другое'
};

// Account names mapping (Russian)
const accountNames = {
    cash: 'Наличные',
    bank_card: 'Банковская карта',
    bank_account: 'Банковский счёт',
    electronic: 'Электронный кошелёк'
};

export const ui = {
    /**
     * Format number as currency
     * @param {number} amount - Amount to format
     * @returns {string} Formatted currency string
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount);
    },

    /**
     * Format date for display
     * @param {string|Date} date - Date to format
     * @returns {string} Formatted date string
     */
    formatDate(date) {
        const d = new Date(date);
        return new Intl.DateTimeFormat('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(d);
    },

    /**
     * Format date for input field
     * @param {string|Date} date - Date to format
     * @returns {string} Formatted date string (YYYY-MM-DD)
     */
    formatDateForInput(date) {
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    },

    /**
     * Get category icon
     * @param {string} category - Category key
     * @returns {string} Emoji icon
     */
    getCategoryIcon(category) {
        return categoryIcons[category] || '📦';
    },

    /**
     * Get category name
     * @param {string} category - Category key
     * @returns {string} Category name in Russian
     */
    getCategoryName(category) {
        return categoryNames[category] || category;
    },

    /**
     * Get account name
     * @param {string} account - Account key
     * @returns {string} Account name in Russian
     */
    getAccountName(account) {
        return accountNames[account] || account;
    },

    /**
     * Update dashboard statistics
     * @param {Object} stats - Statistics object
     */
    updateDashboard(stats) {
        const totalIncomeEl = document.getElementById('totalIncome');
        const totalExpenseEl = document.getElementById('totalExpense');
        const totalBalanceEl = document.getElementById('totalBalance');
        const totalTransactionsEl = document.getElementById('totalTransactions');
        const balanceCard = document.getElementById('balanceCard');

        if (totalIncomeEl) {
            totalIncomeEl.textContent = this.formatCurrency(stats.income);
        }
        if (totalExpenseEl) {
            totalExpenseEl.textContent = this.formatCurrency(stats.expense);
        }
        if (totalBalanceEl) {
            totalBalanceEl.textContent = this.formatCurrency(stats.balance);
        }
        if (totalTransactionsEl) {
            totalTransactionsEl.textContent = stats.count;
        }
        if (balanceCard) {
            balanceCard.classList.toggle('positive', stats.balance >= 0);
            balanceCard.classList.toggle('negative', stats.balance < 0);
        }
    },

    /**
     * Render transactions list
     * @param {Array} transactions - Array of transaction objects
     * @param {string} viewMode - 'list' or 'grid'
     */
    renderTransactions(transactions, viewMode = 'list') {
        const container = document.getElementById('transactionsContainer');
        if (!container) return;

        if (transactions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <div class="empty-state-text">Нет операций</div>
                    <div class="empty-state-subtext">Добавьте первую операцию, чтобы начать учёт</div>
                </div>
            `;
            return;
        }

        container.className = `transactions-container ${viewMode}-view`;

        if (viewMode === 'list') {
            container.innerHTML = transactions.map(t => this.renderTransactionListItem(t)).join('');
        } else {
            container.innerHTML = transactions.map(t => this.renderTransactionCard(t)).join('');
        }
    },

    /**
     * Render single transaction as list item
     * @param {Object} transaction - Transaction object
     * @returns {string} HTML string
     */
    renderTransactionListItem(transaction) {
        const icon = this.getCategoryIcon(transaction.category);
        const description = transaction.description || this.getCategoryName(transaction.category);
        const amountClass = transaction.type;
        const amountPrefix = transaction.type === 'income' ? '+' : '-';
        const date = this.formatDate(transaction.date);
        const account = this.getAccountName(transaction.account);
        const category = this.getCategoryName(transaction.category);

        return `
            <div class="transaction-item ${transaction.type}" data-id="${transaction.id}">
                <div class="transaction-info">
                    <div class="transaction-category">${icon}</div>
                    <div class="transaction-details">
                        <div class="transaction-description">${this.escapeHtml(description)}</div>
                        <div class="transaction-meta">
                            <span>${date}</span>
                            <span>•</span>
                            <span>${category}</span>
                            <span>•</span>
                            <span>${account}</span>
                        </div>
                    </div>
                </div>
                <div class="transaction-amount ${amountClass}">
                    ${amountPrefix}${this.formatCurrency(transaction.amount)}
                </div>
                <div class="transaction-actions">
                    <button class="btn-delete" title="Удалить" data-id="${transaction.id}">🗑️</button>
                </div>
            </div>
        `;
    },

    /**
     * Render single transaction as card
     * @param {Object} transaction - Transaction object
     * @returns {string} HTML string
     */
    renderTransactionCard(transaction) {
        const icon = this.getCategoryIcon(transaction.category);
        const description = transaction.description || this.getCategoryName(transaction.category);
        const amountClass = transaction.type;
        const amountPrefix = transaction.type === 'income' ? '+' : '-';
        const date = this.formatDate(transaction.date);
        const account = this.getAccountName(transaction.account);
        const typeLabel = transaction.type === 'income' ? 'Доход' : 'Расход';

        return `
            <div class="transaction-card" data-id="${transaction.id}">
                <div class="transaction-card-header">
                    <div class="transaction-card-category">${icon}</div>
                    <span class="transaction-card-type ${transaction.type}">${typeLabel}</span>
                </div>
                <div class="transaction-card-body">
                    <div class="transaction-card-description">${this.escapeHtml(description)}</div>
                    <div class="transaction-card-meta">
                        <span>${date}</span>
                        <span>•</span>
                        <span>${this.getCategoryName(transaction.category)}</span>
                        <span>•</span>
                        <span>${account}</span>
                    </div>
                </div>
                <div class="transaction-card-footer">
                    <span class="transaction-card-amount ${amountClass}">
                        ${amountPrefix}${this.formatCurrency(transaction.amount)}
                    </span>
                    <button class="btn-delete" title="Удалить" data-id="${transaction.id}">🗑️</button>
                </div>
            </div>
        `;
    },

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Render pagination
     * @param {number} currentPage - Current page number
     * @param {number} totalPages - Total pages count
     * @param {Function} onPageChange - Callback for page change
     */
    renderPagination(currentPage, totalPages, onPageChange) {
        const container = document.getElementById('pagination');
        if (!container) return;

        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let html = '';
        
        // Previous button
        html += `<button ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">←</button>`;
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                html += `<button class="${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
            } else if (i === currentPage - 2 || i === currentPage + 2) {
                html += `<button disabled>...</button>`;
            }
        }
        
        // Next button
        html += `<button ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">→</button>`;

        container.innerHTML = html;

        // Add event listeners
        container.querySelectorAll('button[data-page]').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.dataset.page);
                if (!btn.disabled && page !== currentPage) {
                    onPageChange(page);
                }
            });
        });
    },

    /**
     * Update filter categories dropdown
     * @param {Array} categories - Array of category keys
     */
    updateFilterCategories(categories) {
        const select = document.getElementById('filterCategory');
        if (!select) return;

        const uniqueCategories = [...new Set(categories)];
        
        select.innerHTML = `
            <option value="all">Все категории</option>
            ${uniqueCategories.map(cat => `
                <option value="${cat}">${this.getCategoryName(cat)}</option>
            `).join('')}
        `;
    },

    /**
     * Render budgets
     * @param {Array} budgets - Array of budget objects
     * @param {Object} expensesByCategory - Expenses grouped by category
     */
    renderBudgets(budgets, expensesByCategory) {
        const container = document.getElementById('budgetsContainer');
        if (!container) return;

        if (budgets.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📊</div>
                    <div class="empty-state-text">Нет бюджетов</div>
                    <div class="empty-state-subtext">Создайте бюджет для контроля расходов</div>
                </div>
            `;
            return;
        }

        container.innerHTML = budgets.map(budget => {
            const spent = expensesByCategory[budget.category] || 0;
            const percent = Math.min((spent / budget.amount) * 100, 100);
            const remaining = budget.amount - spent;
            
            let progressClass = 'good';
            if (percent >= 90) progressClass = 'danger';
            else if (percent >= 70) progressClass = 'warning';

            return `
                <div class="budget-card" data-id="${budget.id}">
                    <div class="budget-card-header">
                        <div class="budget-category">
                            <span>${this.getCategoryIcon(budget.category)}</span>
                            <span>${this.getCategoryName(budget.category)}</span>
                        </div>
                        <button class="budget-delete" data-id="${budget.id}">×</button>
                    </div>
                    <div class="budget-progress">
                        <div class="budget-info">
                            <span>${this.formatCurrency(spent)} из ${this.formatCurrency(budget.amount)}</span>
                            <span>${Math.round(percent)}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill ${progressClass}" style="width: ${percent}%"></div>
                        </div>
                    </div>
                    <div class="budget-footer">
                        <span class="budget-spent">${remaining >= 0 ? `Осталось: ${this.formatCurrency(remaining)}` : 'Превышен!'}</span>
                        <span class="budget-limit">${budget.period === 'week' ? 'в неделю' : 'в месяц'}</span>
                    </div>
                </div>
            `;
        }).join('');
    },

    /**
     * Show toast notification
     * @param {string} message - Message to display
     * @param {string} type - Type: 'success', 'error', 'warning'
     */
    showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-message">${this.escapeHtml(message)}</span>
            <button class="toast-close">×</button>
        `;

        container.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.style.animation = 'toastIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 5000);

        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.style.animation = 'toastIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        });
    },

    /**
     * Open modal
     * @param {string} modalId - Modal element ID
     */
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    },

    /**
     * Close modal
     * @param {string} modalId - Modal element ID
     */
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    },

    /**
     * Set up modal close handlers
     * @param {string} modalId - Modal element ID
     */
    setupModalHandlers(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        // Close button
        modal.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal(modalId));
        });

        // Click outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modalId);
            }
        });

        // ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                this.closeModal(modalId);
            }
        });
    },

    /**
     * Set theme
     * @param {string} theme - 'light' or 'dark'
     */
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('finance-app-theme', theme);
        const toggleBtn = document.getElementById('themeToggle');
        if (toggleBtn) {
            toggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
    },

    /**
     * Toggle theme
     * @returns {string} New theme
     */
    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = current === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
        return newTheme;
    },

    /**
     * Initialize theme from localStorage on page load
     */
    initTheme() {
        const savedTheme = localStorage.getItem('finance-app-theme') || 'light';
        this.setTheme(savedTheme);
    },

    /**
     * Clear form
     * @param {HTMLFormElement} form - Form element
     */
    clearForm(form) {
        if (form) {
            form.reset();
            // Set default date to today
            const dateInput = form.querySelector('#date');
            if (dateInput) {
                dateInput.value = this.formatDateForInput(new Date());
            }
        }
    },

    /**
     * Scroll to element
     * @param {string} selector - CSS selector
     */
    scrollTo(selector) {
        const element = document.querySelector(selector);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
};

export default ui;
