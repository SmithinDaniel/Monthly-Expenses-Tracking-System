// expenses.js

const API_BASE = '/api';

document.addEventListener('DOMContentLoaded', () => {
  loadExpenses();
  populateMonthFilter();

  document.getElementById('expenseForm').addEventListener('submit', handleAddExpense);
  document.getElementById('monthFilter').addEventListener('change', loadExpenses);
  document.getElementById('categoryFilter').addEventListener('change', loadExpenses);
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);

  // Set today's date as default
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('date').valueAsDate = new Date();
});

async function loadExpenses() {
  const month = document.getElementById('monthFilter').value;
  const category = document.getElementById('categoryFilter').value;

  let url = `${API_BASE}/expenses`;
  const params = new URLSearchParams();
  if (month) params.append('month', month);
  if (category) params.append('category', category);
  if (params.toString()) url += '?' + params.toString();

  try {
    const response = await fetch(url);

    if (response.ok) {
      const expenses = await response.json();
      displayExpenses(expenses);
      calculateTotal(expenses);
    } else {
      console.error('Failed to load expenses:', response.statusText);
      alert('Failed to load expenses');
    }
  } catch (error) {
    console.error('Load expenses error:', error);
    alert('Network error. Please check your connection.');
  }
}

function displayExpenses(expenses) {
  const tbody = document.querySelector('#expensesTable tbody');
  tbody.innerHTML = '';

  if (expenses.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="5" style="text-align:center;">No expenses found</td>';
    tbody.appendChild(row);
    return;
  }

  expenses.forEach(expense => {
    const row = document.createElement('tr');
    const expenseDate = new Date(expense.date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
    row.innerHTML = `
      <td>$${parseFloat(expense.amount).toFixed(2)}</td>
      <td>${expense.description}</td>
      <td><span class="category ${expense.category}">${expense.category}</span></td>
      <td>${expenseDate}</td>
      <td>
        <button class="edit-btn" onclick="editExpense('${expense.id}', '${parseFloat(expense.amount).toFixed(2)}', '${expense.description}', '${expense.category}', '${expense.date}')">Edit</button>
        <button class="delete-btn" onclick="deleteExpense('${expense.id}')">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function calculateTotal(expenses) {
  const total = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
  document.getElementById('totalAmount').textContent = total.toFixed(2);
}

async function handleAddExpense(e) {
  e.preventDefault();
  const amount = document.getElementById('amount').value;
  const description = document.getElementById('description').value.trim();
  const category = document.getElementById('category').value;
  const date = document.getElementById('date').value;

  if (!amount || !description || !category || !date) {
    alert('Please fill in all fields');
    return;
  }

  if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    alert('Please enter a valid amount');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        amount: parseFloat(amount), 
        description, 
        category, 
        date 
      })
    });

    if (response.status === 401) {
      alert('Session expired. Please login again.');
      localStorage.removeItem('token');
      window.location.href = '/index.html';
      return;
    }

    if (response.ok) {
      document.getElementById('expenseForm').reset();
      document.getElementById('date').valueAsDate = new Date();
      loadExpenses();
      alert('Expense added successfully!');
    } else {
      const error = await response.json();
      alert(error.message || 'Failed to add expense');
    }
  } catch (error) {
    console.error('Add expense error:', error);
    alert('Network error. Please try again.');
  }
}

async function deleteExpense(id) {
  const token = localStorage.getItem('token');

  if (!confirm('Are you sure you want to delete this expense?')) return;

  try {
    const response = await fetch(`${API_BASE}/expenses/${id}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      loadExpenses();
      alert('Expense deleted successfully!');
    } else {
      alert('Failed to delete expense');
    }
  } catch (error) {
    console.error('Delete expense error:', error);
    alert('Network error. Please try again.');
  }
}

function editExpense(id, amount, description, category, date) {
  const newAmount = prompt('Edit amount:', amount);
  if (newAmount === null) return;

  const newDescription = prompt('Edit description:', description);
  if (newDescription === null) return;

  const newCategory = prompt('Edit category (Food/Transport/Bills/Entertainment/Other):', category);
  if (newCategory === null) return;

  const validCategories = ['Food', 'Transport', 'Bills', 'Entertainment', 'Other'];
  if (!validCategories.includes(newCategory)) {
    alert('Invalid category');
    return;
  }

  const newDate = prompt('Edit date (YYYY-MM-DD):', date);
  if (newDate === null) return;

  if (isNaN(parseFloat(newAmount)) || parseFloat(newAmount) <= 0) {
    alert('Please enter a valid amount');
    return;
  }

  updateExpense(id, { 
    amount: parseFloat(newAmount), 
    description: newDescription.trim(), 
    category: newCategory, 
    date: newDate 
  });
}

async function updateExpense(id, data) {
  try {
    const response = await fetch(`${API_BASE}/expenses/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      loadExpenses();
      alert('Expense updated successfully!');
    } else {
      const error = await response.json();
      alert(error.message || 'Failed to update expense');
    }
  } catch (error) {
    console.error('Update expense error:', error);
    alert('Network error. Please try again.');
  }
}

function populateMonthFilter() {
  const select = document.getElementById('monthFilter');
  const currentDate = new Date();
  select.innerHTML = '<option value="" selected>All Months</option>';

  for (let i = 0; i < 12; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const value = date.toISOString().slice(0, 7); // YYYY-MM
    const text = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    const option = new Option(text, value);
    select.appendChild(option);
  }

  select.value = ''; // ensure all months is default

  // Initial load for all months
  loadExpenses();
}

function handleLogout() {
  alert('You have been logged out');
  window.location.href = '/index.html';
}