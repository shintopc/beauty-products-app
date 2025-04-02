// auth.js
document.addEventListener('DOMContentLoaded', async function() {
  // Get Supabase client from utils.js
  const supabase = window._supabase;
  
  // Handle login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) throw error;
        window.location.href = 'dashboard.html';
      } catch (error) {
        document.getElementById('errorMessage').textContent = error.message;
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
