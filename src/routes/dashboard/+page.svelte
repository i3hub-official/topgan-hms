<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { 
    Hotel, 
    Wallet, 
    ShieldAlert, 
    Zap, 
    GlassWater, 
    ClipboardCheck, 
    Play,
    BellRing,
    LogOut,
    CheckCircle2,
    Users,
    Truck,
    Package,
    Clock,
    AlertTriangle
  } from 'lucide-svelte';
  
  // Get user from page data
  let user = $derived($page.data.user);
  
  // Svelte 5 State Runes
  let stats = $state({
    occupancyRate: 0,
    totalRevenue: 0,
    activeFlags: 0,
    pendingAudit: false,
    totalRooms: 0,
    occupiedRooms: 0,
    vacantRooms: 0,
    maintenanceRooms: 0
  });
  
  let recentFlags = $state<any[]>([]);
  let loading = $state(true);
  let runningAudit = $state(false);
  
  onMount(async () => {
    await loadDashboardData();
  });
  
  async function loadDashboardData() {
    loading = true;
    try {
      const res = await fetch('/api/dashboard/stats');
      if (res.ok) {
        const data = await res.json();
        stats = data.stats;
        recentFlags = data.flags;
      }
    } catch (e) {
      console.error("Failed to load dashboard data", e);
    } finally {
      loading = false;
    }
  }
  
  async function runNightAudit() {
    runningAudit = true;
    try {
      const res = await fetch('/api/audit/run', { method: 'POST' });
      const data = await res.json();
      
      if (res.ok) {
        // Show audit results
        alert(`Audit Complete!\n\nDiscrepancy: ${data.discrepancy} rooms\nFlags: ${data.flags?.length || 0} issues found\n\nCheck audit logs for details.`);
        await loadDashboardData(); // Refresh dashboard
        await goto('/audit/report');
      } else {
        alert(`Audit failed: ${data.error}`);
      }
    } catch (e) {
      console.error("Failed to run audit", e);
      alert("Failed to run audit. Please try again.");
    } finally {
      runningAudit = false;
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/signout', { method: 'POST' });
    window.location.href = '/login';
  }
  
  // Role-based dashboard title
  const getDashboardTitle = () => {
    const role = user?.role;
    switch(role) {
      case 'owner': return 'Owner Dashboard';
      case 'super_admin': return 'Super Admin Dashboard';
      case 'general_manager': return 'General Manager Dashboard';
      case 'front_desk_manager': return 'Front Desk Dashboard';
      case 'store_keeper': return 'Store Keeper Dashboard';
      case 'cleaner': return 'Cleaner Dashboard';
      default: return 'Staff Dashboard';
    }
  };
  
  // Role-based navigation buttons for the management section
  const getManagementButtons = () => {
    const role = user?.role;
    const buttons = [];
    
    // Rooms - everyone can see
    buttons.push({
      label: 'Room Register',
      description: 'Check-ins & Live Status',
      icon: Hotel,
      path: '/rooms',
      color: 'indigo'
    });
    
    // Inventory - store keepers and above
    if (['owner', 'super_admin', 'general_manager', 'store_keeper'].includes(role)) {
      buttons.push({
        label: 'Bar & Store',
        description: 'Stock Control & Bin Cards',
        icon: GlassWater,
        path: '/inventory',
        color: 'amber'
      });
    }
    
    // Suppliers - store keepers and above
    if (['owner', 'super_admin', 'general_manager', 'store_keeper'].includes(role)) {
      buttons.push({
        label: 'Suppliers',
        description: 'Vendor Management',
        icon: Truck,
        path: '/suppliers',
        color: 'emerald'
      });
    }
    
    // Staff Management - managers and above
    if (['owner', 'super_admin', 'general_manager'].includes(role)) {
      buttons.push({
        label: 'Staff Management',
        description: 'Personnel & Roles',
        icon: Users,
        path: '/staff',
        color: 'purple'
      });
    }
    
    // Power Log - managers and above
    if (['owner', 'super_admin', 'general_manager'].includes(role)) {
      buttons.push({
        label: 'Power Log',
        description: 'Fuel Tracking & NEPA',
        icon: Zap,
        path: '/power',
        color: 'orange'
      });
    }
    
    // Time Tracking - cleaners and staff
    if (['cleaner', 'staff'].includes(role)) {
      buttons.push({
        label: 'Time Tracking',
        description: 'Clock In/Out',
        icon: Clock,
        path: '/time-tracking',
        color: 'teal'
      });
    }
    
    // Physical Audit - managers and above
    if (['owner', 'super_admin', 'general_manager'].includes(role)) {
      buttons.push({
        label: 'Physical Audit',
        description: 'Manual Walkthrough Count',
        icon: ClipboardCheck,
        path: '/audit/physical',
        color: 'rose'
      });
    }
    
    return buttons;
  };
</script>

<div class="min-h-screen bg-white text-slate-900 font-sans">
  <header class="border-b border-slate-100 px-8 py-5 flex justify-between items-center bg-white sticky top-0 z-10">
    <div class="flex items-center gap-3">
      <div class="bg-indigo-600 p-2 rounded-lg text-white">
        <ShieldAlert size={20} />
      </div>
      <div>
        <h1 class="text-xl font-bold tracking-tight text-slate-900">{getDashboardTitle()}</h1>
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Topgan Intelligence Terminal</p>
      </div>
    </div>
    
    <div class="flex items-center gap-6">
      <div class="text-right hidden md:block">
        <p class="text-sm font-bold text-slate-700">{user?.name || 'User'}</p>
        <p class="text-[10px] text-slate-400 font-bold uppercase">{user?.role?.replace('_', ' ') || 'Staff'}</p>
        {#if user?.staffId}
          <p class="text-[9px] text-slate-300 font-mono">ID: {user.staffId}</p>
        {/if}
      </div>
      <button 
        onclick={handleLogout}
        class="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
      >
        <LogOut size={16} />
        Sign Out
      </button>
    </div>
  </header>
  
  <main class="max-w-7xl mx-auto p-8">
    {#if loading}
      <div class="flex items-center justify-center h-64">
        <div class="animate-pulse text-center">
          <div class="w-12 h-12 bg-indigo-100 rounded-full mx-auto mb-4"></div>
          <p class="text-slate-400 font-bold">Loading dashboard...</p>
        </div>
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between mb-4">
            <div class="p-2 bg-slate-50 rounded-lg text-slate-400"><Hotel size={20} /></div>
            <span class="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full tracking-tighter">LIVE</span>
          </div>
          <p class="text-xs font-bold text-slate-400 uppercase">Occupancy</p>
          <p class="text-3xl font-black text-slate-900">{stats.occupancyRate}%</p>
          <p class="text-xs text-slate-400 mt-1">{stats.occupiedRooms} / {stats.totalRooms} rooms</p>
        </div>

        <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div class="p-2 bg-slate-50 rounded-lg text-slate-400 w-fit mb-4"><Wallet size={20} /></div>
          <p class="text-xs font-bold text-slate-400 uppercase">Today's Revenue</p>
          <p class="text-3xl font-black text-slate-900">₦{stats.totalRevenue.toLocaleString()}</p>
        </div>

        <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div class="p-2 bg-slate-50 rounded-lg text-slate-400 w-fit mb-4"><BellRing size={20} /></div>
          <p class="text-xs font-bold text-slate-400 uppercase">Security Flags</p>
          <p class="text-3xl font-black {stats.activeFlags > 0 ? 'text-orange-600' : 'text-slate-900'}">
            {stats.activeFlags}
          </p>
        </div>

        {#if ['owner', 'super_admin', 'general_manager'].includes(user?.role)}
          <div class="bg-indigo-600 rounded-2xl p-6 shadow-xl shadow-indigo-100 flex flex-col justify-between group">
            <div class="flex items-center gap-2 text-indigo-100 mb-2">
              <Play size={14} fill="currentColor" />
              <p class="text-[10px] font-bold uppercase tracking-wider">Audit Protocol</p>
            </div>
            <button
              onclick={runNightAudit}
              disabled={runningAudit}
              class="w-full py-3 bg-white text-indigo-600 rounded-xl text-sm font-black hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {runningAudit ? 'Running Audit...' : 'Run Night Audit'}
            </button>
          </div>
        {:else if user?.role === 'cleaner'}
          <div class="bg-teal-600 rounded-2xl p-6 shadow-xl shadow-teal-100 flex flex-col justify-between group">
            <div class="flex items-center gap-2 text-teal-100 mb-2">
              <Clock size={14} fill="currentColor" />
              <p class="text-[10px] font-bold uppercase tracking-wider">Time Tracking</p>
            </div>
            <button
              onclick={async () => await goto('/time-tracking')}
              class="w-full py-3 bg-white text-teal-600 rounded-xl text-sm font-black hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm"
            >
              Clock In/Out
            </button>
          </div>
        {:else if user?.role === 'store_keeper'}
          <div class="bg-amber-600 rounded-2xl p-6 shadow-xl shadow-amber-100 flex flex-col justify-between group">
            <div class="flex items-center gap-2 text-amber-100 mb-2">
              <Package size={14} fill="currentColor" />
              <p class="text-[10px] font-bold uppercase tracking-wider">Stock Alert</p>
            </div>
            <button
              onclick={async () => await goto('/inventory')}
              class="w-full py-3 bg-white text-amber-600 rounded-xl text-sm font-black hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm"
            >
              Check Inventory
            </button>
          </div>
        {/if}
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div class="lg:col-span-2">
          <div class="flex items-center gap-3 mb-6">
            <ShieldAlert size={18} class="text-slate-400" />
            <h2 class="text-lg font-black text-slate-800 tracking-tight">System Discrepancies</h2>
          </div>

          {#if recentFlags.length === 0}
            <div class="bg-slate-50 border-2 border-dashed border-slate-100 rounded-3xl p-12 text-center">
              <div class="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <CheckCircle2 class="text-emerald-500" size={24} />
              </div>
              <p class="text-sm font-bold text-slate-500">No flags detected. Revenue is secure.</p>
            </div>
          {:else}
            <div class="space-y-3">
              {#each recentFlags as flag (flag.timestamp)}
                <div class="group bg-white border border-slate-100 rounded-2xl p-5 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-500/5 transition-all">
                  <div class="flex justify-between items-start">
                    <div class="flex gap-4">
                      <div class="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center shrink-0">
                        <AlertTriangle size={20} />
                      </div>
                      <div class="flex-1">
                        <p class="font-black text-slate-800 text-sm tracking-tight">{flag.type}</p>
                        <p class="text-sm text-slate-500 mt-1 leading-snug">{flag.message}</p>
                      </div>
                    </div>
                    <span class="text-[10px] font-black text-slate-300 font-mono whitespace-nowrap ml-4">
                      {new Date(flag.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <div>
          <h2 class="text-lg font-black text-slate-800 mb-6 tracking-tight">Management</h2>
          <div class="grid grid-cols-1 gap-3">
            {#each getManagementButtons() as button (button.label)}
              <button 
                onclick={async () => await goto(button.path)} 
                class="group flex items-center p-4 bg-white border border-slate-100 rounded-2xl hover:bg-{button.color}-600 transition-all text-left w-full"
              >
                <span class="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-{button.color}-600 group-hover:bg-{button.color}-500 group-hover:text-white transition-colors shrink-0">
                  <button.icon size={20} />
                </span>
                <div class="ml-4 flex-1">
                  <p class="text-sm font-black text-slate-800 group-hover:text-white transition-colors">{button.label}</p>
                  <p class="text-[10px] font-bold text-slate-400 group-hover:text-{button.color}-100 transition-colors">{button.description}</p>
                </div>
              </button>
            {/each}
          </div>
        </div>
      </div>
    {/if}
  </main>
</div>