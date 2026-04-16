<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    BedDouble, 
    UserPlus, 
    LogOut, 
    CreditCard, 
    Banknote, 
    ArrowRightLeft,
    Clock,
    X
  } from 'lucide-svelte';

  // --- Svelte 5 State Runes ---
  let rooms = $state<any[]>([]);
  let showCheckIn = $state(false);
  let selectedRoom = $state<any>(null);
  
  let form = $state({
    guestName: '',
    amount: 0,
    paymentMethod: 'cash',
    nights: 1
  });

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
      // Reset form
      form = { guestName: '', amount: 0, paymentMethod: 'cash', nights: 1 };
    }
  }

  async function handleCheckOut(roomId: number) {
    if (confirm('Confirm Guest Departure? This will update room status to vacant.')) {
      await fetch(`/api/transactions/checkout/${roomId}`, { method: 'POST' });
      await loadRooms();
    }
  }

  // Derived calculation for the UI
  let totalBill = $derived(form.amount * form.nights);
</script>

<div class="min-h-screen bg-slate-50/50">
  <header class="bg-white border-b border-slate-100 px-8 py-6">
    <div class="max-w-7xl mx-auto flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div class="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-100">
          <BedDouble size={24} />
        </div>
        <div>
          <h1 class="text-2xl font-black text-slate-900 tracking-tight">Room Register</h1>
          <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Live Occupancy & Payments</p>
        </div>
      </div>
      
      <div class="flex gap-4">
        <div class="px-4 py-2 bg-emerald-50 rounded-lg border border-emerald-100">
          <p class="text-[10px] font-black text-emerald-600 uppercase">Available</p>
          <p class="text-xl font-black text-emerald-700">{rooms.filter(r => r.status === 'vacant').length}</p>
        </div>
        <div class="px-4 py-2 bg-rose-50 rounded-lg border border-rose-100">
          <p class="text-[10px] font-black text-rose-600 uppercase">Occupied</p>
          <p class="text-xl font-black text-rose-700">{rooms.filter(r => r.status === 'occupied').length}</p>
        </div>
      </div>
    </div>
  </header>

  <main class="max-w-7xl mx-auto p-8">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {#each rooms as room (room.id)}
        <div class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
          <div class="p-6">
            <div class="flex justify-between items-start mb-4">
              <div>
                <h3 class="text-xl font-black text-slate-900">Room {room.roomNumber}</h3>
                <p class="text-xs font-bold text-slate-400 uppercase tracking-tight">{room.category || 'Standard'}</p>
              </div>
              <span class="px-3 py-1 text-[10px] font-black uppercase rounded-full tracking-wider {room.status === 'occupied' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}">
                {room.status}
              </span>
            </div>
            
            <div class="flex items-center gap-2 text-slate-500 mb-6">
              <Banknote size={16} />
              <span class="text-sm font-bold">₦{room.rate.toLocaleString()}/night</span>
            </div>

            {#if room.status === 'vacant'}
              <button
                onclick={() => { selectedRoom = room; form.amount = room.rate; showCheckIn = true; }}
                class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-indigo-600 transition-all"
              >
                <UserPlus size={18} />
                Check In
              </button>
            {:else}
              <button
                onclick={() => handleCheckOut(room.id)}
                class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-black text-sm hover:border-rose-200 hover:text-rose-600 transition-all"
              >
                <LogOut size={18} />
                Check Out
              </button>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </main>

  {#if showCheckIn}
    <div class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div class="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 class="text-xl font-black text-slate-900">Guest Registration</h2>
            <p class="text-xs font-bold text-slate-400 uppercase">Room {selectedRoom?.roomNumber}</p>
          </div>
          <button onclick={() => showCheckIn = false} class="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>
        
        <div class="p-8 space-y-5">
          <div class="space-y-1.5">
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Guest Full Name</label>
            <input bind:value={form.guestName} type="text" placeholder="John Doe" class="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold" />
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Agreed Rate</label>
              <input bind:value={form.amount} type="number" class="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold" />
            </div>
            <div class="space-y-1.5">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nights</label>
              <input bind:value={form.nights} type="number" min="1" class="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold" />
            </div>
          </div>
          
          <div class="space-y-1.5">
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Channel</label>
            <div class="grid grid-cols-3 gap-2">
              {#each ['cash', 'pos', 'transfer'] as method (method)}
                <button 
                  onclick={() => form.paymentMethod = method}
                  class="py-2.5 rounded-xl border-2 text-[11px] font-black uppercase transition-all {form.paymentMethod === method ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-400 hover:border-slate-200'}"
                >
                  {method}
                </button>
              {/each}
            </div>
          </div>

          <div class="mt-4 p-4 bg-slate-900 rounded-2xl flex justify-between items-center text-white">
            <span class="text-xs font-bold opacity-70">Total Receivable:</span>
            <span class="text-lg font-black text-indigo-400">₦{totalBill.toLocaleString()}</span>
          </div>
          
          <button 
            onclick={handleCheckIn} 
            class="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all mt-2"
          >
            Complete Check-In
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>