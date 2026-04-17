<script lang="ts">
  import { MapPin, Clock, LogIn, LogOut, Loader2, CheckCircle, AlertCircle, WifiOff, ShieldAlert } from 'lucide-svelte';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  
  let status = $state<'idle' | 'loading' | 'success'>('idle');
  let locationData = $state<string | null>(null);
  let error = $state<string | null>(null);
  let todayActivity = $state<any>(null);
  let useManualLocation = $state(false);
  let manualLocation = $state('');
  let isVPNDetected = $state(false);
  let vpnCheckLoading = $state(false);
  let user = $derived($page.data.user);

  onMount(async () => {
    await checkTodayStatus();
    await checkForVPN(); // Auto-check on load
  });
  
  async function checkTodayStatus() {
    try {
      const response = await fetch('/api/staff/attendance/today');
      const data = await response.json();
      if (response.ok) {
        todayActivity = data.activity;
      }
    } catch (err) {
      console.error('Failed to check status:', err);
    }
  }

  // VPN / Proxy detection (client-side)
  async function checkForVPN() {
    vpnCheckLoading = true;
    try {
      // Option 1: ipapi.co (free tier, no key needed for basic use)
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();

      // Flags that usually indicate VPN/proxy/datacenter
      if (data.proxy === true || 
          data.hosting === true || 
          data.asn?.toLowerCase().includes('vpn') || 
          data.org?.toLowerCase().includes('vpn') ||
          data.org?.toLowerCase().includes('proxy')) {
        isVPNDetected = true;
      } else {
        isVPNDetected = false;
      }
    } catch (err) {
      console.warn('VPN check failed (network or API issue). Proceeding without block.', err);
      // Fail open or strict? Here we fail open to avoid locking legitimate users
      isVPNDetected = false;
    } finally {
      vpnCheckLoading = false;
    }
  }

  async function getCoords(): Promise<string> {
    if (useManualLocation && manualLocation) {
      return manualLocation;
    }

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject("Geolocation is not supported by your browser. Please use manual location as fallback.");
      }

      // Force high accuracy + shorter timeout for "auto location"
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(6);
          const lon = pos.coords.longitude.toFixed(6);
          const accuracy = pos.coords.accuracy.toFixed(0);
          resolve(`${lat}, ${lon} (acc: ${accuracy}m)`);
        },
        (err) => {
          let message = "Failed to get precise GPS location. ";
          switch(err.code) {
            case err.PERMISSION_DENIED:
              message += "Please enable location services in your browser/device settings.";
              break;
            case err.POSITION_UNAVAILABLE:
              message += "GPS signal unavailable. Try moving to open area or use manual fallback.";
              break;
            case err.TIMEOUT:
              message += "Request timed out. Please try again.";
              break;
            default:
              message += "Unknown error.";
          }
          reject(message);
        },
        { 
          enableHighAccuracy: true,   // ← This is the key for "auto / precise GPS"
          timeout: 12000, 
          maximumAge: 30000 
        }
      );
    });
  }

  async function handlePunch(action: 'clock-in' | 'clock-out') {
    if (status === 'loading' || isVPNDetected) return;
    
    status = 'loading';
    error = null;
    
    try {
      let location = "";

      try {
        location = await getCoords();
      } catch (locErr) {
        if (useManualLocation && manualLocation) {
          location = manualLocation;
        } else {
          throw new Error(String(locErr));
        }
      }

      const response = await fetch('/api/staff/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, location })
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || "Server error. Try again.");
      
      status = 'success';
      setTimeout(() => {
        status = 'idle';
        checkTodayStatus();
      }, 2000);
    } catch (err: any) {
      error = err.toString();
      status = 'idle';
      setTimeout(() => error = null, 6000);
    }
  }
  
  function toggleManualLocation() {
    useManualLocation = !useManualLocation;
    if (!useManualLocation) {
      manualLocation = '';
    }
  }
</script>

<div class="min-h-[80vh] flex flex-col items-center justify-center p-6">
  <div class="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 p-10 text-center">
    
    <div class="mb-8">
      <div class="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
        <Clock size={40} />
      </div>
      <h1 class="text-2xl font-black text-slate-900">Attendance Portal</h1>
      <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">TOPGAN HMS Staff Terminal</p>
      
      {#if user}
        <div class="mt-4 pt-4 border-t border-slate-100">
          <p class="text-sm font-bold text-slate-800">{user.name}</p>
          <p class="text-[10px] text-slate-400">{user.staffId || user.email}</p>
        </div>
      {/if}
      
      {#if todayActivity?.checkIn && !todayActivity?.checkOut}
        <div class="mt-3 inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black">
          <Clock size={10} />
          Currently Clocked In
        </div>
      {/if}
    </div>

    {#if error}
      <div class="mb-6 p-4 bg-rose-50 text-rose-600 rounded-2xl text-sm font-bold flex items-center gap-2 justify-center">
        <AlertCircle size={16} />
        {error}
      </div>
    {/if}

    <!-- VPN Warning -->
    {#if isVPNDetected}
      <div class="mb-6 p-4 bg-amber-50 text-amber-700 rounded-2xl text-sm font-bold flex items-center gap-2 justify-center">
        <ShieldAlert size={18} />
        VPN or Proxy detected.<br>Please disable it to mark attendance.
      </div>
    {/if}

    <!-- Manual Location Toggle (now secondary) -->
    <div class="mb-4 flex items-center justify-center gap-2">
      <button
        onclick={toggleManualLocation}
        class="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
      >
        <WifiOff size={12} />
        {useManualLocation ? 'Switch to GPS Auto Location' : 'Use Manual Location (Fallback)'}
      </button>
    </div>

    {#if useManualLocation}
      <div class="mb-4">
        <input
          type="text"
          bind:value={manualLocation}
          placeholder="Enter exact work location (e.g., Main Building - Front Desk)"
          class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-center"
        />
        <p class="text-[9px] text-slate-400 mt-1">Only use if GPS fails</p>
      </div>
    {/if}

    <div class="space-y-4">
      {#if status === 'success'}
        <div class="py-12 flex flex-col items-center animate-bounce">
          <CheckCircle size={60} class="text-emerald-500" />
          <p class="mt-4 font-black text-slate-900 uppercase">Action Recorded!</p>
        </div>
      {:else if status === 'loading'}
        <div class="py-12 flex flex-col items-center">
          <Loader2 size={60} class="animate-spin text-indigo-600" />
          <p class="mt-4 font-black text-slate-400 uppercase">Verifying GPS Location...</p>
        </div>
      {:else}
        {#if !todayActivity?.checkIn}
          <button 
            onclick={() => handlePunch('clock-in')}
            disabled={isVPNDetected || vpnCheckLoading}
            class="w-full py-6 bg-emerald-500 text-white rounded-3xl font-black text-lg shadow-xl shadow-emerald-100 hover:bg-emerald-600 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogIn size={20} /> Clock In
          </button>
        {/if}
        
        {#if todayActivity?.checkIn && !todayActivity?.checkOut}
          <button 
            onclick={() => handlePunch('clock-out')}
            disabled={isVPNDetected || vpnCheckLoading}
            class="w-full py-6 bg-slate-900 text-white rounded-3xl font-black text-lg shadow-xl shadow-slate-200 hover:bg-rose-600 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut size={20} /> Clock Out
          </button>
        {/if}
        
        {#if todayActivity?.checkIn && todayActivity?.checkOut}
          <div class="py-8 text-center">
            <CheckCircle size={48} class="mx-auto text-slate-300 mb-3" />
            <p class="font-bold text-slate-600">Shift Completed</p>
            <p class="text-xs text-slate-400 mt-1">
              {todayActivity.hoursWorked} hours worked
            </p>
          </div>
        {/if}
      {/if}
    </div>

    <div class="mt-10 flex flex-col items-center justify-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-tighter">
      <div class="flex items-center gap-2">
        <MapPin size={12} />
        {#if useManualLocation}
          Manual Location Enabled
        {:else}
          Auto GPS Location Required (High Accuracy)
        {/if}
      </div>
      
      {#if !useManualLocation && !isVPNDetected}
        <button
          onclick={() => {
            if (confirm('This will request precise GPS access. Allow?')) {
              navigator.geolocation.getCurrentPosition(() => {}, () => {});
            }
          }}
          class="text-indigo-500 underline"
        >
          Test GPS Access
        </button>
      {/if}
    </div>
  </div>
</div>

<style>

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
  .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  .animate-bounce { animation: bounce 0.5s ease-in-out; }
</style>