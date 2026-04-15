<script lang="ts">
  import { goto } from '$app/navigation';
  
  let email = '';
  let password = '';
  let loading = false;
  let error = '';

  async function handleSubmit() {
    loading = true;
    error = '';
    
    try {
      const res = await fetch('/api/auth/sign-in/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      
      if (res.ok && data.user) {
        // Successful login
        goto('/dashboard');
      } else {
        error = data.error || 'Invalid email or password';
      }
    } catch (err) {
      error = 'Network error. Please try again.';
    } finally {
      loading = false;
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-white">
  <div class="max-w-md w-full space-y-8 p-8">
    <div>
      <h2 class="text-center text-3xl font-bold text-gray-900">
        TOPGAN Hotel Audit
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        Sign in to your account
      </p>
    </div>
    
    <form on:submit|preventDefault={handleSubmit} class="mt-8 space-y-6">
      {#if error}
        <div class="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      {/if}
      
      <div class="space-y-4">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            bind:value={email}
            required
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-crimson focus:border-crimson"
          />
        </div>
        
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            bind:value={password}
            required
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-crimson focus:border-crimson"
          />
        </div>
      </div>
      
      <button
        type="submit"
        disabled={loading}
        class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-crimson hover:bg-crimson-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-crimson disabled:opacity-50"
      >
        {loading ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  </div>
</div>

<style>
  :global(.bg-crimson) { background-color: #DC2626; }
  :global(.hover\:bg-crimson-dark:hover) { background-color: #B91C1C; }
  :global(.focus\:ring-crimson:focus) { --tw-ring-color: #DC2626; }
  :global(.focus\:border-crimson:focus) { border-color: #DC2626; }
</style>