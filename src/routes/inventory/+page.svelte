<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { 
    Package, Plus, Search, Edit, Trash2, 
    TrendingUp, TrendingDown, AlertTriangle,
    X, Check, ChevronLeft, ChevronRight,
    DollarSign, Box, Filter, Eye, Clock,
    PlusCircle, MinusCircle, ClipboardList,
    TrendingUp as TrendingUpIcon, Wallet, Percent,
    Truck
  } from 'lucide-svelte';
  
  // Use $props() instead of export let
  let { data } = $props();
  
  // Safe data access with fallbacks
  let inventory = $derived(data?.inventory || []);
  let categories = $derived(data?.categories || []);
  let units = $derived(data?.units || []);
  let suppliers = $derived(data?.suppliers || []);
  let stats = $derived(data?.stats || { totalItems: 0, lowStock: 0, totalStockValue: 0, totalPotentialRevenue: 0, profitMargin: 0 });
  let lowStockItems = $derived(data?.lowStockItems || []);
  let recentOrders = $derived(data?.recentOrders || []);
  let pagination = $derived(data?.pagination || { page: 1, limit: 20, total: 0, pages: 1 });
  let canManage = $derived(data?.canManage || false);
  
  let showAddModal = $state(false);
  let showStockModal = $state(false);
  let showPriceModal = $state(false);
  let showCountModal = $state(false);
  let showSupplierModal = $state(false);
  let selectedItem = $state(null);
  let stockType = $state('add');
  let searchInput = $state(data?.search || '');
  let selectedCategory = $state(data?.category || '');
  let currentPage = $state(pagination.page);
  
  let searchTimeout: any;
  
  function handleSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    searchInput = target.value;
    
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      goto(`/inventory?page=1&search=${encodeURIComponent(searchInput)}&category=${selectedCategory}`);
    }, 500);
  }
  
  function handleCategoryChange() {
    goto(`/inventory?page=1&search=${encodeURIComponent(searchInput)}&category=${selectedCategory}`);
  }
  
  function changePage(page: number) {
    if (page < 1 || page > pagination.pages) return;
    goto(`/inventory?page=${page}&search=${encodeURIComponent(searchInput)}&category=${selectedCategory}`);
  }
  
  async function addInventory(event: Event) {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    
    const response = await fetch('?/addInventory', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      showAddModal = false;
      location.reload();
    } else {
      alert('Failed to add inventory item');
    }
  }
  
  async function updateStock(event: Event) {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    formData.append('itemId', selectedItem.id);
    formData.append('type', stockType);
    
    const response = await fetch('?/updateStock', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      showStockModal = false;
      location.reload();
    } else {
      const error = await response.json();
      alert(error.message || 'Failed to update stock');
    }
  }
  
  async function updatePrices(event: Event) {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    formData.append('itemId', selectedItem.id);
    
    const response = await fetch('?/updatePrices', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      showPriceModal = false;
      location.reload();
    } else {
      alert('Failed to update prices');
    }
  }
  
  async function updateSupplier(event: Event) {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    formData.append('itemId', selectedItem.id);
    
    const response = await fetch('?/updateSupplier', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      showSupplierModal = false;
      location.reload();
    } else {
      alert('Failed to update supplier');
    }
  }
  
  async function updatePhysicalCount(event: Event) {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    formData.append('itemId', selectedItem.id);
    
    const response = await fetch('?/updatePhysicalCount', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      showCountModal = false;
      location.reload();
    } else {
      alert('Failed to update physical count');
    }
  }
  
  async function deleteInventory(itemId: number, itemName: string) {
    if (confirm(`Are you sure you want to delete ${itemName}?`)) {
      const formData = new FormData();
      formData.append('itemId', itemId.toString());
      
      const response = await fetch('?/deleteInventory', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        location.reload();
      } else {
        alert('Failed to delete item');
      }
    }
  }
  
  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount || 0);
  }
  
  function getStockStatusColor(stock: number) {
    const stockValue = stock || 0;
    if (stockValue <= 10) return 'text-rose-600 bg-rose-50';
    if (stockValue <= 30) return 'text-amber-600 bg-amber-50';
    return 'text-emerald-600 bg-emerald-50';
  }
  
  function calculateProfitMargin(item: any) {
    if (!item || !item.costPrice || item.costPrice === 0) return 0;
    return ((item.sellingPrice - item.costPrice) / item.costPrice * 100).toFixed(1);
  }
  
  function getCategoryIcon(categoryId: string) {
    const cat = categories.find(c => c.id === categoryId);
    return cat?.icon || '📦';
  }
</script>

<div class="min-h-screen bg-slate-50/50 p-8">
  <div class="max-w-7xl mx-auto">
    
    <header class="flex items-center justify-between mb-8 flex-wrap gap-4">
      <div>
        <h1 class="text-3xl font-black text-slate-900 tracking-tight">Inventory Management</h1>
        <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
          Stock Control, Pricing & Supply Chain
        </p>
      </div>
      {#if canManage}
        <button 
          onclick={() => showAddModal = true}
          class="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all"
        >
          <Plus size={18} />
          Add Item
        </button>
      {/if}
    </header>

    <!-- Stats Overview -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div class="bg-white rounded-2xl p-5 border border-slate-100">
        <div class="p-2 bg-indigo-50 rounded-lg w-fit mb-3">
          <Package size={18} class="text-indigo-600" />
        </div>
        <p class="text-[10px] font-black text-slate-400 uppercase">Total Items</p>
        <p class="text-2xl font-black text-slate-900">{stats.totalItems || 0}</p>
      </div>
      
      <div class="bg-white rounded-2xl p-5 border border-slate-100">
        <div class="p-2 bg-rose-50 rounded-lg w-fit mb-3">
          <AlertTriangle size={18} class="text-rose-600" />
        </div>
        <p class="text-[10px] font-black text-slate-400 uppercase">Low Stock</p>
        <p class="text-2xl font-black text-rose-600">{stats.lowStock || 0}</p>
      </div>
      
      <div class="bg-white rounded-2xl p-5 border border-slate-100">
        <div class="p-2 bg-emerald-50 rounded-lg w-fit mb-3">
          <Wallet size={18} class="text-emerald-600" />
        </div>
        <p class="text-[10px] font-black text-slate-400 uppercase">Stock Value</p>
        <p class="text-2xl font-black text-emerald-600">{formatCurrency(stats.totalStockValue || 0)}</p>
      </div>
      
      <div class="bg-white rounded-2xl p-5 border border-slate-100">
        <div class="p-2 bg-amber-50 rounded-lg w-fit mb-3">
          <Percent size={18} class="text-amber-600" />
        </div>
        <p class="text-[10px] font-black text-slate-400 uppercase">Profit Margin</p>
        <p class="text-2xl font-black text-amber-600">{stats.profitMargin || 0}%</p>
      </div>
    </div>

    <!-- Low Stock Alert -->
    {#if lowStockItems && lowStockItems.length > 0}
      <div class="bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-6">
        <div class="flex items-center gap-2 mb-2">
          <AlertTriangle size={18} class="text-rose-600" />
          <span class="font-black text-rose-800">Low Stock Alert</span>
        </div>
        <div class="flex flex-wrap gap-2">
          {#each lowStockItems as item}
            <span class="text-sm bg-white px-3 py-1 rounded-full text-rose-600">
              {item.itemName}: {item.closingStock} {item.unit} left
            </span>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Filters -->
    <div class="bg-white rounded-2xl p-4 mb-6 border border-slate-100">
      <div class="flex gap-4 flex-wrap">
        <div class="flex-1 min-w-[200px] relative">
          <Search size={18} class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            value={searchInput}
            oninput={handleSearchInput}
            placeholder="Search inventory..." 
            class="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl text-sm font-bold"
          />
        </div>
        <select 
          value={selectedCategory}
          onchange={handleCategoryChange}
          class="px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold"
        >
          <option value="">All Categories</option>
          {#each categories as cat}
            <option value={cat.id}>{cat.icon} {cat.name}</option>
          {/each}
        </select>
      </div>
    </div>

    <!-- Inventory Table -->
    <div class="bg-white rounded-3xl border border-slate-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-50 border-b border-slate-100">
            <tr>
              <th class="text-left px-6 py-4 text-xs font-black text-slate-400 uppercase">Item</th>
              <th class="text-left px-6 py-4 text-xs font-black text-slate-400 uppercase">Category</th>
              <th class="text-left px-6 py-4 text-xs font-black text-slate-400 uppercase">Supplier</th>
              <th class="text-left px-6 py-4 text-xs font-black text-slate-400 uppercase">Stock</th>
              <th class="text-left px-6 py-4 text-xs font-black text-slate-400 uppercase">Cost Price</th>
              <th class="text-left px-6 py-4 text-xs font-black text-slate-400 uppercase">Selling Price</th>
              <th class="text-left px-6 py-4 text-xs font-black text-slate-400 uppercase">Margin</th>
              <th class="text-left px-6 py-4 text-xs font-black text-slate-400 uppercase">Status</th>
              <th class="text-right px-6 py-4 text-xs font-black text-slate-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#if !inventory || inventory.length === 0}
              <tr>
                <td colspan="9" class="text-center py-20">
                  <Package size={48} class="mx-auto text-slate-200 mb-4" />
                  <p class="font-black text-slate-400 uppercase tracking-widest">No inventory items found</p>
                </td>
              </tr>
            {:else}
              {#each inventory as item (item.id)}
                <tr class="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                        <Package size={18} class="text-indigo-600" />
                      </div>
                      <div>
                        <span class="font-black text-slate-900">{item.itemName || 'Unknown'}</span>
                        <p class="text-[10px] text-slate-400">{item.unit || 'N/A'}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <span class="text-sm font-bold text-slate-600">
                      {getCategoryIcon(item.category)} {item.category || 'Uncategorized'}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    {#if item.supplierName}
                      <div class="flex items-center gap-2">
                        <span class="text-sm font-bold text-slate-600">{item.supplierName}</span>
                        <button
                          onclick={() => {
                            selectedItem = item;
                            showSupplierModal = true;
                          }}
                          class="p-1 hover:bg-slate-100 rounded transition-colors"
                          title="Change Supplier"
                        >
                          <Edit size={12} class="text-indigo-600" />
                        </button>
                      </div>
                    {:else}
                      <button
                        onclick={() => {
                          selectedItem = item;
                          showSupplierModal = true;
                        }}
                        class="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                      >
                        + Assign Supplier
                      </button>
                    {/if}
                  </td>
                  <td class="px-6 py-4">
                    <span class="text-sm font-bold text-slate-900">{item.closingStock || 0}</span>
                  </td>
                  <td class="px-6 py-4">
                    <span class="text-sm font-bold text-slate-600">{formatCurrency(item.costPrice || 0)}</span>
                  </td>
                  <td class="px-6 py-4">
                    <span class="text-sm font-bold text-emerald-600">{formatCurrency(item.sellingPrice || 0)}</span>
                  </td>
                  <td class="px-6 py-4">
                    <span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black {calculateProfitMargin(item) > 50 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}">
                      <TrendingUpIcon size={10} />
                      {calculateProfitMargin(item)}%
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black {getStockStatusColor(item.closingStock)}">
                      {#if (item.closingStock || 0) <= (item.reorderLevel || 10)}
                        <AlertTriangle size={10} />
                        Critical
                      {:else if (item.closingStock || 0) <= 30}
                        <AlertTriangle size={10} />
                        Low
                      {:else}
                        <Check size={10} />
                        Good
                      {/if}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-2">
                      {#if canManage}
                        <button
                          onclick={() => {
                            selectedItem = item;
                            stockType = 'add';
                            showStockModal = true;
                          }}
                          class="p-2 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Add Stock"
                        >
                          <PlusCircle size={16} class="text-emerald-600" />
                        </button>
                        <button
                          onclick={() => {
                            selectedItem = item;
                            stockType = 'remove';
                            showStockModal = true;
                          }}
                          class="p-2 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Remove Stock"
                        >
                          <MinusCircle size={16} class="text-rose-600" />
                        </button>
                        <button
                          onclick={() => {
                            selectedItem = item;
                            showPriceModal = true;
                          }}
                          class="p-2 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Update Prices"
                        >
                          <DollarSign size={16} class="text-amber-600" />
                        </button>
                        <button
                          onclick={() => {
                            selectedItem = item;
                            showCountModal = true;
                          }}
                          class="p-2 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Physical Count"
                        >
                          <ClipboardList size={16} class="text-indigo-600" />
                        </button>
                        <button
                          onclick={() => deleteInventory(item.id, item.itemName)}
                          class="p-2 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} class="text-rose-400" />
                        </button>
                      {/if}
                    </div>
                  </td>
                </tr>
              {/each}
            {/if}
          </tbody>
        </table>
      </div>
      
      <!-- Pagination -->
      {#if pagination.pages > 1}
        <div class="flex items-center justify-between px-6 py-4 border-t border-slate-100">
          <p class="text-sm text-slate-500">
            Page {pagination.page} of {pagination.pages}
          </p>
          <div class="flex gap-2">
            <button
              onclick={() => changePage(pagination.page - 1)}
              disabled={pagination.page === 1}
              class="p-2 bg-slate-50 rounded-lg disabled:opacity-50 hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onclick={() => changePage(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              class="p-2 bg-slate-50 rounded-lg disabled:opacity-50 hover:bg-slate-100 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      {/if}
    </div>

    <!-- Recent Orders -->
    {#if recentOrders && recentOrders.length > 0}
      <div class="mt-8">
        <h2 class="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
          <Truck size={20} />
          Recent Purchase Orders
        </h2>
        
        <div class="bg-white rounded-3xl border border-slate-100 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th class="text-left px-6 py-4 text-xs font-black text-slate-400 uppercase">Order #</th>
                  <th class="text-left px-6 py-4 text-xs font-black text-slate-400 uppercase">Supplier</th>
                  <th class="text-left px-6 py-4 text-xs font-black text-slate-400 uppercase">Order Date</th>
                  <th class="text-left px-6 py-4 text-xs font-black text-slate-400 uppercase">Status</th>
                  <th class="text-left px-6 py-4 text-xs font-black text-slate-400 uppercase">Total</th>
                </tr>
              </thead>
              <tbody>
                {#each recentOrders as order (order.id)}
                  <tr class="border-b border-slate-50">
                    <td class="px-6 py-4 font-bold text-slate-900">{order.orderNumber}</td>
                    <td class="px-6 py-4 text-slate-600">{order.supplierName}</td>
                    <td class="px-6 py-4 text-sm text-slate-500">{new Date(order.orderDate).toLocaleDateString()}</td>
                    <td class="px-6 py-4">
                      <span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black
                        {order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' : 
                         order.status === 'cancelled' ? 'bg-rose-100 text-rose-700' : 
                         'bg-amber-100 text-amber-700'}">
                        {order.status}
                      </span>
                    </td>
                    <td class="px-6 py-4 font-bold text-emerald-600">{formatCurrency(order.totalAmount || 0)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- Add Inventory Modal -->
{#if showAddModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
    <div class="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto">
      <form onsubmit={addInventory}>
        <div class="p-6 border-b border-slate-100">
          <h2 class="text-2xl font-black text-slate-900">Add Inventory Item</h2>
          <p class="text-sm text-slate-500">Create new stock item</p>
        </div>
        
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase mb-1">Item Name</label>
            <input type="text" name="itemName" required class="w-full px-4 py-3 bg-slate-50 rounded-xl" />
          </div>
          
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase mb-1">Category</label>
            <select name="category" required class="w-full px-4 py-3 bg-slate-50 rounded-xl">
              {#each categories as cat}
                <option value={cat.id}>{cat.icon} {cat.name}</option>
              {/each}
            </select>
          </div>
          
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase mb-1">Unit</label>
            <select name="unit" required class="w-full px-4 py-3 bg-slate-50 rounded-xl">
              {#each units as unit}
                <option value={unit.id}>{unit.name}</option>
              {/each}
            </select>
          </div>
          
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase mb-1">Supplier (Optional)</label>
            <select name="supplierId" class="w-full px-4 py-3 bg-slate-50 rounded-xl">
              <option value="">-- Select Supplier --</option>
              {#each suppliers as supplier}
                <option value={supplier.id}>{supplier.name}</option>
              {/each}
            </select>
          </div>
          
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-black text-slate-400 uppercase mb-1">Cost Price (₦)</label>
              <input type="number" name="costPrice" step="0.01" class="w-full px-4 py-3 bg-slate-50 rounded-xl" />
            </div>
            <div>
              <label class="block text-xs font-black text-slate-400 uppercase mb-1">Selling Price (₦)</label>
              <input type="number" name="sellingPrice" step="0.01" class="w-full px-4 py-3 bg-slate-50 rounded-xl" />
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-black text-slate-400 uppercase mb-1">Opening Stock</label>
              <input type="number" name="openingStock" class="w-full px-4 py-3 bg-slate-50 rounded-xl" />
            </div>
            <div>
              <label class="block text-xs font-black text-slate-400 uppercase mb-1">Reorder Level</label>
              <input type="number" name="reorderLevel" value="10" class="w-full px-4 py-3 bg-slate-50 rounded-xl" />
            </div>
          </div>
          
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase mb-1">Storage Location</label>
            <input type="text" name="location" class="w-full px-4 py-3 bg-slate-50 rounded-xl" placeholder="e.g., Warehouse A, Shelf 3" />
          </div>
        </div>
        
        <div class="p-6 border-t border-slate-100 flex gap-3">
          <button type="button" onclick={() => showAddModal = false} class="flex-1 px-4 py-3 bg-slate-100 rounded-xl font-black text-slate-600">
            Cancel
          </button>
          <button type="submit" class="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-black">
            Add Item
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Stock Adjustment Modal -->
{#if showStockModal && selectedItem}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
    <div class="bg-white rounded-3xl max-w-md w-full">
      <form onsubmit={updateStock}>
        <div class="p-6 border-b border-slate-100">
          <h2 class="text-2xl font-black text-slate-900">
            {stockType === 'add' ? 'Add Stock' : 'Remove Stock'}
          </h2>
          <p class="text-sm text-slate-500">{selectedItem.itemName}</p>
          <p class="text-xs text-slate-400 mt-1">Current stock: {selectedItem.closingStock || 0} {selectedItem.unit}</p>
        </div>
        
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase mb-1">Quantity</label>
            <input type="number" name="quantity" required class="w-full px-4 py-3 bg-slate-50 rounded-xl" />
          </div>
          
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase mb-1">Reason</label>
            <input type="text" name="reason" class="w-full px-4 py-3 bg-slate-50 rounded-xl" placeholder="e.g., Purchase, Usage, Damage" />
          </div>
        </div>
        
        <div class="p-6 border-t border-slate-100 flex gap-3">
          <button type="button" onclick={() => showStockModal = false} class="flex-1 px-4 py-3 bg-slate-100 rounded-xl font-black text-slate-600">
            Cancel
          </button>
          <button type="submit" class="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-black">
            Confirm
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Update Prices Modal -->
{#if showPriceModal && selectedItem}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
    <div class="bg-white rounded-3xl max-w-md w-full">
      <form onsubmit={updatePrices}>
        <div class="p-6 border-b border-slate-100">
          <h2 class="text-2xl font-black text-slate-900">Update Prices</h2>
          <p class="text-sm text-slate-500">{selectedItem.itemName}</p>
        </div>
        
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase mb-1">Cost Price (₦)</label>
            <input type="number" name="costPrice" step="0.01" value={selectedItem.costPrice || 0} class="w-full px-4 py-3 bg-slate-50 rounded-xl" />
          </div>
          
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase mb-1">Selling Price (₦)</label>
            <input type="number" name="sellingPrice" step="0.01" value={selectedItem.sellingPrice || 0} class="w-full px-4 py-3 bg-slate-50 rounded-xl" />
          </div>
          
          <div class="bg-slate-50 rounded-xl p-3">
            <p class="text-xs text-slate-600">
              Current profit margin: 
              <span class="font-bold text-emerald-600">
                {calculateProfitMargin(selectedItem)}%
              </span>
            </p>
          </div>
        </div>
        
        <div class="p-6 border-t border-slate-100 flex gap-3">
          <button type="button" onclick={() => showPriceModal = false} class="flex-1 px-4 py-3 bg-slate-100 rounded-xl font-black text-slate-600">
            Cancel
          </button>
          <button type="submit" class="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-black">
            Update Prices
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Assign Supplier Modal -->
{#if showSupplierModal && selectedItem}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
    <div class="bg-white rounded-3xl max-w-md w-full">
      <form onsubmit={updateSupplier}>
        <div class="p-6 border-b border-slate-100">
          <h2 class="text-2xl font-black text-slate-900">Assign Supplier</h2>
          <p class="text-sm text-slate-500">{selectedItem.itemName}</p>
        </div>
        
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase mb-1">Select Supplier</label>
            <select name="supplierId" class="w-full px-4 py-3 bg-slate-50 rounded-xl">
              <option value="">-- None --</option>
              {#each suppliers as supplier}
                <option value={supplier.id} selected={supplier.id === selectedItem.supplierId}>
                  {supplier.name} - {supplier.category || 'General'}
                </option>
              {/each}
            </select>
          </div>
        </div>
        
        <div class="p-6 border-t border-slate-100 flex gap-3">
          <button type="button" onclick={() => showSupplierModal = false} class="flex-1 px-4 py-3 bg-slate-100 rounded-xl font-black text-slate-600">
            Cancel
          </button>
          <button type="submit" class="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-black">
            Assign Supplier
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Physical Count Modal -->
{#if showCountModal && selectedItem}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
    <div class="bg-white rounded-3xl max-w-md w-full">
      <form onsubmit={updatePhysicalCount}>
        <div class="p-6 border-b border-slate-100">
          <h2 class="text-2xl font-black text-slate-900">Physical Count</h2>
          <p class="text-sm text-slate-500">{selectedItem.itemName}</p>
          <p class="text-xs text-slate-400 mt-1">System stock: {selectedItem.closingStock || 0} {selectedItem.unit}</p>
          <p class="text-xs text-slate-400">Value at cost: {formatCurrency((selectedItem.closingStock || 0) * (selectedItem.costPrice || 0))}</p>
        </div>
        
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase mb-1">Physical Count</label>
            <input type="number" name="physicalCount" required class="w-full px-4 py-3 bg-slate-50 rounded-xl" />
          </div>
        </div>
        
        <div class="p-6 border-t border-slate-100 flex gap-3">
          <button type="button" onclick={() => showCountModal = false} class="flex-1 px-4 py-3 bg-slate-100 rounded-xl font-black text-slate-600">
            Cancel
          </button>
          <button type="submit" class="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-black">
            Record Count
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}