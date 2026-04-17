<script lang="ts">
  import { 
    Users, Plus, Search, Edit, Power, 
    Eye, MoreVertical, Mail, Phone, 
    UserCheck, UserX, Calendar, DollarSign,
    MapPin, Banknote, FileText, Trash2
  } from 'lucide-svelte';
  
  export let data;
  
  let staff = $state(data.staff);
  let stats = $state(data.stats);
  let showCreateModal = $state(false);
  let showDetailsModal = $state(false);
  let selectedStaff = $state(null);
  let searchQuery = $state('');
  
  let filteredStaff = $derived(
    staff.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.staffId?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );
  
  async function createStaff(formData: FormData) {
    const response = await fetch('?/createStaff', {
      method: 'POST',
      body: formData
    });
    if (response.ok) {
      showCreateModal = false;
      window.location.reload();
    }
  }
  
  async function toggleStaffStatus(userId: string, currentStatus: boolean) {
    const action = currentStatus ? 'deactivateStaff' : 'activateStaff';
    const formData = new FormData();
    formData.append('userId', userId);
    
    const response = await fetch(`?/${action}`, {
      method: 'POST',
      body: formData
    });
    if (response.ok) {
      window.location.reload();
    }
  }
</script>

<div class="min-h-screen bg-slate-50/50 p-8">
  <div class="max-w-7xl mx-auto">
    
    <header class="flex items-center justify-between mb-8 flex-wrap gap-4">
      <div>
        <h1 class="text-3xl font-black text-slate-900 tracking-tight">Staff Management</h1>
        <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
          Personnel & Role Management
        </p>
      </div>
      <button 
        onclick={() => showCreateModal = true}
        class="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-indigo-200 active:scale-95"
      >
        <Plus size={18} />
        Add Staff
      </button>
    </header>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div class="bg-white rounded-2xl p-5 border border-slate-100">
        <p class="text-[10px] font-black text-slate-400 uppercase">Total Staff</p>
        <p class="text-2xl font-black text-slate-900">{stats.total}</p>
      </div>
      <div class="bg-white rounded-2xl p-5 border border-slate-100">
        <p class="text-[10px] font-black text-slate-400 uppercase">Active</p>
        <p class="text-2xl font-black text-emerald-600">{stats.active}</p>
      </div>
      <div class="bg-white rounded-2xl p-5 border border-slate-100">
        <p class="text-[10px] font-black text-slate-400 uppercase">Inactive</p>
        <p class="text-2xl font-black text-rose-600">{stats.inactive}</p>
      </div>
    </div>

    <!-- Search -->
    <div class="bg-white rounded-2xl p-4 mb-6 border border-slate-100">
      <div class="relative">
        <Search size={18} class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input 
          type="text" 
          bind:value={searchQuery}
          placeholder="Search by name, email, or staff ID..." 
          class="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
    </div>

    <!-- Staff Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each filteredStaff as staff (staff.id)}
        <div class="bg-white rounded-3xl border border-slate-100 overflow-hidden hover:shadow-xl transition-all group">
          <div class="p-6">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-3">
                <div class="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl">
                  {staff.name.charAt(0)}
                </div>
                <div>
                  <h3 class="font-black text-slate-900">{staff.name}</h3>
                  <p class="text-xs font-bold text-slate-400 capitalize">{staff.role?.replace('_', ' ')}</p>
                  <p class="text-xs font-bold text-indigo-600">{staff.staffId}</p>
                </div>
              </div>
              <div class="relative">
                <button class="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                  <MoreVertical size={18} class="text-slate-400" />
                </button>
              </div>
            </div>
            
            <div class="space-y-2 mb-4">
              <div class="flex items-center gap-2 text-sm">
                <Mail size={14} class="text-slate-400" />
                <span class="text-slate-600">{staff.email}</span>
              </div>
              {#if staff.phone}
                <div class="flex items-center gap-2 text-sm">
                  <Phone size={14} class="text-slate-400" />
                  <span class="text-slate-600">{staff.phone}</span>
                </div>
              {/if}
              {#if staff.department}
                <div class="flex items-center gap-2 text-sm">
                  <FileText size={14} class="text-slate-400" />
                  <span class="text-slate-600">{staff.department}</span>
                </div>
              {/if}
            </div>
            
            <div class="flex items-center justify-between pt-4 border-t border-slate-50">
              <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black {staff.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}">
                {#if staff.isActive}
                  <UserCheck size={12} />
                  Active
                {:else}
                  <UserX size={12} />
                  Inactive
                {/if}
              </span>
              <div class="flex gap-2">
                <button 
                  onclick={() => toggleStaffStatus(staff.id, staff.isActive)}
                  class="p-2 {staff.isActive ? 'hover:bg-rose-50 text-rose-600' : 'hover:bg-emerald-50 text-emerald-600'} rounded-xl transition-colors"
                >
                  <Power size={16} />
                </button>
                <button class="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                  <Edit size={16} class="text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>

<!-- Create Staff Modal -->
{#if showCreateModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
    <div class="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto">
      <form method="POST" action="?/createStaff" onsubmit={async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        await createStaff(formData);
      }}>
        <div class="p-6 border-b border-slate-100">
          <h2 class="text-2xl font-black text-slate-900">Add New Staff</h2>
          <p class="text-sm text-slate-500">Create a new staff account</p>
        </div>
        
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase mb-1">Full Name</label>
            <input type="text" name="name" required class="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold" />
          </div>
          
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase mb-1">Email</label>
            <input type="email" name="email" required class="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold" />
          </div>
          
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase mb-1">Staff ID</label>
            <input type="text" name="staffId" class="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold" />
          </div>
          
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase mb-1">Role</label>
            <select name="role" required class="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold">
              <option value="front_desk_manager">Front Desk Manager</option>
              <option value="store_keeper">Store Keeper / Bar Tender / Cook</option>
              <option value="cleaner">Cleaner</option>
              <option value="staff">Staff</option>
            </select>
          </div>
          
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase mb-1">Phone</label>
            <input type="tel" name="phone" class="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold" />
          </div>
          
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase mb-1">Department</label>
            <input type="text" name="department" class="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold" />
          </div>
          
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase mb-1">Password</label>
            <input type="password" name="password" required class="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold" />
          </div>
        </div>
        
        <div class="p-6 border-t border-slate-100 flex gap-3">
          <button type="button" onclick={() => showCreateModal = false} class="flex-1 px-4 py-3 bg-slate-100 rounded-xl font-black text-slate-600">
            Cancel
          </button>
          <button type="submit" class="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-black">
            Create Staff
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}