<script lang="ts">
  import { goto } from '$app/navigation';
  
  let email = '';
  let password = '';
  let name = '';
  let loading = false;
  let error = '';

  async function handleRegister() {
    loading = true;
    error = '';
    
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });
    
    if (res.ok) {
      goto('/dashboard', { replaceState: true });
    } else {
      const data = await res.json();
      error = data.error || 'Registration failed';
    }
    loading = false;
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-white">
  <div class="max-w-md w-full space-y-8 p-8">
    <div>
      <h2 class="text-center text-3xl font-bold text-gray-900">Create Account</h2>
    </div>
    <form on:submit|preventDefault={handleRegister} class="mt-8 space-y-6">
      {#if error}
        <div class="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      {/if}
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Full Name</label>
          <input bind:value={name} type="text" required class="mt-1 block w-full border rounded-md px-3 py-2" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Email</label>
          <input bind:value={email} type="email" required class="mt-1 block w-full border rounded-md px-3 py-2" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Password</label>
          <input bind:value={password} type="password" required class="mt-1 block w-full border rounded-md px-3 py-2" />
        </div>
      </div>
      <button type="submit" disabled={loading} class="w-full bg-crimson text-white py-2 rounded-md">
        {loading ? 'Creating...' : 'Register'}
      </button>
    </form>
  </div>
</div>