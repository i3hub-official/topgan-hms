<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
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
    CheckCircle2
  } from 'lucide-svelte';
  
  // Svelte 5 State Runes
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
      console.error("Failed to load dashboard data");
    } finally {
      loading = false;
    }
  });
  
  async function runNightAudit() {
    const res = await fetch('/api/audit/run', { method: 'POST' });
    if (res.ok) {
      await goto('/audit/report');
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/sign-out', { method: 'POST' });
    window.location.href = '/login';
  }
</script>

<div class="min-h-screen bg-white text-slate-900 font-sans">
  <header class="border-b border-slate-100 px-8 py-5 flex justify-between items-center bg-white sticky top-0 z-10">
    <div class="flex items-center gap-3">
      <div class="bg-indigo-600 p-2 rounded-lg text-white">
        <ShieldAlert size={20} />
      </div>
      <div>
        <h1 class="text-xl font-bold tracking-tight text-slate-900">Owner Dashboard</h1>
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Topgan Intelligence Terminal</p>
      </div>
    </div>
    
    <div class="flex items-center gap-6">
      <div class="text-right hidden md:block">
        <p class="text-sm font-bold text-slate-700">Admin User</p>
        <p class="text-[10px] text-slate-400 font-bold uppercase">System Owner</p>
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
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
      <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between mb-4">
          <div class="p-2 bg-slate-50 rounded-lg text-slate-400"><Hotel size={20} /></div>
          <span class="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full tracking-tighter">LIVE</span>
        </div>
        <p class="text-xs font-bold text-slate-400 uppercase">Occupancy</p>
        <p class="text-3xl font-black text-slate-900">{stats.occupancyRate}%</p>
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

      <div class="bg-indigo-600 rounded-2xl p-6 shadow-xl shadow-indigo-100 flex flex-col justify-between group">
        <div class="flex items-center gap-2 text-indigo-100 mb-2">
          <Play size={14} fill="currentColor" />
          <p class="text-[10px] font-bold uppercase tracking-wider">Audit Protocol</p>
        </div>
        <button
          onclick={runNightAudit}
          class="w-full py-3 bg-white text-indigo-600 rounded-xl text-sm font-black hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm"
        >
          Run Night Audit
        </button>
      </div>
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
                      <ShieldAlert size={20} />
                    </div>
                    <div>
                      <p class="font-black text-slate-800 text-sm tracking-tight">{flag.type}</p>
                      <p class="text-sm text-slate-500 mt-1 leading-snug">{flag.message}</p>
                    </div>
                  </div>
                  <span class="text-[10px] font-black text-slate-300 font-mono">
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
          <button 
            onclick={async () => await goto('/rooms')} 
            class="group flex items-center p-4 bg-white border border-slate-100 rounded-2xl hover:bg-indigo-600 transition-all text-left"
          >
            <span class="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
              <Hotel size={20} />
            </span>
            <div class="ml-4">
              <p class="text-sm font-black text-slate-800 group-hover:text-white transition-colors">Room Register</p>
              <p class="text-[10px] font-bold text-slate-400 group-hover:text-indigo-100 transition-colors">Check-ins & Live Status</p>
            </div>
          </button>

          <button 
            onclick={async () => await goto('/inventory')} 
            class="group flex items-center p-4 bg-white border border-slate-100 rounded-2xl hover:bg-indigo-600 transition-all text-left"
          >
            <span class="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
              <GlassWater size={20} />
            </span>
            <div class="ml-4">
              <p class="text-sm font-black text-slate-800 group-hover:text-white transition-colors">Bar & Store</p>
              <p class="text-[10px] font-bold text-slate-400 group-hover:text-indigo-100 transition-colors">Stock Control & Bin Cards</p>
            </div>
          </button>

          <button 
            onclick={async () => await goto('/power')} 
            class="group flex items-center p-4 bg-white border border-slate-100 rounded-2xl hover:bg-indigo-600 transition-all text-left"
          >
            <span class="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
              <Zap size={20} />
            </span>
            <div class="ml-4">
              <p class="text-sm font-black text-slate-800 group-hover:text-white transition-colors">Power Log</p>
              <p class="text-[10px] font-bold text-slate-400 group-hover:text-indigo-100 transition-colors">Fuel Tracking & NEPA</p>
            </div>
          </button>

          <button 
            onclick={async () => await goto('/audit/physical')} 
            class="group flex items-center p-4 bg-white border border-slate-100 rounded-2xl hover:bg-indigo-600 transition-all text-left"
          >
            <span class="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
              <ClipboardCheck size={20} />
            </span>
            <div class="ml-4">
              <p class="text-sm font-black text-slate-800 group-hover:text-white transition-colors">Physical Audit</p>
              <p class="text-[10px] font-bold text-slate-400 group-hover:text-indigo-100 transition-colors">Manual Walkthrough Count</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  </main>
</div>