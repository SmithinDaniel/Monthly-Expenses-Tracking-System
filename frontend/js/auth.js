// auth.js (no auth required)

document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signupForm');
  const loginForm = document.getElementById('loginForm');

  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      window.location.href = '/dashboard.html';
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      window.location.href = '/dashboard.html';
    });
  }
});
