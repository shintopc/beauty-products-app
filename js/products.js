import { supabase, formatDate, formatCurrency, showNotification, checkAuth } from './utils.js';

document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();
  
  // Load products
  await loadProducts();
  
  // Add product form
  const addProductForm = document.getElementById('addProductForm');
  if (addProductForm) {
    addProductForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = document.getElementById('productName').value;
      const description = document.getElementById('productDescription').value;
      const price = parseFloat(document.getElementById('productPrice').value);
      const costPrice = parseFloat(document.getElementById('productCostPrice').value);
      const stockQuantity = parseInt(document.getElementById('productStock').value);
      
      const { data, error } = await supabase
        .from('products')
        .insert([{ 
          name, 
          description, 
          price, 
          cost_price: costPrice,
          stock_quantity: stockQuantity 
        }]);
      
      if (error) {
        showNotification('Error adding product: ' + error.message, true);
      } else {
        showNotification('Product added successfully!');
        addProductForm.reset();
        await loadProducts();
      }
    });
  }
  
  // Search products
  const searchInput = document.getElementById('productSearch');
  if (searchInput) {
    searchInput.addEventListener('input', async (e) => {
      await loadProducts(e.target.value);
    });
  }
});

async function loadProducts(searchTerm = '') {
  let query = supabase
    .from('products')
    .select('*')
    .order('name', { ascending: true });
  
  if (searchTerm) {
    query = query.ilike('name', `%${searchTerm}%`);
  }
  
  const { data: products, error } = await query;
  
  if (error) {
    showNotification('Error loading products: ' + error.message, true);
    return;
  }
  
  const productsTable = document.getElementById('productsTable');
  if (productsTable) {
    const tbody = productsTable.querySelector('tbody');
    tbody.innerHTML = '';
    
    products.forEach(product => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${product.name}</td>
        <td>${product.description || '-'}</td>
        <td>${formatCurrency(product.price)}</td>
        <td>${product.stock_quantity}</td>
        <td>
          <button class="btn-edit" data-id="${product.id}">Edit</button>
          <button class="btn-delete" data-id="${product.id}">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
    
    // Add event listeners to edit/delete buttons
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => editProduct(btn.dataset.id));
    });
    
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => deleteProduct(btn.dataset.id));
    });
  }
}

async function editProduct(productId) {
  // Fetch product details
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();
  
  if (error) {
    showNotification('Error fetching product: ' + error.message, true);
    return;
  }
  
  // Show edit modal (you'll need to implement this)
  showEditModal(product);
}

async function deleteProduct(productId) {
  if (confirm('Are you sure you want to delete this product?')) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);
    
    if (error) {
      showNotification('Error deleting product: ' + error.message, true);
    } else {
      showNotification('Product deleted successfully!');
      await loadProducts();
    }
  }
}

function showEditModal(product) {
  // Implement a modal to edit product details
  // This would be similar to the add product form but pre-filled
  // and with an update button that calls supabase's update method
}
