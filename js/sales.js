import { supabase, formatDate, formatCurrency, showNotification, checkAuth } from './utils.js';

document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();
  
  // Load initial sales data
  await loadSales();
  await updateDashboardStats();
  
  // Date range filter
  const dateFilter = document.getElementById('dateFilter');
  if (dateFilter) {
    dateFilter.addEventListener('change', async (e) => {
      await loadSales(e.target.value);
    });
  }
  
  // Export buttons
  const exportPdfBtn = document.getElementById('exportPdf');
  if (exportPdfBtn) {
    exportPdfBtn.addEventListener('click', exportToPdf);
  }
  
  const exportExcelBtn = document.getElementById('exportExcel');
  if (exportExcelBtn) {
    exportExcelBtn.addEventListener('click', exportToExcel);
  }
});

async function loadSales(dateRange = 'today') {
  let query = supabase
    .from('sales')
    .select(`
      id,
      sale_date,
      total_amount,
      payment_method,
      customers(name),
      sale_items(
        quantity,
        unit_price,
        subtotal,
        products(name)
      )
    `)
    .order('sale_date', { ascending: false });
  
  // Apply date range filter
  const now = new Date();
  let fromDate;
  
  switch (dateRange) {
    case 'today':
      fromDate = new Date(now.setHours(0, 0, 0, 0));
      break;
    case 'week':
      fromDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case 'month':
      fromDate = new Date(now.setMonth(now.getMonth() - 1));
      break;
    case 'year':
      fromDate = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    default:
      fromDate = null;
  }
  
  if (fromDate) {
    query = query.gte('sale_date', fromDate.toISOString());
  }
  
  const { data: sales, error } = await query;
  
  if (error) {
    showNotification('Error loading sales: ' + error.message, true);
    return;
  }
  
  const salesTable = document.getElementById('salesTable');
  if (salesTable) {
    const tbody = salesTable.querySelector('tbody');
    tbody.innerHTML = '';
    
    sales.forEach(sale => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${formatDate(sale.sale_date)}</td>
        <td>${sale.customers?.name || 'Walk-in'}</td>
        <td>${formatCurrency(sale.total_amount)}</td>
        <td>${sale.payment_method || '-'}</td>
        <td>
          <button class="btn-details" data-id="${sale.id}">Details</button>
        </td>
      `;
      tbody.appendChild(tr);
      
      // Add event listener to details button
      tr.querySelector('.btn-details').addEventListener('click', () => showSaleDetails(sale));
    });
    
    // Update summary
    updateSalesSummary(sales);
  }
}

async function updateDashboardStats() {
  // Today's sales
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const { data: todaySales, error: todayError } = await supabase
    .from('sales')
    .select('total_amount')
    .gte('sale_date', today.toISOString());
  
  if (!todayError) {
    const todayTotal = todaySales.reduce((sum, sale) => sum + sale.total_amount, 0);
    document.getElementById('todaySales').textContent = formatCurrency(todayTotal);
  }
  
  // Weekly sales
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const { data: weeklySales, error: weeklyError } = await supabase
    .from('sales')
    .select('total_amount')
    .gte('sale_date', weekAgo.toISOString());
  
  if (!weeklyError) {
    const weeklyTotal = weeklySales.reduce((sum, sale) => sum + sale.total_amount, 0);
    document.getElementById('weeklySales').textContent = formatCurrency(weeklyTotal);
  }
  
  // Monthly sales
  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  
  const { data: monthlySales, error: monthlyError } = await supabase
    .from('sales')
    .select('total_amount')
    .gte('sale_date', monthAgo.toISOString());
  
  if (!monthlyError) {
    const monthlyTotal = monthlySales.reduce((sum, sale) => sum + sale.total_amount, 0);
    document.getElementById('monthlySales').textContent = formatCurrency(monthlyTotal);
  }
  
  // Low stock count
  const { data: lowStock, error: stockError } = await supabase
    .from('products')
    .select('id')
    .lte('stock_quantity', 5); // Consider <= 5 as low stock
  
  if (!stockError) {
    document.getElementById('lowStockCount').textContent = lowStock.length;
  }
  
  // Recent sales for dashboard
  const { data: recentSales, error: recentError } = await supabase
    .from('sales')
    .select('id, sale_date, total_amount, customers(name)')
    .order('sale_date', { ascending: false })
    .limit(5);
  
  if (!recentError && document.getElementById('recentSales')) {
    const tbody = document.querySelector('#recentSales tbody');
    tbody.innerHTML = '';
    
    recentSales.forEach(sale => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${formatDate(sale.sale_date)}</td>
        <td>${sale.customers?.name || 'Walk-in'}</td>
        <td>${formatCurrency(sale.total_amount)}</td>
      `;
      tbody.appendChild(tr);
    });
  }
}

function updateSalesSummary(sales) {
  const totalSales = sales.reduce((sum, sale) => sum + sale.total_amount, 0);
  const avgSale = sales.length > 0 ? totalSales / sales.length : 0;
  
  document.getElementById('totalSalesAmount').textContent = formatCurrency(totalSales);
  document.getElementById('totalTransactions').textContent = sales.length;
  document.getElementById('averageSale').textContent = formatCurrency(avgSale);
}

function showSaleDetails(sale) {
  // Create and show a modal with sale details
  const modal = document.createElement('div');
  modal.className = 'modal';
  
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close-modal">&times;</span>
      <h2>Sale Details</h2>
      <p><strong>Date:</strong> ${formatDate(sale.sale_date)}</p>
      <p><strong>Customer:</strong> ${sale.customers?.name || 'Walk-in'}</p>
      <p><strong>Total:</strong> ${formatCurrency(sale.total_amount)}</p>
      <p><strong>Payment Method:</strong> ${sale.payment_method || '-'}</p>
      
      <h3>Items</h3>
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Price</th>
            <th>Qty</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${sale.sale_items.map(item => `
            <tr>
              <td>${item.products.name}</td>
              <td>${formatCurrency(item.unit_price)}</td>
              <td>${item.quantity}</td>
              <td>${formatCurrency(item.subtotal)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Close modal
  modal.querySelector('.close-modal').addEventListener('click', () => {
    modal.remove();
  });
  
  // Close when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

function exportToPdf() {
  // Implement PDF export using jsPDF or similar library
  showNotification('PDF export will be implemented', false);
}

function exportToExcel() {
  // Implement Excel export using SheetJS or similar library
  showNotification('Excel export will be implemented', false);
}
