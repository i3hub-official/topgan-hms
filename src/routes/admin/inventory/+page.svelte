<script lang="ts">
  import { 
    Package, Search, Filter, Plus, 
    AlertTriangle, TrendingUp, TrendingDown,
    Edit, Trash2, MoreVertical
  } from 'lucide-svelte';
  
  interface InventoryItem {
    id: number;
    name: string;
    category: string;
    quantity: number;
    unit: string;
    minStock: number;
    maxStock: number;
    location: string;
    lastUpdated: string;
  }
  
  interface PageData {
    items?: InventoryItem[];
  }
  
  let { data }: { data: PageData } = $props();
  let items = $derived(data?.items ?? []);
  let searchQuery = $state('');
  
  let filteredItems = $derived(
    items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );
  
  // Stock status helper
  function getStockStatus(quantity: number, minStock: number, maxStock: number) {
    if (quantity <= minStock) return { color: 'text-rose-600 bg-rose-50', label: 'Low Stock', icon: AlertTriangle };
    if (quantity >= maxStock) return { color: 'text-amber-600 bg-amber-50', label: 'Overstock', icon: TrendingUp };
    return { color: 'text-emerald-600 bg-emerald-50', label: 'Optimal', icon: TrendingDown };
  }
</script>

<div class="min-h-screen bg-slate-50/50 p-8">
  <div class="max-w-7xl mx-auto">
    
    <header class="flex items-center justify-between mb-8 flex-wrap gap-4">
      <div>
        <h1 class="text-3xl font-black text-slate-900 tracking-tight">Inventory Management</h1>
        <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
          Stock Control & Supply Chain
        </p>
      </div>
      <button class="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-indigo-200 active:scale-95">
        <Plus size={18} />
        Add Item
      </button>
    </header>

    <!-- Search and Filters -->
    <div class="bg-white rounded-2xl p-4 mb-6 border border-slate-100">
      <div class="flex gap-4 flex-wrap">
        <div class="flex-1 min-w-[200px] relative">
          <Search size={18} class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            bind:value={searchQuery}
            placeholder="Search inventory..." 
            class="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button class="px-5 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-sm font-black text-slate-600 transition-all flex items-center gap-2">
          <Filter size={16} />
          Filter
        </button>
      </div>
    </div>

    <!-- Stats Overview -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div class="bg-white rounded-2xl p-5 border border-slate-100">
        <p class="text-[10px] font-black text-slate-400 uppercase">Total Items</p>
        <p class="text-2xl font-black text-slate-900">{items.length}</p>
      </div>
      <div class="bg-white rounded-2xl p-5 border border-slate-100">
        <p class="text-[10px] font-black text-slate-400 uppercase">Low Stock Items</p>
        <p class="text-2xl font-black text-rose-600">{items.filter(i => i.quantity <= i.minStock).length}</p>
      </div>
      <div class="bg-white rounded-2xl p-5 border border-slate-100">
        <p class="text-[10px] font-black text-slate-400 uppercase">Total Units</p>
        <p class="text-2xl font-black text-indigo-600">{items.reduce((sum, i) => sum + i.quantity, 0)}</p>
      </div>
      <div class="bg-white rounded-2xl p-5 border border-slate-100">
        <p class="text-[10px] font-black text-slate-400 uppercase">Categories</p>
        <p class="text-2xl font-black text-slate-900">{new Set(items.map(i => i.category)).size}</p>
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
              <th class="text-left px-6 py-4 text-xs font-black text-slate-400 uppercase">Quantity</th>
              <th class="text-left px-6 py-4 text-xs font-black text-slate-400 uppercase">Status</th>
              <th class="text-left px-6 py-4 text-xs font-black text-slate-400 uppercase">Location</th>
              <th class="text-left px-6 py-4 text-xs font-black text-slate-400 uppercase">Last Updated</th>
              <th class="text-right px-6 py-4 text-xs font-black text-slate-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#if filteredItems.length === 0}
              <tr>
                <td colspan="7" class="text-center py-20">
                  <Package size={48} class="mx-auto text-slate-100 mb-4" />
                  <p class="font-black text-slate-300 uppercase tracking-widest">No items found</p>
                </td>
              </tr>
            {:else}
              {#each filteredItems as item (item.id)}
                {@const stockStatus = getStockStatus(item.quantity, item.minStock, item.maxStock)}
                <tr class="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                        <Package size={18} class="text-slate-400" />
                      </div>
                      <span class="font-black text-slate-900">{item.name}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <span class="text-sm font-bold text-slate-600">{item.category}</span>
                  </td>
                  <td class="px-6 py-4">
                    <span class="text-sm font-bold text-slate-900">{item.quantity} {item.unit}</span>
                  </td>
                  <td class="px-6 py-4">
                    <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black {stockStatus.color}">
                      <stockStatus.icon size={12} />
                      {stockStatus.label}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <span class="text-sm font-bold text-slate-600">{item.location}</span>
                  </td>
                  <td class="px-6 py-4">
                    <span class="text-xs font-bold text-slate-400">{new Date(item.lastUpdated).toLocaleDateString()}</span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-2">
                      <button class="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <Edit size={16} class="text-slate-400" />
                      </button>
                      <button class="p-2 hover:bg-rose-50 rounded-lg transition-colors">
                        <Trash2 size={16} class="text-rose-400" />
                      </button>
                      <button class="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <MoreVertical size={16} class="text-slate-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            {/if}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>