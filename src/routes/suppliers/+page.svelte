<script lang="ts">
  import { goto } from '$app/navigation';
  import { 
    Truck, Plus, Search, Phone, Mail, MapPin, 
    User, Power, Edit, ArrowLeft, X, Check,
    Trash2, Save
  } from 'lucide-svelte';
  
  let { data, form } = $props();
  
  let suppliers = $derived(data.suppliers || []);
  let categories = $derived(data.categories || []);
  let canEdit = $derived(data.canEdit);
  let user = $derived(data.user);
  
  let showCreateModal = $state(false);
  let showEditModal = $state(false);
  let selectedSupplier = $state(null);
  let searchQuery = $state(''); 
  let selectedCategory = $state(''); 
  
  let filteredSuppliers = $derived(
    suppliers.filter((s: any) => {
      const matchesSearch = s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           s.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || s.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
  );
  
  function goBack() {
    goto('/dashboard');
  }
  
  function openEditModal(supplier: any) {
    selectedSupplier = supplier;
    showEditModal = true;
  }
  
  async function handleCreateSupplier(event: Event) {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    
    const response = await fetch('?/createSupplier', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      showCreateModal = false;
      window.location.reload();
    } else {
      const error = await response.json();
      alert(error.message || 'Failed to create supplier');
    }
  }
  
  async function handleUpdateSupplier(event: Event) {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    formData.append('id', selectedSupplier.id.toString());
    
    const response = await fetch('?/updateSupplier', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      showEditModal = false;
      window.location.reload();
    } else {
      const error = await response.json();
      alert(error.message || 'Failed to update supplier');
    }
  }
  
  async function handleToggleSupplier(id: number, currentStatus: boolean) {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('currentStatus', currentStatus.toString());
    
    const response = await fetch('?/toggleSupplier', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      window.location.reload();
    } else {
      const error = await response.json();
      alert(error.message || 'Failed to update supplier status');
    }
  }
  
  async function handleDeleteSupplier(id: number, name: string) {
    if (confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      const formData = new FormData();
      formData.append('id', id.toString());
      
      const response = await fetch('?/deleteSupplier', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        window.location.reload();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to delete supplier');
      }
    }
  }
  
  function getCategoryIcon(categoryId: string) {
    const cat = categories?.find((c: any) => c.id === categoryId);
    return cat?.icon || '📦';
  }
  
  function getCategoryName(categoryId: string) {
    const cat = categories?.find((c: any) => c.id === categoryId);
    return cat?.name || categoryId;
  }
</script>

<div class="min-h-screen bg-slate-50/50 p-8">
  <div class="max-w-7xl mx-auto">
    
    <!-- Back Button -->
    <button 
      onclick={goBack}
      class="flex items-center gap-2 mb-6 px-4 py-2 text-sm font-black text-slate-600 hover:text-indigo-600 transition-colors"
    >
      <ArrowLeft size={18} />
      Back to Dashboard
    </button>
    
    <header class="flex items-center justify-between mb-8 flex-wrap gap-4">
      <div>
        <div class="flex items-center gap-3">
          <div class="p-2 bg-indigo-100 rounded-xl">
            <Truck size={24} class="text-indigo-600" />
          </div>
          <div>
            <h1 class="text-3xl font-black text-slate-900 tracking-tight">Suppliers</h1>
            <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
              Vendor & Supply Chain Management
            </p>
          </div>
        </div>
      </div>
      {#if canEdit}
        <button 
          onclick={() => showCreateModal = true}
          class="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all"
        >
          <Plus size={18} />
          Add Supplier
        </button>
      {/if}
    </header>

    <!-- Filters -->
    <div class="bg-white rounded-2xl p-4 mb-6 border border-slate-100">
      <div class="flex gap-4 flex-wrap">
        <div class="flex-1 min-w-[200px] relative">
          <Search size={18} class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            bind:value={searchQuery}
            placeholder="Search suppliers..." 
            class="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl text-sm font-bold"
          />
        </div>
        <select 
          bind:value={selectedCategory}
          class="px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold"
        >
          <option value="">All Categories</option>
          {#each categories as cat (cat.id)}
            <option value={cat.id}>{cat.icon} {cat.name}</option>
          {/each}
        </select>
      </div>
    </div>

    <!-- Suppliers Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each filteredSuppliers as supplier (supplier.id)}
        <div class="bg-white rounded-3xl border border-slate-100 overflow-hidden hover:shadow-xl transition-all">
          <div class="p-6">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                  <Truck size={22} class="text-indigo-600" />
                </div>
                <div>
                  <h3 class="font-black text-slate-900">{supplier.name}</h3>
                  <p class="text-xs font-bold text-indigo-600">
                    {getCategoryIcon(supplier.category)} {getCategoryName(supplier.category)}
                  </p>
                </div>
              </div>
              {#if canEdit}
                <div class="flex gap-2">
                  <button
                    onclick={() => openEditModal(supplier)}
                    class="p-2 hover:bg-slate-50 rounded-xl transition-colors"
                    title="Edit Supplier"
                  >
                    <Edit size={16} class="text-slate-400" />
                  </button>
                  <button 
                    onclick={() => handleToggleSupplier(supplier.id, supplier.isActive)}
                    class="p-2 hover:bg-slate-50 rounded-xl transition-colors"
                    title={supplier.isActive ? 'Deactivate' : 'Activate'}
                  >
                    <Power size={16} class={supplier.isActive ? 'text-emerald-600' : 'text-rose-600'} />
                  </button>
                  {#if user?.role === 'owner' || user?.role === 'super_admin'}
                    <button 
                      onclick={() => handleDeleteSupplier(supplier.id, supplier.name)}
                      class="p-2 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Delete Supplier"
                    >
                      <Trash2 size={16} class="text-rose-400" />
                    </button>
                  {/if}
                </div>
              {/if}
            </div>
            
            <div class="space-y-2 mb-4">
              {#if supplier.contactPerson}
                <div class="flex items-center gap-2 text-sm">
                  <User size={14} class="text-slate-400" />
                  <span class="text-slate-600">{supplier.contactPerson}</span>
                </div>
              {/if}
              <div class="flex items-center gap-2 text-sm">
                <Phone size={14} class="text-slate-400" />
                <span class="text-slate-600">{supplier.phone}</span>
              </div>
              {#if supplier.email}
                <div class="flex items-center gap-2 text-sm">
                  <Mail size={14} class="text-slate-400" />
                  <span class="text-slate-600">{supplier.email}</span>
                </div>
              {/if}
              {#if supplier.address}
                <div class="flex items-center gap-2 text-sm">
                  <MapPin size={14} class="text-slate-400" />
                  <span class="text-slate-600">{supplier.address}</span>
                </div>
              {/if}
            </div>
            
            <div class="pt-4 border-t border-slate-50">
              <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black {supplier.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}">
                {supplier.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>

<!-- Create Supplier Modal -->
{#if showCreateModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
    <div class="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto">
      <form onsubmit={handleCreateSupplier}>
        <div class="p-6 border-b border-slate-100">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-black text-slate-900">Add New Supplier</h2>
              <p class="text-sm text-slate-500">Create a new supplier record</p>
            </div>
            <button type="button" onclick={() => showCreateModal = false} class="p-2 hover:bg-slate-100 rounded-xl">
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase mb-1">Supplier Name</label>
            <input type="text" name="name" required class="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold" />
          </div>
          
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase mb-1">Contact Person</label>
            <input type="text" name="contactPerson" class="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold" />
          </div>
          
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase mb-1">Phone</label>
            <input type="tel" name="phone" required class="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold" />
          </div>
          
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase mb-1">Email</label>
            <input type="email" name="email" class="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold" />
          </div>
          
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase mb-1">Category</label>
            <select name="category" class="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold">
              <option value="">Select Category</option>
              {#each categories as cat (cat.id)}
                <option value={cat.id}>{cat.icon} {cat.name}</option>
              {/each}
            </select>
          </div>
          
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase mb-1">Address</label>
            <textarea name="address" rows="2" class="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold"></textarea>
          </div>
        </div>
        
        <div class="p-6 border-t border-slate-100 flex gap-3">
          <button type="button" onclick={() => showCreateModal = false} class="flex-1 px-4 py-3 bg-slate-100 rounded-xl font-black text-slate-600">
            Cancel
          </button>
          <button type="submit" class="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-black">
            Create Supplier
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Edit Supplier Modal -->
{#if showEditModal && selectedSupplier}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
    <div class="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto">
      <form onsubmit={handleUpdateSupplier}>
        <div class="p-6 border-b border-slate-100">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-black text-slate-900">Edit Supplier</h2>
              <p class="text-sm text-slate-500">Update supplier information</p>
            </div>
            <button type="button" onclick={() => showEditModal = false} class="p-2 hover:bg-slate-100 rounded-xl">
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase mb-1">Supplier Name</label>
            <input type="text" name="name" value={selectedSupplier.name} required class="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold" />
          </div>
          
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase mb-1">Contact Person</label>
            <input type="text" name="contactPerson" value={selectedSupplier.contactPerson || ''} class="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold" />
          </div>
          
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase mb-1">Phone</label>
            <input type="tel" name="phone" value={selectedSupplier.phone} required class="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold" />
          </div>
          
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase mb-1">Email</label>
            <input type="email" name="email" value={selectedSupplier.email || ''} class="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold" />
          </div>
          
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase mb-1">Category</label>
            <select name="category" class="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold">
              <option value="">Select Category</option>
              {#each categories as cat (cat.id)}
                <option value={cat.id} selected={cat.id === selectedSupplier.category}>
                  {cat.icon} {cat.name}
                </option>
              {/each}
            </select>
          </div>
          
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase mb-1">Address</label>
            <textarea name="address" rows="2" class="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold">{selectedSupplier.address || ''}</textarea>
          </div>
          
          <div>
            <label class="flex items-center gap-2">
              <input type="checkbox" name="isActive" value="true" checked={selectedSupplier.isActive} />
              <span class="text-sm font-bold text-slate-700">Active</span>
            </label>
          </div>
        </div>
        
        <div class="p-6 border-t border-slate-100 flex gap-3">
          <button type="button" onclick={() => showEditModal = false} class="flex-1 px-4 py-3 bg-slate-100 rounded-xl font-black text-slate-600">
            Cancel
          </button>
          <button type="submit" class="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-black">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}