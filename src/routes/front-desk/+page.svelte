<script lang="ts">
  import { 
    Hotel, Users, DollarSign, Calendar, 
    Plus, Search, CreditCard, Banknote, Smartphone
  } from 'lucide-svelte';
  
  // Define types
  interface Room {
    id: number;
    roomNumber: string;
    status: string;
    rate: number;
  }
  
  interface Transaction {
    id: number;
    roomId: number | null;
    guestName: string;
    amount: number;
    paymentMethod: string;
    checkIn: Date;
    checkOut: Date | null;
    status: string;
    createdAt: Date | null;
  }
  
  interface Stats {
    totalRooms: number;
    availableRooms: number;
    occupiedRooms: number;
    maintenanceRooms: number;
    todayCheckins: number;
    todayRevenue: number;
  }
  
  let { data } = $props();
  
  let rooms = $derived(data.rooms as Room[]);
  let todayTransactions = $derived(data.todayTransactions as Transaction[]);
  let activeGuests = $derived(data.activeGuests as Transaction[]);
  let stats = $derived(data.stats as Stats);
  
  let showCheckInModal = $state(false);
  let showAddRoomModal = $state(false);
  let searchQuery = $state('');
  let selectedRoom = $state<Room | null>(null);
  
  let guestNameInput: HTMLInputElement;
  let amountInput: HTMLInputElement;
  let paymentMethodSelect: HTMLSelectElement;
  let roomNumberInput: HTMLInputElement;
  let rateInput: HTMLInputElement;
  
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
    formData.append('guestName', guestNameInput.value);
    formData.append('amount', amountInput.value);
    formData.append('paymentMethod', paymentMethodSelect.value);
    
    const response = await fetch('?/checkIn', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      showCheckInModal = false;
      window.location.reload();
    } else {
      const error = await response.json();
      alert(error.message || 'Failed to check in');
    }
  }
  
  async function handleCheckOut(transactionId: number, roomId: number) {
    if (confirm('Are you sure you want to check out this guest?')) {
      const formData = new FormData();
      formData.append('transactionId', transactionId.toString());
      formData.append('roomId', roomId.toString());
      
      const response = await fetch('?/checkOut', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        window.location.reload();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to check out');
      }
    }
  }
  
  async function handleAddRoom() {
    const formData = new FormData();
    formData.append('roomNumber', roomNumberInput.value);
    formData.append('rate', rateInput.value);
    
    const response = await fetch('?/addRoom', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      showAddRoomModal = false;
      window.location.reload();
    } else {
      const error = await response.json();
      alert(error.message || 'Failed to add room');
    }
  }
  
  function getRoomStatusColor(status: string) {
    switch(status) {
      case 'vacant': return 'bg-emerald-100 text-emerald-700';
      case 'occupied': return 'bg-amber-100 text-amber-700';
      case 'maintenance': return 'bg-rose-100 text-rose-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  }
  
  function getRoomStatusText(status: string) {
    switch(status) {
      case 'vacant': return 'Available';
      case 'occupied': return 'Occupied';
      case 'maintenance': return 'Maintenance';
      default: return status;
    }
  }
  
  function formatDate(date: Date | string | null) {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  }
  
  function formatTime(date: Date | string | null) {
    if (!date) return 'N/A';
    return new Date(date).toLocaleTimeString();
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
      <button 
        onclick={() => showAddRoomModal = true}
        class="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all"
      >
        <Plus size={18} />
        Add Room
      </button>
    </header>

    <!-- Stats Overview -->
    <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
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
        <div class="p-2 bg-emerald-50 rounded-lg w-fit mb-3">
          <Calendar size={18} class="text-emerald-600" />
        </div>
        <p class="text-[10px] font-black text-slate-400 uppercase">Today's Check-ins</p>
        <p class="text-2xl font-black text-slate-900">{stats.todayCheckins}</p>
      </div>
      
      <div class="bg-white rounded-2xl p-5 border border-slate-100">
        <div class="p-2 bg-emerald-50 rounded-lg w-fit mb-3">
          <DollarSign size={18} class="text-emerald-600" />
        </div>
        <p class="text-[10px] font-black text-slate-400 uppercase">Today's Revenue</p>
        <p class="text-2xl font-black text-emerald-600">₦{stats.todayRevenue.toLocaleString()}</p>
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
          <div class="bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-lg transition-all">
            <div class="text-center">
              <p class="text-2xl font-black text-slate-900">{room.roomNumber}</p>
              <p class="text-xs font-bold mt-1">₦{room.rate.toLocaleString()}</p>
              <span class="inline-block mt-2 px-2 py-1 rounded-lg text-[10px] font-black {getRoomStatusColor(room.status)}">
                {getRoomStatusText(room.status)}
              </span>
              
              {#if room.status === 'vacant'}
                <button
                  onclick={() => {
                    selectedRoom = room;
                    showCheckInModal = true;
                  }}
                  class="w-full mt-3 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all"
                >
                  Check In
                </button>
              {/if}
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
            <div class="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all">
              <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <p class="font-black text-slate-900 text-lg">{guest.guestName}</p>
                  <p class="text-sm text-slate-500">Room: {guest.roomId}</p>
                  <p class="text-xs text-slate-400">Checked in: {formatDate(guest.checkIn)}</p>
                </div>
                
                <div class="text-right">
                  <p class="text-sm font-bold text-slate-600">Amount: ₦{guest.amount.toLocaleString()}</p>
                  <p class="text-xs text-slate-400 capitalize">Payment: {guest.paymentMethod}</p>
                </div>
                
                <button
                  onclick={() => handleCheckOut(guest.id, guest.roomId!)}
                  class="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-black transition-all"
                >
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
        <div class="bg-white rounded-2xl border border-slate-100 overflow-hidden">
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
                    <td class="px-6 py-4 text-slate-600">{transaction.roomId}</td>
                    <td class="px-6 py-4 font-bold text-emerald-600">₦{transaction.amount.toLocaleString()}</td>
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
                      {formatTime(transaction.createdAt)}
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
{#if showCheckInModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
    <div class="bg-white rounded-3xl max-w-md w-full">
      <div class="p-6 border-b border-slate-100">
        <h2 class="text-2xl font-black text-slate-900">Check In Guest</h2>
        <p class="text-sm text-slate-500">Room {selectedRoom?.roomNumber}</p>
      </div>
      
      <div class="p-6 space-y-4">
        <div>
          <label for="guestName" class="block text-xs font-black text-slate-400 uppercase mb-1">Guest Name</label>
          <input 
            bind:this={guestNameInput}
            id="guestName" 
            type="text" 
            class="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold" 
          />
        </div>
        
        <div>
          <label for="amount" class="block text-xs font-black text-slate-400 uppercase mb-1">Amount (₦)</label>
          <input 
            bind:this={amountInput}
            id="amount" 
            type="number" 
            class="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold" 
          />
        </div>
        
        <div>
          <label for="paymentMethod" class="block text-xs font-black text-slate-400 uppercase mb-1">Payment Method</label>
          <select 
            bind:this={paymentMethodSelect}
            id="paymentMethod" 
            class="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold"
          >
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

<!-- Add Room Modal -->
{#if showAddRoomModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
    <div class="bg-white rounded-3xl max-w-md w-full">
      <div class="p-6 border-b border-slate-100">
        <h2 class="text-2xl font-black text-slate-900">Add New Room</h2>
      </div>
      
      <div class="p-6 space-y-4">
        <div>
          <label for="roomNumber" class="block text-xs font-black text-slate-400 uppercase mb-1">Room Number</label>
          <input 
            bind:this={roomNumberInput}
            id="roomNumber" 
            type="text" 
            class="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold" 
          />
        </div>
        
        <div>
          <label for="rate" class="block text-xs font-black text-slate-400 uppercase mb-1">Rate (₦ per night)</label>
          <input 
            bind:this={rateInput}
            id="rate" 
            type="number" 
            class="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold" 
          />
        </div>
      </div>
      
      <div class="p-6 border-t border-slate-100 flex gap-3">
        <button onclick={() => showAddRoomModal = false} class="flex-1 px-4 py-3 bg-slate-100 rounded-xl font-black text-slate-600">
          Cancel
        </button>
        <button onclick={handleAddRoom} class="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-black">
          Add Room
        </button>
      </div>
    </div>
  </div>
{/if}