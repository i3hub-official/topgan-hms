<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    Zap, 
    History, 
    Fuel, 
    Timer, 
    AlertTriangle, 
    CheckCircle2, 
    PlusCircle,
    Activity,
    Clock
  } from 'lucide-svelte';

  // --- Svelte 5 State Runes ---
  let logs = $state<any[]>([]);
  let loading = $state(true);
  
  let form = $state({
    startTime: '',
    stopTime: '',
    fuelStart: 0,
    fuelEnd: 0
  });

  // --- Derived Audit Calculations ---
  let hoursRun = $derived.by(() => {
    if (!form.startTime || !form.stopTime) return 0;
    const start = new Date(form.startTime).getTime();
    const stop = new Date(form.stopTime).getTime();
    const diff = (stop - start) / (1000 * 60 * 60);
    return diff > 0 ? diff : 0;
  });

  let fuelConsumed = $derived(form.fuelStart - form.fuelEnd);
  let currentEfficiency = $derived(hoursRun > 0 ? fuelConsumed / hoursRun : 0);
  
  // Flag if consumption exceeds 5L/hr (adjust threshold as needed for your gen size)
  let isSuspicious = $derived(currentEfficiency > 5.0);

  onMount(async () => {
    await loadLogs();
  });

  async function loadLogs() {
    loading = true;
    try {
      const res = await fetch('/api/power');
      logs = await res.json();
    } finally {
      loading = false;
    }
  }

  async function submitLog() {
    if (hoursRun <= 0 || fuelConsumed < 0) {
      alert("Invalid time or fuel data.");
      return;
    }

    await fetch('/api/power', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        hoursRun,
        fuelConsumed,
        efficiency: currentEfficiency
      })
    });
    
    // Reset form using state
    form = { startTime: '', stopTime: '', fuelStart: 0, fuelEnd: 0 };
    await loadLogs();
  }
</script>

<div class="min-h-screen bg-slate-50/50">
  <header class="bg-white border-b border-slate-100 px-8 py-6">
    <div class="max-w-7xl mx-auto flex items-center gap-4">
      <div class="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-100">
        <Zap size={24} />
      </div>
      <div>
        <h1 class="text-2xl font-black text-slate-900 tracking-tight">Power & Fuel Log</h1>
        <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Efficiency Audit & Siphoning Detection</p>
      </div>
    </div>
  </header>

  <main class="max-w-7xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
    
    <div class="lg:col-span-1">
      <div class="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 sticky top-8">
        <div class="flex items-center gap-2 mb-6">
          <PlusCircle size={20} class="text-indigo-600" />
          <h2 class="text-lg font-black text-slate-900">Record Session</h2>
        </div>

        <div class="space-y-5">
          <div class="space-y-1.5">
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Start Time
              <input type="datetime-local" bind:value={form.startTime} class="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-sm" />
            </label>
          </div>

          <div class="space-y-1.5">
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Stop Time
              <input type="datetime-local" bind:value={form.stopTime} class="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-sm" />
            </label>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Fuel Start (L)
                <input type="number" step="0.1" bind:value={form.fuelStart} class="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-sm" />
              </label>
            </div>
            <div class="space-y-1.5">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Fuel End (L)
                <input type="number" step="0.1" bind:value={form.fuelEnd} class="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-sm" />
              </label>
            </div>
          </div>

          {#if hoursRun > 0}
            <div class="p-4 rounded-2xl {isSuspicious ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'} transition-colors">
              <div class="flex justify-between items-center mb-2">
                <span class="text-[10px] font-black uppercase tracking-wider">Audit Preview</span>
                {#if isSuspicious}
                  <AlertTriangle size={14} />
                {:else}
                  <CheckCircle2 size={14} />
                {/if}
              </div>
              <div class="flex justify-between items-end">
                <div>
                  <p class="text-2xl font-black">{currentEfficiency.toFixed(2)}</p>
                  <p class="text-[10px] font-bold opacity-70">LITERS PER HOUR</p>
                </div>
                <div class="text-right">
                  <p class="font-bold text-sm">{hoursRun.toFixed(1)} hrs</p>
                  <p class="text-[10px] font-bold opacity-70">RUN TIME</p>
                </div>
              </div>
            </div>
          {/if}

          <button 
            onclick={submitLog} 
            class="w-full py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl shadow-slate-200 hover:bg-indigo-600 transition-all mt-2"
          >
            Record Session
          </button>
        </div>
      </div>
    </div>

    <div class="lg:col-span-2">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-2">
          <History size={20} class="text-slate-400" />
          <h2 class="text-lg font-black text-slate-900">Session History</h2>
        </div>
        <div class="flex items-center gap-2 text-xs font-bold text-slate-400 bg-white px-3 py-1.5 rounded-full border border-slate-100">
          <Activity size={14} class="text-emerald-500" />
          Average: 3.4L/hr
        </div>
      </div>

      <div class="space-y-4">
        {#each logs as log (log._id || log.id || log)}
          <div class="bg-white border border-slate-100 rounded-3xl p-6 flex items-center justify-between group hover:border-indigo-100 transition-all">
            <div class="flex items-center gap-6">
              <div class="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                <Timer size={24} />
              </div>
              <div>
                <p class="font-black text-slate-900">
                  {new Date(log.startTime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
                <div class="flex items-center gap-3 mt-1">
                  <span class="text-xs font-bold text-slate-400 flex items-center gap-1">
                    <Clock size={12} /> {log.hoursRun.toFixed(1)} hrs
                  </span>
                  <span class="text-xs font-bold text-slate-400 flex items-center gap-1">
                    <Fuel size={12} /> {log.fuelConsumed.toFixed(1)} L
                  </span>
                </div>
              </div>
            </div>

            <div class="text-right">
              <p class="text-xl font-black {log.efficiency > 5.0 ? 'text-rose-600' : 'text-slate-900'}">
                {log.efficiency?.toFixed(2)} <span class="text-[10px] text-slate-400">L/HR</span>
              </p>
              {#if log.efficiency > 5.0}
                <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-600 rounded-md text-[10px] font-black uppercase tracking-tighter mt-1">
                  <AlertTriangle size={10} /> Flagged
                </span>
              {/if}
            </div>
          </div>
        {/each}

        {#if logs.length === 0 && !loading}
          <div class="text-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
            <Zap size={48} class="mx-auto text-slate-200 mb-4" />
            <p class="text-sm font-bold text-slate-400 uppercase tracking-widest">No power logs found</p>
          </div>
        {/if}
      </div>
    </div>
  </main>
</div>