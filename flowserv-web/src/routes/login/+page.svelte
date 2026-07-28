<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';

  let { form } = $props();

  let loading = $state(false);
</script>

<svelte:head>
  <title>Login | FlowServ</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 p-4">
  <div class="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-slate-900 mb-2">FlowServ</h1>
      <p class="text-slate-500">Sign in to your account</p>
    </div>

    <form 
      method="POST" 
      use:enhance={() => {
        loading = true;
        return async ({ update }) => {
          loading = false;
          update();
        };
      }}
      class="space-y-6"
    >
      <div>
        <label for="email" class="block text-sm font-medium text-slate-700 mb-1">Alamat Email</label>
        <input 
          id="email" 
          name="email" 
          type="email" 
          required 
          value={form?.email ?? ''}
          class="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
          placeholder="admin@demo.com"
        />
      </div>

      <div>
        <label for="password" class="block text-sm font-medium text-slate-700 mb-1">Password</label>
        <input 
          id="password" 
          name="password" 
          type="password" 
          required 
          class="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
          placeholder="••••••••"
        />
      </div>

      {#if form?.incorrect}
        <div class="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
          {form?.message || 'Invalid credentials'}
        </div>
      {/if}

      <button 
        type="submit" 
        disabled={loading}
        class="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
      >
        {#if loading}
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Signing in...
        {:else}
          Sign In
        {/if}
      </button>
    </form>
    
    <div class="mt-6 text-center text-sm text-slate-500">
      <p>Demo Credentials:</p>
      <p class="font-medium">admin@demo.com / admin123</p>
    </div>
  </div>
</div>
