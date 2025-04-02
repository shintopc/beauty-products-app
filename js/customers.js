import { supabase, formatDate, formatCurrency, showNotification, checkAuth } from './utils.js';

document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();
  
  // Load customers
  await loadCustomers();
  
  // Add customer button
  document.getElementById('addCustomerBtn').addEventListener('click', () => {
    openCustomerModal();
  });
  
  // Search customers
  document.getElementById('customerSearch').addEventListener('input', async (e) => {
    await loadCustomers(e.target.value);
  });
  
  // Customer form submission
  document.getElementById('customerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveCustomer();
  });
  
  // Close modal button
  document.querySelector('.close-modal').addEventListener('click', () => {
    closeCustomerModal();
  });
});

async function loadCustomers(searchTerm = '') {
  let query = supabase
    .from('customers')
    .select(`
      id,
      name,
      phone,
      email,
      address,
      created_at,
      sales: sales!customer_id (id, total_amount)
    `)
    .order('name', { ascending: true });
  
  if (searchTerm) {
    query = query.or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
  }
  
  const { data: customers, error } = await query;
  
  if (error) {
    showNotification('Error loading customers: ' + error.message, true);
    return;
  }
  
  const customersTable = document.getElementById('customersTable');
  if (customersTable) {
    const tbody = customersTable.querySelector('tbody');
    tbody.innerHTML = '';
    
    customers.forEach(customer => {
      const totalPurchases = customer.sales.reduce((sum, sale) => sum + sale.total_amount, 0);
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${customer.name}</td>
        <td>${customer.phone || '-'}</td>
        <td>${customer.email || '-'}</td>
        <td>${formatCurrency(totalPurchases)}</td>
        <td>
          <button class="btn-edit" data-id="${customer.id}">Edit</button>
          <button class="btn-delete" data-id="${customer.id}">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
      
      // Add event listeners to edit/delete buttons
      tr.querySelector('.btn-edit').addEventListener('click', () => editCustomer(customer));
      tr.querySelector('.btn-delete').addEventListener('click', () => deleteCustomer(customer.id));
    });
  }
}

function openCustomerModal(customer = null) {
  const modal = document.getElementById('customerModal');
  const form = document.getElementById('customerForm');
  
  if (customer) {
    document.getElementById('modalTitle').textContent = 'Edit Customer';
    document.getElementById('customerId').value = customer.id;
    document.getElementById('customerName').value = customer.name;
    document.getElementById('customerPhone').value = customer.phone || '';
    document.getElementById('customerEmail').value = customer.email || '';
    document.getElementById('customerAddress').value = customer.address || '';
  } else {
    document.getElementById('modalTitle').textContent = 'Add New Customer';
    form.reset();
  }
  
  modal.style.display = 'flex';
}

function closeCustomerModal() {
  document.getElementById('customerModal').style.display = 'none';
}

async function saveCustomer() {
  const id = document.getElementById('customerId').value;
  const name = document.getElementById('customerName').value;
  const phone = document.getElementById('customerPhone').value;
  const email = document.getElementById('customerEmail').value;
  const address = document.getElementById('customerAddress').value;
  
  if (!name) {
    showNotification('Name is required', true);
    return;
  }
  
  const customerData = {
    name,
    phone: phone || null,
    email: email || null,
    address: address || null,
    updated_at: new Date().toISOString()
  };
  
  try {
    if (id) {
      // Update existing customer
      const { error } = await supabase
        .from('customers')
        .update(customerData)
        .eq('id', id);
      
      if (error) throw error;
      showNotification('Customer updated successfully!');
    } else {
      // Add new customer
      const { error } = await supabase
        .from('customers')
        .insert([customerData]);
      
      if (error) throw error;
      showNotification('Customer added successfully!');
    }
    
    closeCustomerModal();
    await loadCustomers();
  } catch (error) {
    showNotification('Error saving customer: ' + error.message, true);
  }
}

async function editCustomer(customer) {
  openCustomerModal(customer);
}

async function deleteCustomer(customerId) {
  if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
    return;
  }
  
  try {
    // First check if customer has any sales
    const { count } = await supabase
      .from('sales')
      .select('*', { count: 'exact' })
      .eq('customer_id', customerId);
    
    if (count > 0) {
      showNotification('Cannot delete customer with existing sales records', true);
      return;
    }
    
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerId);
    
    if (error) throw error;
    
    showNotification('Customer deleted successfully!');
    await loadCustomers();
  } catch (error) {
    showNotification('Error deleting customer: ' + error.message, true);
  }
}
