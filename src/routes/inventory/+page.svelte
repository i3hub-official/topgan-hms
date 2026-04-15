<script lang="ts">
  import { onMount } from 'svelte';
  
  let items: any[] = [];
  let showAddItem = false;
  let showMovement = false;
  let selectedItem: any = null;
  let movementForm = { type: 'sale', quantity: 0, reason: '' };
  let newItem = { name: '', category: 'bar', unit: 'bottle', openingStock: 0 };
  
  onMount(async () => {
    await loadInventory();
  });
  
  async function loadInventory() {
    const res = await fetch('/api/inventory');
    items = await res.json();
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
    await fetch(`/api/inventory/${itemId}/physical-count`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ physicalCount: count })
    });
    await loadInventory();
  }
</script>

<div class="min-h-screen bg-white">
  <div class="bg-crimson text-white px-6 py-4 flex justify-between items-center">
    <div>
      <h1 class="text-2xl font-bold">Bar Inventory</h1>
      <p class="text-sm opacity-90">Bin Card System - Stock Ledger</p>
    </div>
    <button on:click={() => showAddItem = true} class="px-4 py-2 bg-white text-crimson rounded-md font-medium">
      + Add Item
    </button>
  </div>
  
  <div class="p-6">
    <div class="overflow-x-auto">
      <table class="min-w-full bg-white border">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Opening</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Additions</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sales</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Closing</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Physical</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variance</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          {#each items as item (item.id)}
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4">
                <div class="font-medium">{item.itemName}</div>
                <div class="text-xs text-gray-500">{item.category}</div>
              </td>
              <td class="px-6 py-4">{item.openingStock} {item.unit}</td>
              <td class="px-6 py-4 text-green-600">+{item.additions}</td>
              <td class="px-6 py-4 text-red-600">-{item.sales}</td>
              <td class="px-6 py-4 font-medium">{item.closingStock}</td>
              <td class="px-6 py-4">
                <input
                  type="number"
                  placeholder="Count"
                  onchange={(e) => performPhysicalCount(item.id, parseFloat((e.target as HTMLInputElement).value))}
                  class="w-24 px-2 py-1 border rounded text-sm"
                />
              </td>
              <td class="px-6 py-4">
                {#if item.variance !== 0}
                  <span class="text-red-600 font-semibold">{item.variance}</span>
                {:else}
                  <span class="text-green-600">✓</span>
                {/if}
              </td>
              <td class="px-6 py-4">
                <button
                  onclick={() => { selectedItem = item; showMovement = true; }}
                  class="text-crimson hover:text-crimson-dark text-sm"
                >
                  Record Sale
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
  
  <!-- Movement Modal -->
  {#if showMovement}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg max-w-md w-full p-6">
        <h2 class="text-xl font-bold mb-4">{selectedItem?.itemName} - Record Movement</h2>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Type</label>
            <select bind:value={movementForm.type} class="mt-1 block w-full border rounded-md px-3 py-2">
              <option value="sale">Sale</option>
              <option value="addition">Restock</option>
              <option value="adjustment">Adjustment</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">Quantity</label>
            <input bind:value={movementForm.quantity} type="number" step="0.5" class="mt-1 block w-full border rounded-md px-3 py-2" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">Reason/Reference</label>
            <input bind:value={movementForm.reason} type="text" class="mt-1 block w-full border rounded-md px-3 py-2" />
          </div>
          
          <div class="pt-4 flex gap-3">
            <button on:click={recordMovement} class="flex-1 px-4 py-2 bg-crimson text-white rounded-md">Record</button>
            <button on:click={() => showMovement = false} class="flex-1 px-4 py-2 border rounded-md">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>