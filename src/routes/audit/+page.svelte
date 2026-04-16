<script lang="ts">
  import { enhance } from '$app/forms';
  import { afterNavigate, goto } from '$app/navigation';
  import { 
    ArrowLeft, 
    Copy, 
    Printer, 
    ShieldCheck, 
    Activity, 
    AlertTriangle, 
    CheckCircle2, 
    TrendingUp,
    FileText,
    History,
    ClipboardPenLine
  } from 'lucide-svelte';
  
  // Svelte 5 Props and State
  let { form } = $props();
  
  let copied = $state(false);
  let formData = $state({
    physicalRooms: '',
    auditedBy: '',
    notes: ''
  });
  
  // Reactive derivations using runes
  let result = $derived(form?.result);
  let errors = $derived(form?.errors);
  let success = $derived(form?.success);
  
  afterNavigate(() => {
    if (success) {
      formData = { physicalRooms: '', auditedBy: '', notes: '' };
    }
  });
  
  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  }
  
  function formatDateTime(date: Date) {
    return new Intl.DateTimeFormat('en-NG', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(date));
  }
  
  async function copyReport() {
    if (!result) return;
    
    const report = `
🏨 TOPGAN HMS - NIGHT AUDIT REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 Date: ${formatDateTime(new Date())}
👤 Auditor: ${formData.auditedBy || 'N/A'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 RESULTS
System Count: ${result.systemCount}
Physical Count: ${result.physicalCount}
Discrepancy: ${result.discrepancy > 0 ? '+' : ''}${result.discrepancy}

${result.flaggedRooms.length > 0 ? `🚨 FLAGGED: ${result.flaggedRooms.join(', ')}` : '✅ All Correct'}
💰 Est. Revenue Gap: ${formatCurrency(result.unrecordedEstimate)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    
    await navigator.clipboard.writeText(report);
    copied = true;
    setTimeout(() => copied = false, 2000);
  }

  const printReport = () => window.print();
</script>

<div class="min-h-screen bg-slate-50/50 print:bg-white">
  <div class="max-w-6xl mx-auto px-6 py-8">
    
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 print:hidden">
      <button
        onclick={async () => await goto('/dashboard')}
        class="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold text-sm transition-colors"
      >
        <ArrowLeft size={16} /> Back to Terminal
      </button>

      <div class="flex gap-2">
        {#if result && success}
          <button
            onclick={copyReport}
            class="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition"
          >
            <Copy size={16} class={copied ? 'text-emerald-500' : ''} />
            {copied ? 'Copied' : 'Copy Text'}
          </button>
          <button
            onclick={printReport}
            class="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition"
          >
            <Printer size={16} /> Print Report
          </button>
        {/if}
      </div>
    </div>

    <div class="mb-12 text-center print:text-left print:mb-6">
      <div class="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
        <ShieldCheck size={12} /> Audit Protocol v5.0
      </div>
      <h1 class="text-4xl font-black text-slate-900 tracking-tight">Night Audit System</h1>
      <p class="text-slate-500 mt-2 font-medium">Internal revenue verification & physical room count.</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      
      <section class="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm print:hidden">
        <div class="flex items-center gap-3 mb-8">
          <div class="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <ClipboardPenLine size={20} />
          </div>
          <h2 class="text-lg font-black text-slate-800">New Physical Count</h2>
        </div>

        <form method="POST" use:enhance class="space-y-6">
          <div class="space-y-2">
            <label for="physicalRooms" class="block text-xs font-black text-slate-400 uppercase tracking-widest">
              Physically Occupied Rooms
            </label>
            <textarea
              id="physicalRooms"
              name="physicalRooms"
              rows="4"
              class="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
              placeholder="e.g. 101, 104, 205, 301"
              bind:value={formData.physicalRooms}
              required
            ></textarea>
            <p class="text-[10px] text-slate-400 font-medium italic">Separate room numbers with commas.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label for="auditor" class="block text-xs font-black text-slate-400 uppercase tracking-widest">Auditor Name</label>
              <input
                id="auditor"
                type="text"
                name="auditedBy"
                class="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 text-sm"
                bind:value={formData.auditedBy}
                required
              />
            </div>
            <div class="space-y-2">
              <label for="time" class="block text-xs font-black text-slate-400 uppercase tracking-widest">Time</label>
              <div class="px-4 py-3 bg-slate-50 rounded-2xl text-slate-400 text-sm font-bold">
                {formatDateTime(new Date())}
              </div>
            </div>
          </div>

          <button
            type="submit"
            class="w-full bg-slate-900 text-white py-4 rounded-2xl font-black hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-200"
          >
            <Activity size={18} />
            Cross-Reference Data
          </button>
        </form>
      </section>

      <section class="space-y-6">
        {#if result && success}
          <div class="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm overflow-hidden relative">
            <div class="flex items-center gap-3 mb-8">
              <div class="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <FileText size={20} />
              </div>
              <h2 class="text-lg font-black text-slate-800">Verification Report</h2>
            </div>

            <div class="grid grid-cols-2 gap-4 mb-6">
              <div class="p-5 bg-slate-50 rounded-2xl">
                <p class="text-[10px] font-black text-slate-400 uppercase mb-1">System Record</p>
                <p class="text-2xl font-black text-slate-900">{result.systemCount}</p>
              </div>
              <div class="p-5 bg-indigo-50 rounded-2xl">
                <p class="text-[10px] font-black text-indigo-400 uppercase mb-1">Physical Count</p>
                <p class="text-2xl font-black text-indigo-700">{result.physicalCount}</p>
              </div>
            </div>

            <div class="p-6 rounded-2xl flex items-center justify-between {result.discrepancy === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'}">
              <div>
                <p class="text-xs font-bold uppercase tracking-widest opacity-70">Discrepancy</p>
                <p class="text-3xl font-black">{result.discrepancy > 0 ? '+' : ''}{result.discrepancy}</p>
              </div>
              {#if result.discrepancy === 0}
                <CheckCircle2 size={40} strokeWidth={2.5} />
              {:else}
                <AlertTriangle size={40} strokeWidth={2.5} />
              {/if}
            </div>

            {#if result.flaggedRooms.length > 0}
              <div class="mt-8">
                <p class="text-xs font-black text-red-400 uppercase tracking-widest mb-3">Fraud Risk Identified</p>
                <div class="flex flex-wrap gap-2">
                  {#each result.flaggedRooms as room}
                    <span class="px-3 py-1 bg-red-50 text-red-600 rounded-lg font-bold text-sm border border-red-100">
                      Room {room}
                    </span>
                  {/each}
                </div>
              </div>
            {/if}

            <div class="mt-8 pt-8 border-t border-slate-100">
              <div class="flex justify-between items-center mb-2">
                <span class="text-sm font-bold text-slate-400">Total System Revenue</span>
                <span class="text-lg font-black text-slate-900">{formatCurrency(result.totalRevenue)}</span>
              </div>
              {#if result.unrecordedEstimate > 0}
                <div class="flex justify-between items-center">
                  <span class="text-sm font-bold text-orange-500">Unrecorded Leakage (Est.)</span>
                  <span class="text-lg font-black text-orange-600">{formatCurrency(result.unrecordedEstimate)}</span>
                </div>
              {/if}
            </div>
          </div>
        {:else}
          <div class="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center">
            <History size={48} class="text-slate-200 mb-4" />
            <p class="text-slate-400 font-bold max-w-[200px]">Waiting for physical data input...</p>
          </div>
        {/if}
      </section>
    </div>
  </div>
</div>

<style>
  @media print {
    :global(body) { background: white; }
    .print\:hidden { display: none !important; }
  }
</style>