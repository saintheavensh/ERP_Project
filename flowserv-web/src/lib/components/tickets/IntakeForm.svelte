<script lang="ts">
  import type { TicketIntakeState } from '$lib/states/tickets/ticket.intake.svelte';

  let { state } = $props<{ state: TicketIntakeState }>();
</script>

<form onsubmit={(e) => { e.preventDefault(); state.submitIntake(); }} class="space-y-8 bg-white p-8 rounded-xl shadow-sm border border-gray-200">
  
  <!-- Customer Info -->
  <div>
    <h2 class="text-lg font-semibold text-slate-800 mb-4 flex items-center border-b pb-2">
      <span class="bg-blue-100 text-blue-700 w-6 h-6 rounded-full inline-flex items-center justify-center text-sm mr-2">1</span>
      Customer Details
    </h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="relative">
        <label class="block text-sm font-medium text-slate-700 mb-1" for="name">Customer Name *</label>
        <input id="name" type="text" bind:value={state.form.customerName} oninput={() => state.searchCustomer()} autocomplete="off" required class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. John Doe">
        
        {#if state.showDropdown && state.filteredCustomers.length > 0}
          <ul class="absolute z-10 w-full bg-white border border-slate-200 mt-1 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {#each state.filteredCustomers as c}
              <li>
                <button type="button" class="w-full text-left px-4 py-2 hover:bg-slate-50 border-b last:border-0" onclick={() => state.selectCustomer(c)}>
                  <div class="font-medium text-slate-900">{c.name}</div>
                  <div class="text-xs text-slate-500">{c.phone || 'No phone'}</div>
                </button>
              </li>
            {/each}
          </ul>
        {/if}
        {#if state.form.customerId}
          <div class="text-xs text-green-600 mt-1 flex items-center">
            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            Existing customer selected
          </div>
        {/if}
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1" for="phone">Phone Number (Optional)</label>
        <input id="phone" type="tel" bind:value={state.form.customerPhone} class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 {state.form.customerId ? 'bg-slate-50 text-slate-500' : ''}" placeholder="e.g. 08123456789" readonly={!!state.form.customerId}>
      </div>
      <div class="md:col-span-2">
        <label class="block text-sm font-medium text-slate-700 mb-1" for="email">Email Address (Optional)</label>
        <input id="email" type="email" bind:value={state.form.customerEmail} class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 {state.form.customerId ? 'bg-slate-50 text-slate-500' : ''}" placeholder="john@example.com" readonly={!!state.form.customerId}>
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
        <select id="type" bind:value={state.form.assetType} required class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white">
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
        <input id="brand" type="text" bind:value={state.form.assetBrand} class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Samsung">
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1" for="model">Model</label>
        <input id="model" type="text" bind:value={state.form.assetModel} class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Galaxy S23">
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1" for="sn">Serial Number / IMEI</label>
        <input id="sn" type="text" bind:value={state.form.assetSn} class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="...">
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
      <select id="flow" bind:value={state.form.flowTemplateId} required class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white">
        <option value="">Select Service Workflow...</option>
        {#each state.templates as t}
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
      disabled={state.loading}
      class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center">
      {#if state.loading}
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
