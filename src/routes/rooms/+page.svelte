<script lang="ts">
  import { enhance } from '$app/forms';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  
  let rooms = [];
  let loading = true;
  let showCheckIn = false;
  let showCheckOut = false;
  let selectedRoom = null;
  
  onMount(async () => {
    await fetchRooms();
  });
  
  async function fetchRooms() {
    const response = await fetch('/api/rooms');
    if (response.ok) {
      rooms = await response.json();
      loading = false;
    }
  }
  
  function getStatusColor(status) {
    const colors = {
      vacant: 'bg-green-100 text-green-800',
      occupied: 'bg-red-100 text-red-800',
      dirty: 'bg-yellow-100 text-yellow-800',
      maintenance: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100';
  }
  
  async function updateRoomStatus(roomId, status) {
    const response = await fetch(`/api/rooms/${roomId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (response.ok) {
      await fetchRooms();
    }
  }
</script>

<div class="min-h-screen bg-gray-50">
  <div class="max-w-7xl mx-auto px-4 py-8">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Room Management</h1>
          <p class="text-gray-600 mt-2">Manage room status, check-ins, and check-outs</p>
        </div>
        <button
          on:click={() => showCheckIn = true}
          class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + New Check-in
        </button>
      </div>
    </div>
    
    <!-- Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div class="bg-white rounded-lg p-4 shadow">
        <div class="text-sm text-gray-600">Total Rooms</div>
        <div class="text-2xl font-bold">{rooms.length}</div>
      </div>
      <div class="bg-white rounded-lg p-4 shadow">
        <div class="text-sm text-gray-600">Occupied</div>
        <div class="text-2xl font-bold text-red-600">
          {rooms.filter(r => r.status === 'occupied').length}
        </div>
      </div>
      <div class="bg-white rounded-lg p-4 shadow">
        <div class="text-sm text-gray-600">Vacant</div>
        <div class="text-2xl font-bold text-green-600">
          {rooms.filter(r => r.status === 'vacant').length}
        </div>
      </div>
      <div class="bg-white rounded-lg p-4 shadow">
        <div class="text-sm text-gray-600">Occupancy Rate</div>
        <div class="text-2xl font-bold text-blue-600">
          {rooms.length ? Math.round((rooms.filter(r => r.status === 'occupied').length / rooms.length) * 100) : 0}%
        </div>
      </div>
    </div>
    
    <!-- Rooms Grid -->
    {#if loading}
      <div class="text-center py-12">Loading rooms...</div>
    {:else}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {#each rooms as room (room.id)}
          <div class="bg-white rounded-lg shadow hover:shadow-lg transition p-4">
            <div class="flex justify-between items-start mb-3">
              <div>
                <h3 class="text-xl font-bold">Room {room.roomNumber}</h3>
                <p class="text-sm text-gray-600">Floor {room.floor}</p>
              </div>
              <span class={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(room.status)}`}>
                {room.status.toUpperCase()}
              </span>
            </div>
            
            <div class="mt-3">
              <div class="text-2xl font-bold text-blue-600">
                ₦{Number(room.ratePerNight).toLocaleString()}
              </div>
              <div class="text-xs text-gray-500">per night</div>
            </div>
            
            <div class="mt-4 flex gap-2">
              {#if room.status === 'vacant'}
                <button
                  on:click={() => {
                    selectedRoom = room;
                    showCheckIn = true;
                  }}
                  class="flex-1 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                >
                  Check-in
                </button>
              {:else if room.status === 'occupied'}
                <button
                  on:click={() => {
                    selectedRoom = room;
                    showCheckOut = true;
                  }}
                  class="flex-1 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                >
                  Check-out
                </button>
              {/if}
              
              <button
                on:click={() => updateRoomStatus(room.id, 'dirty')}
                class="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                title="Mark as Dirty"
              >
                🧹
              </button>
              
              <button
                on:click={() => updateRoomStatus(room.id, 'maintenance')}
                class="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                title="Maintenance"
              >
                🔧
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<!-- Check-in Modal -->
{#if showCheckIn}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
      <h2 class="text-xl font-bold mb-4">Check-in Guest</h2>
      <form method="POST" action="/api/check-in" use:enhance>
        <input type="hidden" name="roomId" value={selectedRoom?.id} />
        
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">Guest Name</label>
          <input type="text" name="guestName" class="w-full px-3 py-2 border rounded" required />
        </div>
        
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">Amount Paid</label>
          <input type="number" name="amountPaid" step="0.01" class="w-full px-3 py-2 border rounded" required />
        </div>
        
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">Payment Method</label>
          <select name="paymentMethod" class="w-full px-3 py-2 border rounded" required>
            <option value="cash">Cash</option>
            <option value="pos">POS</option>
            <option value="transfer">Transfer</option>
            <option value="complimentary">Complimentary</option>
          </select>
        </div>
        
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">Staff Name</label>
          <input type="text" name="createdBy" class="w-full px-3 py-2 border rounded" required />
        </div>
        
        <div class="flex gap-2">
          <button type="submit" class="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
            Confirm Check-in
          </button>
          <button type="button" on:click={() => showCheckIn = false} class="flex-1 bg-gray-300 py-2 rounded hover:bg-gray-400">
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}