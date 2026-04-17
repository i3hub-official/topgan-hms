<script lang="ts">
  import { 
    Users, MapPin, Clock, Calendar, 
    ChevronRight, AlertCircle, CheckCircle2 
  } from 'lucide-svelte';
  
  // Define types for the data structure
  interface AttendanceLog {
    id: string | number;
    userName?: string;
    role?: string;
    checkIn: string | Date;
    checkOut?: string | Date | null;
    hoursWorked?: number;
    location: string;
  }
  
  interface PageData {
    logs?: AttendanceLog[]; // Make logs optional
  }
  
  let { data }: { data: PageData } = $props();
  
  // Safe access to logs with fallback
  let logs = $derived(data?.logs ?? []);
  
  // Format location to a Google Maps link
  const getMapLink = (loc: string) => `https://www.google.com/maps?q=${loc}`;
</script>

<div class="min-h-screen bg-slate-50/50 p-8">
  <div class="max-w-7xl mx-auto">
    
    <header class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-black text-slate-900 tracking-tight">Workforce Audit</h1>
        <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
          Real-time Attendance & Geofencing
        </p>
      </div>
      <div class="flex gap-4">
        <div class="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm">
          <p class="text-[10px] font-black text-slate-400 uppercase">On Premises</p>
          <p class="text-xl font-black text-indigo-600">
            {logs.filter((l: AttendanceLog) => !l.checkOut).length}
          </p>
        </div>
      </div>
    </header>

    <div class="grid grid-cols-1 gap-4">
      {#if logs.length === 0}
        <div class="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
          <Calendar size={48} class="mx-auto text-slate-100 mb-4" />
          <p class="font-black text-slate-300 uppercase tracking-widest">No activity recorded today</p>
        </div>
      {:else}
        {#each logs as log (log.id)}
          <div class="bg-white rounded-3xl border border-slate-100 p-6 flex flex-col md:flex-row md:items-center justify-between group hover:shadow-lg hover:shadow-slate-100 transition-all">
            
            <div class="flex items-center gap-5">
              <div class="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Users size={24} />
              </div>
              <div>
                <h3 class="font-black text-slate-900">{log.userName || 'Unknown User'}</h3>
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{log.role || 'Staff'}</p>
              </div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-3 gap-8 mt-6 md:mt-0">
              <div>
                <p class="text-[10px] font-black text-slate-400 uppercase mb-1">Clock In</p>
                <p class="text-sm font-bold text-slate-700">
                  {new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              
              <div>
                <p class="text-[10px] font-black text-slate-400 uppercase mb-1">Status</p>
                {#if log.checkOut}
                  <span class="inline-flex items-center gap-1 text-slate-400 text-xs font-bold">
                    <CheckCircle2 size={14} /> Off Duty
                  </span>
                {:else}
                  <span class="inline-flex items-center gap-1 text-emerald-500 text-xs font-bold animate-pulse">
                    <AlertCircle size={14} /> Active
                  </span>
                {/if}
              </div>

              <div>
                <p class="text-[10px] font-black text-slate-400 uppercase mb-1">Total Time</p>
                <p class="text-sm font-bold text-slate-900">
                  {log.hoursWorked ? `${log.hoursWorked} hrs` : '--'}
                </p>
              </div>
            </div>

            <div class="mt-6 md:mt-0">
              <a 
                href={getMapLink(log.location)} 
                target="_blank"
                class="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl text-xs font-black text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              >
                <MapPin size={14} />
                Verify Location
              </a>
            </div>

          </div>
        {/each}
      {/if}
    </div>
  </div>
</div>