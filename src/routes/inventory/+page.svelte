<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    Package, 
    Plus, 
    ArrowUpRight, 
    ArrowDownLeft, 
    RefreshCcw, 
    Search,
    AlertCircle,
    CheckCircle2,
    X
  } from 'lucide-svelte';

  // --- Svelte 5 State Runes ---
  let items = $state<any[]>([]);
  let showAddItem = $state(false);
  let showMovement = $state(false);
  let selectedItem = $state<any>(null);
  let loading = $state(true);

  let movementForm = $state({ type: 'sale', quantity: 0, reason: '' });
  let newItem = $state({ name: '', category: 'bar', unit: 'bottle', openingStock: 0 });

  onMount(async () => {
    await loadInventory();
  });

  async function loadInventory() {
    loading = true;
    try {
      const res = await fetch('/api/inventory');
      items = await res.json();
    } finally {
      loading = false;
    }
  }

  async function addItem() {
    await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem)
    });
    showAddItem = false;
    await loadInventory();
  }

  async function recordMovement() {
    await fetch(`/api/inventory/${selectedItem.id}/movement`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(movementForm)
    });
    showMovement = false;
    await loadInventory();
  }

  async function performPhysicalCount(itemId: number, count: number) {
    if (isNaN(count)) return;
    await fetch(`/api/inventory/${itemId}/physical-count`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ physicalCount: count })
    });
    await loadInventory();
  }
</script>

<div class="min-h-screen bg-slate-50/50">
  <header class="bg-white border-b border-slate-100 px-8 py-6">
    <div class="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <div class="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-100">
          <Package size={24} />
        </div>
        <div>
          <h1 class="text-2xl font-black text-slate-900 tracking-tight">Inventory Ledger</h1>
          <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Bin Card & Stock Control</p>
        </div>
      </div>
      
      <button 
        onclick={() => showAddItem = true} 
        class="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
      >
        <Plus size={18} />
        Add New Item
      </button>
    </div>
  </header>

  <main class="max-w-7xl mx-auto p-8">
    <div class="flex items-center gap-4 mb-6">
      <div class="relative flex-1 max-w-md">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Search bar stock..." 
          class="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
        />
      </div>
    </div>

    <div class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50/50 border-b border-slate-100">
              <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Item Description</th>
              <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Opening</th>
              <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">In</th>
              <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Out</th>
              <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Book Stock</th>
              <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Physical Count</th>
              <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Variance</th>
              <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            {#each items as item (item.id)}
              <tr class="hover:bg-slate-50/50 transition-colors group">
                <td class="px-6 py-4">
                  <p class="font-bold text-slate-800 text-sm">{item.itemName}</p>
                  <p class="text-[10px] font-bold text-slate-400 uppercase">{item.category}</p>
                </td>
                <td class="px-6 py-4 text-center text-sm font-medium text-slate-500">{item.openingStock}</td>
                <td class="px-6 py-4 text-center">
                  <span class="inline-flex items-center text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded-lg">
                    <Plus size={10} class="mr-1" />{item.additions}
                  </span>
                </td>
                <td class="px-6 py-4 text-center">
                  <span class="inline-flex items-center text-rose-600 font-bold text-xs bg-rose-50 px-2 py-1 rounded-lg">
                    -{item.sales}
                  </span>
                </td>
                <td class="px-6 py-4 text-center font-black text-slate-900">{item.closingStock}</td>
                <td class="px-6 py-4 text-center">
                  <input
                    type="number"
                    placeholder="Enter"
                    onchange={(e) => performPhysicalCount(item.id, parseFloat((e.target as HTMLInputElement).value))}
                    class="w-20 px-2 py-1.5 bg-slate-50 border-none rounded-lg text-center text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                  />
                </td>
                <td class="px-6 py-4 text-center">
                  {#if item.variance < 0}
                    <div class="flex items-center justify-center gap-1 text-rose-600 font-black">
                      <AlertCircle size={14} /> {item.variance}
                    </div>
                  {:else if item.variance > 0}
                    <div class="flex items-center justify-center gap-1 text-amber-600 font-black">
                      +{item.variance}
                    </div>
                  {:else}
                    <div class="flex items-center justify-center text-emerald-500">
                      <CheckCircle2 size={16} />
                    </div>
                  {/if}
                </td>
                <td class="px-6 py-4 text-right">
                  <button
                    onclick={() => { selectedItem = item; showMovement = true; }}
                    class="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Record Sale/Restock"
                  >
                    <RefreshCcw size={18} />
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </main>

  {#if showMovement}
    <div class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div class="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 class="text-xl font-black text-slate-900">Stock Movement</h2>
            <p class="text-xs font-bold text-slate-400 uppercase tracking-tight">{selectedItem?.itemName}</p>
          </div>
          <button onclick={() => showMovement = false} class="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        
        <div class="p-8 space-y-5">
          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 uppercase">Movement Type</label>
            <div class="grid grid-cols-2 gap-2">
              <button 
                onclick={() => movementForm.type = 'sale'}
                class="flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold text-sm transition-all {movementForm.type === 'sale' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-500'}"
              >
                <ArrowUpRight size={16} /> Sale
              </button>
              <button 
                onclick={() => movementForm.type = 'addition'}
                class="flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold text-sm transition-all {movementForm.type === 'addition' ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-100 text-slate-500'}"
              >
                <ArrowDownLeft size={16} /> Restock
              </button>
            </div>
          </div>
          
          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 uppercase">Quantity ({selectedItem?.unit})</label>
            <input 
              bind:value={movementForm.quantity} 
              type="number" 
              step="0.5" 
              class="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold" 
            />
          </div>
          
          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 uppercase">Reference / Note</label>
            <input 
              bind:value={movementForm.reason} 
              type="text" 
              placeholder="e.g. Sales for Room 302"
              class="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500" 
            />
          </div>
          
          <button 
            onclick={recordMovement} 
            class="w-full py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl shadow-slate-200 hover:bg-indigo-600 transition-all mt-4"
          >
            Update Ledger
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  :global(body) {
    background-color: #f8fafc;
  }
</style>