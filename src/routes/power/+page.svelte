<script lang="ts">
  import { onMount } from 'svelte';
  
  let logs: any[] = [];
  let form = {
    startTime: '',
    stopTime: '',
    fuelStart: 0,
    fuelEnd: 0
  };
  
  onMount(async () => {
    await loadLogs();
  });
  
  async function loadLogs() {
    const res = await fetch('/api/power');
    logs = await res.json();
  }
  
  async function submitLog() {
    const start = new Date(form.startTime);
    const stop = new Date(form.stopTime);
    const hoursRun = (stop.getTime() - start.getTime()) / (1000 * 60 * 60);
    const fuelConsumed = form.fuelStart - form.fuelEnd;
    const efficiency = fuelConsumed / hoursRun;
    
    await fetch('/api/power', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        hoursRun,
        fuelConsumed,
        efficiency
      })
    });
    
    form = { startTime: '', stopTime: '', fuelStart: 0, fuelEnd: 0 };
    await loadLogs();
  }
</script>

<div class="min-h-screen bg-white">
  <div class="bg-crimson text-white px-6 py-4">
    <h1 class="text-2xl font-bold">Generator Power Log</h1>
    <p class="text-sm opacity-90">Track fuel efficiency & detect siphoning</p>
  </div>
  
  <div class="p-6">
    <!-- Input Form -->
    <div class="bg-gray-50 rounded-lg p-6 mb-8">
      <h2 class="text-lg font-bold mb-4">New Generator Session</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Start Time</label>
          <input type="datetime-local" bind:value={form.startTime} class="mt-1 block w-full border rounded-md px-3 py-2" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Stop Time</label>
          <input type="datetime-local" bind:value={form.stopTime} class="mt-1 block w-full border rounded-md px-3 py-2" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Fuel Level Start (Liters)</label>
          <input type="number" step="0.1" bind:value={form.fuelStart} class="mt-1 block w-full border rounded-md px-3 py-2" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Fuel Level End (Liters)</label>
          <input type="number" step="0.1" bind:value={form.fuelEnd} class="mt-1 block w-full border rounded-md px-3 py-2" />
        </div>
      </div>
      <button on:click={submitLog} class="mt-4 px-6 py-2 bg-crimson text-white rounded-md hover:bg-crimson-dark">
        Record Session
      </button>
    </div>
    
    <!-- Historical Logs -->
    <div>
      <h2 class="text-lg font-bold mb-4">Session History</h2>
      <div class="space-y-3">
        {#each logs as log}
          <div class="border rounded-lg p-4">
            <div class="flex justify-between items-start">
              <div>
                <p class="font-semibold">
                  {new Date(log.generatorStart).toLocaleDateString()}
                </p>
                <p class="text-sm text-gray-600">
                  Duration: {log.hoursRun.toFixed(1)} hrs | Fuel: {log.fuelConsumed.toFixed(1)} L
                </p>
              </div>
              <div class="text-right">
                <p class="text-lg font-bold {log.flagged ? 'text-red-600' : 'text-green-600'}">
                  {log.efficiency?.toFixed(2)} L/hr
                </p>
                {#if log.flagged}
                  <span class="text-xs text-red-500">⚠️ High consumption</span>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>