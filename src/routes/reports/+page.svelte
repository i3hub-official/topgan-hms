<script lang="ts">
  import { page } from '$app/stores';
  import { 
    BarChart3, TrendingUp, Users, DollarSign, 
    Clock, Calendar, CheckCircle2, Activity,
    Hotel, CreditCard, Banknote, Smartphone,
    Download, Filter, ChevronDown, ChevronUp
  } from 'lucide-svelte';
  
  let { data } = $props();
  
  let personalShifts = $derived(data.personalShifts);
  let personalTransactions = $derived(data.personalTransactions);
  let personalStats = $derived(data.personalStats);
  let aggregatedData = $derived(data.aggregatedData);
  let roomStats = $derived(data.roomStats);
  let staffStats = $derived(data.staffStats);
  let recentActivity = $derived(data.recentActivity);
  let user = $derived(data.user);
  let isManager = $derived(data.isManager);
  
  let showShifts = $state(true);
  let showTransactions = $state(true);
  
  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  }
  
  function formatDate(date: Date | string) {
    return new Date(date).toLocaleDateString();
  }
  
  function formatTime(date: Date | string | null) {
    if (!date) return '--:--';
    return new Date(date).toLocaleTimeString();
  }
</script>

<div class="min-h-screen bg-slate-50/50 p-8">
  <div class="max-w-7xl mx-auto">
    
    <header class="mb-8">
      <h1 class="text-3xl font-black text-slate-900 tracking-tight">My Reports</h1>
      <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
        Personal Analytics & Performance
      </p>
    </header>

    <!-- Personal Stats Overview -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div class="bg-white rounded-2xl p-5 border border-slate-100">
        <div class="p-2 bg-indigo-50 rounded-lg w-fit mb-3">
          <Clock size={18} class="text-indigo-600" />
        </div>
        <p class="text-[10px] font-black text-slate-400 uppercase">Total Hours</p>
        <p class="text-2xl font-black text-slate-900">{personalStats.totalHours} hrs</p>
      </div>
      
      <div class="bg-white rounded-2xl p-5 border border-slate-100">
        <div class="p-2 bg-emerald-50 rounded-lg w-fit mb-3">
          <Calendar size={18} class="text-emerald-600" />
        </div>
        <p class="text-[10px] font-black text-slate-400 uppercase">Total Shifts</p>
        <p class="text-2xl font-black text-slate-900">{personalStats.totalShifts}</p>
      </div>
      
      <div class="bg-white rounded-2xl p-5 border border-slate-100">
        <div class="p-2 bg-amber-50 rounded-lg w-fit mb-3">
          <CheckCircle2 size={18} class="text-amber-600" />
        </div>
        <p class="text-[10px] font-black text-slate-400 uppercase">Completed Shifts</p>
        <p class="text-2xl font-black text-slate-900">{personalStats.completedShifts}</p>
      </div>
      
      <div class="bg-white rounded-2xl p-5 border border-slate-100">
        <div class="p-2 bg-purple-50 rounded-lg w-fit mb-3">
          <TrendingUp size={18} class="text-purple-600" />
        </div>
        <p class="text-[10px] font-black text-slate-400 uppercase">Avg Hours/Shift</p>
        <p class="text-2xl font-black text-slate-900">{personalStats.averageHoursPerShift} hrs</p>
      </div>
    </div>

    <!-- Manager Dashboard (if applicable) -->
    {#if isManager && aggregatedData}
      <div class="mb-8">
        <h2 class="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
          <BarChart3 size={20} />
          Management Overview
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div class="bg-white rounded-2xl p-5 border border-slate-100">
            <p class="text-[10px] font-black text-slate-400 uppercase">Total Revenue (30 days)</p>
            <p class="text-2xl font-black text-emerald-600">{formatCurrency(aggregatedData.totalRevenue)}</p>
          </div>
          
          <div class="bg-white rounded-2xl p-5 border border-slate-100">
            <p class="text-[10px] font-black text-slate-400 uppercase">Total Transactions</p>
            <p class="text-2xl font-black text-slate-900">{aggregatedData.totalTransactions}</p>
          </div>
          
          <div class="bg-white rounded-2xl p-5 border border-slate-100">
            <p class="text-[10px] font-black text-slate-400 uppercase">Avg Transaction Value</p>
            <p class="text-2xl font-black text-slate-900">{formatCurrency(aggregatedData.averageTransactionValue)}</p>
          </div>
        </div>
        
        <!-- Payment Method Breakdown -->
        <div class="bg-white rounded-3xl border border-slate-100 p-6 mb-6">
          <h3 class="text-lg font-black text-slate-800 mb-4">Payment Methods</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <div class="p-2 bg-white rounded-lg">
                <Banknote size={18} class="text-emerald-600" />
              </div>
              <div>
                <p class="text-[10px] font-black text-slate-400 uppercase">Cash</p>
                <p class="text-lg font-black text-slate-900">{formatCurrency(aggregatedData.cashRevenue)}</p>
              </div>
            </div>
            
            <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <div class="p-2 bg-white rounded-lg">
                <CreditCard size={18} class="text-blue-600" />
              </div>
              <div>
                <p class="text-[10px] font-black text-slate-400 uppercase">POS</p>
                <p class="text-lg font-black text-slate-900">{formatCurrency(aggregatedData.posRevenue)}</p>
              </div>
            </div>
            
            <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <div class="p-2 bg-white rounded-lg">
                <Smartphone size={18} class="text-purple-600" />
              </div>
              <div>
                <p class="text-[10px] font-black text-slate-400 uppercase">Transfer</p>
                <p class="text-lg font-black text-slate-900">{formatCurrency(aggregatedData.transferRevenue)}</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Room & Staff Stats -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          {#if roomStats}
            <div class="bg-white rounded-3xl border border-slate-100 p-6">
              <h3 class="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                <Hotel size={18} />
                Room Statistics
              </h3>
              <div class="space-y-3">
                <div class="flex justify-between">
                  <span class="text-sm text-slate-500">Total Rooms</span>
                  <span class="font-bold text-slate-900">{roomStats.total}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm text-slate-500">Occupied</span>
                  <span class="font-bold text-emerald-600">{roomStats.occupied}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm text-slate-500">Available</span>
                  <span class="font-bold text-blue-600">{roomStats.available}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm text-slate-500">Maintenance</span>
                  <span class="font-bold text-amber-600">{roomStats.maintenance}</span>
                </div>
                <div class="pt-2 border-t">
                  <div class="flex justify-between">
                    <span class="text-sm font-bold text-slate-700">Occupancy Rate</span>
                    <span class="font-bold text-indigo-600">{roomStats.occupancyRate}%</span>
                  </div>
                </div>
              </div>
            </div>
          {/if}
          
          {#if staffStats}
            <div class="bg-white rounded-3xl border border-slate-100 p-6">
              <h3 class="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                <Users size={18} />
                Staff Overview
              </h3>
              <div class="space-y-3">
                <div class="flex justify-between">
                  <span class="text-sm text-slate-500">Total Staff</span>
                  <span class="font-bold text-slate-900">{staffStats.total}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm text-slate-500">Active</span>
                  <span class="font-bold text-emerald-600">{staffStats.active}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm text-slate-500">Inactive</span>
                  <span class="font-bold text-rose-600">{staffStats.inactive}</span>
                </div>
              </div>
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Shift History -->
    <div class="mb-8">
      <button
        onclick={() => showShifts = !showShifts}
        class="flex items-center justify-between w-full p-4 bg-white rounded-2xl border border-slate-100 mb-4"
      >
        <div class="flex items-center gap-3">
          <Clock size={20} class="text-indigo-600" />
          <h2 class="text-xl font-black text-slate-800">Shift History</h2>
          <span class="text-xs text-slate-400">({personalShifts.length} shifts)</span>
        </div>
        {#if showShifts}
          <ChevronUp size={18} class="text-slate-400" />
        {:else}
          <ChevronDown size={18} class="text-slate-400" />
        {/if}
      </button>
      
      {#if showShifts}
        {#if personalShifts.length === 0}
          <div class="bg-white rounded-3xl border-2 border-dashed border-slate-100 p-12 text-center">
            <Clock size={48} class="mx-auto text-slate-200 mb-4" />
            <p class="font-black text-slate-400 uppercase tracking-widest">No shift records found</p>
          </div>
        {:else}
          <div class="space-y-3">
            {#each personalShifts as shift (shift.id)}
              <div class="bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md transition-all">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div>
                    <p class="font-black text-slate-900">{formatDate(shift.createdAt)}</p>
                    <div class="flex items-center gap-3 mt-1">
                      <span class="text-xs text-slate-500">In: {formatTime(shift.checkIn)}</span>
                      {#if shift.checkOut}
                        <span class="text-xs text-slate-500">Out: {formatTime(shift.checkOut)}</span>
                      {/if}
                    </div>
                  </div>
                  
                  <div class="flex items-center gap-4">
                    {#if shift.hoursWorked}
                      <div class="text-right">
                        <p class="text-[10px] font-black text-slate-400 uppercase">Hours</p>
                        <p class="text-lg font-black text-emerald-600">{shift.hoursWorked} hrs</p>
                      </div>
                    {/if}
                    
                    {#if shift.location}
                      <div class="text-right">
                        <p class="text-[10px] font-black text-slate-400 uppercase">Location</p>
                        <p class="text-xs font-bold text-slate-600">{shift.location}</p>
                      </div>
                    {/if}
                    
                    {#if !shift.checkOut}
                      <span class="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-black">
                        Active
                      </span>
                    {:else}
                      <span class="px-3 py-1.5 bg-slate-50 text-slate-600 rounded-xl text-xs font-black">
                        Completed
                      </span>
                    {/if}
                  </div>
                </div>
                
                {#if shift.notes}
                  <div class="mt-3 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">
                    📝 {shift.notes}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      {/if}
    </div>

    <!-- Transaction History (for relevant roles) -->
    {#if personalTransactions.length > 0}
      <div>
        <button
          onclick={() => showTransactions = !showTransactions}
          class="flex items-center justify-between w-full p-4 bg-white rounded-2xl border border-slate-100 mb-4"
        >
          <div class="flex items-center gap-3">
            <DollarSign size={20} class="text-emerald-600" />
            <h2 class="text-xl font-black text-slate-800">Transaction History</h2>
            <span class="text-xs text-slate-400">({personalTransactions.length} transactions)</span>
          </div>
          {#if showTransactions}
            <ChevronUp size={18} class="text-slate-400" />
          {:else}
            <ChevronDown size={18} class="text-slate-400" />
          {/if}
        </button>
        
        {#if showTransactions}
          <div class="bg-white rounded-3xl border border-slate-100 overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th class="text-left px-6 py-4 text-xs font-black text-slate-400 uppercase">Date</th>
                    <th class="text-left px-6 py-4 text-xs font-black text-slate-400 uppercase">Guest</th>
                    <th class="text-left px-6 py-4 text-xs font-black text-slate-400 uppercase">Amount</th>
                    <th class="text-left px-6 py-4 text-xs font-black text-slate-400 uppercase">Payment</th>
                    <th class="text-left px-6 py-4 text-xs font-black text-slate-400 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {#each personalTransactions as transaction (transaction.id)}
                    <tr class="border-b border-slate-50 hover:bg-slate-50/50">
                      <td class="px-6 py-4 text-sm text-slate-500">{formatDate(transaction.createdAt)}</td>
                      <td class="px-6 py-4 font-bold text-slate-900">{transaction.guestName}</td>
                      <td class="px-6 py-4 font-bold text-emerald-600">{formatCurrency(transaction.amount)}</td>
                      <td class="px-6 py-4">
                        <span class="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-lg text-xs font-bold">
                          {#if transaction.paymentMethod === 'cash'}
                            <Banknote size={12} />
                          {:else if transaction.paymentMethod === 'pos'}
                            <CreditCard size={12} />
                          {:else}
                            <Smartphone size={12} />
                          {/if}
                          {transaction.paymentMethod}
                        </span>
                      </td>
                      <td class="px-6 py-4">
                        <span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold {transaction.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}">
                          {transaction.status === 'active' ? 'Active' : 'Completed'}
                        </span>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>