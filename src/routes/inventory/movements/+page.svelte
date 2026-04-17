<script lang="ts">
  import { 
    ArrowUpCircle, 
    ArrowDownCircle, 
    Filter, 
    Calendar, 
    Package, 
    MoreHorizontal 
  } from 'lucide-svelte';
  
  let movements = $state<any[]>([]); // Fetch from /api/inventory/movements
</script>

<div class="p-8 max-w-7xl mx-auto">
  <div class="flex items-end justify-between mb-10">
    <div>
      <h1 class="text-3xl font-black text-slate-900 tracking-tight">Stock Ledger</h1>
      <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Transaction History & Wastage Tracking</p>
    </div>
    
    <div class="flex gap-2 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
      <button class="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest">All</button>
      <button class="px-4 py-2 text-slate-400 hover:text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest">Inflow</button>
      <button class="px-4 py-2 text-slate-400 hover:text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest">Outflow</button>
    </div>
  </div>

  <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
    <table class="w-full text-left border-collapse">
      <thead>
        <tr class="bg-slate-50/50">
          <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Time</th>
          <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Item</th>
          <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Type</th>
          <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Quantity</th>
          <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reason / Note</th>
          <th class="px-8 py-5"></th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-50">
        {#each movements as move}
          <tr class="hover:bg-slate-50/50 transition-colors group">
            <td class="px-8 py-5">
              <div class="flex items-center gap-3">
                <Calendar size={14} class="text-slate-300" />
                <div>
                  <p class="text-sm font-bold text-slate-900">{new Date(move.createdAt).toLocaleDateString()}</p>
                  <p class="text-[10px] text-slate-400 font-bold uppercase">{new Date(move.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
              </div>
            </td>
            <td class="px-8 py-5">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Package size={14} />
                </div>
                <span class="text-sm font-black text-slate-700">{move.itemName}</span>
              </div>
            </td>
            <td class="px-8 py-5 text-center">
              {#if move.type === 'in'}
                <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-tighter">
                  <ArrowUpCircle size={12} /> Addition
                </span>
              {:else}
                <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-tighter">
                  <ArrowDownCircle size={12} /> Sale/Usage
                </span>
              {/if}
            </td>
            <td class="px-8 py-5 text-right font-black text-slate-900">
              {move.type === 'in' ? '+' : '-'}{move.quantity}
            </td>
            <td class="px-8 py-5">
              <p class="text-xs font-bold text-slate-500 italic">"{move.reason || 'Regular Stock Update'}"</p>
            </td>
            <td class="px-8 py-5 text-right">
              <button class="text-slate-300 hover:text-slate-900 transition-colors">
                <MoreHorizontal size={18} />
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
    
    {#if movements.length === 0}
      <div class="p-20 text-center">
        <div class="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-200">
          <Filter size={32} />
        </div>
        <p class="text-sm font-black text-slate-300 uppercase tracking-widest">No movements tracked in this period</p>
      </div>
    {/if}
  </div>
</div>