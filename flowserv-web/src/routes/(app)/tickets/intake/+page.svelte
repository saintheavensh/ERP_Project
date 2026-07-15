<script lang="ts">
  import { goto } from '$app/navigation';

  let { data } = $props();
  let templates = $derived(data.templates);
  let customersList = $derived(data.customers || []);

  let form = $state({
    customerId: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    assetType: '',
    assetBrand: '',
    assetModel: '',
    assetSn: '',
    flowTemplateId: '',
    branchId: '00000000-0000-0000-0000-000000000000'
  });

  let loading = $state(false);
  let errorMsg = $state('');

  // Autocomplete logic
  let showDropdown = $state(false);
  let filteredCustomers = $derived(
    form.customerName && !form.customerId 
      ? customersList.filter((c: any) => c.name.toLowerCase().includes(form.customerName.toLowerCase())).slice(0, 5)
      : []
  );

  function searchCustomer() {
    form.customerId = ''; // reset if they type
    showDropdown = true;
  }

  function selectCustomer(c: any) {
    form.customerId = c.id;
    form.customerName = c.name;
    form.customerPhone = c.phone || '';
    form.customerEmail = c.email || '';
    showDropdown = false;
  }

  async function submitIntake() {
    loading = true;
    errorMsg = '';
    
    // Quick validation
    if (!form.customerName || !form.assetType || !form.flowTemplateId) {
      errorMsg = 'Name, Device Type, and Flow Template are required.';
      loading = false;
      return;
    }

    try {
      // In a real app we'd fetch the user's branchId. For demo, we just use a hardcoded fallback or fetch it from `/v1/auth/me`.
      // Actually, since this is a demo, let's just omit branchId if the backend can default it, or we fetch the branches.
      // Wait, our backend schema requires branchId. Let's pass a dummy or let the backend fail.
      // To prevent failure, let's fetch branches on mount or assume the user object has it.
      // For now, let's just try to submit. The backend route requires branchId. 
      // I will update the backend to default to the first branch of the tenant if none is provided, to make this MVP smoother.
      // I will update tickets.ts after this.
      
      const res = await fetch('http://localhost:3001/v1/tickets/intake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.token}`
        },
        body: JSON.stringify(form)
      });
      
      const result = await res.json();
      if (res.ok) {
        goto(`/tickets/${result.data.id}`);
      } else {
        errorMsg = result.error?.message || 'Failed to create intake';
      }
    } catch (e) {
      errorMsg = 'Network error';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>New Intake | FlowServ</title>
</svelte:head>

<div class="p-6 max-w-4xl mx-auto">
  <div class="mb-6 flex items-center gap-4">
    <a href="/tickets" class="text-slate-500 hover:text-slate-800 transition-colors" aria-label="Back to tickets">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
      </svg>
    </a>
    <h1 class="text-2xl font-bold text-slate-900">New Service Intake</h1>
  </div>

  {#if errorMsg}
    <div class="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-100 flex items-start">
      <svg class="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      <div>
        <h3 class="font-medium text-sm">Error creating intake</h3>
        <p class="text-sm mt-1">{errorMsg}</p>
      </div>
    </div>
  {/if}

  <form onsubmit={(e) => { e.preventDefault(); submitIntake(); }} class="space-y-8 bg-white p-8 rounded-xl shadow-sm border border-gray-200">
    
    <!-- Customer Info -->
    <div>
      <h2 class="text-lg font-semibold text-slate-800 mb-4 flex items-center border-b pb-2">
        <span class="bg-blue-100 text-blue-700 w-6 h-6 rounded-full inline-flex items-center justify-center text-sm mr-2">1</span>
        Customer Details
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="relative">
          <label class="block text-sm font-medium text-slate-700 mb-1" for="name">Customer Name *</label>
          <input id="name" type="text" bind:value={form.customerName} oninput={searchCustomer} autocomplete="off" required class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. John Doe">
          
          {#if showDropdown && filteredCustomers.length > 0}
            <ul class="absolute z-10 w-full bg-white border border-slate-200 mt-1 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {#each filteredCustomers as c}
                <li>
                  <button type="button" class="w-full text-left px-4 py-2 hover:bg-slate-50 border-b last:border-0" onclick={() => selectCustomer(c)}>
                    <div class="font-medium text-slate-900">{c.name}</div>
                    <div class="text-xs text-slate-500">{c.phone || 'No phone'}</div>
                  </button>
                </li>
              {/each}
            </ul>
          {/if}
          {#if form.customerId}
            <div class="text-xs text-green-600 mt-1 flex items-center">
              <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
              Existing customer selected
            </div>
          {/if}
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="phone">Phone Number (Optional)</label>
          <input id="phone" type="tel" bind:value={form.customerPhone} class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 {form.customerId ? 'bg-slate-50 text-slate-500' : ''}" placeholder="e.g. 08123456789" readonly={!!form.customerId}>
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-slate-700 mb-1" for="email">Email Address (Optional)</label>
          <input id="email" type="email" bind:value={form.customerEmail} class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 {form.customerId ? 'bg-slate-50 text-slate-500' : ''}" placeholder="john@example.com" readonly={!!form.customerId}>
        </div>
      </div>
    </div>

    <!-- Device Info -->
    <div>
      <h2 class="text-lg font-semibold text-slate-800 mb-4 flex items-center border-b pb-2">
        <span class="bg-blue-100 text-blue-700 w-6 h-6 rounded-full inline-flex items-center justify-center text-sm mr-2">2</span>
        Device / Asset Information
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="type">Device Type *</label>
          <select id="type" bind:value={form.assetType} required class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">Select Type...</option>
            <option value="Smartphone">Smartphone</option>
            <option value="Laptop">Laptop</option>
            <option value="Tablet">Tablet</option>
            <option value="Smartwatch">Smartwatch</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="brand">Brand</label>
          <input id="brand" type="text" bind:value={form.assetBrand} class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Samsung">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="model">Model</label>
          <input id="model" type="text" bind:value={form.assetModel} class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Galaxy S23">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="sn">Serial Number / IMEI</label>
          <input id="sn" type="text" bind:value={form.assetSn} class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="...">
        </div>
      </div>
    </div>

    <!-- Service Details -->
    <div>
      <h2 class="text-lg font-semibold text-slate-800 mb-4 flex items-center border-b pb-2">
        <span class="bg-blue-100 text-blue-700 w-6 h-6 rounded-full inline-flex items-center justify-center text-sm mr-2">3</span>
        Service Details
      </h2>
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1" for="flow">Service Flow *</label>
        <select id="flow" bind:value={form.flowTemplateId} required class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="">Select Service Workflow...</option>
          {#each templates as t}
            <option value={t.id}>{t.name} - {t.description}</option>
          {/each}
        </select>
        <p class="text-xs text-slate-500 mt-2">
          The selected workflow dictates the stages this ticket will go through (e.g. Diagnosis &rarr; Approval &rarr; Repair).
        </p>
      </div>
    </div>

    <!-- Submit -->
    <div class="pt-4 flex justify-end">
      <button 
        type="submit"
        disabled={loading}
        class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center">
        {#if loading}
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        {:else}
          Create Ticket
        {/if}
      </button>
    </div>

  </form>
</div>
