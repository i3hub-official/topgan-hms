<script lang="ts">
  import { MapPin, Clock, LogIn, LogOut, Loader2, CheckCircle } from 'lucide-svelte';
  
  let status = $state<'idle' | 'loading' | 'success'>('idle');
  let locationData = $state<string | null>(null);
  let error = $state<string | null>(null);

  async function getCoords(): Promise<string> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(`${pos.coords.latitude}, ${pos.coords.longitude}`),
        () => reject("Please enable GPS to clock in/out.")
      );
    });
  }

  async function handlePunch(action: 'clock-in' | 'clock-out') {
    status = 'loading';
    error = null;
    
    try {
      const location = await getCoords();
      const res = await fetch('/api/staff/attendance', {
        method: 'POST',
        body: JSON.stringify({ action, location })
      });

      if (!res.ok) throw new Error("Server error. Try again.");
      
      status = 'success';
      setTimeout(() => status = 'idle', 3000);
    } catch (err: any) {
      error = err.toString();
      status = 'idle';
    }
  }
</script>

<div class="min-h-[80vh] flex flex-col items-center justify-center p-6">
  <div class="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 p-10 text-center">
    
    <div class="mb-8">
      <div class="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
        <Clock size={40} />
      </div>
      <h1 class="text-2xl font-black text-slate-900">Attendance Portal</h1>
      <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">TOPGAN HMS Staff Terminal</p>
    </div>

    {#if error}
      <div class="mb-6 p-4 bg-rose-50 text-rose-600 rounded-2xl text-sm font-bold animate-shake">
        ⚠️ {error}
      </div>
    {/if}

    <div class="space-y-4">
      {#if status === 'success'}
        <div class="py-12 flex flex-col items-center animate-bounce">
          <CheckCircle size={60} class="text-emerald-500" />
          <p class="mt-4 font-black text-slate-900 uppercase">Action Recorded!</p>
        </div>
      {:else if status === 'loading'}
        <div class="py-12 flex flex-col items-center">
          <Loader2 size={60} class="animate-spin text-indigo-600" />
          <p class="mt-4 font-black text-slate-400 uppercase">Verifying Location...</p>
        </div>
      {:else}
        <button 
          onclick={() => handlePunch('clock-in')}
          class="w-full py-6 bg-emerald-500 text-white rounded-3xl font-black text-lg shadow-xl shadow-emerald-100 hover:bg-emerald-600 transition-all active:scale-95 flex items-center justify-center gap-3"
        >
          <LogIn /> Clock In
        </button>

        <button 
          onclick={() => handlePunch('clock-out')}
          class="w-full py-6 bg-slate-900 text-white rounded-3xl font-black text-lg shadow-xl shadow-slate-200 hover:bg-rose-600 transition-all active:scale-95 flex items-center justify-center gap-3"
        >
          <LogOut /> Clock Out
        </button>
      {/if}
    </div>

    <div class="mt-10 flex items-center justify-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-tighter">
      <MapPin size={12} />
      Location Services Required for Verification
    </div>
  </div>
</div>

<style>
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
  .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
</style>