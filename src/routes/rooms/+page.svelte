<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { 
    Hotel, Users, Plus, Search, Edit, 
    Power, Trash2, X, Check, ChevronLeft,
    ChevronRight, DoorOpen, LogOut, User,
    Calendar, DollarSign, Clock, AlertTriangle
  } from 'lucide-svelte';
  
  let { data } = $props();
  
  let rooms = $derived(data.rooms);
  let activeTransactions = $derived(data.activeTransactions);
  let recentCheckouts = $derived(data.recentCheckouts);
  let stats = $derived(data.stats);
  let canManage = $derived(data.canManage);
  let user = $derived(data.user);
  
  let showCheckoutModal = $state(false);
  let showAddRoomModal = $state(false);
  let searchQuery = $state('');
  let selectedRoom = $state(null);
  let selectedTransaction = $state(null);
  let checkoutHours = $state(0);
  
  let filteredRooms = $derived(
    rooms.filter(r => 
      r.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.status.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );
  
  function openCheckoutModal(room: any) {
    const transaction = activeTransactions.get(room.id);
    if (transaction) {
      selectedRoom = room;
      selectedTransaction = transaction;
      
      // Calculate hours stayed
      const checkIn = new Date(transaction.checkIn);
      const now = new Date();
      const hours = Math.ceil((now.getTime() - checkIn.getTime()) / (1000 * 60 * 60));
      checkoutHours = hours;
      
      showCheckoutModal = true;
    }
  }
  
  async function handleCheckOut() {
    if (!selectedRoom || !selectedTransaction) return;
    
    const formData = new FormData();
    formData.append('roomId', selectedRoom.id.toString());
    formData.append('transactionId', selectedTransaction.id.toString());
    
    const response = await fetch('?/checkOut', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      showCheckoutModal = false;
      location.reload();
    } else {
      const error = await response.json();
      alert(error.message || 'Failed to check out');
    }
  }
  
  async function handleAddRoom(event: Event) {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    
    const response = await fetch('?/createRoom', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      showAddRoomModal = false;
      location.reload();
    } else {
      alert('Failed to add room');
    }
  }
  
  async function handleUpdateRoomStatus(roomId: number, currentStatus: string) {
    let newStatus = '';
    if (currentStatus === 'vacant') newStatus = 'maintenance';
    else if (currentStatus === 'maintenance') newStatus = 'vacant';
    else if (currentStatus === 'occupied') newStatus = 'vacant';
    else newStatus = 'vacant';
    
    const formData = new FormData();
    formData.append('roomId', roomId.toString());
    formData.append('status', newStatus);
    
    const response = await fetch('?/updateRoomStatus', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      location.reload();
    } else {
      alert('Failed to update room status');
    }
  }
  
  async function handleDeleteRoom(roomId: number, roomNumber: string) {
    if (confirm(`Are you sure you want to delete room ${roomNumber}? This action can be undone by reactivating.`)) {
      const formData = new FormData();
      formData.append('roomId', roomId.toString());
      
      const response = await fetch('?/deleteRoom', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        location.reload();
      } else {
        alert('Failed to delete room');
      }
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
        <h1 class="text-3xl font-black text-slate-900 tracking-tight">Room Management</h1>
        <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
          View Rooms & Check-out Guests
        </p>
      </div>
      {#if canManage}
        <button 
          onclick={() => showAddRoomModal = true}
          class="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all"
        >
          <Plus size={18} />
          Add Room
        </button>
      {/if}
    </header>

    <!-- Stats Overview -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div class="bg-white rounded-2xl p-5 border border-slate-100">
        <div class="p-2 bg-indigo-50 rounded-lg w-fit mb-3">
          <Hotel size={18} class="text-indigo-600" />
        </div>
        <p class="text-[10px] font-black text-slate-400 uppercase">Total Rooms</p>
        <p class="text-2xl font-black text-slate-900">{stats.total}</p>
      </div>
      
      <div class="bg-white rounded-2xl p-5 border border-slate-100">
        <div class="p-2 bg-emerald-50 rounded-lg w-fit mb-3">
          <DoorOpen size={18} class="text-emerald-600" />
        </div>
        <p class="text-[10px] font-black text-slate-400 uppercase">Available</p>
        <p class="text-2xl font-black text-emerald-600">{stats.available}</p>
      </div>
      
      <div class="bg-white rounded-2xl p-5 border border-slate-100">
        <div class="p-2 bg-amber-50 rounded-lg w-fit mb-3">
          <Users size={18} class="text-amber-600" />
        </div>
        <p class="text-[10px] font-black text-slate-400 uppercase">Occupied</p>
        <p class="text-2xl font-black text-amber-600">{stats.occupied}</p>
      </div>
      
      <div class="bg-white rounded-2xl p-5 border border-slate-100">
        <div class="p-2 bg-rose-50 rounded-lg w-fit mb-3">
          <AlertTriangle size={18} class="text-rose-600" />
        </div>
        <p class="text-[10px] font-black text-slate-400 uppercase">Maintenance</p>
        <p class="text-2xl font-black text-rose-600">{stats.maintenance}</p>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="bg-white rounded-2xl p-4 mb-6 border border-slate-100">
      <div class="relative">
        <Search size={18} class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input 
          type="text" 
          bind:value={searchQuery}
          placeholder="Search by room number or status..." 
          class="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
    </div>

    <!-- Rooms Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
      {#each filteredRooms as room (room.id)}
        {@const activeTransaction = activeTransactions.get(room.id)}
        <div class="bg-white rounded-3xl border border-slate-100 overflow-hidden hover:shadow-xl transition-all group">
          <div class="p-6">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                  <Hotel size={22} class="text-slate-400" />
                </div>
                <div>
                  <h3 class="font-black text-2xl text-slate-900">Room {room.roomNumber}</h3>
                  <p class="text-xs font-bold text-indigo-600">{formatCurrency(room.rate)}/night</p>
                </div>
              </div>
              {#if canManage}
                <div class="flex gap-1">
                  <button
                    onclick={() => handleUpdateRoomStatus(room.id, room.status)}
                    class="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Change Status"
                  >
                    <Edit size={14} class="text-slate-400" />
                  </button>
                  <button
                    onclick={() => handleDeleteRoom(room.id, room.roomNumber)}
                    class="p-1.5 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Room"
                  >
                    <Trash2 size={14} class="text-rose-400" />
                  </button>
                </div>
              {/if}
            </div>
            
            <div class="mb-4">
              <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black {getRoomStatusColor(room.status)}">
                {getRoomStatusText(room.status)}
              </span>
            </div>
            
            {#if room.status === 'occupied' && activeTransaction}
              <div class="border-t border-slate-100 pt-4 mb-4">
                <div class="flex items-center gap-2 mb-2">
                  <User size={14} class="text-slate-400" />
                  <p class="text-sm font-bold text-slate-700">{activeTransaction.guestName}</p>
                </div>
                <div class="flex items-center gap-2 text-xs text-slate-500">
                  <Calendar size={12} />
                  <span>Checked in: {formatDate(activeTransaction.checkIn)}</span>
                </div>
              </div>
              
              <button
                onclick={() => openCheckoutModal(room)}
                class="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2"
              >
                <LogOut size={16} />
                Check Out Guest
              </button>
            {:else if room.status === 'vacant'}
              <div class="border-t border-slate-100 pt-4">
                <p class="text-center text-sm text-slate-400">Ready for check-in</p>
              </div>
            {:else if room.status === 'maintenance'}
              <div class="border-t border-slate-100 pt-4">
                <p class="text-center text-sm text-rose-500">Under maintenance</p>
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>

    <!-- Recent Checkouts -->
    {#if recentCheckouts.length > 0}
      <div>
        <h2 class="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
          <Clock size={20} />
          Recent Check-outs
        </h2>
        
        <div class="bg-white rounded-3xl border border-slate-100 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th class="text-left px-6 py-4 text-xs font-black text-slate-400 uppercase">Room</th>
                  <th class="text-left px-6 py-4 text-xs font-black text-slate-400 uppercase">Guest</th>
                  <th class="text-left px-6 py-4 text-xs font-black text-slate-400 uppercase">Check-in</th>
                  <th class="text-left px-6 py-4 text-xs font-black text-slate-400 uppercase">Check-out</th>
                  <th class="text-left px-6 py-4 text-xs font-black text-slate-400 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody>
                {#each recentCheckouts as checkout (checkout.id)}
                  <tr class="border-b border-slate-50 hover:bg-slate-50/50">
                    <td class="px-6 py-4 font-bold text-slate-900">
                      Room {rooms.find(r => r.id === checkout.roomId)?.roomNumber || checkout.roomId}
                    </td>
                    <td class="px-6 py-4 font-bold text-slate-700">{checkout.guestName}</td>
                    <td class="px-6 py-4 text-sm text-slate-500">{formatDate(checkout.checkIn)}</td>
                    <td class="px-6 py-4 text-sm text-slate-500">
                      {#if checkout.checkOut}
                        {formatDate(checkout.checkOut)}
                      {:else}
                        --
                      {/if}
                    </td>
                    <td class="px-6 py-4 font-bold text-emerald-600">{formatCurrency(checkout.amount)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- Check-out Modal -->
{#if showCheckoutModal && selectedRoom && selectedTransaction}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
    <div class="bg-white rounded-3xl max-w-md w-full">
      <div class="p-6 border-b border-slate-100">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-black text-slate-900">Check Out Guest</h2>
            <p class="text-sm text-slate-500">Room {selectedRoom.roomNumber}</p>
          </div>
          <button onclick={() => showCheckoutModal = false} class="p-2 hover:bg-slate-100 rounded-xl">
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
        
        <div class="bg-amber-50 rounded-xl p-3">
          <p class="text-xs text-amber-700 flex items-center gap-2">
            <AlertTriangle size={12} />
            Confirm check-out to free up this room for new guests
          </p>
        </div>
      </div>
      
      <div class="p-6 border-t border-slate-100 flex gap-3">
        <button onclick={() => showCheckoutModal = false} class="flex-1 px-4 py-3 bg-slate-100 rounded-xl font-black text-slate-600">
          Cancel
        </button>
        <button onclick={handleCheckOut} class="flex-1 px-4 py-3 bg-rose-600 text-white rounded-xl font-black">
          Confirm Check Out
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Add Room Modal (Only for managers) -->
{#if showAddRoomModal && canManage}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
    <div class="bg-white rounded-3xl max-w-md w-full">
      <form onsubmit={handleAddRoom}>
        <div class="p-6 border-b border-slate-100">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-black text-slate-900">Add New Room</h2>
              <p class="text-sm text-slate-500">Create a new room</p>
            </div>
            <button type="button" onclick={() => showAddRoomModal = false} class="p-2 hover:bg-slate-100 rounded-xl">
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase mb-1">Room Number</label>
            <input type="text" name="roomNumber" required class="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold" />
          </div>
          
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase mb-1">Rate (₦ per night)</label>
            <input type="number" name="rate" required class="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold" />
          </div>
        </div>
        
        <div class="p-6 border-t border-slate-100 flex gap-3">
          <button type="button" onclick={() => showAddRoomModal = false} class="flex-1 px-4 py-3 bg-slate-100 rounded-xl font-black text-slate-600">
            Cancel
          </button>
          <button type="submit" class="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-black">
            Add Room
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}