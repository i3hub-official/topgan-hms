<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { 
    Users, Plus, Search, Edit, Power, 
    Eye, Mail, Phone, UserCheck, UserX,
    Calendar, DollarSign, MapPin, Banknote,
    FileText, Trash2, X, Check, ChevronLeft,
    ChevronRight, Building, CreditCard, User,
    Shield, Briefcase, Key, AlertCircle, Crown, Lock
  } from 'lucide-svelte';
  
  // Use $props() instead of export let
  let { data } = $props();
  
  let staff = $derived(data.staff);
  let stats = $derived(data.stats);
  let roles = $derived(data.roles);
  let pagination = $derived(data.pagination);
  let searchQuery = $derived(data.search);
  let permissions = $derived(data.permissions);
  let currentUser = $derived(data.currentUser);
  let roleHierarchy = $derived(data.roleHierarchy);
  
  
  let showCreateModal = $state(false);
  let showEditModal = $state(false);
  let showBankModal = $state(false);
  let showResetPasswordModal = $state(false);
  let selectedStaff = $state(null);
  let currentPage = $state(pagination.page);
  let searchInput = $state(searchQuery);
  
  let searchTimeout: any;
  
  // Helper to check if bank details are locked
  function isBankDetailsLocked(staffMember: any) {
    return staffMember?.hasBankDetails && !permissions.canModifyBankDetails;
  }
  
  function handleSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    searchInput = target.value;
    
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      goto(`/staff?page=1&search=${encodeURIComponent(searchInput)}`);
    }, 500);
  }
  
  function changePage(page: number) {
    if (page < 1 || page > pagination.pages) return;
    goto(`/staff?page=${page}&search=${encodeURIComponent(searchInput)}`);
  }
  
  async function createStaff(event: Event) {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    
    const response = await fetch('?/createStaff', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      showCreateModal = false;
      location.reload();
    } else {
      const error = await response.json();
      alert(error.message || 'Failed to create staff');
    }
  }
  
  async function updateStaff(event: Event) {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    formData.append('userId', selectedStaff.id);
    
    const response = await fetch('?/updateStaff', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      showEditModal = false;
      location.reload();
    } else {
      const error = await response.json();
      alert(error.message || 'Failed to update staff');
    }
  }
  
  async function updateBankDetails(event: Event) {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    formData.append('userId', selectedStaff.id);
    
    const response = await fetch('?/updateBankDetails', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      showBankModal = false;
      location.reload();
    } else {
      const error = await response.json();
      alert(error.message || 'Failed to update bank details');
    }
  }
  
  async function resetPassword(event: Event) {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    formData.append('userId', selectedStaff.id);
    
    const response = await fetch('?/resetPassword', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      showResetPasswordModal = false;
      alert('Password reset successfully');
      location.reload();
    } else {
      const error = await response.json();
      alert(error.message || 'Failed to reset password');
    }
  }
  
  async function toggleStaffStatus(userId: string, currentStatus: boolean) {
    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('currentStatus', currentStatus.toString());
    
    const response = await fetch('?/toggleStaffStatus', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      location.reload();
    } else {
      const error = await response.json();
      alert(error.message || 'Failed to update staff status');
    }
  }
  
  async function deleteStaff(userId: string, name: string) {
    if (confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      const formData = new FormData();
      formData.append('userId', userId);
      
      const response = await fetch('?/deleteStaff', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        location.reload();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to delete staff');
      }
    }
  }
  
  function getRoleBadgeColor(role: string) {
    const colors: Record<string, string> = {
      owner: 'bg-purple-100 text-purple-700',
      super_admin: 'bg-red-100 text-red-700',
      general_manager: 'bg-blue-100 text-blue-700',
      front_desk_manager: 'bg-emerald-100 text-emerald-700',
      store_keeper: 'bg-amber-100 text-amber-700',
      store_keeper_bar: 'bg-orange-100 text-orange-700',
      store_keeper_kitchen: 'bg-lime-100 text-lime-700',
      store_keeper_store: 'bg-yellow-100 text-yellow-700',
      cleaner: 'bg-teal-100 text-teal-700',
      staff: 'bg-slate-100 text-slate-700'
    };
    return colors[role] || 'bg-slate-100 text-slate-700';
  }
  
  function getRoleLabel(role: string) {
    const labels: Record<string, string> = {
      owner: 'Owner',
      super_admin: 'Super Admin',
      general_manager: 'General Manager',
      front_desk_manager: 'Front Desk',
      store_keeper: 'Store Keeper (Full)',
      store_keeper_bar: 'Store Keeper (Bar)',
      store_keeper_kitchen: 'Store Keeper (Kitchen)',
      store_keeper_store: 'Store Keeper (Store)',
      cleaner: 'Cleaner',
      staff: 'Staff'
    };
    return labels[role] || role;
  }
  
  function getRoleLevelBadge(role: string) {
    const level = roleHierarchy[role] || 0;
    if (level >= 90) return 'bg-purple-100 text-purple-700';
    if (level >= 80) return 'bg-blue-100 text-blue-700';
    if (level >= 70) return 'bg-emerald-100 text-emerald-700';
    if (level >= 60) return 'bg-amber-100 text-amber-700';
    return 'bg-slate-100 text-slate-700';
  }
  
  function isCurrentUser(staffMember: any) {
    return staffMember.id === currentUser?.id;
  }
  
  function canEditStaff(staffMember: any) {
    if ((staffMember.role === 'owner' || staffMember.role === 'super_admin') && 
        currentUser?.role !== 'owner' && currentUser?.role !== 'super_admin') {
      return false;
    }
    return permissions.canModifyRole;
  }
</script>

<div class="min-h-screen bg-slate-50/50 p-8">
  <div class="max-w-7xl mx-auto">
    
    <header class="flex items-center justify-between mb-8 flex-wrap gap-4">
      <div>
        <h1 class="text-3xl font-black text-slate-900 tracking-tight">Staff Management</h1>
        <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
          Personnel, Roles & Bank Details
        </p>
      </div>
      <button 
        onclick={() => showCreateModal = true}
        class="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-indigo-200"
      >
        <Plus size={18} />
        Add Staff
      </button>
    </header>

    <!-- Stats Overview -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div class="bg-white rounded-2xl p-5 border border-slate-100">
        <div class="p-2 bg-indigo-50 rounded-lg w-fit mb-3">
          <Users size={18} class="text-indigo-600" />
        </div>
        <p class="text-[10px] font-black text-slate-400 uppercase">Total Staff</p>
        <p class="text-2xl font-black text-slate-900">{stats.total}</p>
      </div>
      
      <div class="bg-white rounded-2xl p-5 border border-slate-100">
        <div class="p-2 bg-emerald-50 rounded-lg w-fit mb-3">
          <UserCheck size={18} class="text-emerald-600" />
        </div>
        <p class="text-[10px] font-black text-slate-400 uppercase">Active</p>
        <p class="text-2xl font-black text-emerald-600">{stats.active}</p>
      </div>
      
      <div class="bg-white rounded-2xl p-5 border border-slate-100">
        <div class="p-2 bg-rose-50 rounded-lg w-fit mb-3">
          <UserX size={18} class="text-rose-600" />
        </div>
        <p class="text-[10px] font-black text-slate-400 uppercase">Inactive</p>
        <p class="text-2xl font-black text-rose-600">{stats.inactive}</p>
      </div>
      
      <div class="bg-white rounded-2xl p-5 border border-slate-100">
        <div class="p-2 bg-amber-50 rounded-lg w-fit mb-3">
          <Shield size={18} class="text-amber-600" />
        </div>
        <p class="text-[10px] font-black text-slate-400 uppercase">Managers</p>
        <p class="text-2xl font-black text-slate-900">{stats.managers}</p>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="bg-white rounded-2xl p-4 mb-6 border border-slate-100">
      <div class="relative">
        <Search size={18} class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input 
          type="text" 
          value={searchInput}
          oninput={handleSearchInput}
          placeholder="Search by name, email, or staff ID..." 
          class="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
    </div>

    <!-- Staff Table -->
    <div class="bg-white rounded-3xl border border-slate-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-50 border-b border-slate-100">
            <tr>
              <th class="text-left px-6 py-4 text-xs font-black text-slate-400 uppercase">Staff</th>
              <th class="text-left px-6 py-4 text-xs font-black text-slate-400 uppercase">Contact</th>
              <th class="text-left px-6 py-4 text-xs font-black text-slate-400 uppercase">Role</th>
              <th class="text-left px-6 py-4 text-xs font-black text-slate-400 uppercase">Level</th>
              <th class="text-left px-6 py-4 text-xs font-black text-slate-400 uppercase">Status</th>
              <th class="text-left px-6 py-4 text-xs font-black text-slate-400 uppercase">Bank Details</th>
              <th class="text-right px-6 py-4 text-xs font-black text-slate-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#if staff.length === 0}
              <tr>
                <td colspan="7" class="text-center py-20">
                  <Users size={48} class="mx-auto text-slate-200 mb-4" />
                  <p class="font-black text-slate-400 uppercase tracking-widest">No staff found</p>
                </td>
              </tr>
            {:else}
              {#each staff as staffMember (staffMember.id)}
                <tr class="border-b border-slate-50 transition-colors {isCurrentUser(staffMember) ? 'bg-indigo-50/30 hover:bg-indigo-50/50' : 'hover:bg-slate-50/50'}">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black">
                        {staffMember.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div class="flex items-center gap-2">
                          <p class="font-black text-slate-900">{staffMember.name}</p>
                          {#if isCurrentUser(staffMember)}
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-lg text-[9px] font-black">
                              <Crown size={10} />
                              You
                            </span>
                          {/if}
                        </div>
                        <p class="text-xs font-mono text-slate-400">{staffMember.staffId || 'No ID'}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="space-y-1">
                      <div class="flex items-center gap-1 text-sm">
                        <Mail size={12} class="text-slate-400" />
                        <span class="text-slate-600">{staffMember.email}</span>
                      </div>
                      {#if staffMember.phone}
                        <div class="flex items-center gap-1 text-sm">
                          <Phone size={12} class="text-slate-400" />
                          <span class="text-slate-600">{staffMember.phone}</span>
                        </div>
                      {/if}
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black {getRoleBadgeColor(staffMember.role)}">
                      <Briefcase size={10} />
                      {getRoleLabel(staffMember.role)}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black {getRoleLevelBadge(staffMember.role)}">
                      Level {staffMember.roleLevel}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <button
                      onclick={() => toggleStaffStatus(staffMember.id, staffMember.isActive)}
                      class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black transition-all
                        {staffMember.isActive ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-rose-100 text-rose-700 hover:bg-rose-200'}"
                    >
                      {#if staffMember.isActive}
                        <Check size={10} />
                        Active
                      {:else}
                        <X size={10} />
                        Inactive
                      {/if}
                    </button>
                  </td>
                  <td class="px-6 py-4">
                    {#if staffMember.details?.bankName}
                      <div class="space-y-1">
                        <p class="text-xs font-bold text-slate-700">{staffMember.details.bankName}</p>
                        <p class="text-[10px] font-mono text-slate-500">{staffMember.details.accountNumber}</p>
                      </div>
                      {#if !permissions.canModifyBankDetails}
                        <p class="text-[9px] text-amber-600 mt-1 flex items-center gap-1">
                          <Lock size={8} /> Locked
                        </p>
                      {/if}
                    {:else}
                      <button
                        onclick={() => {
                          selectedStaff = staffMember;
                          showBankModal = true;
                        }}
                        class="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                      >
                        Add Details
                      </button>
                    {/if}
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-2">
                      {#if canEditStaff(staffMember) && !isCurrentUser(staffMember)}
                        <button
                          onclick={() => {
                            selectedStaff = staffMember;
                            showEditModal = true;
                          }}
                          class="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Staff"
                        >
                          <Edit size={16} class="text-slate-400" />
                        </button>
                      {/if}
                      
                      <button
                        onclick={() => {
                          selectedStaff = staffMember;
                          showBankModal = true;
                        }}
                        class="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        title={staffMember.hasBankDetails && !permissions.canModifyBankDetails ? 'Bank Details (Locked - Only Owners/Super Admins can modify)' : 'Bank Details'}
                      >
                        <Banknote size={16} class="text-slate-400" />
                      </button>
                      
                      {#if permissions.canResetPassword && !isCurrentUser(staffMember)}
                        <button
                          onclick={() => {
                            selectedStaff = staffMember;
                            showResetPasswordModal = true;
                          }}
                          class="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Reset Password"
                        >
                          <Key size={16} class="text-slate-400" />
                        </button>
                      {/if}
                      
                      {#if permissions.canDeleteStaff && staffMember.role !== 'owner' && !isCurrentUser(staffMember)}
                        <button
                          onclick={() => deleteStaff(staffMember.id, staffMember.name)}
                          class="p-2 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Staff"
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
  </div>
</div>

<!-- Create Staff Modal -->
{#if showCreateModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
    <div class="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto">
      <form onsubmit={createStaff}>
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
              {#each roles as role}
                <option value={role.value}>{role.label}</option>
              {/each}
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

<!-- Edit Staff Modal -->
{#if showEditModal && selectedStaff}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
    <div class="bg-white rounded-3xl max-w-md w-full">
      <form onsubmit={updateStaff}>
        <div class="p-6 border-b border-slate-100">
          <h2 class="text-2xl font-black text-slate-900">Edit Staff</h2>
          <p class="text-sm text-slate-500">Update staff information</p>
        </div>
        
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase mb-1">Full Name</label>
            <input type="text" name="name" value={selectedStaff.name} required class="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold" />
          </div>
          
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase mb-1">Role</label>
            <select name="role" class="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold">
              {#each roles as role}
                <option value={role.value} selected={role.value === selectedStaff.role}>
                  {role.label}
                </option>
              {/each}
            </select>
          </div>
          
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase mb-1">Phone</label>
            <input type="tel" name="phone" value={selectedStaff.phone || ''} class="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold" />
          </div>
          
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase mb-1">Department</label>
            <input type="text" name="department" value={selectedStaff.department || ''} class="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold" />
          </div>
          
          <div>
            <label class="flex items-center gap-2">
              <input type="checkbox" name="isActive" value="true" checked={selectedStaff.isActive} />
              <span class="text-sm font-bold text-slate-700">Active</span>
            </label>
          </div>
        </div>
        
        <div class="p-6 border-t border-slate-100 flex gap-3">
          <button type="button" onclick={() => showEditModal = false} class="flex-1 px-4 py-3 bg-slate-100 rounded-xl font-black text-slate-600">
            Cancel
          </button>
          <button type="submit" class="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-black">
            Update Staff
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Bank Details Modal -->
{#if showBankModal && selectedStaff}
  {@const isLocked = isBankDetailsLocked(selectedStaff)}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
    <div class="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto">
      <form onsubmit={updateBankDetails}>
        <div class="p-6 border-b border-slate-100">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-black text-slate-900">Bank & Personal Details</h2>
              <p class="text-sm text-slate-500">{selectedStaff.name}</p>
            </div>
            {#if isLocked}
              <div class="flex items-center gap-1 px-2 py-1 bg-amber-100 rounded-lg text-[10px] font-black text-amber-700">
                <Lock size={10} />
                Read Only
              </div>
            {/if}
          </div>
        </div>
        
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase mb-1">Address</label>
            <textarea name="address" rows="2" class="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold" disabled={isLocked}>{selectedStaff.details?.address || ''}</textarea>
          </div>
          
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase mb-1">Next of Kin Name</label>
            <input type="text" name="nextOfKinName" value={selectedStaff.details?.nextOfKinName || ''} disabled={isLocked} class="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold" />
          </div>
          
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase mb-1">Next of Kin Phone</label>
            <input type="tel" name="nextOfKinPhone" value={selectedStaff.details?.nextOfKinPhone || ''} disabled={isLocked} class="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold" />
          </div>
          
          <div class="border-t border-slate-100 pt-4">
            <p class="text-sm font-black text-slate-700 mb-3">Bank Information</p>
            
            <div class="space-y-3">
              <div>
                <label class="block text-xs font-black text-slate-400 uppercase mb-1">Bank Name</label>
                <input type="text" name="bankName" value={selectedStaff.details?.bankName || ''} disabled={isLocked} class="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold" />
              </div>
              
              <div>
                <label class="block text-xs font-black text-slate-400 uppercase mb-1">Account Number</label>
                <input type="text" name="accountNumber" value={selectedStaff.details?.accountNumber || ''} disabled={isLocked} class="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold" />
              </div>
              
              <div>
                <label class="block text-xs font-black text-slate-400 uppercase mb-1">Account Name</label>
                <input type="text" name="accountName" value={selectedStaff.details?.accountName || ''} disabled={isLocked} class="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold" />
              </div>
              
              <div>
                <label class="block text-xs font-black text-slate-400 uppercase mb-1">Salary (₦)</label>
                <input type="number" name="salary" value={selectedStaff.details?.salary || ''} disabled={isLocked} class="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold" />
              </div>
            </div>
          </div>
        </div>
        
        <div class="p-6 border-t border-slate-100 flex gap-3">
          <button type="button" onclick={() => showBankModal = false} class="flex-1 px-4 py-3 bg-slate-100 rounded-xl font-black text-slate-600">
            Cancel
          </button>
          <button type="submit" class="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-black" disabled={isLocked}>
            Save Details
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Reset Password Modal -->
{#if showResetPasswordModal && selectedStaff}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
    <div class="bg-white rounded-3xl max-w-md w-full">
      <form onsubmit={resetPassword}>
        <div class="p-6 border-b border-slate-100">
          <h2 class="text-2xl font-black text-slate-900">Reset Password</h2>
          <p class="text-sm text-slate-500">For {selectedStaff.name}</p>
        </div>
        
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase mb-1">New Password</label>
            <input type="password" name="newPassword" required class="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold" />
          </div>
        </div>
        
        <div class="p-6 border-t border-slate-100 flex gap-3">
          <button type="button" onclick={() => showResetPasswordModal = false} class="flex-1 px-4 py-3 bg-slate-100 rounded-xl font-black text-slate-600">
            Cancel
          </button>
          <button type="submit" class="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-black">
            Reset Password
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}