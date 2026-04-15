<script lang="ts">
  import { onMount } from 'svelte';
  
  let rooms: any[] = [];
  let showCheckIn = false;
  let selectedRoom: any = null;
  let form = {
    guestName: '',
    amount: 0,
    paymentMethod: 'cash',
    nights: 1
  };
  
  onMount(async () => {
    await loadRooms();
  });
  
  async function loadRooms() {
    const res = await fetch('/api/rooms');
    rooms = await res.json();
  }
  
  async function handleCheckIn() {
    const res = await fetch('/api/transactions/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: selectedRoom.id,
        guestName: form.guestName,
        amount: form.amount * form.nights,
        paymentMethod: form.paymentMethod
      })
    });
    
    if (res.ok) {
      showCheckIn = false;
      await loadRooms();
      form = { guestName: '', amount: 0, paymentMethod: 'cash', nights: 1 };
    }
  }
  
  async function handleCheckOut(roomId: number) {
    if (confirm('Process check-out for this room?')) {
      await fetch(`/api/transactions/checkout/${roomId}`, { method: 'POST' });
      await loadRooms();
    }
  }
</script>

<div class="min-h-screen bg-white">
  <div class="bg-crimson text-white px-6 py-4">
    <h1 class="text-2xl font-bold">Room Register</h1>
    <p class="text-sm opacity-90">Digital check-in/out & payment tracking</p>
  </div>
  
  <div class="p-6">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each rooms as room (room.id)}
        <div class="border rounded-lg overflow-hidden shadow-sm">
          <div class="p-4 border-b">
            <div class="flex justify-between items-center">
              <h3 class="text-lg font-bold">Room {room.roomNumber}</h3>
              <span class="px-2 py-1 text-xs rounded-full {room.status === 'occupied' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}">
                {room.status}
              </span>
            </div>
            <p class="text-sm text-gray-600 mt-1">₦{room.rate}/night</p>
          </div>
          
          <div class="p-4 bg-gray-50">
            {#if room.status === 'vacant'}
              <button
                onclick={() => { selectedRoom = room; showCheckIn = true; }}
                class="w-full px-4 py-2 bg-crimson text-white rounded-md hover:bg-crimson-dark"
              >
                Check In
              </button>
            {:else if room.status === 'occupied'}
              <button
                onclick={() => handleCheckOut(room.id)}
                class="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Check Out
              </button>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </div>
  
  <!-- Check-in Modal -->
  {#if showCheckIn}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg max-w-md w-full p-6">
        <h2 class="text-xl font-bold mb-4">Check-in Room {selectedRoom?.roomNumber}</h2>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Guest Name</label>
            <input bind:value={form.guestName} type="text" class="mt-1 block w-full border rounded-md px-3 py-2" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">Rate (₦/night)</label>
            <input bind:value={form.amount} type="number" class="mt-1 block w-full border rounded-md px-3 py-2" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">Nights</label>
            <input bind:value={form.nights} type="number" min="1" class="mt-1 block w-full border rounded-md px-3 py-2" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">Payment Method</label>
            <select bind:value={form.paymentMethod} class="mt-1 block w-full border rounded-md px-3 py-2">
              <option value="cash">Cash</option>
              <option value="pos">POS</option>
              <option value="transfer">Bank Transfer</option>
            </select>
          </div>
          
          <div class="pt-4 flex gap-3">
            <button onclick={handleCheckIn} class="flex-1 px-4 py-2 bg-crimson text-white rounded-md">Confirm</button>
            <button onclick={() => showCheckIn = false} class="flex-1 px-4 py-2 border rounded-md">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>