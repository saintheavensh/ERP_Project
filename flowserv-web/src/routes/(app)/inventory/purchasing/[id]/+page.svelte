<script lang="ts">
  import { API_BASE } from '$lib/api/config';
  import OrderHeader from '$lib/components/purchasing/OrderHeader.svelte';
  import OrderSteps from '$lib/components/purchasing/OrderSteps.svelte';
  import OrderInfo from '$lib/components/purchasing/OrderInfo.svelte';
  import OrderLinesTable from '$lib/components/purchasing/OrderLinesTable.svelte';

  let { data } = $props();
  let order = $derived(data.order);
  let inv = $derived(order?.supplierInvoices?.[0]);
  
  let loading = $state(false);
  
  async function updateStatus(newStatus: string) {
    if (!confirm(`Are you sure you want to change status to ${newStatus}?`)) return;
    loading = true;
    
    try {
      const res = await fetch(`${API_BASE}/purchasing/orders/${order.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!res.ok) throw new Error('Failed to update status');
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
      loading = false;
    }
  }

  // F5 — the delete button only renders for a 'draft' PO (OrderHeader.svelte), so
  // the 409 PO_NOT_DELETABLE path below is a defensive fallback, not the normal case.
  async function deleteOrder() {
    if (!confirm('Are you sure you want to delete this PO?')) return;
    loading = true;

    try {
      const res = await fetch(`${API_BASE}/purchasing/orders/${order.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${data.token}`
        }
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error?.message || 'Failed to delete order');
      }
      window.location.href = '/inventory/purchasing';
    } catch (err: any) {
      alert(err.message);
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>PO {order?.poNumber} - FlowServ</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
  <OrderHeader 
    {order} 
    {loading} 
    onDelete={deleteOrder} 
  />

  <OrderSteps 
    {order} 
    {inv} 
    {loading} 
    onUpdateStatus={updateStatus} 
  />

  <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
    <OrderInfo {order} />
    <OrderLinesTable {order} />
  </div>
</div>
