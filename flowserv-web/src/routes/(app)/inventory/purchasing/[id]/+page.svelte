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

  async function deleteOrder() {
    let warning = `Are you sure you want to delete this PO?`;
    if (order.status === 'received' || order.status === 'completed') {
      warning = `WARNING: This PO is already ${order.status}. Deleting it in dev-mode will rollback all stock batches and movements, which may cause negative stock levels! Do you want to proceed?`;
    }
    
    if (!confirm(warning)) return;
    loading = true;
    
    try {
      const res = await fetch(`${API_BASE}/purchasing/orders/${order.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${data.token}`
        }
      });
      
      if (!res.ok) throw new Error('Failed to delete order');
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
