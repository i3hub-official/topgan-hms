<script lang="ts">
  import { 
    User, Mail, Phone, MapPin, Building2, 
    CreditCard, Landmark, ShieldCheck, Save 
  } from 'lucide-svelte';

  // Svelte 5 State for the multi-part form
  let staffData = $state({
    name: '',
    email: '',
    role: 'staff',
    phone: '',
    department: 'Housekeeping',
    address: '',
    bankName: '',
    accountNumber: '',
    nextOfKin: '',
    salary: 0
  });

  let saving = $state(false);

  async function saveStaff() {
    saving = true;
    // This will hit an endpoint that writes to both 'user' and 'staffDetails' tables
    const res = await fetch('/api/admin/staff/onboard', {
      method: 'POST',
      body: JSON.stringify(staffData)
    });
    
    if (res.ok) {
      alert("Staff onboarded successfully!");
    }
    saving = false;
  }
</script>

<div class="max-w-4xl mx-auto p-8">
  <div class="mb-8">
    <h1 class="text-3xl font-black text-slate-900">Staff Onboarding</h1>
    <p class="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">Capture Personal, Professional & Payroll Data</p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
    <section class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
      <h2 class="flex items-center gap-2 font-black text-slate-800 border-b pb-3 mb-4">
        <ShieldCheck size={18} class="text-indigo-600" />
        Identity & RBAC
      </h2>
      
      <div class="space-y-3">
        <label class="block">
          <span class="text-[10px] font-black text-slate-400 uppercase ml-1">Full Name</span>
          <input bind:value={staffData.name} type="text" class="w-full mt-1 px-4 py-3 bg-slate-50 border-none rounded-xl font-bold text-sm" />
        </label>

        <div class="grid grid-cols-2 gap-4">
          <label class="block">
            <span class="text-[10px] font-black text-slate-400 uppercase ml-1">System Role</span>
            <select bind:value={staffData.role} class="w-full mt-1 px-4 py-3 bg-slate-50 border-none rounded-xl font-bold text-sm">
              <option value="staff">Staff (Cleaner/Cook)</option>
              <option value="receptionist">Receptionist</option>
              <option value="manager">Manager</option>
              <option value="inventory_lead">Inventory Lead</option>
            </select>
          </label>
          <label class="block">
            <span class="text-[10px] font-black text-slate-400 uppercase ml-1">Department</span>
            <select bind:value={staffData.department} class="w-full mt-1 px-4 py-3 bg-slate-50 border-none rounded-xl font-bold text-sm">
              <option>Housekeeping</option>
              <option>Bar & Kitchen</option>
              <option>Front Office</option>
              <option>Security</option>
            </select>
          </label>
        </div>
      </div>
    </section>

    <section class="bg-indigo-900 text-white p-6 rounded-3xl shadow-xl space-y-4">
      <h2 class="flex items-center gap-2 font-black text-indigo-200 border-b border-indigo-800 pb-3 mb-4">
        <Landmark size={18} />
        Payroll & Banking
      </h2>

      <div class="space-y-3">
        <label class="block">
          <span class="text-[10px] font-black text-indigo-400 uppercase ml-1">Bank Name</span>
          <input bind:value={staffData.bankName} type="text" class="w-full mt-1 px-4 py-3 bg-indigo-800/50 border-none rounded-xl font-bold text-sm placeholder:text-indigo-400" placeholder="e.g. GTBank" />
        </label>
        
        <label class="block">
          <span class="text-[10px] font-black text-indigo-400 uppercase ml-1">Account Number</span>
          <input bind:value={staffData.accountNumber} type="text" class="w-full mt-1 px-4 py-3 bg-indigo-800/50 border-none rounded-xl font-bold text-sm" />
        </label>

        <label class="block">
          <span class="text-[10px] font-black text-indigo-400 uppercase ml-1">Monthly Salary (₦)</span>
          <input bind:value={staffData.salary} type="number" class="w-full mt-1 px-4 py-3 bg-indigo-800/50 border-none rounded-xl font-bold text-sm" />
        </label>
      </div>
    </section>
  </div>

  <div class="mt-8 flex justify-end">
    <button 
      onclick={saveStaff}
      disabled={saving}
      class="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-indigo-600 transition-all active:scale-95"
    >
      <Save size={20} />
      {saving ? 'Processing...' : 'Onboard Employee'}
    </button>
  </div>
</div>