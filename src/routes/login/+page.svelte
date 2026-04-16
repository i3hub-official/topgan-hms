<script lang="ts">
  import { goto } from '$app/navigation';
  import { ShieldCheck, Lock, Mail, Loader2 } from 'lucide-svelte';
  
  // Svelte 5 State Runes
  let email = $state('');
  let password = $state('');
  let loading = $state(false);
  let error = $state('');

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault(); // Svelte 5 way to prevent default
    loading = true;
    error = '';
    
    try {
      const res = await fetch('/api/auth/sign-in/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      
      if (res.ok && data.user) {
        await goto('/dashboard');
      } else {
        error = data.error || 'Invalid credentials. Access denied.';
      }
    } catch (err) {
      error = 'Security terminal offline. Check connection.';
    } finally {
      loading = false;
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-slate-50 px-6">
  <div class="max-w-md w-full">
    <div class="text-center mb-10">
      <div class="inline-flex items-center justify-center p-3 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-200 mb-4">
        <ShieldCheck size={32} strokeWidth={2.5} />
      </div>
      <h2 class="text-3xl font-black text-slate-900 tracking-tight">
        TOPGAN <span class="text-indigo-600">HMS</span>
      </h2>
      <p class="mt-2 text-sm font-bold text-slate-400 uppercase tracking-widest">
        Security Access Terminal
      </p>
    </div>
    
    <div class="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
      <form onsubmit={handleSubmit} class="space-y-6">
        {#if error}
          <div class="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <div class="w-1.5 h-1.5 bg-rose-600 rounded-full"></div>
            {error}
          </div>
        {/if}
        
        <div class="space-y-4">
          <div class="space-y-1.5">
            <label for="email" class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Administrator Email
            </label>
            <div class="relative">
              <Mail class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                id="email"
                type="email"
                bind:value={email}
                required
                placeholder="owner@topgan.com"
                class="block w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
              />
            </div>
          </div>
          
          <div class="space-y-1.5">
            <label for="password" class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Secure Password
            </label>
            <div class="relative">
              <Lock class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                id="password"
                type="password"
                bind:value={password}
                required
                placeholder="••••••••"
                class="block w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
              />
            </div>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          class="w-full flex justify-center items-center gap-2 py-4 bg-slate-900 text-white rounded-2xl text-sm font-black hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 disabled:opacity-70 disabled:cursor-not-allowed group"
        >
          {#if loading}
            <Loader2 size={18} class="animate-spin" />
            Verifying...
          {:else}
            Access Dashboard
          {/if}
        </button>
      </form>
    </div>

    <p class="mt-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
      Topgan Hospitality Systems &copy; 2026
    </p>
  </div>
</div>