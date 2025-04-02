// utils.js

// Initialize Supabase client
const _supabase = (function() {
  const supabaseUrl = 'https://vmzentmmwxpmezofzjkz.supabase.co';
  const supabaseKey = 'YOUR_SUPABASE_KEY';
  return supabase.createClient(supabaseUrl, supabaseKey);
})();

// Utility functions
function formatDate(date) {
  return new Date(date).toLocaleDateString();
}

function formatCurrency(amount) {
  return '\u20b9' + amount.toFixed(2);
}

function showNotification(message, isError = false) {
  const notification = document.createElement('div');
  notification.className = `notification ${isError ? 'error' : 'success'}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Check if user is logged in
async function checkAuth() {
  const { data: { session } } = await _supabase.auth.getSession();
  if (!session) {
    window.location.href = 'index.html';
  }
  return session;
}
