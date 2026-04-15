<script lang="ts">
  import { onMount } from 'svelte';
  
  let auditHistory = [];
  let dateRange = 'week';
  let loading = true;
  
  onMount(async () => {
    await fetchAuditHistory();
  });
  
  async function fetchAuditHistory() {
    const response = await fetch(`/api/audit/history?range=${dateRange}`);
    if (response.ok) {
      auditHistory = await response.json();
      loading = false;
    }
  }
  
  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  }
  
  function getDiscrepancyColor(discrepancy) {
    if (discrepancy === 0) return 'text-green-600';
    return 'text-red-600 font-bold';
  }
  
  async function exportReport() {
    const response = await fetch(`/api/reports/export?range=${dateRange}`);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `topgan-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<div class="min-h-screen bg-gray-50">
  <div class="max-w-7xl mx-auto px-4 py-8">
    <!-- Header -->
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <p class="text-gray-600 mt-2">Audit history and financial insights</p>
      </div>
      <button
        on:click={exportReport}
        class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
      >
        📊 Export Report
      </button>
    </div>
    
    <!-- Date Range Filter -->
    <div class="bg-white rounded-lg shadow p-4 mb-6">
      <div class="flex gap-4">
        <button
          on:click={() => { dateRange = 'day'; fetchAuditHistory(); }}
          class={`px-4 py-2 rounded ${dateRange === 'day' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Today
        </button>
        <button
          on:click={() => { dateRange = 'week'; fetchAuditHistory(); }}
          class={`px-4 py-2 rounded ${dateRange === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          This Week
        </button>
        <button
          on:click={() => { dateRange = 'month'; fetchAuditHistory(); }}
          class={`px-4 py-2 rounded ${dateRange === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          This Month
        </button>
      </div>
    </div>
    
    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="bg-white rounded-lg shadow p-6">
        <div class="text-sm text-gray-600 mb-2">Total Audits</div>
        <div class="text-3xl font-bold">{auditHistory.length}</div>
      </div>
      <div class="bg-white rounded-lg shadow p-6">
        <div class="text-sm text-gray-600 mb-2">Total Discrepancies Found</div>
        <div class="text-3xl font-bold text-red-600">
          {auditHistory.reduce((sum, a) => sum + Math.abs(a.discrepancy), 0)}
        </div>
      </div>
      <div class="bg-white rounded-lg shadow p-6">
        <div class="text-sm text-gray-600 mb-2">Estimated Revenue Protected</div>
        <div class="text-3xl font-bold text-green-600">
          {formatCurrency(auditHistory.reduce((sum, a) => sum + (a.unrecordedEstimate || 0), 0))}
        </div>
      </div>
    </div>
    
    <!-- Audit History Table -->
    <div class="bg-white rounded-lg shadow">
      <div class="p-4 border-b">
        <h2 class="text-lg font-semibold">Audit History</h2>
      </div>
      
      {#if loading}
        <div class="p-8 text-center">Loading audit history...</div>
      {:else if auditHistory.length === 0}
        <div class="p-8 text-center text-gray-500">No audit records found</div>
      {:else}
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">Audited By</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">System Count</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">Physical Count</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">Discrepancy</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">Flagged Rooms</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              {#each auditHistory as audit (audit.id)}
                <tr class="hover:bg-gray-50">
                  <td class="px-4 py-3 text-sm">{new Date(audit.auditDate).toLocaleDateString()}</td>
                  <td class="px-4 py-3 text-sm">{audit.auditedBy}</td>
                  <td class="px-4 py-3 text-sm">{audit.systemCount}</td>
                  <td class="px-4 py-3 text-sm">{audit.physicalCount}</td>
                  <td class={`px-4 py-3 text-sm ${getDiscrepancyColor(audit.discrepancy)}`}>
                    {audit.discrepancy > 0 ? '+' : ''}{audit.discrepancy}
                  </td>
                  <td class="px-4 py-3 text-sm">
                    {audit.flagged?.length > 0 ? audit.flagged.join(', ') : '-'}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  </div>
</div>