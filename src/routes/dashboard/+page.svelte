<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  
  let stats = {
    occupancyRate: 0,
    totalRevenue: 0,
    activeFlags: 0,
    pendingAudit: false
  };
  let recentFlags: any[] = [];
  let loading = true;
  
  onMount(async () => {
    const res = await fetch('/api/dashboard/stats');
    const data = await res.json();
    stats = data.stats;
    recentFlags = data.flags;
    loading = false;
  });
  
  async function runNightAudit() {
    const res = await fetch('/api/audit/run', { method: 'POST' });
    if (res.ok) {
      alert('Night audit completed successfully');
      goto('/audit/report');
    }
  }
</script>

<div class="min-h-screen bg-white">
  <!-- Header -->
  <div class="bg-crimson text-white px-6 py-4">
    <h1 class="text-2xl font-bold">Owner Dashboard</h1>
    <p class="text-sm opacity-90">Real-time hotel overview</p>

    <!-- In the header section -->
<div class="bg-crimson text-white px-6 py-4 flex justify-between items-center">
  <div>
    <h1 class="text-2xl font-bold">Owner Dashboard</h1>
    <p class="text-sm opacity-90">Real-time hotel overview</p>
  </div>
  <button 
    on:click={async () => { await fetch('/api/auth/sign-out', { method: 'POST' }); window.location.href = '/login'; }}
    class="px-4 py-2 bg-white text-crimson rounded-md text-sm font-medium hover:bg-gray-100"
  >
    Logout
  </button>
</div>
  </div>
  
  <!-- Stats Grid -->
  <div class="p-6">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div class="bg-gray-50 rounded-lg p-6 border-l-4 border-crimson">
        <p class="text-sm text-gray-600">Occupancy Rate</p>
        <p class="text-3xl font-bold text-gray-900">{stats.occupancyRate}%</p>
      </div>
      <div class="bg-gray-50 rounded-lg p-6 border-l-4 border-crimson">
        <p class="text-sm text-gray-600">Today's Revenue</p>
        <p class="text-3xl font-bold text-gray-900">₦{stats.totalRevenue.toLocaleString()}</p>
      </div>
      <div class="bg-gray-50 rounded-lg p-6 border-l-4 border-crimson">
        <p class="text-sm text-gray-600">Active Flags</p>
        <p class="text-3xl font-bold text-red-600">{stats.activeFlags}</p>
      </div>
      <div class="bg-gray-50 rounded-lg p-6 border-l-4 border-crimson">
        <p class="text-sm text-gray-600">Audit Status</p>
        <button
          on:click={runNightAudit}
          class="mt-2 px-4 py-2 bg-crimson text-white rounded-md text-sm hover:bg-crimson-dark"
        >
          Run Night Audit
        </button>
      </div>
    </div>
    
    <!-- Red Flags Section -->
    <div class="mb-8">
      <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center">
        <span class="w-2 h-2 bg-red-600 rounded-full mr-2"></span>
        Red Flags & Discrepancies
      </h2>
      {#if recentFlags.length === 0}
        <div class="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
          ✓ No active flags - all systems normal
        </div>
      {:else}
        <div class="space-y-3">
          {#each recentFlags as flag}
            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
              <div class="flex justify-between items-start">
                <div>
                  <p class="font-semibold text-red-800">{flag.type}</p>
                  <p class="text-sm text-red-600 mt-1">{flag.message}</p>
                </div>
                <span class="text-xs text-red-500">{new Date(flag.timestamp).toLocaleString()}</span>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
    
    <!-- Quick Actions -->
    <div>
      <h2 class="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button on:click={() => goto('/rooms')} class="p-4 bg-gray-50 rounded-lg text-center hover:bg-gray-100">
          <div class="text-2xl mb-2">🏨</div>
          <div class="text-sm font-medium">Room Register</div>
        </button>
        <button on:click={() => goto('/inventory')} class="p-4 bg-gray-50 rounded-lg text-center hover:bg-gray-100">
          <div class="text-2xl mb-2">🍾</div>
          <div class="text-sm font-medium">Bar Inventory</div>
        </button>
        <button on:click={() => goto('/power')} class="p-4 bg-gray-50 rounded-lg text-center hover:bg-gray-100">
          <div class="text-2xl mb-2">⚡</div>
          <div class="text-sm font-medium">Power Log</div>
        </button>
        <button on:click={() => goto('/audit/physical')} class="p-4 bg-gray-50 rounded-lg text-center hover:bg-gray-100">
          <div class="text-2xl mb-2">📋</div>
          <div class="text-sm font-medium">Physical Count</div>
        </button>
      </div>
    </div>
  </div>
</div>