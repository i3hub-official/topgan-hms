<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { 
    LayoutDashboard, 
    LogOut, 
    TrendingUp, 
    Wallet, 
    AlertCircle, 
    PlayCircle,
    Hotel,
    GlassWater,
    Zap,
    ClipboardList,
    RefreshCw
  } from 'lucide-svelte';
  
  // Using Svelte 5 state runes
  let stats = $state({
    occupancyRate: 0,
    totalRevenue: 0,
    activeFlags: 0,
    pendingAudit: false
  });
  let recentFlags = $state<any[]>([]);
  let loading = $state(true);
  
  onMount(async () => {
    try {
      const res = await fetch('/api/dashboard/stats');
      const data = await res.json();
      stats = data.stats;
      recentFlags = data.flags;
    } catch (e) {
      console.error("Dashboard sync error");
    } finally {
      loading = false;
    }
  });
  
  async function runNightAudit() {
    const res = await fetch('/api/audit/run', { method: 'POST' });
    if (res.ok) {
      // await goto to satisfy ESLint
      await goto('/audit/report');
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/sign-out', { method: 'POST' });
    window.location.href = '/login';
  }
</script>

<div class="min-h-screen bg-white text-slate-900">
  <header class="border-b border-slate-100 px-6 py-4 bg-white sticky top-0 z-20">
    <div class="max-w-7xl mx-auto flex justify-between items-center">
      <div class="flex items-center gap-3">
        <div class="bg-indigo-600 p-2 rounded-lg text-white">
          <LayoutDashboard size={20} />
        </div>
        <div>
          <h1 class="text-lg font-bold leading-none">Owner Dashboard</h1>
          <p class="text-[10px] text-slate-400 uppercase tracking-tighter mt-1">Intelligence Terminal</p>
        </div>
      </div>
      
      <button 
        onclick={handleLogout}
        class="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
      >
        <LogOut size={16} />
        <span>Sign Out</span>
      </button>
    </div>
  </header>
  
  <main class="max-w-7xl mx-auto p-6">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
      <div class="p-5 border border-slate-100 rounded-2xl bg-white shadow-sm">
        <div class="flex items-center justify-between mb-3">
          <span class="p-2 bg-slate-50 rounded-lg text-slate-500"><Hotel size={18} /></span>
          <span class="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded">LIVE</span>
        </div>
        <p class="text-xs font-medium text-slate-500">Occupancy Rate</p>
        <p class="text-2xl font-bold">{stats.occupancyRate}%</p>
      </div>

      <div class="p-5 border border-slate-100 rounded-2xl bg-white shadow-sm">
        <div class="flex items-center justify-between mb-3">
          <span class="p-2 bg-slate-50 rounded-lg text-slate-500"><Wallet size={18} /></span>
        </div>
        <p class="text-xs font-medium text-slate-500">Daily Revenue</p>
        <p class="text-2xl font-bold">₦{stats.totalRevenue.toLocaleString()}</p>
      </div>

      <div class="p-5 border border-slate-100 rounded-2xl bg-white shadow-sm">
        <div class="flex items-center justify-between mb-3">
          <span class="p-2 bg-slate-50 rounded-lg text-slate-500"><AlertCircle size={18} /></span>
        </div>
        <p class="text-xs font-medium text-slate-500">Active Flags</p>
        <p class="text-2xl font-bold {stats.activeFlags > 0 ? 'text-orange-600' : ''}">{stats.activeFlags}</p>
      </div>

      <div class="p-5 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100">
        <div class="flex items-center gap-2 mb-3">
          <RefreshCw size={16} class="animate-spin-slow" />
          <span class="text-[10px] font-bold uppercase">System Operations</span>
        </div>
        <button
          onclick={runNightAudit}
          class="w-full py-2.5 bg-white text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
        >
          <PlayCircle size={16} />
          Run Night Audit
        </button>
      </div>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2">
        <h2 class="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <AlertCircle size={14} /> Critical Alerts
        </h2>

        {#if recentFlags.length === 0}
          <div class="border-2 border-dashed border-slate-100 rounded-2xl p-12 text-center">
            <p class="text-sm text-slate-400 font-medium">No system discrepancies detected today.</p>
          </div>
        {:else}
          <div class="space-y-3">
            {#each recentFlags as flag (flag.timestamp)}
              <div class="flex items-start gap-4 p-4 border border-slate-100 rounded-xl bg-white">
                <div class="p-2 bg-orange-50 text-orange-600 rounded-lg">
                  <AlertCircle size={18} />
                </div>
                <div class="flex-1">
                  <div class="flex justify-between">
                    <p class="text-sm font-bold text-slate-800">{flag.type}</p>
                    <span class="text-[10px] text-slate-400 font-mono">
                      {new Date(flag.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p class="text-sm text-slate-500 mt-1">{flag.message}</p>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <div>
        <h2 class="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Management</h2>
        <div class="flex flex-col gap-2">
          <button 
            onclick={async () => await goto('/rooms')} 
            class="flex items-center gap-4 p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all text-left"
          >
            <span class="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Hotel size={18} /></span>
            <div>
              <p class="text-sm font-bold">Room Register</p>
              <p class="text-[10px] text-slate-400">Front desk & check-ins</p>
            </div>
          </button>

          <button 
            onclick={async () => await goto('/inventory')} 
            class="flex items-center gap-4 p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all text-left"
          >
            <span class="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><GlassWater size={18} /></span>
            <div>
              <p class="text-sm font-bold">Bar Inventory</p>
              <p class="text-[10px] text-slate-400">Stock & Bin card tracking</p>
            </div>
          </button>

          <button 
            onclick={async () => await goto('/power')} 
            class="flex items-center gap-4 p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all text-left"
          >
            <span class="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Zap size={18} /></span>
            <div>
              <p class="text-sm font-bold">Power Log</p>
              <p class="text-[10px] text-slate-400">Fuel & Gen efficiency</p>
            </div>
          </button>

          <button 
            onclick={async () => await goto('/audit/physical')} 
            class="flex items-center gap-4 p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all text-left"
          >
            <span class="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><ClipboardList size={18} /></span>
            <div>
              <p class="text-sm font-bold">Physical Count</p>
              <p class="text-[10px] text-slate-400">Manual verification</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  </main>
</div>

<style>
  :global(body) {
    background-color: #ffffff;
  }
  
  .animate-spin-slow {
    animation: spin 8s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>