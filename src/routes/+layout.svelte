<script lang="ts">
  import './layout.css'; // Your global CSS
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { 
    LayoutDashboard, 
    SearchCheck, 
    Hotel, 
    Package, 
    Zap, 
    BarChart3, 
    Menu, 
    X, 
    ShieldCheck, 
    LogOut,
    ChevronRight
  } from 'lucide-svelte';
  
  // --- Svelte 5 State Runes ---
  let mobileMenuOpen = $state(false);
  let isLoggingOut = $state(false);
  let currentPath = $derived($page.url.pathname);

  // --- Navigation Definition ---
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Night Audit', path: '/audit', icon: SearchCheck },
    { name: 'Room Management', path: '/rooms', icon: Hotel },
    { name: 'Inventory', path: '/inventory', icon: Package },
    { name: 'Power Log', path: '/power', icon: Zap },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
  ];

  // --- Handlers ---
  async function handleSignOut() {
    isLoggingOut = true;
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (response.ok) {
        // Close menu before navigating on mobile
        mobileMenuOpen = false; 
        await goto('/login');
      }
    } catch (err) {
      console.error('Logout failed', err);
    } finally {
      isLoggingOut = false;
    }
  }

  function isActive(path: string) {
    return currentPath.startsWith(path) 
      ? 'bg-indigo-50 text-indigo-700' 
      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900';
  }
</script>

{#if mobileMenuOpen}
  <div class="fixed inset-0 z-50 md:hidden">
    <div 
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" 
      onclick={() => mobileMenuOpen = false}
      aria-hidden="true"
    ></div>

    <div class="fixed inset-y-0 left-0 w-full max-w-xs bg-white shadow-2xl flex flex-col transition-transform duration-300">
      <div class="flex items-center justify-between px-6 h-20 border-b border-slate-50">
        <div class="flex items-center gap-3">
          <div class="bg-indigo-600 p-1.5 rounded-lg text-white">
            <ShieldCheck size={22} strokeWidth={2.5} />
          </div>
          <span class="text-xl font-black text-slate-900 tracking-tight">TOPGAN</span>
        </div>
        <button 
          onclick={() => mobileMenuOpen = false} 
          class="p-2 text-slate-400 hover:text-slate-600"
        >
          <X size={24} />
        </button>
      </div>

      <nav class="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {#each navItems as item (item.path)}
          {@const Icon = item.icon}
          <a
            href={item.path}
            onclick={() => mobileMenuOpen = false}
            class="group flex items-center justify-between px-4 py-3.5 text-base font-bold rounded-2xl transition-all {isActive(item.path)}"
          >
            <div class="flex items-center">
              <Icon size={20} class="mr-4 opacity-80" />
              {item.name}
            </div>
            <ChevronRight size={16} class="opacity-30" />
          </a>
        {/each}
      </nav>
      
      <div class="p-6 border-t border-slate-50">
        <button 
          onclick={handleSignOut}
          disabled={isLoggingOut}
          class="flex w-full items-center justify-center gap-3 px-4 py-4 text-base font-black text-rose-600 bg-rose-50 rounded-2xl active:scale-95 transition-all disabled:opacity-50"
        >
          <LogOut size={20} />
          {isLoggingOut ? 'Terminating...' : 'Sign Out'}
        </button>
      </div>
    </div>
  </div>
{/if}

<div class="min-h-screen bg-white">
  <aside class="hidden md:fixed md:inset-y-0 md:flex md:w-72 md:flex-col border-r border-slate-100 bg-white">
    <div class="flex flex-col h-full">
      <div class="flex items-center gap-3 px-8 h-24">
        <div class="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-100">
          <ShieldCheck size={24} strokeWidth={2.5} />
        </div>
        <span class="text-2xl font-black tracking-tight text-slate-900">
          TOPGAN <span class="text-indigo-600">HMS</span>
        </span>
      </div>

      <nav class="flex-1 px-6 space-y-1.5 mt-4">
        {#each navItems as item (item.path)}
          {@const Icon = item.icon}
          <a
            href={item.path}
            class="group flex items-center px-4 py-3 text-sm font-black rounded-2xl transition-all {isActive(item.path)}"
          >
            <Icon size={19} class="mr-3 opacity-80" />
            {item.name}
          </a>
        {/each}
      </nav>

      <div class="p-6 border-t border-slate-50 space-y-4">
        <button 
          onclick={handleSignOut}
          disabled={isLoggingOut}
          class="flex w-full items-center px-4 py-3 text-sm font-black text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all disabled:opacity-50"
        >
          <LogOut size={19} class="mr-3" />
          {isLoggingOut ? 'Wait...' : 'Sign Out'}
        </button>
        
        <div class="bg-slate-50 rounded-2xl p-4">
          <p class="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-2">Internal System</p>
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <p class="text-[11px] font-bold text-slate-500">Node Secure</p>
          </div>
        </div>
      </div>
    </div>
  </aside>
  
  <div class="md:pl-72 flex flex-col min-h-screen">
    
    <header class="sticky top-0 z-40 flex h-20 shrink-0 items-center justify-between border-b border-slate-50 bg-white/80 backdrop-blur-md px-6 md:hidden">
      <div class="flex items-center gap-3">
        <div class="bg-indigo-600 p-1.5 rounded-lg text-white shadow-md shadow-indigo-100">
          <ShieldCheck size={20} strokeWidth={2.5} />
        </div>
        <span class="text-xl font-black text-slate-900 tracking-tight">TOPGAN</span>
      </div>
      
      <button 
        type="button" 
        class="p-2.5 text-slate-600 bg-slate-50 rounded-xl active:scale-90 transition-all"
        onclick={() => mobileMenuOpen = !mobileMenuOpen}
      >
        <span class="sr-only">Toggle Menu</span>
        {#if mobileMenuOpen}
          <X size={24} />
        {:else}
          <Menu size={24} />
        {/if}
      </button>
    </header>

    <main class="flex-1 p-4 md:p-0">
      <slot />
    </main>
    
  </div>
</div>

<style>
  /* Ensure smooth transitions for the drawer */
  :global(body) {
    overflow-x: hidden;
    color: #1e293b; /* slate-800 */
  }

  /* Optional: Active link indicator dot */
  .isActive::after {
    content: '';
    width: 4px;
    height: 4px;
    background-color: currentColor;
    border-radius: 99px;
    margin-left: auto;
  }
</style>