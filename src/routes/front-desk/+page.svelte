<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { 
    Hotel, Users, DollarSign, Calendar, 
    Plus, Search, CreditCard, Banknote, Smartphone,
    LogIn, LogOut, Power, AlertTriangle, 
    Wrench, X, Check, User, Clock, Menu
  } from 'lucide-svelte';
  
  // Use $props() instead of export let
  let { data } = $props();
  
  let rooms = $derived(data.rooms);
  let todayTransactions = $derived(data.todayTransactions);
  let activeGuests = $derived(data.activeGuests);
  let stats = $derived(data.stats);
  let user = $derived(data.user);
  let permissions = $derived(data.permissions);
  
  let showCheckInModal = $state(false);
  let showCheckOutModal = $state(false);
  let searchQuery = $state('');
  let selectedRoom = $state(null);
  let selectedTransaction = $state(null);
  let checkoutHours = $state(0);
  
  let filteredRooms = $derived(
    rooms.filter(r => 
      r.roomNumber.includes(searchQuery) ||
      r.status.includes(searchQuery)
    )
  );
  
  async function handleCheckIn() {
    if (!selectedRoom) return;
    
    const formData = new FormData();
    formData.append('roomId', selectedRoom.id.toString());
    formData.append('guestName', (document.getElementById('guestName') as HTMLInputElement).value);
    formData.append('amount', (document.getElementById('amount') as HTMLInputElement).value);
    formData.append('paymentMethod', (document.getElementById('paymentMethod') as HTMLSelectElement).value);
    
    const response = await fetch('?/checkIn', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      showCheckInModal = false;
      location.reload();
    } else {
      const error = await response.json();
      alert(error.message || 'Failed to check in');
    }
  }
  
  function openCheckOutModal(transaction: any, room: any) {
    selectedTransaction = transaction;
    selectedRoom = room;
    
    const checkIn = new Date(transaction.checkIn);
    const now = new Date();
    const hours = Math.ceil((now.getTime() - checkIn.getTime()) / (1000 * 60 * 60));
    checkoutHours = hours;
    
    showCheckOutModal = true;
  }
  
  async function handleCheckOut() {
    if (!selectedTransaction || !selectedRoom) return;
    
    const formData = new FormData();
    formData.append('transactionId', selectedTransaction.id.toString());
    formData.append('roomId', selectedRoom.id.toString());
    
    const response = await fetch('?/checkOut', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      showCheckOutModal = false;
      location.reload();
    } else {
      const error = await response.json();
      alert(error.message || 'Failed to check out');
    }
  }
  
  async function toggleMaintenance(roomId: number) {
    const formData = new FormData();
    formData.append('roomId', roomId.toString());
    
    const response = await fetch('?/toggleMaintenance', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      location.reload();
    } else {
      const error = await response.json();
      alert(error.message || 'Failed to toggle maintenance');
    }
  }
  
  async function toggleRoomActive(roomId: number) {
    const formData = new FormData();
    formData.append('roomId', roomId.toString());
    
    const response = await fetch('?/toggleRoomActive', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      location.reload();
    } else {
      const error = await response.json();
      alert(error.message || 'Failed to toggle room status');
    }
  }
  
  function getRoomStatusColor(status: string, isActive: boolean) {
    if (!isActive) return 'bg-slate-300 text-slate-600';
    switch(status) {
      case 'vacant': return 'bg-emerald-100 text-emerald-700';
      case 'occupied': return 'bg-amber-100 text-amber-700';
      case 'maintenance': return 'bg-rose-100 text-rose-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  }
  
  function getRoomStatusText(status: string, isActive: boolean) {
    if (!isActive) return 'Discontinued';
    switch(status) {
      case 'vacant': return 'Available';
      case 'occupied': return 'Occupied';
      case 'maintenance': return 'Maintenance';
      default: return status;
    }
  }
  
  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  }
  
  function formatDate(date: Date | string) {
    return new Date(date).toLocaleString();
  }
</script>

<div class="min-h-screen bg-slate-50/50 p-8">
  <div class="max-w-7xl mx-auto">
    
    <header class="flex items-center justify-between mb-8 flex-wrap gap-4">
      <div>
        <h1 class="text-3xl font-black text-slate-900 tracking-tight">Front Desk</h1>
        <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
          Check-in / Check-out & Room Management
        </p>
      </div>
    </header>

    <!-- Stats Overview -->
    <div class="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
      <div class="bg-white rounded-2xl p-5 border border-slate-100">
        <div class="p-2 bg-indigo-50 rounded-lg w-fit mb-3">
          <Hotel size={18} class="text-indigo-600" />
        </div>
        <p class="text-[10px] font-black text-slate-400 uppercase">Total Rooms</p>
        <p class="text-2xl font-black text-slate-900">{stats.totalRooms}</p>
      </div>
      
      <div class="bg-white rounded-2xl p-5 border border-slate-100">
        <div class="p-2 bg-emerald-50 rounded-lg w-fit mb-3">
          <Hotel size={18} class="text-emerald-600" />
        </div>
        <p class="text-[10px] font-black text-slate-400 uppercase">Available</p>
        <p class="text-2xl font-black text-emerald-600">{stats.availableRooms}</p>
      </div>
      
      <div class="bg-white rounded-2xl p-5 border border-slate-100">
        <div class="p-2 bg-amber-50 rounded-lg w-fit mb-3">
          <Users size={18} class="text-amber-600" />
        </div>
        <p class="text-[10px] font-black text-slate-400 uppercase">Occupied</p>
        <p class="text-2xl font-black text-amber-600">{stats.occupiedRooms}</p>
      </div>
      
      <div class="bg-white rounded-2xl p-5 border border-slate-100">
        <div class="p-2 bg-rose-50 rounded-lg w-fit mb-3">
          <Wrench size={18} class="text-rose-600" />
        </div>
        <p class="text-[10px] font-black text-slate-400 uppercase">Maintenance</p>
        <p class="text-2xl font-black text-rose-600">{stats.maintenanceRooms}</p>
      </div>
      
      <div class="bg-white rounded-2xl p-5 border border-slate-100">
        <div class="p-2 bg-slate-50 rounded-lg w-fit mb-3">
          <Calendar size={18} class="text-slate-400" />
        </div>
        <p class="text-[10px] font-black text-slate-400 uppercase">Today's Check-ins</p>
        <p class="text-2xl font-black text-slate-900">{stats.todayCheckins}</p>
      </div>
      
      <div class="bg-white rounded-2xl p-5 border border-slate-100">
        <div class="p-2 bg-emerald-50 rounded-lg w-fit mb-3">
          <DollarSign size={18} class="text-emerald-600" />
        </div>
        <p class="text-[10px] font-black text-slate-400 uppercase">Today's Revenue</p>
        <p class="text-2xl font-black text-emerald-600">{formatCurrency(stats.todayRevenue)}</p>
      </div>
    </div>

    <!-- Rooms Grid -->
    <div class="mb-12">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-black text-slate-800">Room Status</h2>
        <div class="relative">
          <Search size={18} class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            bind:value={searchQuery}
            placeholder="Search rooms..." 
            class="pl-10 pr-4 py-2 bg-white border border-slate-100 rounded-xl text-sm font-bold"
          />
        </div>
      </div>
      
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {#each filteredRooms as room (room.id)}
          <div class="bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-lg transition-all {!room.isActive ? 'opacity-60' : ''}">
            <div class="text-center">
              <p class="text-2xl font-black text-slate-900">{room.roomNumber}</p>
              <p class="text-xs font-bold mt-1">{formatCurrency(room.rate)}/night</p>
              <span class="inline-block mt-2 px-2 py-1 rounded-lg text-[10px] font-black {getRoomStatusColor(room.status, room.isActive)}">
                {getRoomStatusText(room.status, room.isActive)}
              </span>
              
              <div class="flex flex-col gap-2 mt-3">
                {#if room.status === 'vacant' && room.isActive}
                  <button
                    onclick={() => {
                      selectedRoom = room;
                      showCheckInModal = true;
                    }}
                    class="w-full px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all"
                  >
                    <LogIn size={12} class="inline mr-1" />
                    Check In
                  </button>
                {/if}
                
                {#if permissions.canToggleMaintenance && room.isActive}
                  <button
                    onclick={() => toggleMaintenance(room.id)}
                    class="w-full px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black transition-all"
                  >
                    <Wrench size={12} class="inline mr-1" />
                    {room.status === 'maintenance' ? 'End Maintenance' : 'Maintenance'}
                  </button>
                {/if}
                
                {#if permissions.canDisableRoom}
                  <button
                    onclick={() => toggleRoomActive(room.id)}
                    class="w-full px-3 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-xl text-xs font-black transition-all"
                  >
                    <Power size={12} class="inline mr-1" />
                    {room.isActive ? 'Discontinue' : 'Reactivate'}
                  </button>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Active Guests -->
    <div class="mb-12">
      <h2 class="text-xl font-black text-slate-800 mb-6">Active Guests</h2>
      
      {#if activeGuests.length === 0}
        <div class="bg-white rounded-3xl border-2 border-dashed border-slate-100 p-12 text-center">
          <Users size={48} class="mx-auto text-slate-200 mb-4" />
          <p class="font-black text-slate-400 uppercase tracking-widest">No active guests</p>
        </div>
      {:else}
        <div class="space-y-3">
          {#each activeGuests as guest (guest.id)}
            {@const room = rooms.find(r => r.id === guest.roomId)}
            <div class="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all">
              <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <p class="font-black text-slate-900 text-lg">{guest.guestName}</p>
                  <p class="text-sm text-slate-500">Room: {room?.roomNumber || guest.roomId}</p>
                  <div class="flex items-center gap-3 mt-1">
                    <p class="text-xs text-slate-400">
                      <Clock size={10} class="inline mr-1" />
                      Checked in: {formatDate(guest.checkIn)}
                    </p>
                  </div>
                </div>
                
                <div class="text-right">
                  <p class="text-sm font-bold text-slate-600">Amount: {formatCurrency(guest.amount)}</p>
                  <p class="text-xs text-slate-400 capitalize">Payment: {guest.paymentMethod}</p>
                </div>
                
                <button
                  onclick={() => openCheckOutModal(guest, room)}
                  class="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-black transition-all"
                >
                  <LogOut size={14} class="inline mr-1" />
                  Check Out
                </button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Today's Transactions -->
    <div>
      <h2 class="text-xl font-black text-slate-800 mb-6">Today's Transactions</h2>
      
      {#if todayTransactions.length === 0}
        <div class="bg-white rounded-3xl border-2 border-dashed border-slate-100 p-12 text-center">
          <DollarSign size={48} class="mx-auto text-slate-200 mb-4" />
          <p class="font-black text-slate-400 uppercase tracking-widest">No transactions today</p>
        </div>
      {:else}
        <div class="bg-white rounded-3xl border border-slate-100 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th class="text-left px-6 py-4 text-xs font-black text-slate-400 uppercase">Guest</th>
                  <th class="text-left px-6 py-4 text-xs font-black text-slate-400 uppercase">Room</th>
                  <th class="text-left px-6 py-4 text-xs font-black text-slate-400 uppercase">Amount</th>
                  <th class="text-left px-6 py-4 text-xs font-black text-slate-400 uppercase">Payment</th>
                  <th class="text-left px-6 py-4 text-xs font-black text-slate-400 uppercase">Time</th>
                  <th class="text-left px-6 py-4 text-xs font-black text-slate-400 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {#each todayTransactions as transaction (transaction.id)}
                  <tr class="border-b border-slate-50 hover:bg-slate-50/50">
                    <td class="px-6 py-4 font-bold text-slate-900">{transaction.guestName}</td>
                    <td class="px-6 py-4 text-slate-600">
                      {rooms.find(r => r.id === transaction.roomId)?.roomNumber || transaction.roomId}
                    </td>
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
                    <td class="px-6 py-4 text-sm text-slate-500">
                      {new Date(transaction.createdAt).toLocaleTimeString()}
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
  </div>
</div>

<!-- Check-in Modal -->
{#if showCheckInModal && selectedRoom}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
    <div class="bg-white rounded-3xl max-w-md w-full">
      <div class="p-6 border-b border-slate-100">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-black text-slate-900">Check In Guest</h2>
            <p class="text-sm text-slate-500">Room {selectedRoom.roomNumber}</p>
          </div>
          <button onclick={() => showCheckInModal = false} class="p-2 hover:bg-slate-100 rounded-xl">
            <X size={20} />
          </button>
        </div>
      </div>
      
      <div class="p-6 space-y-4">
        <div>
          <label class="block text-xs font-black text-slate-400 uppercase mb-1">Guest Name</label>
          <input id="guestName" type="text" class="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold" />
        </div>
        
        <div>
          <label class="block text-xs font-black text-slate-400 uppercase mb-1">Amount (₦)</label>
          <input id="amount" type="number" class="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold" />
        </div>
        
        <div>
          <label class="block text-xs font-black text-slate-400 uppercase mb-1">Payment Method</label>
          <select id="paymentMethod" class="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold">
            <option value="cash">Cash</option>
            <option value="pos">POS</option>
            <option value="transfer">Bank Transfer</option>
          </select>
        </div>
      </div>
      
      <div class="p-6 border-t border-slate-100 flex gap-3">
        <button onclick={() => showCheckInModal = false} class="flex-1 px-4 py-3 bg-slate-100 rounded-xl font-black text-slate-600">
          Cancel
        </button>
        <button onclick={handleCheckIn} class="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-black">
          Check In
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Check-out Modal -->
{#if showCheckOutModal && selectedTransaction && selectedRoom}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
    <div class="bg-white rounded-3xl max-w-md w-full">
      <div class="p-6 border-b border-slate-100">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-black text-slate-900">Check Out Guest</h2>
            <p class="text-sm text-slate-500">Room {selectedRoom.roomNumber}</p>
          </div>
          <button onclick={() => showCheckOutModal = false} class="p-2 hover:bg-slate-100 rounded-xl">
            <X size={20} />
          </button>
        </div>
      </div>
      
      <div class="p-6 space-y-4">
        <div class="bg-slate-50 rounded-xl p-4">
          <div class="flex items-center gap-3 mb-3">
            <User size={18} class="text-indigo-600" />
            <span class="font-black text-slate-800">{selectedTransaction.guestName}</span>
          </div>
          <div class="flex items-center gap-3 text-sm text-slate-600">
            <Calendar size={14} />
            <span>Checked in: {formatDate(selectedTransaction.checkIn)}</span>
          </div>
          <div class="flex items-center gap-3 text-sm text-slate-600 mt-2">
            <Clock size={14} />
            <span>Duration: {checkoutHours} hour{checkoutHours !== 1 ? 's' : ''}</span>
          </div>
          <div class="flex items-center gap-3 text-sm text-slate-600 mt-2 pt-2 border-t border-slate-200">
            <DollarSign size={14} />
            <span class="font-bold text-emerald-600">Amount: {formatCurrency(selectedTransaction.amount)}</span>
          </div>
        </div>
      </div>
      
      <div class="p-6 border-t border-slate-100 flex gap-3">
        <button onclick={() => showCheckOutModal = false} class="flex-1 px-4 py-3 bg-slate-100 rounded-xl font-black text-slate-600">
          Cancel
        </button>
        <button onclick={handleCheckOut} class="flex-1 px-4 py-3 bg-rose-600 text-white rounded-xl font-black">
          Confirm Check Out
        </button>
      </div>
    </div>
  </div>
{/if}