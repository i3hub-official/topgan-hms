<script lang="ts">
  import './layout.css';
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
    ChevronRight,
    Users,
    Truck,
    Clock,
    UserCheck,
    Settings,
    ClipboardList
  } from 'lucide-svelte';
  
  // --- Svelte 5 State Runes ---
  let mobileMenuOpen = $state(false);
  let isLoggingOut = $state(false);
  let currentPath = $derived($page.url.pathname);
  
  // Get user from page data (set in +layout.server.ts)
  let user = $derived($page.data?.user);
  let userRole = $derived(user?.role || null);
  
  // Check if user is logged in
  let isLoggedIn = $derived(!!user);
  
  // Close mobile menu on route change
  $effect(() => {
    if (currentPath) {
      mobileMenuOpen = false;
    }
  });

  // --- Role-based Navigation Definition ---
  const getNavItems = (role: string | null) => {
    if (!role) return [];
    
    const items = [];
    
    // Dashboard - everyone gets this
    items.push({ name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard });
    
    // My Reports - everyone gets this
    items.push({ name: 'My Reports', path: '/reports', icon: BarChart3 });
    
    // Rooms - everyone can view rooms
    items.push({ name: 'Rooms', path: '/rooms', icon: Hotel });
    
    // Night Audit - managers and above
    if (['owner', 'super_admin', 'general_manager'].includes(role)) {
      items.push({ name: 'Night Audit', path: '/audit', icon: SearchCheck });
    }
    
    // Front Desk - front desk managers and above
    if (['owner', 'super_admin', 'general_manager', 'front_desk_manager'].includes(role)) {
      items.push({ name: 'Front Desk', path: '/front-desk', icon: UserCheck });
    }
    
    // Inventory & Store Management
    if (['owner', 'super_admin', 'general_manager', 'store_keeper', 'store_keeper_bar', 'store_keeper_kitchen', 'store_keeper_store'].includes(role)) {
      items.push({ name: 'Inventory', path: '/inventory', icon: Package });
      items.push({ name: 'Suppliers', path: '/suppliers', icon: Truck });
    }
    
    // Bar & Kitchen - store keepers
    if (['store_keeper', 'store_keeper_bar', 'store_keeper_kitchen', 'store_keeper_store'].includes(role)) {
      items.push({ name: 'Bar & Kitchen', path: '/bar-kitchen', icon: ClipboardList });
    }
    
    // Staff Management - managers and above
    if (['owner', 'super_admin', 'general_manager'].includes(role)) {
      items.push({ name: 'Staff Management', path: '/staff', icon: Users });
    }
    
    // Power Log - managers and above
    if (['owner', 'super_admin', 'general_manager'].includes(role)) {
      items.push({ name: 'Power Log', path: '/power', icon: Zap });
    }
    
    // Time Tracking - cleaners and staff
    if (['cleaner', 'staff'].includes(role)) {
      items.push({ name: 'Time Tracking', path: '/time-tracking', icon: Clock });
    }
    
    // Admin Settings - owners and super admins
    if (['owner', 'super_admin'].includes(role)) {
      items.push({ name: 'Admin', path: '/admin/settings', icon: Settings });
    }
    
    return items;
  };
  
  let navItems = $derived(getNavItems(userRole));

  // --- Single Source of Truth for Logout ---
  async function handleSignOut() {
    if (isLoggingOut) return;
    
    isLoggingOut = true;
    try {
      const response = await fetch('/api/auth/signout', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      mobileMenuOpen = false;
      await goto('/login');
    } catch (err) {
      console.error('Logout error:', err);
      await goto('/login');
    } finally {
      isLoggingOut = false;
    }
  }

  function isActive(path: string) {
    return currentPath === path || currentPath.startsWith(path + '/')
      ? 'bg-indigo-50 text-indigo-700' 
      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900';
  }
  
  let { children } = $props();
</script>

{#if !isLoggedIn}
  <!-- No user logged in - just render children without layout -->
  <main>
    {@render children?.()}
  </main>
{:else}
  <!-- User is logged in - show full layout -->
  <!-- Mobile Menu Overlay -->
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

        <div class="px-6 py-4 border-b border-slate-50">
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Logged in as</p>
          <p class="text-sm font-black text-slate-900">{user?.name || 'User'}</p>
          <p class="text-xs text-slate-500 capitalize mt-0.5">{userRole?.replace(/_/g, ' ') || 'Staff'}</p>
          {#if user?.staffId}
            <p class="text-[9px] font-mono text-slate-400 mt-1">ID: {user.staffId}</p>
          {/if}
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
            {isLoggingOut ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Desktop Layout -->
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

        <div class="px-6 py-4 border-b border-slate-50">
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Logged in as</p>
          <p class="text-sm font-black text-slate-900">{user?.name || 'User'}</p>
          <p class="text-xs text-slate-500 capitalize mt-0.5">{userRole?.replace(/_/g, ' ') || 'Staff'}</p>
          {#if user?.staffId}
            <p class="text-[9px] font-mono text-slate-400 mt-1">ID: {user.staffId}</p>
          {/if}
        </div>

        <nav class="flex-1 px-6 space-y-1.5 mt-4 overflow-y-auto">
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
            {isLoggingOut ? 'Signing out...' : 'Sign Out'}
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
      
      <!-- Mobile Header with Hamburger -->
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
        {@render children?.()}
      </main>
      
    </div>
  </div>
{/if}

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