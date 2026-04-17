<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { 
    Settings, Shield, Database, Users, Hotel, 
    Truck, Package, Activity, Clock, AlertTriangle,
    Save, RefreshCw, Download, Trash2, Plus,
    Edit, X, Check, ChevronRight, Server,
    Lock, UserCheck, Bell, Globe, HardDrive,
    Eye, EyeOff, ChevronDown, ChevronUp, Filter,
    Calendar, User as UserIcon, Briefcase, DollarSign, Search
  } from 'lucide-svelte';
  
  // Import permissions from shared config
  import { availablePermissions, getPermissionsByCategory } from '$lib/config/permissions';
  
  let { data } = $props();
  
  let stats = $derived(data.stats);
  let recentAudits = $derived(data.recentAudits);
  let roles = $derived(data.roles);
  let user = $derived(data.user);
  
  let activeTab = $state('overview');
  let showCreateRoleModal = $state(false);
  let showEditRoleModal = $state(false);
  let selectedRole = $state(null);
  let selectedPermissions = $state<string[]>([]);
  let showConfirmClearLogs = $state(false);
  let auditFilter = $state('all');
  let auditSearch = $state('');
  
  // Group permissions by category
  let permissionsByCategory = $derived(getPermissionsByCategory());
  
  // Filtered audits
  let filteredAudits = $derived(
    recentAudits.filter(audit => {
      if (auditFilter !== 'all' && audit.action !== auditFilter) return false;
      if (auditSearch && !audit.description.toLowerCase().includes(auditSearch.toLowerCase()) && 
          !audit.userName?.toLowerCase().includes(auditSearch.toLowerCase())) return false;
      return true;
    })
  );
  
  function openEditRole(role: any) {
    selectedRole = role;
    selectedPermissions = [...(role.permissionsArray || [])];
    showEditRoleModal = true;
  }
  
  function togglePermission(permId: string) {
    if (selectedPermissions.includes(permId)) {
      selectedPermissions = selectedPermissions.filter(p => p !== permId);
    } else {
      selectedPermissions = [...selectedPermissions, permId];
    }
  }
  
  function selectAllCategory(category: string, perms: any[]) {
    const categoryPermIds = perms.map(p => p.id);
    const allSelected = categoryPermIds.every(id => selectedPermissions.includes(id));
    
    if (allSelected) {
      selectedPermissions = selectedPermissions.filter(p => !categoryPermIds.includes(p));
    } else {
      const newPerms = [...selectedPermissions];
      categoryPermIds.forEach(id => {
        if (!newPerms.includes(id)) newPerms.push(id);
      });
      selectedPermissions = newPerms;
    }
  }
  
  function isCategoryFullySelected(category: string, perms: any[]) {
    return perms.every(p => selectedPermissions.includes(p.id));
  }
  
  function isCategoryPartiallySelected(category: string, perms: any[]) {
    const selected = perms.filter(p => selectedPermissions.includes(p.id)).length;
    return selected > 0 && selected < perms.length;
  }
  
  function getCategoryCheckboxClasses(category: string, perms: any[]) {
    const fullySelected = isCategoryFullySelected(category, perms);
    const partiallySelected = isCategoryPartiallySelected(category, perms);
    
    if (fullySelected) {
      return 'bg-indigo-600 border-indigo-600';
    } else if (partiallySelected) {
      return 'bg-indigo-200 border-indigo-300';
    } else {
      return 'border-slate-300';
    }
  }
  
  function getCategoryCheckboxIcon(category: string, perms: any[]) {
    const fullySelected = isCategoryFullySelected(category, perms);
    const partiallySelected = isCategoryPartiallySelected(category, perms);
    
    if (fullySelected) {
      return 'check';
    } else if (partiallySelected) {
      return 'minus';
    } else {
      return 'none';
    }
  }
  
  async function handleUpdateRole(event: Event) {
    event.preventDefault();
    const formData = new FormData();
    formData.append('roleId', selectedRole.id);
    formData.append('level', (document.getElementById('roleLevel') as HTMLInputElement).value);
    selectedPermissions.forEach(p => formData.append('permissions', p));
    
    const response = await fetch('?/updateRolePermissions', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      showEditRoleModal = false;
      location.reload();
    } else {
      alert('Failed to update role');
    }
  }
  
  async function handleCreateRole(event: Event) {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    
    const response = await fetch('?/createRole', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      showCreateRoleModal = false;
      location.reload();
    } else {
      alert('Failed to create role');
    }
  }
  
  async function handleBackup() {
    if (confirm('Start database backup? This may take a few moments.')) {
      const response = await fetch('?/backupDatabase', { method: 'POST' });
      if (response.ok) {
        alert('Backup initiated successfully');
      } else {
        alert('Backup failed');
      }
    }
  }
  
  async function handleClearLogs() {
    const response = await fetch('?/clearAuditLogs', { method: 'POST' });
    if (response.ok) {
      showConfirmClearLogs = false;
      alert('Audit logs cleared (kept last 30 days)');
      location.reload();
    } else {
      alert('Failed to clear logs');
    }
  }
  
  function getActionIcon(action: string) {
    if (action.includes('CREATE')) return Plus;
    if (action.includes('UPDATE')) return Edit;
    if (action.includes('DELETE')) return Trash2;
    if (action.includes('BACKUP')) return Download;
    if (action.includes('CLEAR')) return RefreshCw;
    return Activity;
  }
  
  function getActionColor(action: string) {
    if (action.includes('CREATE')) return 'border-emerald-200 bg-emerald-50';
    if (action.includes('UPDATE')) return 'border-blue-200 bg-blue-50';
    if (action.includes('DELETE')) return 'border-rose-200 bg-rose-50';
    if (action.includes('BACKUP')) return 'border-purple-200 bg-purple-50';
    if (action.includes('CLEAR')) return 'border-amber-200 bg-amber-50';
    return 'border-slate-200 bg-slate-50';
  }
</script>

<div class="min-h-screen bg-slate-50/50 p-8">
  <div class="max-w-7xl mx-auto">
    
    <header class="mb-8">
      <h1 class="text-3xl font-black text-slate-900 tracking-tight">Admin Settings</h1>
      <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
        System Configuration & Management
      </p>
      <div class="mt-2 flex items-center gap-2">
        <div class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
        <p class="text-xs font-bold text-slate-500">Owner Access • Full Control</p>
      </div>
    </header>

    <!-- Tabs -->
    <div class="flex gap-2 mb-8 border-b border-slate-200 overflow-x-auto">
      <button
        onclick={() => activeTab = 'overview'}
        class="px-6 py-3 font-black text-sm transition-all whitespace-nowrap {activeTab === 'overview' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}"
      >
        <div class="flex items-center gap-2">
          <Activity size={16} />
          Overview
        </div>
      </button>
      <button
        onclick={() => activeTab = 'audit'}
        class="px-6 py-3 font-black text-sm transition-all whitespace-nowrap {activeTab === 'audit' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}"
      >
        <div class="flex items-center gap-2">
          <Clock size={16} />
          Audit Logs
        </div>
      </button>
      <button
        onclick={() => activeTab = 'roles'}
        class="px-6 py-3 font-black text-sm transition-all whitespace-nowrap {activeTab === 'roles' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}"
      >
        <div class="flex items-center gap-2">
          <Shield size={16} />
          Roles & Permissions
        </div>
      </button>
      <button
        onclick={() => activeTab = 'system'}
        class="px-6 py-3 font-black text-sm transition-all whitespace-nowrap {activeTab === 'system' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}"
      >
        <div class="flex items-center gap-2">
          <Server size={16} />
          System
        </div>
      </button>
    </div>

    <!-- Overview Tab -->
    {#if activeTab === 'overview'}
      <div class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div class="bg-white rounded-2xl p-5 border border-slate-100">
            <div class="p-2 bg-indigo-50 rounded-lg w-fit mb-3">
              <Users size={18} class="text-indigo-600" />
            </div>
            <p class="text-[10px] font-black text-slate-400 uppercase">Total Users</p>
            <p class="text-2xl font-black text-slate-900">{stats.totalUsers}</p>
          </div>
          
          <div class="bg-white rounded-2xl p-5 border border-slate-100">
            <div class="p-2 bg-emerald-50 rounded-lg w-fit mb-3">
              <UserCheck size={18} class="text-emerald-600" />
            </div>
            <p class="text-[10px] font-black text-slate-400 uppercase">Active Users</p>
            <p class="text-2xl font-black text-emerald-600">{stats.activeUsers}</p>
          </div>
          
          <div class="bg-white rounded-2xl p-5 border border-slate-100">
            <div class="p-2 bg-amber-50 rounded-lg w-fit mb-3">
              <Hotel size={18} class="text-amber-600" />
            </div>
            <p class="text-[10px] font-black text-slate-400 uppercase">Total Rooms</p>
            <p class="text-2xl font-black text-slate-900">{stats.totalRooms}</p>
          </div>
          
          <div class="bg-white rounded-2xl p-5 border border-slate-100">
            <div class="p-2 bg-purple-50 rounded-lg w-fit mb-3">
              <Truck size={18} class="text-purple-600" />
            </div>
            <p class="text-[10px] font-black text-slate-400 uppercase">Suppliers</p>
            <p class="text-2xl font-black text-slate-900">{stats.totalSuppliers}</p>
          </div>
          
          <div class="bg-white rounded-2xl p-5 border border-slate-100">
            <div class="p-2 bg-rose-50 rounded-lg w-fit mb-3">
              <Package size={18} class="text-rose-600" />
            </div>
            <p class="text-[10px] font-black text-slate-400 uppercase">Inventory Items</p>
            <p class="text-2xl font-black text-slate-900">{stats.totalInventory}</p>
          </div>
        </div>
        
        <!-- Quick Actions -->
        <div class="bg-white rounded-3xl border border-slate-100 p-6">
          <h2 class="text-lg font-black text-slate-800 mb-4">Quick Actions</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onclick={handleBackup}
              class="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl hover:bg-indigo-50 transition-all group"
            >
              <div class="p-2 bg-white rounded-xl">
                <Download size={20} class="text-indigo-600" />
              </div>
              <div class="text-left">
                <p class="font-black text-slate-800 group-hover:text-indigo-600">Backup Database</p>
                <p class="text-[10px] text-slate-400">Export system data</p>
              </div>
            </button>
            
            <button
              onclick={() => showConfirmClearLogs = true}
              class="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl hover:bg-rose-50 transition-all group"
            >
              <div class="p-2 bg-white rounded-xl">
                <Trash2 size={20} class="text-rose-600" />
              </div>
              <div class="text-left">
                <p class="font-black text-slate-800 group-hover:text-rose-600">Clear Audit Logs</p>
                <p class="text-[10px] text-slate-400">Remove old logs (keep 30 days)</p>
              </div>
            </button>
            
            <button
              onclick={() => activeTab = 'roles'}
              class="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl hover:bg-indigo-50 transition-all group"
            >
              <div class="p-2 bg-white rounded-xl">
                <Shield size={20} class="text-indigo-600" />
              </div>
              <div class="text-left">
                <p class="font-black text-slate-800 group-hover:text-indigo-600">Manage Roles</p>
                <p class="text-[10px] text-slate-400">Configure permissions</p>
              </div>
            </button>
          </div>
        </div>
      </div>
      
    {:else if activeTab === 'audit'}
      <!-- Audit Logs Tab -->
      <div class="space-y-4">
        <div class="bg-white rounded-2xl p-4 border border-slate-100">
          <div class="flex gap-4 flex-wrap">
            <div class="flex-1 min-w-[200px] relative">
              <Search size={18} class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                bind:value={auditSearch}
                placeholder="Search by user or description..." 
                class="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl text-sm"
              />
            </div>
            <select bind:value={auditFilter} class="px-4 py-2 bg-slate-50 rounded-xl text-sm">
              <option value="all">All Actions</option>
              <option value="CREATE_STAFF">Create Staff</option>
              <option value="UPDATE_STAFF">Update Staff</option>
              <option value="DELETE_STAFF">Delete Staff</option>
              <option value="CREATE_ROOM">Create Room</option>
              <option value="UPDATE_ROOM">Update Room</option>
              <option value="DELETE_ROOM">Delete Room</option>
              <option value="DATABASE_BACKUP">Database Backup</option>
              <option value="CLEAR_AUDIT_LOGS">Clear Logs</option>
            </select>
          </div>
        </div>
        
        <div class="space-y-3">
          {#each filteredAudits as audit (audit.id)}
            {@const ActionIcon = getActionIcon(audit.action)}
            <div class="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all">
              <div class="flex flex-col md:flex-row gap-4">
                <div class="flex-shrink-0">
                  <div class="w-12 h-12 rounded-xl {getActionColor(audit.action)} flex items-center justify-center">
                    <ActionIcon size={20} class="text-slate-600" />
                  </div>
                </div>
                
                <div class="flex-1">
                  <div class="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                    <div>
                      <p class="font-black text-slate-900">{audit.description}</p>
                      <div class="flex items-center gap-3 mt-1">
                        <div class="flex items-center gap-1 text-xs text-slate-500">
                          <UserIcon size={12} />
                          <span class="font-medium">{audit.userName || 'System'}</span>
                          <span class="text-slate-300">•</span>
                          <span class="capitalize text-slate-400">{audit.userRole?.replace(/_/g, ' ')}</span>
                        </div>
                        <div class="flex items-center gap-1 text-xs text-slate-400">
                          <Calendar size={12} />
                          <span>{audit.date}</span>
                          <span class="text-slate-300">•</span>
                          <Clock size={12} />
                          <span>{audit.time}</span>
                        </div>
                      </div>
                    </div>
                    <span class="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                      {audit.action}
                    </span>
                  </div>
                  
                  {#if audit.changes}
                    <div class="mt-2 p-3 bg-slate-50 rounded-xl">
                      <p class="text-xs text-slate-600">
                        <span class="font-bold">Changes:</span> {audit.changes}
                      </p>
                    </div>
                  {/if}
                </div>
              </div>
            </div>
          {:else}
            <div class="bg-white rounded-3xl border-2 border-dashed border-slate-100 p-12 text-center">
              <Activity size={48} class="mx-auto text-slate-200 mb-4" />
              <p class="font-black text-slate-400 uppercase tracking-widest">No audit logs found</p>
            </div>
          {/each}
        </div>
      </div>
      
    {:else if activeTab === 'roles'}
      <div>
        <div class="flex justify-end mb-6">
          <button
            onclick={() => showCreateRoleModal = true}
            class="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-black"
          >
            <Plus size={16} />
            Create Role
          </button>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          {#each roles as role (role.id)}
            <div class="bg-white rounded-3xl border border-slate-100 p-6 hover:shadow-lg transition-all">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <h3 class="text-xl font-black text-slate-900 capitalize">{role.roleName.replace(/_/g, ' ')}</h3>
                  <p class="text-xs text-slate-500">Level {role.level}</p>
                </div>
                <button
                  onclick={() => openEditRole(role)}
                  class="p-2 hover:bg-indigo-50 rounded-xl transition-colors"
                >
                  <Edit size={18} class="text-indigo-600" />
                </button>
              </div>
              
              <div class="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {#each role.permissionsArray as perm (perm)}
                  <span class="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">
                    {perm}
                  </span>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      </div>
      
    {:else if activeTab === 'system'}
      <div class="space-y-6">
        <div class="bg-white rounded-3xl border border-slate-100 p-6">
          <h2 class="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
            <Server size={18} />
            System Information
          </h2>
          
          <div class="space-y-3">
            <div class="flex justify-between py-2 border-b border-slate-50">
              <span class="text-sm font-bold text-slate-500">Version</span>
              <span class="text-sm font-black text-slate-800">TOPGAN HMS v1.0.0</span>
            </div>
            <div class="flex justify-between py-2 border-b border-slate-50">
              <span class="text-sm font-bold text-slate-500">Environment</span>
              <span class="text-sm font-black text-slate-800">Production</span>
            </div>
            <div class="flex justify-between py-2 border-b border-slate-50">
              <span class="text-sm font-bold text-slate-500">Database</span>
              <span class="text-sm font-black text-slate-800">SQLite</span>
            </div>
            <div class="flex justify-between py-2 border-b border-slate-50">
              <span class="text-sm font-bold text-slate-500">Authentication</span>
              <span class="text-sm font-black text-slate-800">Better Auth</span>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-3xl border border-slate-100 p-6">
          <h2 class="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
            <HardDrive size={18} />
            Database Maintenance
          </h2>
          
          <div class="space-y-4">
            <button
              onclick={handleBackup}
              class="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-indigo-50 transition-all"
            >
              <div class="flex items-center gap-3">
                <Download size={18} class="text-indigo-600" />
                <span class="font-black text-slate-700">Backup Database</span>
              </div>
              <ChevronRight size={16} class="text-slate-400" />
            </button>
            
            <button
              onclick={() => showConfirmClearLogs = true}
              class="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-rose-50 transition-all"
            >
              <div class="flex items-center gap-3">
                <Trash2 size={18} class="text-rose-600" />
                <span class="font-black text-slate-700">Clear Old Audit Logs</span>
              </div>
              <ChevronRight size={16} class="text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- Edit Role Modal -->
{#if showEditRoleModal && selectedRole}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
    <div class="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <form onsubmit={handleUpdateRole}>
        <div class="p-6 border-b border-slate-100 sticky top-0 bg-white">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-black text-slate-900">Edit Role Permissions</h2>
              <p class="text-sm text-slate-500 capitalize">{selectedRole.roleName.replace(/_/g, ' ')}</p>
            </div>
            <button type="button" onclick={() => showEditRoleModal = false} class="p-2 hover:bg-slate-100 rounded-xl">
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div class="p-6 space-y-6">
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase mb-2">Role Level (1-100)</label>
            <input type="number" id="roleLevel" name="level" value={selectedRole.level} class="w-32 px-4 py-2 bg-slate-50 rounded-xl" />
            <p class="text-[10px] text-slate-400 mt-1">Higher level = more access</p>
          </div>
          
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase mb-3">Permissions</label>
            <div class="space-y-4">
              {#each Object.entries(permissionsByCategory) as [category, perms] (category)}
                {@const checkboxClasses = getCategoryCheckboxClasses(category, perms)}
                {@const iconType = getCategoryCheckboxIcon(category, perms)}
                <div class="border border-slate-100 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    class="flex items-center justify-between p-3 bg-slate-50 cursor-pointer w-full text-left hover:bg-slate-100 transition-colors"
                    onclick={() => selectAllCategory(category, perms)}
                  >
                    <div class="flex items-center gap-2">
                      <div class="w-4 h-4 rounded border-2 flex items-center justify-center {checkboxClasses}">
                        {#if iconType === 'check'}
                          <Check size={10} class="text-white" />
                        {:else if iconType === 'minus'}
                          <div class="w-2 h-2 bg-indigo-600 rounded"></div>
                        {/if}
                      </div>
                      <span class="font-black text-slate-800">{category}</span>
                    </div>
                    <span class="text-xs text-slate-400">{perms.filter(p => selectedPermissions.includes(p.id)).length}/{perms.length}</span>
                  </div>
                  
                  <div class="p-3 grid grid-cols-2 gap-2">
                    {#each perms as perm (perm.id)}
                      <label class="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded-lg">
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(perm.id)}
                          onchange={() => togglePermission(perm.id)}
                          class="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span class="text-sm text-slate-700">{perm.label}</span>
                      </label>
                    {/each}
                  </div>
               
              {/each}
            </div>
          </div>
        </div>
        
        <div class="p-6 border-t border-slate-100 flex gap-3 sticky bottom-0 bg-white">
          <button type="button" onclick={() => showEditRoleModal = false} class="flex-1 px-4 py-3 bg-slate-100 rounded-xl font-black text-slate-600">
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

<!-- Create Role Modal -->
{#if showCreateRoleModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
    <div class="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <form onsubmit={handleCreateRole}>
        <div class="p-6 border-b border-slate-100 sticky top-0 bg-white">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-black text-slate-900">Create New Role</h2>
              <p class="text-sm text-slate-500">Define a new staff role with permissions</p>
            </div>
            <button type="button" onclick={() => showCreateRoleModal = false} class="p-2 hover:bg-slate-100 rounded-xl">
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div class="p-6 space-y-6">
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase mb-1">Role Name</label>
            <input type="text" name="roleName" required class="w-full px-4 py-3 bg-slate-50 rounded-xl" />
          </div>
          
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase mb-1">Level (1-100)</label>
            <input type="number" name="level" required class="w-full px-4 py-3 bg-slate-50 rounded-xl" />
          </div>
          
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase mb-3">Permissions</label>
            <div class="space-y-4">
              {#each Object.entries(permissionsByCategory) as [category, perms] (category)}
                <div class="border border-slate-100 rounded-xl overflow-hidden">
                  <div class="p-3 bg-slate-50 font-black text-slate-800">{category}</div>
                  <div class="p-3 grid grid-cols-2 gap-2">
                    {#each perms as perm (perm.id)}
                      <label class="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded-lg">
                        <input type="checkbox" name="permissions" value={perm.id} class="w-4 h-4 rounded" />
                        <span class="text-sm text-slate-700">{perm.label}</span>
                      </label>
                    {/each}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
        
        <div class="p-6 border-t border-slate-100 flex gap-3 sticky bottom-0 bg-white">
          <button type="button" onclick={() => showCreateRoleModal = false} class="flex-1 px-4 py-3 bg-slate-100 rounded-xl font-black text-slate-600">
            Cancel
          </button>
          <button type="submit" class="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-black">
            Create Role
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Confirm Clear Logs Modal -->
{#if showConfirmClearLogs}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
    <div class="bg-white rounded-3xl max-w-md w-full">
      <div class="p-6 border-b border-slate-100">
        <div class="flex items-center gap-3 text-rose-600">
          <AlertTriangle size={24} />
          <h2 class="text-2xl font-black">Clear Audit Logs?</h2>
        </div>
        <p class="text-sm text-slate-500 mt-2">This will remove all logs older than 30 days. This action cannot be undone.</p>
      </div>
      
      <div class="p-6 flex gap-3">
        <button onclick={() => showConfirmClearLogs = false} class="flex-1 px-4 py-3 bg-slate-100 rounded-xl font-black text-slate-600">
          Cancel
        </button>
        <button onclick={handleClearLogs} class="flex-1 px-4 py-3 bg-rose-600 text-white rounded-xl font-black">
          Clear Logs
        </button>
      </div>
    </div>
  </div>
{/if}