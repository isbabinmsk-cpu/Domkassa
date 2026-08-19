// iOS Finance App - Main Application Logic

const API_BASE = '';
let sessionId = localStorage.getItem('sessionId');
let currentUser = null;

// State
let categories = { income: [], expense: [] };
let accounts = [];
let transactions = [];
let selectedCategory = null;
let selectedSubcategory = null;
let currentTransactionType = 'expense';

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const appScreen = document.getElementById('app-screen');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
const addTransactionFab = document.getElementById('add-transaction-fab');
const transactionModal = document.getElementById('transaction-modal');
const categoryModal = document.getElementById('category-modal');
const closeTransactionModal = document.getElementById('close-transaction-modal');
const closeCategoryModal = document.getElementById('close-category-modal');
const transactionForm = document.getElementById('transaction-form');
const typeOptions = document.querySelectorAll('.type-option');
const selectCategoryBtn = document.getElementById('select-category-btn');
const selectedCategoryDisplay = document.getElementById('selected-category-display');
const selectedCategoryIcon = document.getElementById('selected-category-icon');
const selectedCategoryName = document.getElementById('selected-category-name');
const changeCategoryBtn = document.getElementById('change-category-btn');
const subcategorySection = document.getElementById('subcategory-section');
const subcategoryScroll = document.getElementById('subcategory-scroll');
const categoryListContainer = document.getElementById('category-list-container');

// Initialize App
async function initApp() {
    if (sessionId) {
        try {
            const response = await fetch(`${API_BASE}/api/auth/me`, {
                headers: { 'X-Session-ID': sessionId }
            });
            
            if (response.ok) {
                const data = await response.json();
                currentUser = data.user;
                showAppScreen();
            } else {
                localStorage.removeItem('sessionId');
                sessionId = null;
                showLoginScreen();
            }
        } catch (error) {
            showLoginScreen();
        }
    } else {
        showLoginScreen();
    }
}

function showLoginScreen() {
    loginScreen.classList.add('active');
    appScreen.classList.remove('active');
}

function showAppScreen() {
    loginScreen.classList.remove('active');
    appScreen.classList.add('active');
    loadDashboard();
}

// Login Handler
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            sessionId = data.sessionId;
            currentUser = data.user;
            localStorage.setItem('sessionId', sessionId);
            showAppScreen();
        } else {
            alert(data.error || 'Ошибка входа');
        }
    } catch (error) {
        alert('Ошибка подключения к серверу');
    }
});

// Logout Handler
logoutBtn.addEventListener('click', async () => {
    try {
        await fetch(`${API_BASE}/api/auth/logout`, {
            method: 'POST',
            headers: { 'X-Session-ID': sessionId }
        });
    } catch (error) {}
    
    localStorage.removeItem('sessionId');
    sessionId = null;
    currentUser = null;
    showLoginScreen();
});

// Tab Navigation
tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        
        tabButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(`tab-${tabName}`).classList.add('active');
        
        // Update page title
        const titles = {
            dashboard: 'Главная',
            transactions: 'Операции',
            categories: 'Категории',
            accounts: 'Счета'
        };
        document.getElementById('current-page-title').textContent = titles[tabName];
        
        // Load content for tab
        switch(tabName) {
            case 'dashboard':
                loadDashboard();
                break;
            case 'transactions':
                loadTransactions();
                break;
            case 'categories':
                loadCategoriesView();
                break;
            case 'accounts':
                loadAccounts();
                break;
        }
    });
});

// Load Dashboard Data
async function loadDashboard() {
    try {
        const [summaryRes, transactionsRes, categoriesRes] = await Promise.all([
            fetch(`${API_BASE}/api/summary`, { headers: { 'X-Session-ID': sessionId } }),
            fetch(`${API_BASE}/api/transactions?limit=10`, { headers: { 'X-Session-ID': sessionId } }),
            fetch(`${API_BASE}/api/analytics/categories?type=expense&startDate=${new Date(new Date().setDate(1)).toISOString().split('T')[0]}`, { 
                headers: { 'X-Session-ID': sessionId } 
            })
        ]);
        
        const summary = await summaryRes.json();
        transactions = await transactionsRes.json();
        const expenseCategories = await categoriesRes.json();
        
        // Update balance
        document.getElementById('total-balance').textContent = formatCurrency(summary.balance);
        document.getElementById('monthly-income').textContent = `+${formatCurrency(summary.income)}`;
        document.getElementById('monthly-expense').textContent = `-${formatCurrency(summary.expense)}`;
        
        // Load recent transactions
        loadRecentTransactions();
        
        // Load categories breakdown
        loadCategoriesBreakdown(expenseCategories, summary.expense);
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

function loadRecentTransactions() {
    const container = document.getElementById('recent-transactions');
    
    if (transactions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <ion-icon name="receipt-outline"></ion-icon>
                <p>Нет операций</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = transactions.slice(0, 5).map(t => createTransactionHTML(t)).join('');
}

function loadCategoriesBreakdown(categoriesData, totalExpense) {
    const container = document.getElementById('categories-breakdown');
    
    if (!categoriesData || categoriesData.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Нет данных по категориям</p>
            </div>
        `;
        return;
    }
    
    const maxAmount = Math.max(...categoriesData.map(c => c.total));
    
    container.innerHTML = categoriesData.slice(0, 5).map(cat => {
        const percentage = totalExpense > 0 ? (cat.total / totalExpense * 100) : 0;
        return `
            <div class="category-breakdown-item">
                <div class="icon-wrapper" style="background: ${cat.color}20; color: ${cat.color}">
                    <ion-icon name="${cat.icon}"></ion-icon>
                </div>
                <div class="category-breakdown-info">
                    <div class="category-breakdown-name">${cat.name}</div>
                    <div class="category-breakdown-bar">
                        <div class="category-breakdown-fill" style="width: ${percentage}%; background: ${cat.color}"></div>
                    </div>
                </div>
                <div class="category-breakdown-amount">${formatCurrency(cat.total)}</div>
            </div>
        `;
    }).join('');
}

// Load Transactions View
async function loadTransactions() {
    try {
        const response = await fetch(`${API_BASE}/api/transactions`, { 
            headers: { 'X-Session-ID': sessionId } 
        });
        transactions = await response.json();
        
        const container = document.getElementById('all-transactions');
        
        if (transactions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <ion-icon name="receipt-outline"></ion-icon>
                    <p>Нет операций</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = transactions.map(t => createTransactionHTML(t)).join('');
    } catch (error) {
        console.error('Error loading transactions:', error);
    }
}

function createTransactionHTML(transaction) {
    const date = new Date(transaction.transaction_date);
    const formattedDate = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    
    return `
        <div class="transaction-item">
            <div class="transaction-icon" style="background: ${transaction.category_color}20; color: ${transaction.category_color}">
                <ion-icon name="${transaction.category_icon}"></ion-icon>
            </div>
            <div class="transaction-info">
                <div class="transaction-category">${transaction.category_name}</div>
                <div class="transaction-description">${transaction.description || transaction.account_name}</div>
            </div>
            <div class="transaction-meta">
                <div class="transaction-amount ${transaction.type}">${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}</div>
                <div class="transaction-date">${formattedDate}</div>
            </div>
        </div>
    `;
}

// Load Categories View
async function loadCategoriesView() {
    try {
        const response = await fetch(`${API_BASE}/api/categories`, { 
            headers: { 'X-Session-ID': sessionId } 
        });
        const allCategories = await response.json();
        
        categories.income = allCategories.filter(c => c.type === 'income' && !c.parent_id);
        categories.expense = allCategories.filter(c => c.type === 'expense' && !c.parent_id);
        
        const incomeContainer = document.getElementById('income-categories');
        const expenseContainer = document.getElementById('expense-categories');
        
        incomeContainer.innerHTML = categories.income.map(cat => createCategoryItemHTML(cat)).join('');
        expenseContainer.innerHTML = categories.expense.map(cat => createCategoryItemHTML(cat)).join('');
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

function createCategoryItemHTML(category) {
    return `
        <div class="category-item">
            <div class="icon-wrapper" style="background: ${category.color}20; color: ${category.color}">
                <ion-icon name="${category.icon}"></ion-icon>
            </div>
            <div class="category-name">${category.name}</div>
        </div>
    `;
}

// Load Accounts View
async function loadAccounts() {
    try {
        const response = await fetch(`${API_BASE}/api/accounts`, { 
            headers: { 'X-Session-ID': sessionId } 
        });
        accounts = await response.json();
        
        const container = document.getElementById('accounts-list');
        
        if (accounts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <ion-icon name="wallet-outline"></ion-icon>
                    <p>Нет счетов</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = accounts.map(acc => `
            <div class="account-item">
                <div class="account-icon" style="background: ${acc.color}20; color: ${acc.color}">
                    <ion-icon name="${acc.icon}"></ion-icon>
                </div>
                <div class="account-info">
                    <div class="account-name">${acc.name}</div>
                    <div class="account-type">${translateAccountType(acc.type)}</div>
                </div>
                <div class="account-balance">${formatCurrency(acc.balance)}</div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading accounts:', error);
    }
}

function translateAccountType(type) {
    const types = {
        cash: 'Наличные',
        bank: 'Банковский счет',
        card: 'Банковская карта',
        investment: 'Инвестиционный'
    };
    return types[type] || type;
}

// FAB Button - Open Transaction Modal
addTransactionFab.addEventListener('click', () => {
    openTransactionModal();
});

function openTransactionModal(editTransaction = null) {
    transactionModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Reset form
    document.getElementById('transaction-id').value = '';
    document.getElementById('transaction-amount').value = '';
    document.getElementById('transaction-description').value = '';
    document.getElementById('transaction-date').valueAsDate = new Date();
    
    selectedCategory = null;
    selectedSubcategory = null;
    updateCategoryDisplay();
    
    // Set default type
    setTypeOption('expense');
    
    // Load accounts into select
    loadAccountsSelect();
    
    if (editTransaction) {
        // Populate form for editing
        document.getElementById('transaction-modal-title').textContent = 'Редактировать операцию';
        document.getElementById('transaction-id').value = editTransaction.id;
        document.getElementById('transaction-amount').value = editTransaction.amount;
        document.getElementById('transaction-description').value = editTransaction.description || '';
        document.getElementById('transaction-date').value = editTransaction.transaction_date.split('T')[0];
        setTypeOption(editTransaction.type);
        
        // Set category
        selectedCategory = {
            id: editTransaction.category_id,
            name: editTransaction.category_name,
            icon: editTransaction.category_icon,
            color: editTransaction.category_color
        };
        updateCategoryDisplay();
    } else {
        document.getElementById('transaction-modal-title').textContent = 'Новая операция';
    }
}

function closeTransactionModalFunc() {
    transactionModal.classList.remove('active');
    document.body.style.overflow = '';
}

closeTransactionModal.addEventListener('click', closeTransactionModalFunc);

document.querySelector('#transaction-modal .modal-overlay').addEventListener('click', closeTransactionModalFunc);

// Type Toggle
typeOptions.forEach(option => {
    option.addEventListener('click', () => {
        setTypeOption(option.dataset.type);
    });
});

function setTypeOption(type) {
    currentTransactionType = type;
    typeOptions.forEach(opt => {
        opt.classList.toggle('active', opt.dataset.type === type);
    });
    
    // Reload categories based on type
    loadCategoriesForSelection();
}

// Load Accounts Select
function loadAccountsSelect() {
    const select = document.getElementById('transaction-account');
    select.innerHTML = accounts.map(acc => 
        `<option value="${acc.id}">${acc.name} (${formatCurrency(acc.balance)})</option>`
    ).join('');
}

// Category Selection
selectCategoryBtn.addEventListener('click', () => {
    openCategoryModal();
});

changeCategoryBtn.addEventListener('click', () => {
    openCategoryModal();
});

function openCategoryModal() {
    categoryModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    loadCategoriesForSelection();
}

function closeCategoryModalFunc() {
    categoryModal.classList.remove('active');
    document.body.style.overflow = '';
}

closeCategoryModal.addEventListener('click', closeCategoryModalFunc);
document.querySelector('#category-modal .modal-overlay').addEventListener('click', closeCategoryModalFunc);

async function loadCategoriesForSelection() {
    try {
        const response = await fetch(`${API_BASE}/api/categories?type=${currentTransactionType}`, { 
            headers: { 'X-Session-ID': sessionId } 
        });
        const cats = await response.json();
        
        // Filter only parent categories
        const parentCategories = cats.filter(c => !c.parent_id);
        
        categoryListContainer.innerHTML = parentCategories.map(cat => `
            <div class="category-list-group">
                <div class="category-list-item ${selectedCategory && selectedCategory.id === cat.id ? 'selected' : ''}" data-category-id="${cat.id}" data-category-name="${cat.name}" data-category-icon="${cat.icon}" data-category-color="${cat.color}">
                    <div class="icon-wrapper" style="background: ${cat.color}20; color: ${cat.color}">
                        <ion-icon name="${cat.icon}"></ion-icon>
                    </div>
                    <span class="category-name">${cat.name}</span>
                    <ion-icon name="checkmark" class="checkmark"></ion-icon>
                </div>
            </div>
        `).join('');
        
        // Add click handlers
        document.querySelectorAll('.category-list-item').forEach(item => {
            item.addEventListener('click', () => {
                selectedCategory = {
                    id: parseInt(item.dataset.categoryId),
                    name: item.dataset.categoryName,
                    icon: item.dataset.categoryIcon,
                    color: item.dataset.categoryColor
                };
                
                // Update UI
                document.querySelectorAll('.category-list-item').forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
                
                // Check for subcategories
                loadSubcategories(selectedCategory.id);
                
                // Close modal after short delay
                setTimeout(() => {
                    closeCategoryModalFunc();
                    updateCategoryDisplay();
                }, 200);
            });
        });
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

async function loadSubcategories(parentId) {
    try {
        const response = await fetch(`${API_BASE}/api/categories/${parentId}/subcategories`, { 
            headers: { 'X-Session-ID': sessionId } 
        });
        const subcats = await response.json();
        
        if (subcats && subcats.length > 0) {
            subcategorySection.style.display = 'block';
            subcategoryScroll.innerHTML = subcats.map(sub => `
                <button type="button" class="subcategory-chip" data-subcategory-id="${sub.id}">${sub.name}</button>
            `).join('');
            
            // Add click handlers
            subcategoryScroll.querySelectorAll('.subcategory-chip').forEach(chip => {
                chip.addEventListener('click', () => {
                    subcategoryScroll.querySelectorAll('.subcategory-chip').forEach(c => c.classList.remove('active'));
                    chip.classList.add('active');
                    selectedSubcategory = {
                        id: parseInt(chip.dataset.subcategoryId),
                        name: chip.textContent
                    };
                    // Use subcategory for transaction
                    selectedCategory.id = selectedSubcategory.id;
                });
            });
        } else {
            subcategorySection.style.display = 'none';
            selectedSubcategory = null;
        }
    } catch (error) {
        console.error('Error loading subcategories:', error);
        subcategorySection.style.display = 'none';
    }
}

function updateCategoryDisplay() {
    if (selectedCategory) {
        selectCategoryBtn.style.display = 'none';
        selectedCategoryDisplay.style.display = 'flex';
        selectedCategoryIcon.setAttribute('name', selectedCategory.icon);
        selectedCategoryIcon.style.color = selectedCategory.color;
        selectedCategoryName.textContent = selectedCategory.name;
    } else {
        selectCategoryBtn.style.display = 'flex';
        selectedCategoryDisplay.style.display = 'none';
    }
}

// Transaction Form Submit
transactionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!selectedCategory) {
        alert('Выберите категорию');
        return;
    }
    
    const transactionId = document.getElementById('transaction-id').value;
    const amount = parseFloat(document.getElementById('transaction-amount').value);
    const description = document.getElementById('transaction-description').value;
    const accountId = parseInt(document.getElementById('transaction-account').value);
    const transactionDate = document.getElementById('transaction-date').value;
    
    const transactionData = {
        amount,
        type: currentTransactionType,
        description,
        categoryId: selectedCategory.id,
        accountId,
        transactionDate
    };
    
    try {
        let response;
        if (transactionId) {
            // Update existing transaction
            response = await fetch(`${API_BASE}/api/transactions/${transactionId}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Session-ID': sessionId 
                },
                body: JSON.stringify(transactionData)
            });
        } else {
            // Create new transaction
            response = await fetch(`${API_BASE}/api/transactions`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Session-ID': sessionId 
                },
                body: JSON.stringify(transactionData)
            });
        }
        
        if (response.ok) {
            closeTransactionModalFunc();
            // Reload current tab
            const activeTab = document.querySelector('.tab-button.active').dataset.tab;
            switch(activeTab) {
                case 'dashboard':
                    loadDashboard();
                    break;
                case 'transactions':
                    loadTransactions();
                    break;
                case 'accounts':
                    loadAccounts();
                    break;
            }
        } else {
            const data = await response.json();
            alert(data.error || 'Ошибка сохранения');
        }
    } catch (error) {
        alert('Ошибка подключения к серверу');
    }
});

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('ru-RU', { 
        style: 'currency', 
        currency: 'RUB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(amount).replace('₽', ' ₽');
}

// Search functionality
const transactionSearch = document.getElementById('transaction-search');
if (transactionSearch) {
    transactionSearch.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const items = document.querySelectorAll('#all-transactions .transaction-item');
        
        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(query) ? 'flex' : 'none';
        });
    });
}

// Filter chips
const filterChips = document.querySelectorAll('.filter-chip');
filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
        filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        
        const filter = chip.dataset.filter;
        const items = document.querySelectorAll('#all-transactions .transaction-item');
        
        items.forEach(item => {
            const amountEl = item.querySelector('.transaction-amount');
            const isIncome = amountEl.classList.contains('income');
            const isExpense = amountEl.classList.contains('expense');
            
            if (filter === 'all') {
                item.style.display = 'flex';
            } else if (filter === 'income' && isIncome) {
                item.style.display = 'flex';
            } else if (filter === 'expense' && isExpense) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    });
});

// Initialize app
initApp();
