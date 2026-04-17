<script lang="ts">
  import { goto } from '$app/navigation';
  import { UserPlus, Mail, Lock, User, Loader2, ArrowLeft } from 'lucide-svelte';
  
  // --- Svelte 5 State Runes ---
  let email = $state('');
  let password = $state('');
  let name = $state('');
  let loading = $state(false);
  let error = $state('');

  async function handleRegister(e: SubmitEvent) {
    e.preventDefault(); // Svelte 5 replacement for |preventDefault
    loading = true;
    error = '';
    
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      });
      
      if (res.ok) {
        // Await goto to satisfy 'svelte/no-navigation-without-resolve'
        await goto('/dashboard', { replaceState: true });
      } else {
        const data = await res.json();
        error = data.error || 'Registration failed. Verify your details.';
      }
    } catch (err) {
      error = 'Server connection failed.';
    } finally {
      loading = false;
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-slate-50 px-6">
  <div class="max-w-md w-full">
    <div class="text-center mb-8">
      <div class="inline-flex items-center justify-center p-3 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-100 mb-4">
        <UserPlus size={32} strokeWidth={2.5} />
      </div>
      <h2 class="text-3xl font-black text-slate-900 tracking-tight">Create Account</h2>
      <p class="mt-2 text-sm font-bold text-slate-400 uppercase tracking-widest">
        Hotel Management Terminal
      </p>
    </div>

    <div class="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
      <form onsubmit={handleRegister} class="space-y-5">
        {#if error}
          <div class="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2">
            <div class="w-1.5 h-1.5 bg-rose-600 rounded-full"></div>
            {error}
          </div>
        {/if}

        <div class="space-y-4">
          <div class="space-y-1.5">
            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
            <div class="relative">
              <User class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                bind:value={name} 
                type="text" 
                required 
                placeholder="Admin Name"
                class="block w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all outline-none" 
              />
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
            <div class="relative">
              <Mail class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                bind:value={email} 
                type="email" 
                required 
                placeholder="admin@topgan.com"
                class="block w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all outline-none" 
              />
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Password</label>
            <div class="relative">
              <Lock class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                bind:value={password} 
                type="password" 
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
          class="w-full flex justify-center items-center gap-2 py-4 bg-slate-900 text-white rounded-2xl text-sm font-black hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 disabled:opacity-70 group"
        >
          {#if loading}
            <Loader2 size={18} class="animate-spin" />
            Provisioning...
          {:else}
            Register Admin
          {/if}
        </button>
      </form>

      <div class="mt-6 pt-6 border-t border-slate-50">
        <a 
          href="/login" 
          class="flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Login
        </a>
      </div>
    </div>
  </div>
</div>