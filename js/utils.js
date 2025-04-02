// utils.js

// Initialize Supabase client
const _supabase = (function() {
  const supabaseUrl = 'https://vmzentmmwxpmezofzjkz.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtemVudG1td3hwbWV6b2Z6amt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1OTc3NjUsImV4cCI6MjA1OTE3Mzc2NX0.gZlwX7B8b6B3KAe9mAurBSoMb023OjlIHxSFmrpYi3o';
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
