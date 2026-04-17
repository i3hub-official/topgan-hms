<script lang="ts">
  import { goto } from '$app/navigation';
  import { ShieldCheck, Mail, Lock, LogIn, AlertCircle, ChevronDown, ChevronUp } from 'lucide-svelte';
  
  let email = $state('');
  let password = $state('');
  let loading = $state(false);
  let error = $state('');
  let showAllCredentials = $state(false);
  
  // Complete demo credentials
  const demoCredentials = [
    { role: 'Owner', email: 'owner@topgan.com', password: 'owner123', level: 'Highest Access', color: 'bg-purple-100 text-purple-700' },
    { role: 'Super Admin', email: 'admin@topgan.com', password: 'admin123', level: 'Full System Access', color: 'bg-red-100 text-red-700' },
    { role: 'General Manager', email: 'manager@topgan.com', password: 'manager123', level: 'Operations Oversight', color: 'bg-blue-100 text-blue-700' },
    { role: 'Front Desk Manager', email: 'frontdesk@topgan.com', password: 'front123', level: 'Guest Management', color: 'bg-emerald-100 text-emerald-700' },
    { role: 'Store Keeper (Full)', email: 'store@topgan.com', password: 'store123', level: 'Bar, Kitchen & Store', color: 'bg-amber-100 text-amber-700' },
    { role: 'Store Keeper (Bar)', email: 'storebar@topgan.com', password: 'store123', level: 'Bar Only', color: 'bg-orange-100 text-orange-700' },
    { role: 'Store Keeper (Kitchen)', email: 'storekitchen@topgan.com', password: 'store123', level: 'Kitchen Only', color: 'bg-lime-100 text-lime-700' },
    { role: 'Store Keeper (Store)', email: 'storeonly@topgan.com', password: 'store123', level: 'Store Only', color: 'bg-yellow-100 text-yellow-700' },
    { role: 'Cleaner', email: 'cleaner@topgan.com', password: 'clean123', level: 'Housekeeping', color: 'bg-teal-100 text-teal-700' },
    { role: 'Regular Staff', email: 'staff@topgan.com', password: 'staff123', level: 'Basic Access', color: 'bg-slate-100 text-slate-700' }
  ];
  
  async function handleLogin(e: Event) {
    e.preventDefault();
    loading = true;
    error = '';
    
    try {
      console.log('Attempting login for:', email);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });
      
      const data = await response.json();
      console.log('Login response:', { status: response.status, data });
      
      if (response.ok && data.success) {
        console.log('Login successful, redirecting to dashboard');
        await goto('/dashboard');
      } else {
        error = data.error || 'Invalid email or password';
        console.error('Login failed:', error);
      }
    } catch (err) {
      console.error('Login error:', err);
      error = 'An error occurred. Please try again.';
    } finally {
      loading = false;
    }
  }
  
  function fillCredentials(credEmail: string, credPassword: string) {
    email = credEmail;
    password = credPassword;
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50 flex items-center justify-center p-4">
  <div class="max-w-md w-full">
    <div class="text-center mb-8">
      <div class="inline-flex p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-200 mb-4">
        <ShieldCheck size={32} strokeWidth={2.5} />
      </div>
      <h1 class="text-3xl font-black text-slate-900 tracking-tight">TOPGAN HMS</h1>
      <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
        Hotel Management System
      </p>
    </div>
    
    <div class="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
      <form onsubmit={handleLogin} class="space-y-6">
        <div>
          <label class="block text-xs font-black text-slate-400 uppercase mb-2">Email Address</label>
          <div class="relative">
            <Mail size={18} class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              bind:value={email}
              required
              class="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="admin@topgan.com"
            />
          </div>
        </div>
        
        <div>
          <label class="block text-xs font-black text-slate-400 uppercase mb-2">Password</label>
          <div class="relative">
            <Lock size={18} class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              bind:value={password}
              required
              class="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>
        </div>
        
        {#if error}
          <div class="bg-rose-50 border border-rose-100 text-rose-600 p-3 rounded-xl text-sm font-bold text-center flex items-center justify-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        {/if}
        
        <button
          type="submit"
          disabled={loading}
          class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl transition-all shadow-lg shadow-indigo-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <LogIn size={18} />
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      
      <div class="mt-6 pt-6 border-t border-slate-100">
        <button
          onclick={() => showAllCredentials = !showAllCredentials}
          class="w-full flex items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors mb-3"
        >
          {#if showAllCredentials}
            <ChevronUp size={14} />
          {:else}
            <ChevronDown size={14} />
          {/if}
          {showAllCredentials ? 'Hide' : 'Show'} All Demo Credentials
        </button>
        
        {#if showAllCredentials}
          <div class="space-y-2 max-h-96 overflow-y-auto">
            {#each demoCredentials as cred (cred.email)}
              <button
                onclick={() => fillCredentials(cred.email, cred.password)}
                class="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-black text-slate-800">{cred.role}</p>
                    <p class="text-[10px] font-mono text-slate-500 mt-0.5">{cred.email}</p>
                  </div>
                  <div class="text-right">
                    <span class="inline-block px-2 py-0.5 rounded-lg text-[9px] font-black {cred.color}">
                      {cred.level}
                    </span>
                    <p class="text-[9px] font-mono text-slate-400 mt-1">{cred.password}</p>
                  </div>
                </div>
              </button>
            {/each}
          </div>
        {:else}
          <div class="space-y-1 text-center">
            <p class="text-xs font-mono text-slate-500">
              <span class="font-bold text-indigo-600">Owner:</span> owner@topgan.com / owner123
            </p>
            <p class="text-xs font-mono text-slate-500">
              <span class="font-bold text-indigo-600">Admin:</span> admin@topgan.com / admin123
            </p>
            <p class="text-xs font-mono text-slate-500">
              <span class="font-bold text-indigo-600">Manager:</span> manager@topgan.com / manager123
            </p>
            <p class="text-xs font-mono text-slate-500">
              <span class="font-bold text-indigo-600">Front Desk:</span> frontdesk@topgan.com / front123
            </p>
            <button
              onclick={() => showAllCredentials = true}
              class="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 mt-2"
            >
              + Show all {demoCredentials.length} roles
            </button>
          </div>
        {/if}
      </div>
      
      <div class="mt-4 pt-4 border-t border-slate-100">
        <div class="flex items-center justify-center gap-2 text-[10px] text-slate-400">
          <div class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
          <span>System Ready</span>
          <span class="mx-1">•</span>
          <div class="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
          <span>RBAC Enabled</span>
        </div>
      </div>
    </div>
  </div>
</div>