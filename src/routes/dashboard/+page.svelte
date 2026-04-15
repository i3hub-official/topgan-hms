<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  
  let loading = true;
  let stats = {
    totalRooms: 0,
    occupiedRooms: 0,
    vacantRooms: 0,
    dirtyRooms: 0,
    maintenanceRooms: 0,
    occupancyRate: 0,
    todayRevenue: 0,
    weekRevenue: 0,
    monthRevenue: 0,
    pendingAudits: 0,
    lowStockItems: 0,
    activeGenerator: null,
    recentTransactions: [],
    recentAudits: [],
    recentInventoryActivity: []
  };
  
  let selectedPeriod = 'today';
  let showRevenueChart = true;
  
  onMount(async () => {
    await fetchDashboardData();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  });
  
  async function fetchDashboardData() {
    try {
      const response = await fetch(`/api/dashboard/stats?period=${selectedPeriod}`);
      if (response.ok) {
        stats = await response.json();
        loading = false;
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      loading = false;
    }
  }
  
  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  }
  
  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-NG', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  function getStatusColor(status: string) {
    const colors = {
      vacant: 'bg-green-100 text-green-800',
      occupied: 'bg-red-100 text-red-800',
      dirty: 'bg-yellow-100 text-yellow-800',
      maintenance: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100';
  }
  
  function getStockColor(level: number) {
    if (level <= 5) return 'text-red-600';
    if (level <= 10) return 'text-yellow-600';
    return 'text-green-600';
  }
</script>

<svelte:head>
  <title>Dashboard | TOPGAN HMS</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <!-- Header -->
  <div class="bg-white shadow-sm sticky top-0 z-10">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p class="text-sm text-gray-600">Welcome back! Here's what's happening with your hotel today.</p>
        </div>
        <div class="flex gap-3">
          <button
            on:click={() => goto('/audit')}
            class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            🔍 Run Night Audit
          </button>
          <button
            on:click={() => fetchDashboardData()}
            class="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
          >
            ↻ Refresh
          </button>
        </div>
      </div>
    </div>
  </div>

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {#if loading}
      <div class="flex items-center justify-center h-64">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p class="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    {:else}
      <!-- Key Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
          <div class="flex items-center justify-between mb-2">
            <span class="text-gray-500 text-sm">Occupancy Rate</span>
            <span class="text-2xl">🏨</span>
          </div>
          <div class="text-3xl font-bold text-gray-900">{stats.occupancyRate}%</div>
          <div class="mt-2 text-sm text-gray-600">
            {stats.occupiedRooms} / {stats.totalRooms} rooms occupied
          </div>
          <div class="mt-3 w-full bg-gray-200 rounded-full h-2">
            <div class="bg-blue-600 rounded-full h-2 transition-all" style="width: {stats.occupancyRate}%"></div>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
          <div class="flex items-center justify-between mb-2">
            <span class="text-gray-500 text-sm">Today's Revenue</span>
            <span class="text-2xl">💰</span>
          </div>
          <div class="text-3xl font-bold text-green-600">{formatCurrency(stats.todayRevenue)}</div>
          <div class="mt-2 text-sm text-gray-600">
            This week: {formatCurrency(stats.weekRevenue)}
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
          <div class="flex items-center justify-between mb-2">
            <span class="text-gray-500 text-sm">Low Stock Alerts</span>
            <span class="text-2xl">⚠️</span>
          </div>
          <div class="text-3xl font-bold text-yellow-600">{stats.lowStockItems}</div>
          <div class="mt-2 text-sm text-gray-600">
            Items need reordering
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
          <div class="flex items-center justify-between mb-2">
            <span class="text-gray-500 text-sm">Pending Audits</span>
            <span class="text-2xl">🔍</span>
          </div>
          <div class="text-3xl font-bold text-purple-600">{stats.pendingAudits}</div>
          <div class="mt-2 text-sm text-gray-600">
            Run audit to check discrepancies
          </div>
        </div>
      </div>

      <!-- Quick Actions & Charts Row -->
      <div class="grid lg:grid-cols-3 gap-6 mb-8">
        <!-- Quick Actions -->
        <div class="bg-white rounded-xl shadow-sm p-6">
          <h3 class="text-lg font-semibold mb-4">Quick Actions</h3>
          <div class="space-y-3">
            <button
              on:click={() => goto('/audit')}
              class="w-full text-left px-4 py-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition flex items-center gap-3"
            >
              <span class="text-2xl">🔍</span>
              <div>
                <div class="font-semibold">Run Night Audit</div>
                <div class="text-sm text-gray-600">Check for discrepancies</div>
              </div>
            </button>
            
            <button
              on:click={() => goto('/rooms')}
              class="w-full text-left px-4 py-3 bg-green-50 rounded-lg hover:bg-green-100 transition flex items-center gap-3"
            >
              <span class="text-2xl">🏨</span>
              <div>
                <div class="font-semibold">New Check-in</div>
                <div class="text-sm text-gray-600">Register a guest</div>
              </div>
            </button>
            
            <button
              on:click={() => goto('/inventory')}
              class="w-full text-left px-4 py-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition flex items-center gap-3"
            >
              <span class="text-2xl">📦</span>
              <div>
                <div class="font-semibold">Update Inventory</div>
                <div class="text-sm text-gray-600">Record stock movement</div>
              </div>
            </button>
            
            <button
              on:click={() => goto('/power')}
              class="w-full text-left px-4 py-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition flex items-center gap-3"
            >
              <span class="text-2xl">⚡</span>
              <div>
                <div class="font-semibold">Log Generator</div>
                <div class="text-sm text-gray-600">Record power usage</div>
              </div>
            </button>
          </div>
        </div>
        
        <!-- Room Status Distribution -->
        <div class="bg-white rounded-xl shadow-sm p-6">
          <h3 class="text-lg font-semibold mb-4">Room Status</h3>
          <div class="space-y-3">
            <div>
              <div class="flex justify-between text-sm mb-1">
                <span>Occupied</span>
                <span class="font-semibold">{stats.occupiedRooms}</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="bg-red-600 rounded-full h-2" style="width: {(stats.occupiedRooms / stats.totalRooms) * 100}%"></div>
              </div>
            </div>
            <div>
              <div class="flex justify-between text-sm mb-1">
                <span>Vacant</span>
                <span class="font-semibold">{stats.vacantRooms}</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="bg-green-600 rounded-full h-2" style="width: {(stats.vacantRooms / stats.totalRooms) * 100}%"></div>
              </div>
            </div>
            <div>
              <div class="flex justify-between text-sm mb-1">
                <span>Dirty</span>
                <span class="font-semibold">{stats.dirtyRooms}</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="bg-yellow-600 rounded-full h-2" style="width: {(stats.dirtyRooms / stats.totalRooms) * 100}%"></div>
              </div>
            </div>
            <div>
              <div class="flex justify-between text-sm mb-1">
                <span>Maintenance</span>
                <span class="font-semibold">{stats.maintenanceRooms}</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="bg-gray-600 rounded-full h-2" style="width: {(stats.maintenanceRooms / stats.totalRooms) * 100}%"></div>
              </div>
            </div>
          </div>
          
          <!-- Generator Status -->
          {#if stats.activeGenerator}
            <div class="mt-6 pt-4 border-t">
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-sm text-gray-600">Generator Status</div>
                  <div class="font-semibold text-green-600">● Running</div>
                </div>
                <div class="text-right">
                  <div class="text-sm text-gray-600">Since</div>
                  <div class="text-sm font-mono">{formatDate(stats.activeGenerator.startTime)}</div>
                </div>
              </div>
            </div>
          {/if}
        </div>
        
        <!-- Revenue Chart Placeholder -->
        <div class="bg-white rounded-xl shadow-sm p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">Revenue Overview</h3>
            <select bind:value={selectedPeriod} on:change={fetchDashboardData} class="text-sm border rounded px-2 py-1">
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-green-600 mb-2">
              {formatCurrency(selectedPeriod === 'today' ? stats.todayRevenue : selectedPeriod === 'week' ? stats.weekRevenue : stats.monthRevenue)}
            </div>
            <div class="text-sm text-gray-600">
              {selectedPeriod === 'today' ? 'Today\'s' : selectedPeriod === 'week' ? 'Weekly' : 'Monthly'} revenue
            </div>
          </div>
          <!-- Simple bar chart representation -->
          <div class="mt-6 space-y-2">
            <div class="flex items-center gap-2 text-sm">
              <span class="w-16 text-gray-600">Rooms</span>
              <div class="flex-1 bg-gray-200 rounded-full h-2">
                <div class="bg-blue-600 rounded-full h-2" style="width: {Math.min((stats.occupiedRooms / stats.totalRooms) * 100, 100)}%"></div>
              </div>
              <span class="text-gray-600">{Math.round((stats.occupiedRooms / stats.totalRooms) * 100)}%</span>
            </div>
            <div class="flex items-center gap-2 text-sm">
              <span class="w-16 text-gray-600">Revenue</span>
              <div class="flex-1 bg-gray-200 rounded-full h-2">
                <div class="bg-green-600 rounded-full h-2" style="width: {Math.min((stats.todayRevenue / 500000) * 100, 100)}%"></div>
              </div>
              <span class="text-gray-600">{Math.round((stats.todayRevenue / 500000) * 100)}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Activity Section -->
      <div class="grid lg:grid-cols-2 gap-6">
        <!-- Recent Transactions -->
        <div class="bg-white rounded-xl shadow-sm">
          <div class="p-6 border-b">
            <h3 class="text-lg font-semibold">Recent Transactions</h3>
          </div>
          <div class="divide-y">
            {#if stats.recentTransactions.length === 0}
              <div class="p-6 text-center text-gray-500">No recent transactions</div>
            {:else}
              {#each stats.recentTransactions.slice(0, 5) as transaction (transaction.id)}
                <div class="p-4 hover:bg-gray-50 transition">
                  <div class="flex justify-between items-start">
                    <div>
                      <div class="font-semibold">{transaction.guestName}</div>
                      <div class="text-sm text-gray-600">Room {transaction.roomNumber}</div>
                      <div class="text-xs text-gray-500 mt-1">{formatDate(transaction.createdAt)}</div>
                    </div>
                    <div class="text-right">
                      <div class="font-bold text-green-600">{formatCurrency(transaction.amountPaid)}</div>
                      <div class="text-xs text-gray-500 mt-1 capitalize">{transaction.paymentMethod}</div>
                    </div>
                  </div>
                </div>
              {/each}
            {/if}
          </div>
          <div class="p-4 border-t">
            <button on:click={() => goto('/reports')} class="text-blue-600 text-sm hover:text-blue-700">
              View all transactions →
            </button>
          </div>
        </div>
        
        <!-- Recent Audits -->
        <div class="bg-white rounded-xl shadow-sm">
          <div class="p-6 border-b">
            <h3 class="text-lg font-semibold">Recent Audit Reports</h3>
          </div>
          <div class="divide-y">
            {#if stats.recentAudits.length === 0}
              <div class="p-6 text-center text-gray-500">No recent audits</div>
            {:else}
              {#each stats.recentAudits.slice(0, 5) as audit (audit.id)}
                <div class="p-4 hover:bg-gray-50 transition">
                  <div class="flex justify-between items-start">
                    <div>
                      <div class="font-semibold">Audit by {audit.auditedBy}</div>
                      <div class="text-sm text-gray-600">
                        {audit.systemCount} system / {audit.physicalCount} physical
                      </div>
                      <div class="text-xs text-gray-500 mt-1">{formatDate(audit.auditDate)}</div>
                    </div>
                    <div class="text-right">
                      {#if audit.discrepancy !== 0}
                        <div class="text-red-600 font-semibold">⚠️ {audit.discrepancy > 0 ? '+' : ''}{audit.discrepancy}</div>
                        <div class="text-xs text-red-500 mt-1">discrepancy</div>
                      {:else}
                        <div class="text-green-600 font-semibold">✓ Clean</div>
                        <div class="text-xs text-green-500 mt-1">no issues</div>
                      {/if}
                    </div>
                  </div>
                </div>
              {/each}
            {/if}
          </div>
          <div class="p-4 border-t">
            <button on:click={() => goto('/audit')} class="text-blue-600 text-sm hover:text-blue-700">
              Run new audit →
            </button>
          </div>
        </div>
        
        <!-- Low Stock Alerts -->
        <div class="bg-white rounded-xl shadow-sm lg:col-span-2">
          <div class="p-6 border-b">
            <h3 class="text-lg font-semibold">Low Stock Alerts</h3>
          </div>
          <div class="overflow-x-auto">
            {#if stats.lowStockItems === 0}
              <div class="p-6 text-center text-gray-500">All inventory levels are healthy ✓</div>
            {:else}
              <table class="w-full">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reorder Level</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y">
                  {#each stats.recentInventoryActivity as item (item.id)}
                    {#if item.currentStock <= item.reorderLevel}
                      <tr class="hover:bg-gray-50">
                        <td class="px-6 py-4 font-medium">{item.itemName}</td>
                        <td class="px-6 py-4 capitalize">{item.category}</td>
                        <td class="px-6 py-4 font-mono">{item.currentStock} {item.unit}</td>
                        <td class="px-6 py-4 font-mono">{item.reorderLevel} {item.unit}</td>
                        <td class="px-6 py-4">
                          <span class="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Critical</span>
                        </td>
                        <td class="px-6 py-4">
                          <button on:click={() => goto('/inventory')} class="text-blue-600 text-sm hover:text-blue-700">
                            Restock →
                          </button>
                        </td>
                      </tr>
                    {/if}
                  {/each}
                </tbody>
              </table>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>