// UI module - handles DOM manipulation and rendering
export const ui = {
    elements: {
        transactionList: document.getElementById('transaction-list'),
        totalIncome: document.getElementById('total-income'),
        totalExpense: document.getElementById('total-expense'),
        totalBalance: document.getElementById('total-balance'),
        filterButtons: document.querySelectorAll('.filter-btn')
    },

    categoryNames: {
        salary: 'Зарплата',
        food: 'Продукты',
        transport: 'Транспорт',
        utilities: 'Коммунальные услуги',
        entertainment: 'Развлечения',
        other: 'Другое'
    },

    formatCurrency(amount) {
        return new Intl.NumberFormat('ru-RU').format(amount) + ' ₽';
    },

    renderTransactions(transactions, filter = 'all') {
        const { transactionList } = this.elements;
        transactionList.innerHTML = '';

        let filteredTransactions = transactions;
        if (filter === 'income') {
            filteredTransactions = transactions.filter(t => t.type === 'income');
        } else if (filter === 'expense') {
            filteredTransactions = transactions.filter(t => t.type === 'expense');
        }

        if (filteredTransactions.length === 0) {
            transactionList.innerHTML = `
                <li class="empty-state">
                    ${filter === 'all' ? 'Нет операций. Добавьте первую!' : 'Нет операций в этой категории'}
                </li>
            `;
            return;
        }

        // Sort by date (newest first)
        filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        filteredTransactions.forEach(transaction => {
            const li = document.createElement('li');
            li.className = 'transaction-item';
            li.innerHTML = `
                <div class="transaction-info">
                    <div class="transaction-description">${this.escapeHtml(transaction.description)}</div>
                    <div class="transaction-category">${this.categoryNames[transaction.category]} • ${this.formatDate(transaction.date)}</div>
                </div>
                <span class="transaction-amount ${transaction.type}">
                    ${transaction.type === 'income' ? '+' : '-'} ${this.formatCurrency(transaction.amount)}
                </span>
                <button class="btn-delete" data-id="${transaction.id}">✕</button>
            `;
            transactionList.appendChild(li);
        });
    },

    updateSummary(transactions) {
        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expense = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const balance = income - expense;

        this.elements.totalIncome.textContent = this.formatCurrency(income);
        this.elements.totalExpense.textContent = this.formatCurrency(expense);
        this.elements.totalBalance.textContent = this.formatCurrency(balance);
    },

    setActiveFilter(filter) {
        this.elements.filterButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.id === `filter-${filter}`) {
                btn.classList.add('active');
            }
        });
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    },

    getFormData(form) {
        const formData = new FormData(form);
        return {
            description: form.querySelector('#description').value.trim(),
            amount: parseFloat(form.querySelector('#amount').value),
            type: form.querySelector('#type').value,
            category: form.querySelector('#category').value
        };
    },

    resetForm(form) {
        form.reset();
        form.querySelector('#description').focus();
    }
};
