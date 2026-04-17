<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { 
    Beer, Coffee, Package, Search, TrendingUp, 
    TrendingDown, AlertTriangle, Plus, Minus,
    X, Check, Clock, Truck, BarChart3,
    ShoppingCart, Users, DollarSign, RefreshCw,
    ClipboardList, ChefHat, Store, Wine
  } from 'lucide-svelte';
  
  let { data } = $props();
  
  let inventory = $derived(data.inventory);
  let lowStockItems = $derived(data.lowStockItems);
  let recentMovements = $derived(data.recentMovements);
  let stats = $derived(data.stats);
  let allowedSections = $derived(data.allowedSections);
  let user = $derived(data.user);
  
  let activeSection = $state(allowedSections[0] || 'bar');
  let showStockModal = $state(false);
  let showOrderModal = $state(false);
  let selectedItem = $state(null);
  let stockType = $state('add');
  let searchQuery = $state('');
  let orderItems = $state<Array<{id: number, name: string, quantity: number, supplierName: string, closingStock: number}>>([]);
  
  let filteredInventory = $derived(
    inventory.filter(item => 
      item.section === activeSection && 
      item.itemName.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );
  
  let sectionLowStock = $derived(
    lowStockItems.filter(item => item.section === activeSection)
  );
  
  function openStockModal(item: any, type: string) {
    selectedItem = item;
    stockType = type;
    showStockModal = true;
  }
  
  async function handleStockUpdate(event: Event) {
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
  
  function addToOrder(item: any) {
    const existing = orderItems.find(i => i.id === item.id);
    if (existing) {
      existing.quantity++;
    } else {
      orderItems.push({
        id: item.id,
        name: item.itemName,
        quantity: 1,
        supplierName: item.supplierName,
        closingStock: item.closingStock
      });
    }
    showOrderModal = true;
  }
  
  function removeFromOrder(itemId: number) {
    orderItems = orderItems.filter(i => i.id !== itemId);
  }
  
  function updateQuantity(itemId: number, quantity: number) {
    const item = orderItems.find(i => i.id === itemId);
    if (item) {
      item.quantity = Math.max(1, quantity);
    }
  }
  
  async function submitOrder() {
    if (orderItems.length === 0) {
      alert('No items in order');
      return;
    }
    
    const formData = new FormData();
    formData.append('items', JSON.stringify(orderItems));
    
    const response = await fetch('?/createOrder', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      showOrderModal = false;
      orderItems = [];
      location.reload();
    } else {
      alert('Failed to create order');
    }
  }
  
  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount || 0);
  }
  
  function getStockStatusColor(stock: number, reorderLevel: number) {
    const level = reorderLevel || 10;
    if (stock <= level) return 'text-rose-600 bg-rose-50';
    if (stock <= level * 2) return 'text-amber-600 bg-amber-50';
    return 'text-emerald-600 bg-emerald-50';
  }
  
  function getSectionIcon(section: string) {
    switch(section) {
      case 'bar': return Beer;
      case 'kitchen': return ChefHat;
      case 'store': return Store;
      default: return Package;
    }
  }
  
  function getSectionTitle(section: string) {
    switch(section) {
      case 'bar': return 'Bar Inventory';
      case 'kitchen': return 'Kitchen Inventory';
      case 'store': return 'Store Inventory';
      default: return 'Inventory';
    }
  }
  
  function getSectionColor(section: string) {
    switch(section) {
      case 'bar': return 'indigo';
      case 'kitchen': return 'emerald';
      case 'store': return 'amber';
      default: return 'slate';
    }
  }
</script>

<div class="min-h-screen bg-slate-50/50 p-8">
  <div class="max-w-7xl mx-auto">
    
    <header class="mb-8">
      <h1 class="text-3xl font-black text-slate-900 tracking-tight">Bar & Kitchen Management</h1>
      <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
        Inventory Control & Stock Management
      </p>
    </header>

    <!-- Section Tabs -->
    <div class="flex gap-2 mb-8 border-b border-slate-200 overflow-x-auto">
      {#each allowedSections as section (section)}
        {@const SectionIcon = getSectionIcon(section)}
        <button
          onclick={() => activeSection = section}
          class="px-6 py-3 font-black text-sm transition-all whitespace-nowrap flex items-center gap-2
            {activeSection === section ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}"
        >
          <SectionIcon size={16} />
          {section.charAt(0).toUpperCase() + section.slice(1)}
        </button>
      {/each}
    </div>

    <!-- Stats Overview -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div class="bg-white rounded-2xl p-5 border border-slate-100">
        <div class="p-2 bg-indigo-50 rounded-lg w-fit mb-3">
          <Package size={18} class="text-indigo-600" />
        </div>
        <p class="text-[10px] font-black text-slate-400 uppercase">Total Items</p>
        <p class="text-2xl font-black text-slate-900">
          {activeSection === 'bar' ? stats.bar.totalItems : 
           activeSection === 'kitchen' ? stats.kitchen.totalItems : 
           stats.store.totalItems}
        </p>
      </div>
      
      <div class="bg-white rounded-2xl p-5 border border-slate-100">
        <div class="p-2 bg-rose-50 rounded-lg w-fit mb-3">
          <AlertTriangle size={18} class="text-rose-600" />
        </div>
        <p class="text-[10px] font-black text-slate-400 uppercase">Low Stock</p>
        <p class="text-2xl font-black text-rose-600">
          {activeSection === 'bar' ? stats.bar.lowStock : 
           activeSection === 'kitchen' ? stats.kitchen.lowStock : 
           stats.store.lowStock}
        </p>
      </div>
      
      <div class="bg-white rounded-2xl p-5 border border-slate-100">
        <div class="p-2 bg-emerald-50 rounded-lg w-fit mb-3">
          <DollarSign size={18} class="text-emerald-600" />
        </div>
        <p class="text-[10px] font-black text-slate-400 uppercase">Stock Value</p>
        <p class="text-2xl font-black text-emerald-600">
          {formatCurrency(activeSection === 'bar' ? stats.bar.totalValue : 
           activeSection === 'kitchen' ? stats.kitchen.totalValue : 
           stats.store.totalValue)}
        </p>
      </div>
    </div>

    <!-- Low Stock Alert -->
    {#if sectionLowStock.length > 0}
      <div class="bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-6">
        <div class="flex items-center gap-2 mb-2">
          <AlertTriangle size={18} class="text-rose-600" />
          <span class="font-black text-rose-800">Low Stock Alert - {activeSection.toUpperCase()}</span>
        </div>
        <div class="flex flex-wrap gap-2">
          {#each sectionLowStock as item (item.id)}
            <span class="text-sm bg-white px-3 py-1 rounded-full text-rose-600">
              {item.itemName}: {item.closingStock} {item.unit} left
            </span>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Search Bar -->
    <div class="bg-white rounded-2xl p-4 mb-6 border border-slate-100">
      <div class="relative">
        <Search size={18} class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input 
          type="text" 
          bind:value={searchQuery}
          placeholder="Search {activeSection} inventory..." 
          class="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl text-sm font-bold"
        />
      </div>
    </div>

    <!-- Inventory Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
      {#each filteredInventory as item (item.id)}
        {@const SectionIcon = getSectionIcon(activeSection)}
        <div class="bg-white rounded-3xl border border-slate-100 overflow-hidden hover:shadow-xl transition-all">
          <div class="p-6">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-2xl bg-{getSectionColor(activeSection)}-50 flex items-center justify-center">
                  <SectionIcon size={22} class="text-{getSectionColor(activeSection)}-600" />
                </div>
                <div>
                  <h3 class="font-black text-slate-900">{item.itemName}</h3>
                  <p class="text-xs text-slate-400">{item.unit}</p>
                </div>
              </div>
              {#if item.supplierName}
                <div class="text-right">
                  <p class="text-[10px] font-bold text-slate-400">Supplier</p>
                  <p class="text-[10px] font-black text-slate-600">{item.supplierName}</p>
                </div>
              {/if}
            </div>
            
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p class="text-[10px] font-black text-slate-400 uppercase">Stock</p>
                <p class="text-xl font-black text-slate-900">{item.closingStock}</p>
              </div>
              <div>
                <p class="text-[10px] font-black text-slate-400 uppercase">Status</p>
                <span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black {getStockStatusColor(item.closingStock, item.reorderLevel)}">
                  {#if item.closingStock <= (item.reorderLevel || 10)}
                    <AlertTriangle size={10} />
                    Critical
                  {:else if item.closingStock <= ((item.reorderLevel || 10) * 2)}
                    <AlertTriangle size={10} />
                    Low
                  {:else}
                    <Check size={10} />
                    Good
                  {/if}
                </span>
              </div>
            </div>
            
            <div class="grid grid-cols-2 gap-2 mb-4">
              <div>
                <p class="text-[10px] font-black text-slate-400 uppercase">Cost Price</p>
                <p class="text-sm font-bold text-slate-600">{formatCurrency(item.costPrice)}</p>
              </div>
              <div>
                <p class="text-[10px] font-black text-slate-400 uppercase">Selling Price</p>
                <p class="text-sm font-bold text-emerald-600">{formatCurrency(item.sellingPrice)}</p>
              </div>
            </div>
            
            <div class="flex gap-2">
              <button
                onclick={() => openStockModal(item, 'add')}
                class="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1"
              >
                <Plus size={12} />
                Add Stock
              </button>
              <button
                onclick={() => openStockModal(item, 'remove')}
                class="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1"
              >
                <Minus size={12} />
                Remove
              </button>
              <button
                onclick={() => addToOrder(item)}
                class="py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all"
                title="Add to Order"
              >
                <ShoppingCart size={14} />
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>

    <!-- Recent Movements -->
    {#if recentMovements.length > 0}
      <div>
        <h2 class="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
          <Clock size={20} />
          Recent Movements
        </h2>
        
        <div class="bg-white rounded-3xl border border-slate-100 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th class="text-left px-6 py-4 text-xs font-black text-slate-400 uppercase">Date</th>
                  <th class="text-left px-6 py-4 text-xs font-black text-slate-400 uppercase">Item</th>
                  <th class="text-left px-6 py-4 text-xs font-black text-slate-400 uppercase">Type</th>
                  <th class="text-left px-6 py-4 text-xs font-black text-slate-400 uppercase">Quantity</th>
                  <th class="text-left px-6 py-4 text-xs font-black text-slate-400 uppercase">Reason</th>
                </tr>
              </thead>
              <tbody>
                {#each recentMovements as movement (movement.id)}
                  <tr class="border-b border-slate-50 hover:bg-slate-50/50">
                    <td class="px-6 py-4 text-sm text-slate-500">
                      {new Date(movement.createdAt).toLocaleString()}
                    </td>
                    <td class="px-6 py-4 font-bold text-slate-900">{movement.itemName}</td>
                    <td class="px-6 py-4">
                      <span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black {movement.type === 'add' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}">
                        {#if movement.type === 'add'}
                          <TrendingUp size={10} />
                        {:else}
                          <TrendingDown size={10} />
                        {/if}
                        {movement.type === 'add' ? 'Addition' : 'Removal'}
                      </span>
                    </td>
                    <td class="px-6 py-4 font-bold text-slate-900">{movement.quantity}</td>
                    <td class="px-6 py-4 text-sm text-slate-600">{movement.reason || '-'}</td>
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

<!-- Stock Adjustment Modal -->
{#if showStockModal && selectedItem}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
    <div class="bg-white rounded-3xl max-w-md w-full">
      <form onsubmit={handleStockUpdate}>
        <div class="p-6 border-b border-slate-100">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-black text-slate-900">
                {stockType === 'add' ? 'Add Stock' : 'Remove Stock'}
              </h2>
              <p class="text-sm text-slate-500">{selectedItem.itemName}</p>
              <p class="text-xs text-slate-400 mt-1">Current stock: {selectedItem.closingStock} {selectedItem.unit}</p>
            </div>
            <button type="button" onclick={() => showStockModal = false} class="p-2 hover:bg-slate-100 rounded-xl">
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase mb-1">Quantity</label>
            <input type="number" name="quantity" required class="w-full px-4 py-3 bg-slate-50 rounded-xl" />
          </div>
          
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase mb-1">Reason</label>
            <input type="text" name="reason" class="w-full px-4 py-3 bg-slate-50 rounded-xl" 
              placeholder={stockType === 'add' ? "e.g., Delivery from supplier" : "e.g., Used for service, Spillage"} />
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

<!-- Order Modal -->
{#if showOrderModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
    <div class="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto">
      <div class="p-6 border-b border-slate-100">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-black text-slate-900">Create Order</h2>
            <p class="text-sm text-slate-500">Items to reorder</p>
          </div>
          <button onclick={() => showOrderModal = false} class="p-2 hover:bg-slate-100 rounded-xl">
            <X size={20} />
          </button>
        </div>
      </div>
      
      <div class="p-6 space-y-4">
        {#if orderItems.length === 0}
          <p class="text-center text-slate-400 py-8">No items added to order</p>
        {:else}
          {#each orderItems as item (item.id)}
            <div class="bg-slate-50 rounded-xl p-3">
              <div class="flex items-center justify-between mb-2">
                <span class="font-black text-slate-800">{item.name}</span>
                <button onclick={() => removeFromOrder(item.id)} class="text-rose-500 hover:text-rose-700">
                  <X size={14} />
                </button>
              </div>
              <div class="flex items-center gap-3">
                <label class="text-xs text-slate-500">Quantity:</label>
                <input 
                  type="number" 
                  value={item.quantity}
                  oninput={(e) => updateQuantity(item.id, parseInt((e.target as HTMLInputElement).value))}
                  class="w-20 px-2 py-1 bg-white rounded-lg text-sm"
                />
                <span class="text-xs text-slate-400">Current stock: {item.closingStock}</span>
              </div>
              {#if item.supplierName}
                <p class="text-[10px] text-slate-400 mt-2">Supplier: {item.supplierName}</p>
              {/if}
            </div>
          {/each}
        {/if}
      </div>
      
      <div class="p-6 border-t border-slate-100 flex gap-3">
        <button onclick={() => showOrderModal = false} class="flex-1 px-4 py-3 bg-slate-100 rounded-xl font-black text-slate-600">
          Cancel
        </button>
        <button onclick={submitOrder} class="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-black">
          Submit Order
        </button>
      </div>
    </div>
  </div>
{/if}