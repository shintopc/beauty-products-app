import { supabase, showNotification } from './utils.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Handle login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        document.getElementById('errorMessage').textContent = error.message;
      } else {
        window.location.href = 'dashboard.html';
      }
    });
  }
  
  // Handle logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const { error } = await supabase.auth.signOut();
      if (!error) {
        window.location.href = 'index.html';
      }
    });
  }
  
  // Show user email if on dashboard
  const userEmail = document.getElementById('userEmail');
  if (userEmail) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      userEmail.textContent = user.email;
    }
  }
});
