<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { 
    Clock, Calendar, MapPin, CheckCircle2, 
    AlertCircle, TrendingUp, Briefcase, Award,
    Timer, Play, Square, Edit2, Users,
    Search, Filter, User, Mail, Phone, X
  } from 'lucide-svelte';
  
  let { data } = $props();
  
  let user = $derived(data.user);
  let todayActivity = $derived(data.todayActivity);
  let history = $derived(data.history);
  let stats = $derived(data.stats);
  let needsTracking = $derived(data.needsTracking);
  let isAdmin = $derived(data.isAdmin);
  let allStaffActivity = $derived(data.allStaffActivity || []);
  
  let showNotesModal = $state(false);
  let selectedActivity = $state(null);
  let notes = $state('');
  let clockingIn = $state(false);
  let clockingOut = $state(false);
  let activeTab = $state('personal');
  let searchStaff = $state('');
  let errorMessage = $state('');
  
  let filteredStaffActivity = $derived(
    allStaffActivity.filter(activity => 
      activity.userName?.toLowerCase().includes(searchStaff.toLowerCase())
    )
  );
  
  async function handleClockIn() {
    if (clockingIn) return;
    clockingIn = true;
    errorMessage = '';
    
    const location = prompt('Enter your location (e.g., Main Building, Store, Kitchen):', 'Main Building');
    if (!location) {
      clockingIn = false;
      return;
    }
    
    const formData = new URLSearchParams();
    formData.append('location', location);
    
    try {
      const response = await fetch('?/clockIn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        window.location.reload();
      } else {
        errorMessage = result.error || 'Failed to clock in';
        alert(errorMessage);
      }
    } catch (err) {
      errorMessage = 'Failed to clock in';
      alert(errorMessage);
    } finally {
      clockingIn = false;
    }
  }
  
  async function handleClockOut() {
    if (clockingOut) return;
    clockingOut = true;
    errorMessage = '';
    
    if (confirm('Are you sure you want to clock out?')) {
      try {
        const formData = new URLSearchParams();
        
        const response = await fetch('?/clockOut', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString()
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
          window.location.reload();
        } else {
          errorMessage = result.error || 'Failed to clock out';
          alert(errorMessage);
        }
      } catch (err) {
        errorMessage = 'Failed to clock out';
        alert(errorMessage);
      } finally {
        clockingOut = false;
      }
    } else {
      clockingOut = false;
    }
  }
  
  async function handleUpdateNotes() {
    if (!selectedActivity) return;
    
    const formData = new URLSearchParams();
    formData.append('activityId', selectedActivity.id);
    formData.append('notes', notes);
    
    const response = await fetch('?/updateNotes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    });
    
    if (response.ok) {
      showNotesModal = false;
      window.location.reload();
    } else {
      alert('Failed to update notes');
    }
  }
  
  function formatTime(date: Date | string | null) {
    if (!date) return '--:--';
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  function formatDate(date: Date | string) {
    return new Date(date).toLocaleDateString([], { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  }
  
  function getShiftStatus(activity: any) {
    if (!activity.checkOut) return { label: 'Active', color: 'text-emerald-600 bg-emerald-50', icon: Play };
    return { label: 'Completed', color: 'text-slate-500 bg-slate-50', icon: CheckCircle2 };
  }
  
  function getRoleBadge(role: string) {
    const colors: Record<string, string> = {
      general_manager: 'bg-blue-100 text-blue-700',
      front_desk_manager: 'bg-emerald-100 text-emerald-700',
      store_keeper: 'bg-amber-100 text-amber-700',
      cleaner: 'bg-teal-100 text-teal-700',
      staff: 'bg-slate-100 text-slate-700'
    };
    return colors[role] || 'bg-slate-100 text-slate-700';
  }
</script>

<div class="min-h-screen bg-slate-50/50 p-8">
  <div class="max-w-7xl mx-auto">
    
    <header class="mb-8">
      <h1 class="text-3xl font-black text-slate-900 tracking-tight">Time Tracking</h1>
      <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
        {#if !needsTracking}
          Administrator View - Monitor Staff Attendance
        {:else}
          Clock In/Out & Shift Management
        {/if}
      </p>
    </header>

    <!-- Owner/Super Admin Message -->
    {#if !needsTracking}
      <div class="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 mb-6">
        <div class="flex items-center gap-2">
          <AlertCircle size={18} class="text-indigo-600" />
          <span class="font-black text-indigo-800">Administrator Access</span>
        </div>
        <p class="text-sm text-indigo-700 mt-1">
          As an owner or super admin, you are not required to clock in/out. This page allows you to monitor staff attendance.
        </p>
      </div>
    {/if}

    <!-- Error Message -->
    {#if errorMessage}
      <div class="bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-6">
        <p class="text-sm text-rose-700">{errorMessage}</p>
      </div>
    {/if}

    <!-- Tabs for Admin View -->
    {#if isAdmin}
      <div class="flex gap-2 mb-8 border-b border-slate-200">
        <button
          onclick={() => activeTab = 'personal'}
          class="px-6 py-3 font-black text-sm transition-all {activeTab === 'personal' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}"
        >
          <div class="flex items-center gap-2">
            <User size={16} />
            My Time Tracking
          </div>
        </button>
        <button
          onclick={() => activeTab = 'staff'}
          class="px-6 py-3 font-black text-sm transition-all {activeTab === 'staff' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}"
        >
          <div class="flex items-center gap-2">
            <Users size={16} />
            Staff Attendance
          </div>
        </button>
      </div>
    {/if}

    <!-- Personal Time Tracking -->
    {#if (!isAdmin && needsTracking) || (isAdmin && activeTab === 'personal')}
      {#if needsTracking}
        <!-- Stats Overview for regular users -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-2xl p-5 border border-slate-100">
            <div class="flex items-center justify-between mb-3">
              <div class="p-2 bg-indigo-50 rounded-lg">
                <Timer size={18} class="text-indigo-600" />
              </div>
            </div>
            <p class="text-[10px] font-black text-slate-400 uppercase">Total Hours (Month)</p>
            <p class="text-2xl font-black text-slate-900">{stats.totalHoursThisMonth} hrs</p>
          </div>
          
          <div class="bg-white rounded-2xl p-5 border border-slate-100">
            <div class="p-2 bg-emerald-50 rounded-lg w-fit mb-3">
              <Briefcase size={18} class="text-emerald-600" />
            </div>
            <p class="text-[10px] font-black text-slate-400 uppercase">Total Shifts</p>
            <p class="text-2xl font-black text-slate-900">{stats.totalShifts}</p>
          </div>
          
          <div class="bg-white rounded-2xl p-5 border border-slate-100">
            <div class="p-2 bg-amber-50 rounded-lg w-fit mb-3">
              <TrendingUp size={18} class="text-amber-600" />
            </div>
            <p class="text-[10px] font-black text-slate-400 uppercase">Avg Hours/Shift</p>
            <p class="text-2xl font-black text-slate-900">{stats.averageHours} hrs</p>
          </div>
          
          <div class="bg-white rounded-2xl p-5 border border-slate-100">
            <div class="p-2 bg-purple-50 rounded-lg w-fit mb-3">
              <Award size={18} class="text-purple-600" />
            </div>
            <p class="text-[10px] font-black text-slate-400 uppercase">Completed Shifts</p>
            <p class="text-2xl font-black text-slate-900">{stats.completedShifts}</p>
          </div>
        </div>
      {/if}

      <!-- Today's Shift Card -->
      <div class="bg-white rounded-3xl border border-slate-100 overflow-hidden mb-8">
        <div class="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4">
          <h2 class="text-white font-black text-lg flex items-center gap-2">
            <Clock size={20} />
            {needsTracking ? "Today's Shift" : "Shift Information"}
          </h2>
        </div>
        
        <div class="p-6">
          {#if needsTracking && todayActivity}
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div class="flex items-center gap-6">
                <div>
                  <p class="text-[10px] font-black text-slate-400 uppercase">Clock In</p>
                  <p class="text-2xl font-black text-slate-900">{formatTime(todayActivity.checkIn)}</p>
                  <p class="text-xs text-slate-500">{formatDate(todayActivity.checkIn)}</p>
                </div>
                
                {#if todayActivity.checkOut}
                  <div class="w-px h-12 bg-slate-200"></div>
                  <div>
                    <p class="text-[10px] font-black text-slate-400 uppercase">Clock Out</p>
                    <p class="text-2xl font-black text-slate-900">{formatTime(todayActivity.checkOut)}</p>
                    <p class="text-xs text-slate-500">{formatDate(todayActivity.checkOut)}</p>
                  </div>
                  
                  <div class="w-px h-12 bg-slate-200"></div>
                  <div>
                    <p class="text-[10px] font-black text-slate-400 uppercase">Hours Worked</p>
                    <p class="text-2xl font-black text-emerald-600">{todayActivity.hoursWorked} hrs</p>
                  </div>
                {/if}
              </div>
              
              <div class="flex gap-3">
                {#if !todayActivity.checkOut && needsTracking}
                  <button
                    onclick={handleClockOut}
                    disabled={clockingOut}
                    class="flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl transition-all disabled:opacity-50"
                  >
                    <Square size={18} />
                    {clockingOut ? 'Processing...' : 'Clock Out'}
                  </button>
                {/if}
                
                <button
                  onclick={() => {
                    selectedActivity = todayActivity;
                    notes = todayActivity.notes || '';
                    showNotesModal = true;
                  }}
                  class="flex items-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-xl transition-all"
                >
                  <Edit2 size={16} />
                  Add Notes
                </button>
              </div>
            </div>
            
            {#if todayActivity.location}
              <div class="mt-4 flex items-center gap-2 text-sm text-slate-500 border-t border-slate-100 pt-4">
                <MapPin size={14} />
                <span>Location: {todayActivity.location}</span>
              </div>
            {/if}
            
            {#if todayActivity.notes}
              <div class="mt-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-xl">
                <span class="font-bold">Notes:</span> {todayActivity.notes}
              </div>
            {/if}
            
          {:else if needsTracking}
            <div class="text-center py-8">
              <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock size={28} class="text-slate-400" />
              </div>
              <p class="text-slate-500 mb-4">Not clocked in yet today</p>
              <button
                onclick={handleClockIn}
                disabled={clockingIn}
                class="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl transition-all disabled:opacity-50"
              >
                <Play size={18} />
                {clockingIn ? 'Processing...' : 'Clock In'}
              </button>
            </div>
          {:else}
            <div class="text-center py-8">
              <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock size={28} class="text-slate-400" />
              </div>
              <p class="text-slate-500">No time tracking data available for your account</p>
              <p class="text-xs text-slate-400 mt-2">As an administrator, you are not required to clock in/out</p>
            </div>
          {/if}
        </div>
      </div>

      <!-- History Section (only for users who need tracking) -->
      {#if needsTracking && history.length > 0}
        <div>
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-black text-slate-800 flex items-center gap-2">
              <Calendar size={20} />
              Shift History
            </h2>
            <p class="text-xs text-slate-400">Last 30 shifts</p>
          </div>
          
          <div class="space-y-3">
            {#each history as shift (shift.id)}
              {@const status = getShiftStatus(shift)}
              <div class="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div class="flex items-center gap-4">
                    <div class="w-10 h-10 {status.color} rounded-xl flex items-center justify-center">
                      <status.icon size={18} />
                    </div>
                    <div>
                      <p class="font-black text-slate-900">{formatDate(shift.createdAt)}</p>
                      <div class="flex items-center gap-3 mt-1">
                        <span class="text-xs font-bold text-slate-500">
                          In: {formatTime(shift.checkIn)}
                        </span>
                        {#if shift.checkOut}
                          <span class="text-xs font-bold text-slate-500">
                            Out: {formatTime(shift.checkOut)}
                          </span>
                        {/if}
                      </div>
                    </div>
                  </div>
                  
                  <div class="flex items-center gap-4">
                    {#if shift.hoursWorked}
                      <div class="text-right">
                        <p class="text-[10px] font-black text-slate-400 uppercase">Hours</p>
                        <p class="text-lg font-black text-emerald-600">{shift.hoursWorked} hrs</p>
                      </div>
                    {/if}
                    
                    {#if !shift.checkOut}
                      <span class="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-black">
                        Active
                      </span>
                    {/if}
                    
                    <button
                      onclick={() => {
                        selectedActivity = shift;
                        notes = shift.notes || '';
                        showNotesModal = true;
                      }}
                      class="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} class="text-slate-400" />
                    </button>
                  </div>
                </div>
                
                {#if shift.location}
                  <div class="mt-3 flex items-center gap-2 text-xs text-slate-400 border-t border-slate-50 pt-3">
                    <MapPin size={12} />
                    <span>{shift.location}</span>
                  </div>
                {/if}
                
                {#if shift.notes}
                  <div class="mt-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">
                    📝 {shift.notes}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/if}
    {/if}

    <!-- Staff Attendance View (Admin only) -->
    {#if isAdmin && activeTab === 'staff'}
      <div>
        <div class="bg-white rounded-2xl p-4 mb-6 border border-slate-100">
          <div class="relative">
            <Search size={18} class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              bind:value={searchStaff}
              placeholder="Search staff by name..." 
              class="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl text-sm font-bold"
            />
          </div>
        </div>
        
        <div class="space-y-3">
          {#if filteredStaffActivity.length === 0}
            <div class="bg-white rounded-3xl border-2 border-dashed border-slate-100 p-12 text-center">
              <Users size={48} class="mx-auto text-slate-200 mb-4" />
              <p class="font-black text-slate-400 uppercase tracking-widest">No staff clocked in today</p>
            </div>
          {:else}
            {#each filteredStaffActivity as activity (activity.id)}
              <div class="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg">
                      {activity.userName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p class="font-black text-slate-900 text-lg">{activity.userName}</p>
                      <div class="flex items-center gap-2 mt-1">
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black {getRoleBadge(activity.userRole)}">
                          <Briefcase size={8} />
                          {activity.userRole?.replace(/_/g, ' ')}
                        </span>
                        <span class="text-xs text-slate-400">{activity.userStaffId}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div class="flex items-center gap-6">
                    <div>
                      <p class="text-[10px] font-black text-slate-400 uppercase">Clock In</p>
                      <p class="text-lg font-black text-slate-900">{formatTime(activity.checkIn)}</p>
                    </div>
                    
                    {#if activity.checkOut}
                      <div>
                        <p class="text-[10px] font-black text-slate-400 uppercase">Clock Out</p>
                        <p class="text-lg font-black text-slate-900">{formatTime(activity.checkOut)}</p>
                      </div>
                      <div>
                        <p class="text-[10px] font-black text-slate-400 uppercase">Hours</p>
                        <p class="text-lg font-black text-emerald-600">{activity.hoursWorked} hrs</p>
                      </div>
                    {:else}
                      <div class="px-3 py-2 bg-emerald-50 rounded-xl">
                        <p class="text-xs font-black text-emerald-700 flex items-center gap-1">
                          <Play size={10} />
                          Active Now
                        </p>
                      </div>
                    {/if}
                  </div>
                </div>
                
                {#if activity.location}
                  <div class="mt-3 flex items-center gap-2 text-xs text-slate-400 border-t border-slate-50 pt-3">
                    <MapPin size={12} />
                    <span>{activity.location}</span>
                  </div>
                {/if}
              </div>
            {/each}
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- Notes Modal -->
{#if showNotesModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
    <div class="bg-white rounded-3xl max-w-md w-full">
      <div class="p-6 border-b border-slate-100">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-black text-slate-900">Add Notes</h2>
            <p class="text-sm text-slate-500">Add notes to your shift</p>
          </div>
          <button onclick={() => showNotesModal = false} class="p-2 hover:bg-slate-100 rounded-xl">
            <X size={20} />
          </button>
        </div>
      </div>
      
      <div class="p-6">
        <textarea
          bind:value={notes}
          rows="4"
          class="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Enter any notes about your shift..."
        ></textarea>
      </div>
      
      <div class="p-6 border-t border-slate-100 flex gap-3">
        <button onclick={() => showNotesModal = false} class="flex-1 px-4 py-3 bg-slate-100 rounded-xl font-black text-slate-600">
          Cancel
        </button>
        <button onclick={handleUpdateNotes} class="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-black">
          Save Notes
        </button>
      </div>
    </div>
  </div>
{/if}