<script lang="ts">
  import { 
    Hotel, DoorOpen, Wifi, Coffee, 
    Bath, Tv, Thermometer, CheckCircle2,
    AlertCircle, Edit, MoreVertical, Plus
  } from 'lucide-svelte';
  
  interface Room {
    id: number;
    number: string;
    type: 'Standard' | 'Deluxe' | 'Suite' | 'Presidential';
    status: 'available' | 'occupied' | 'maintenance' | 'cleaning';
    price: number;
    amenities: string[];
    floor: number;
  }
  
  interface PageData {
    rooms?: Room[];
  }
  
  let { data }: { data: PageData } = $props();
  let rooms = $derived(data?.rooms ?? []);
  
  // Room type colors and icons
  const roomTypeConfig = {
    Standard: { color: 'bg-blue-100 text-blue-700', icon: DoorOpen },
    Deluxe: { color: 'bg-emerald-100 text-emerald-700', icon: Wifi },
    Suite: { color: 'bg-purple-100 text-purple-700', icon: Coffee },
    Presidential: { color: 'bg-amber-100 text-amber-700', icon: Tv }
  };
  
  const statusConfig = {
    available: { color: 'bg-emerald-100 text-emerald-700', label: 'Available', icon: CheckCircle2 },
    occupied: { color: 'bg-indigo-100 text-indigo-700', label: 'Occupied', icon: Hotel },
    maintenance: { color: 'bg-amber-100 text-amber-700', label: 'Maintenance', icon: AlertCircle },
    cleaning: { color: 'bg-slate-100 text-slate-700', label: 'Cleaning', icon: Thermometer }
  };
</script>

<div class="min-h-screen bg-slate-50/50 p-8">
  <div class="max-w-7xl mx-auto">
    
    <header class="flex items-center justify-between mb-8 flex-wrap gap-4">
      <div>
        <h1 class="text-3xl font-black text-slate-900 tracking-tight">Room Management</h1>
        <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
          Real-time Room Status & Occupancy
        </p>
      </div>
      <button class="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-indigo-200 active:scale-95">
        <Plus size={18} />
        Add New Room
      </button>
    </header>

    <!-- Stats Overview -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div class="bg-white rounded-2xl p-5 border border-slate-100">
        <p class="text-[10px] font-black text-slate-400 uppercase">Total Rooms</p>
        <p class="text-2xl font-black text-slate-900">{rooms.length}</p>
      </div>
      <div class="bg-white rounded-2xl p-5 border border-slate-100">
        <p class="text-[10px] font-black text-slate-400 uppercase">Available</p>
        <p class="text-2xl font-black text-emerald-600">{rooms.filter(r => r.status === 'available').length}</p>
      </div>
      <div class="bg-white rounded-2xl p-5 border border-slate-100">
        <p class="text-[10px] font-black text-slate-400 uppercase">Occupied</p>
        <p class="text-2xl font-black text-indigo-600">{rooms.filter(r => r.status === 'occupied').length}</p>
      </div>
      <div class="bg-white rounded-2xl p-5 border border-slate-100">
        <p class="text-[10px] font-black text-slate-400 uppercase">Maintenance</p>
        <p class="text-2xl font-black text-amber-600">{rooms.filter(r => r.status === 'maintenance').length}</p>
      </div>
    </div>

    <!-- Rooms Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#if rooms.length === 0}
        <div class="col-span-full text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
          <Hotel size={48} class="mx-auto text-slate-100 mb-4" />
          <p class="font-black text-slate-300 uppercase tracking-widest">No rooms configured</p>
        </div>
      {:else}
        {#each rooms as room (room.id)}
          {@const TypeIcon = roomTypeConfig[room.type].icon}
          {@const StatusIcon = statusConfig[room.status].icon}
          
          <div class="bg-white rounded-3xl border border-slate-100 overflow-hidden hover:shadow-xl hover:shadow-slate-100 transition-all group">
            <div class="p-6">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                    <Hotel size={22} class="text-slate-400 group-hover:text-indigo-600" />
                  </div>
                  <div>
                    <h3 class="font-black text-xl text-slate-900">Room {room.number}</h3>
                    <p class="text-xs font-bold text-slate-400">Floor {room.floor}</p>
                  </div>
                </div>
                <button class="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                  <MoreVertical size={18} class="text-slate-400" />
                </button>
              </div>
              
              <div class="flex items-center justify-between mb-4">
                <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black {roomTypeConfig[room.type].color}">
                  <TypeIcon size={14} />
                  {room.type}
                </span>
                <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black {statusConfig[room.status].color}">
                  <StatusIcon size={14} />
                  {statusConfig[room.status].label}
                </span>
              </div>
              
              <div class="border-t border-slate-50 pt-4 mb-4">
                <p class="text-2xl font-black text-indigo-600">${room.price}<span class="text-sm font-bold text-slate-400">/night</span></p>
              </div>
              
              <div class="flex flex-wrap gap-2 mb-5">
                {#each room.amenities.slice(0, 3) as amenity}
                  <span class="text-[10px] font-bold bg-slate-50 text-slate-600 px-2 py-1 rounded-lg">{amenity}</span>
                {/each}
                {#if room.amenities.length > 3}
                  <span class="text-[10px] font-bold bg-slate-50 text-slate-400 px-2 py-1 rounded-lg">+{room.amenities.length - 3}</span>
                {/if}
              </div>
              
              <button class="w-full py-3 bg-slate-50 hover:bg-indigo-600 rounded-2xl text-sm font-black text-slate-600 hover:text-white transition-all">
                Manage Room
              </button>
            </div>
          </div>
        {/each}
      {/if}
    </div>
  </div>
</div>