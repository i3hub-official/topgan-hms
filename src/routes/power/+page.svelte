<script lang="ts">
  import { onMount } from 'svelte';
  
  let logs = [];
  let activeSession = null;
  let showStartForm = false;
  let showStopForm = false;
  let loading = true;
  
  onMount(async () => {
    await fetchLogs();
    await checkActiveSession();
  });
  
  async function fetchLogs() {
    const response = await fetch('/api/power/logs');
    if (response.ok) {
      logs = await response.json();
      loading = false;
    }
  }
  
  async function checkActiveSession() {
    const response = await fetch('/api/power/active');
    if (response.ok) {
      activeSession = await response.json();
    }
  }
  
  async function startGenerator(startTime, fuelAtStart, recordedBy) {
    const response = await fetch('/api/power/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startTime, fuelAtStart, recordedBy })
    });
    if (response.ok) {
      showStartForm = false;
      await checkActiveSession();
    }
  }
  
  async function stopGenerator(stopTime, fuelAtStop) {
    const response = await fetch(`/api/power/stop/${activeSession.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stopTime, fuelAtStop })
    });
    if (response.ok) {
      showStopForm = false;
      activeSession = null;
      await fetchLogs();
    }
  }
  
  function formatDuration(hours) {
    if (!hours) return 'N/A';
    const h = Math.floor(hours);
    const m = Math.floor((hours % 1) * 60);
    return `${h}h ${m}m`;
  }
</script>

<div class="min-h-screen bg-gray-50">
  <div class="max-w-7xl mx-auto px-4 py-8">
    <!-- Header -->
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Power Generator Log</h1>
        <p class="text-gray-600 mt-2">Track generator efficiency and fuel consumption</p>
      </div>
      
      {#if !activeSession}
        <button
          on:click={() => showStartForm = true}
          class="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
        >
          Start Generator
        </button>
      {:else}
        <button
          on:click={() => showStopForm = true}
          class="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 animate-pulse"
        >
          ⚡ Stop Generator
        </button>
      {/if}
    </div>
    
    <!-- Active Session Card -->
    {#if activeSession}
      <div class="bg-linear-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 rounded-lg p-6 mb-8">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <h2 class="text-xl font-semibold">Generator Running</h2>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <div class="text-sm text-gray-600">Generator ID</div>
            <div class="font-mono font-bold">{activeSession.generatorId}</div>
          </div>
          <div>
            <div class="text-sm text-gray-600">Started At</div>
            <div class="font-semibold">{new Date(activeSession.startTime).toLocaleString()}</div>
          </div>
          <div>
            <div class="text-sm text-gray-600">Fuel at Start</div>
            <div class="font-semibold">{activeSession.fuelAtStart} liters</div>
          </div>
        </div>
      </div>
    {/if}
    
    <!-- Historical Logs -->
    <div class="bg-white rounded-lg shadow">
      <div class="p-4 border-b">
        <h2 class="text-lg font-semibold">Generator Log History</h2>
      </div>
      
      {#if loading}
        <div class="p-8 text-center">Loading logs...</div>
      {:else if logs.length === 0}
        <div class="p-8 text-center text-gray-500">No generator logs yet. Start a new session!</div>
      {:else}
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">Duration</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">Fuel Used</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">Liters/Hour</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">Efficiency</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              {#each logs as log (log.id)}
                <tr class="hover:bg-gray-50">
                  <td class="px-4 py-3 text-sm">{new Date(log.startTime).toLocaleDateString()}</td>
                  <td class="px-4 py-3 text-sm">{formatDuration(log.hoursRun)}</td>
                  <td class="px-4 py-3 text-sm">{log.fuelConsumed} L</td>
                  <td class="px-4 py-3 text-sm font-mono">{log.litersPerHour} L/h</td>
                  <td class="px-4 py-3">
                    {#if log.flagged === 'high_consumption'}
                      <span class="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">⚠️ High</span>
                    {:else}
                      <span class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">✓ Optimal</span>
                    {/if}
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

<!-- Start Generator Modal -->
{#if showStartForm}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 max-w-md w-full">
      <h2 class="text-xl font-bold mb-4">Start Generator Session</h2>
      <form on:submit|preventDefault={async (e) => {
        const formData = new FormData(e.target);
        await startGenerator(
          new Date(formData.get('startTime')),
          parseFloat(formData.get('fuelAtStart')),
          formData.get('recordedBy')
        );
      }}>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">Start Time</label>
            <input type="datetime-local" name="startTime" class="w-full px-3 py-2 border rounded" required />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2">Fuel at Start (liters)</label>
            <input type="number" name="fuelAtStart" step="0.1" class="w-full px-3 py-2 border rounded" required />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2">Recorded By</label>
            <input type="text" name="recordedBy" class="w-full px-3 py-2 border rounded" required />
          </div>
        </div>
        
        <div class="flex gap-2 mt-6">
          <button type="submit" class="flex-1 bg-green-600 text-white py-2 rounded">Start Generator</button>
          <button type="button" on:click={() => showStartForm = false} class="flex-1 bg-gray-300 py-2 rounded">Cancel</button>
        </div>
      </form>
    </div>
  </div>
{/if}