// auth.js

const API_BASE = '/api';

document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signupForm');
  const loginForm = document.getElementById('loginForm');

  if (signupForm) {
    signupForm.addEventListener('submit', handleSignup);
  }

  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  // Check if user is logged in and redirect appropriately
  const token = localStorage.getItem('token');
  const currentPath = window.location.pathname;
  
  if (token && (currentPath.includes('dashboard.html') || currentPath === '/')) {
    // User is logged in and on correct page, stay
  } else if (token && !currentPath.includes('dashboard.html')) {
    // User is logged in but not on dashboard, redirect
    window.location.href = '/dashboard.html';
  } else if (!token && currentPath.includes('dashboard.html')) {
    // User not logged in but trying to access dashboard, redirect to home
    window.location.href = '/index.html';
  }
});

async function handleSignup(e) {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!email || !password) {
    alert('Please fill in all fields');
    return;
  }

  if (password.length < 6) {
    alert('Password must be at least 6 characters');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    if (response.ok && data.token) {
      localStorage.setItem('token', data.token);
      alert('Account created successfully!');
      window.location.href = '/dashboard.html';
    } else {
      alert(data.message || 'Signup failed');
    }
  } catch (error) {
    console.error('Signup error:', error);
    alert('Network error. Please try again.');
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!email || !password) {
    alert('Please fill in all fields');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    if (response.ok && data.token) {
      localStorage.setItem('token', data.token);
      alert('Login successful!');
      window.location.href = '/dashboard.html';
    } else {
      alert(data.message || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    alert('Network error. Please try again.');
  }
}