<script lang="ts">
  import { goto } from '$app/navigation';
  import { 
    Truck, Plus, Search, Phone, Mail, MapPin, 
    User, Power, Edit, ArrowLeft, X, Check,
    Trash2, Save, FolderPlus
  } from 'lucide-svelte';
  import { defaultSupplierCategories } from '$lib/server/categories';
  
  // Use $props() instead of export let
  let { data, form } = $props();
  
  let suppliers = $derived(data.suppliers);
  let categories = $derived(defaultSupplierCategories);
  let canEdit = $derived(data.canEdit);
  let user = $derived(data.user);
let searchTerm = $state<string>('');
  

  let filteredSuppliers = $derived(
    suppliers.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );
</script>

<div class="p-8 max-w-7xl mx-auto">
  <header class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
    <div>
      <h1 class="text-3xl font-black text-slate-900 tracking-tight">Supply Chain</h1>
      <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Vendor Directory & Procurement</p>
    </div>
    
    <button class="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl shadow-indigo-100 transition-transform active:scale-95">
      <Plus size={18} /> Register Supplier
    </button>
  </header>

  <div class="relative mb-8">
    <Search class="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
<input 
  type="text"
  value={searchTerm}
  oninput={(e) => searchTerm = (e.target as HTMLInputElement).value}
  placeholder="Search vendors..."
  class="w-full pl-14 pr-6 py-5 bg-white border border-slate-100 rounded-[2rem] font-bold text-sm shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
/>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each filteredSuppliers as vendor (vendor._id)}
      <div class="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm hover:shadow-xl hover:shadow-slate-100 transition-all group relative overflow-hidden">
        <div class="flex justify-between items-start mb-6">
          <div class="bg-slate-50 p-4 rounded-2xl text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
            <Truck size={28} />
          </div>
          <span class="px-4 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase rounded-full tracking-widest">
            {vendor.category}
          </span>
        </div>

        <h3 class="text-2xl font-black text-slate-900 mb-2">{vendor.name}</h3>
        
        <div class="space-y-2 mb-8">
          <p class="text-sm font-bold text-slate-500 flex items-center gap-2">
            <User size={14} class="text-slate-300" /> {vendor.contactPerson}
          </p>
          <p class="text-sm font-bold text-slate-400 flex items-center gap-2">
            <MapPin size={14} class="text-slate-300" /> {vendor.address || 'Local Vendor'}
          </p>
        </div>

        <div class="flex gap-3 pt-4 border-t border-slate-50">
          <a 
            href="tel:{vendor.phone}" 
            class="flex-1 flex items-center justify-center gap-2 py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100"
          >
            <Phone size={14} /> Call Vendor
          </a>
          <button class="p-4 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all">
            <Mail size={16} />
          </button>
        </div>
      </div>
    {/each}
  </div>
</div>