// Expense Tracker Application
class ExpenseTracker {
    constructor() {
        this.transactions = this.loadTransactions();
        this.currentEditId = null;
        this.initializeEventListeners();
        this.setCurrentDate();
        this.updateDisplay();
    }

    // Initialize all event listeners
    initializeEventListeners() {
        // Form submission
        document.getElementById('transactionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTransaction();
        });

        // Edit form submission
        document.getElementById('editForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateTransaction();
        });

        // Search and filter functionality
        document.getElementById('searchInput').addEventListener('input', () => {
            this.filterTransactions();
        });

        document.getElementById('filterType').addEventListener('change', () => {
            this.filterTransactions();
        });

        document.getElementById('filterCategory').addEventListener('change', () => {
            this.filterTransactions();
        });

        // Modal close functionality
        document.querySelector('.close').addEventListener('click', () => {
            this.closeEditModal();
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('editModal');
            if (e.target === modal) {
                this.closeEditModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeEditModal();
            }
        });
    }

    // Set current date as default
    setCurrentDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date').value = today;
        document.getElementById('editDate').value = today;
    }

    // Add new transaction
    addTransaction() {
        const description = document.getElementById('description').value.trim();
        const amount = parseFloat(document.getElementById('amount').value);
        const type = document.getElementById('type').value;
        const category = document.getElementById('category').value;
        const date = document.getElementById('date').value;

        // Validation
        if (!description || !amount || !type || !category || !date) {
            this.showMessage('Please fill in all fields', 'error');
            return;
        }

        if (amount <= 0) {
            this.showMessage('Amount must be greater than 0', 'error');
            return;
        }

        // Create transaction object
        const transaction = {
            id: Date.now().toString(),
            description,
            amount,
            type,
            category,
            date,
            timestamp: new Date().toISOString()
        };

        // Add to transactions array
        this.transactions.unshift(transaction);
        
        // Save to localStorage
        this.saveTransactions();
        
        // Update display
        this.updateDisplay();
        
        // Reset form
        this.resetForm();
        
        // Show success message
        this.showMessage('Transaction added successfully!', 'success');
    }

    // Update existing transaction
    updateTransaction() {
        const description = document.getElementById('editDescription').value.trim();
        const amount = parseFloat(document.getElementById('editAmount').value);
        const type = document.getElementById('editType').value;
        const category = document.getElementById('editCategory').value;
        const date = document.getElementById('editDate').value;

        // Validation
        if (!description || !amount || !type || !category || !date) {
            this.showMessage('Please fill in all fields', 'error');
            return;
        }

        if (amount <= 0) {
            this.showMessage('Amount must be greater than 0', 'error');
            return;
        }

        // Find and update transaction
        const transactionIndex = this.transactions.findIndex(t => t.id === this.currentEditId);
        if (transactionIndex !== -1) {
            this.transactions[transactionIndex] = {
                ...this.transactions[transactionIndex],
                description,
                amount,
                type,
                category,
                date
            };

            // Save to localStorage
            this.saveTransactions();
            
            // Update display
            this.updateDisplay();
            
            // Close modal
            this.closeEditModal();
            
            // Show success message
            this.showMessage('Transaction updated successfully!', 'success');
        }
    }

    // Delete transaction
    deleteTransaction(id) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            this.transactions = this.transactions.filter(t => t.id !== id);
            this.saveTransactions();
            this.updateDisplay();
            this.showMessage('Transaction deleted successfully!', 'success');
        }
    }

    // Edit transaction
    editTransaction(id) {
        const transaction = this.transactions.find(t => t.id === id);
        if (transaction) {
            this.currentEditId = id;
            
            // Populate edit form
            document.getElementById('editId').value = transaction.id;
            document.getElementById('editDescription').value = transaction.description;
            document.getElementById('editAmount').value = transaction.amount;
            document.getElementById('editType').value = transaction.type;
            document.getElementById('editCategory').value = transaction.category;
            document.getElementById('editDate').value = transaction.date;
            
            // Show modal
            document.getElementById('editModal').style.display = 'block';
        }
    }

    // Close edit modal
    closeEditModal() {
        document.getElementById('editModal').style.display = 'none';
        this.currentEditId = null;
    }

    // Filter transactions based on search and filters
    filterTransactions() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const typeFilter = document.getElementById('filterType').value;
        const categoryFilter = document.getElementById('filterCategory').value;

        let filteredTransactions = this.transactions.filter(transaction => {
            const matchesSearch = transaction.description.toLowerCase().includes(searchTerm) ||
                                transaction.category.toLowerCase().includes(searchTerm);
            
            const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
            const matchesCategory = categoryFilter === 'all' || transaction.category === categoryFilter;

            return matchesSearch && matchesType && matchesCategory;
        });

        this.displayTransactions(filteredTransactions);
    }

    // Update all display elements
    updateDisplay() {
        this.updateSummary();
        this.displayTransactions(this.transactions);
    }

    // Update balance summary
    updateSummary() {
        const totalIncome = this.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpenses = this.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalBalance = totalIncome - totalExpenses;

        // Update display
        document.getElementById('totalBalance').textContent = this.formatCurrency(totalBalance);
        document.getElementById('totalIncome').textContent = this.formatCurrency(totalIncome);
        document.getElementById('totalExpenses').textContent = this.formatCurrency(totalExpenses);

        // Update balance color based on positive/negative
        const balanceElement = document.getElementById('totalBalance');
        balanceElement.className = 'amount balance';
        if (totalBalance > 0) {
            balanceElement.classList.add('income');
        } else if (totalBalance < 0) {
            balanceElement.classList.add('expense');
        }
    }

    // Display transactions list
    displayTransactions(transactions) {
        const transactionList = document.getElementById('transactionList');

        if (transactions.length === 0) {
            transactionList.innerHTML = `
                <div class="no-transactions">
                    <i class="fas fa-receipt"></i>
                    <p>No transactions found. Try adjusting your search or filters.</p>
                </div>
            `;
            return;
        }

        transactionList.innerHTML = transactions.map(transaction => `
            <div class="transaction-item ${transaction.type}">
                <div class="transaction-details">
                    <div class="transaction-description">${this.escapeHtml(transaction.description)}</div>
                    <div class="transaction-meta">
                        <span class="transaction-date">
                            <i class="fas fa-calendar"></i> ${this.formatDate(transaction.date)}
                        </span>
                        <span class="transaction-category">${this.capitalizeFirst(transaction.category)}</span>
                    </div>
                </div>
                <div class="transaction-amount ${transaction.type}">
                    ${transaction.type === 'income' ? '+' : '-'}${this.formatCurrency(transaction.amount)}
                </div>
                <div class="transaction-actions">
                    <button class="btn-icon edit" onclick="expenseTracker.editTransaction('${transaction.id}')" title="Edit transaction">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete" onclick="expenseTracker.deleteTransaction('${transaction.id}')" title="Delete transaction">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Reset form
    resetForm() {
        document.getElementById('transactionForm').reset();
        this.setCurrentDate();
    }

    // Show message to user
    showMessage(message, type) {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());

        // Create new message
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        messageDiv.style.display = 'block';

        // Insert at the top of the main container
        const container = document.querySelector('.container');
        container.insertBefore(messageDiv, container.firstChild);

        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }

    // Utility functions
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(date);
    }

    capitalizeFirst(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Local Storage functions
    saveTransactions() {
        try {
            localStorage.setItem('expenseTrackerTransactions', JSON.stringify(this.transactions));
        } catch (error) {
            console.error('Error saving transactions:', error);
            this.showMessage('Error saving data. Please try again.', 'error');
        }
    }

    loadTransactions() {
        try {
            const saved = localStorage.getItem('expenseTrackerTransactions');
            return saved ? JSON.parse(saved) : this.getDefaultTransactions();
        } catch (error) {
            console.error('Error loading transactions:', error);
            return this.getDefaultTransactions();
        }
    }

    // Default sample transactions for demo
    getDefaultTransactions() {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);

        return [
            {
                id: '1',
                description: 'Salary Payment',
                amount: 3500.00,
                type: 'income',
                category: 'salary',
                date: today.toISOString().split('T')[0],
                timestamp: today.toISOString()
            },
            {
                id: '2',
                description: 'Grocery Shopping',
                amount: 85.50,
                type: 'expense',
                category: 'food',
                date: yesterday.toISOString().split('T')[0],
                timestamp: yesterday.toISOString()
            },
            {
                id: '3',
                description: 'Gas Station',
                amount: 45.00,
                type: 'expense',
                category: 'transport',
                date: yesterday.toISOString().split('T')[0],
                timestamp: yesterday.toISOString()
            },
            {
                id: '4',
                description: 'Freelance Project',
                amount: 750.00,
                type: 'income',
                category: 'freelance',
                date: lastWeek.toISOString().split('T')[0],
                timestamp: lastWeek.toISOString()
            },
            {
                id: '5',
                description: 'Movie Tickets',
                amount: 28.00,
                type: 'expense',
                category: 'entertainment',
                date: lastWeek.toISOString().split('T')[0],
                timestamp: lastWeek.toISOString()
            }
        ];
    }

    // Export data functionality
    exportData() {
        const data = {
            transactions: this.transactions,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `expense-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        this.showMessage('Data exported successfully!', 'success');
    }

    // Import data functionality
    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.transactions && Array.isArray(data.transactions)) {
                    if (confirm('This will replace all existing transactions. Are you sure?')) {
                        this.transactions = data.transactions;
                        this.saveTransactions();
                        this.updateDisplay();
                        this.showMessage('Data imported successfully!', 'success');
                    }
                } else {
                    this.showMessage('Invalid file format', 'error');
                }
            } catch (error) {
                console.error('Import error:', error);
                this.showMessage('Error importing file', 'error');
            }
        };
        reader.readAsText(file);
    }

    // Clear all data
    clearAllData() {
        if (confirm('Are you sure you want to delete all transactions? This action cannot be undone.')) {
            this.transactions = [];
            this.saveTransactions();
            this.updateDisplay();
            this.showMessage('All data cleared successfully!', 'success');
        }
    }
}

// Global functions for onclick handlers
window.closeEditModal = () => {
    expenseTracker.closeEditModal();
};

// Initialize the expense tracker when DOM is loaded
let expenseTracker;
document.addEventListener('DOMContentLoaded', () => {
    expenseTracker = new ExpenseTracker();
    
    // Add keyboard shortcuts info
    console.log('Expense Tracker loaded successfully!');
    console.log('Keyboard shortcuts:');
    console.log('- Press Escape to close modals');
    console.log('- Use Tab to navigate between form fields');
});

// Service Worker registration for offline functionality (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}