export function createPosDrafts(data: any, productsState: any, cartState: any, commonState: any) {
  let showDraftsModal = $state(false);
  let drafts: any[] = $state([]);
  let loadingDrafts = $state(false);

  async function saveDraft() {
    if (cartState.cart.length === 0) {
      alert("Keranjang kosong!");
      return;
    }
    const name = prompt("Masukkan nama untuk draft pesanan ini (misal: 'Pesanan WA - Budi'):");
    if (!name) return;

    commonState.processing = true;
    try {
      const res = await fetch('http://localhost:3001/v1/pos/drafts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.token}`
        },
        body: JSON.stringify({
          branchId: productsState.selectedBranchId,
          name,
          cartItems: cartState.cart
        })
      });
      if (res.ok) {
        commonState.successMsg = `Draft '${name}' berhasil disimpan!`;
        cartState.clearCart(); 
      } else {
        const err = await res.json();
        alert('Gagal menyimpan draft: ' + err.error?.message);
      }
    } catch (e) {
      alert('Error saat menghubungi server.');
    } finally {
      commonState.processing = false;
      setTimeout(() => commonState.successMsg = '', 3000);
    }
  }

  async function openDrafts() {
    if (!productsState.selectedBranchId) {
      alert('Pilih cabang terlebih dahulu');
      return;
    }
    showDraftsModal = true;
    loadingDrafts = true;
    try {
      const res = await fetch(`http://localhost:3001/v1/pos/drafts?branchId=${productsState.selectedBranchId}`, {
        headers: { 'Authorization': `Bearer ${data.token}` }
      });
      if (res.ok) {
        drafts = (await res.json()).data;
      }
    } catch (e) {
      console.error(e);
    } finally {
      loadingDrafts = false;
    }
  }

  async function loadDraft(draft: any) {
    cartState.cart = draft.cartItems;
    showDraftsModal = false;
    commonState.successMsg = `Draft '${draft.name}' dimuat.`;
    setTimeout(() => commonState.successMsg = '', 3000);

    fetch(`http://localhost:3001/v1/pos/drafts/${draft.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${data.token}` }
    }).catch(console.error);
  }

  async function deleteDraft(id: string, e: Event) {
    e.stopPropagation();
    if (!confirm('Hapus draft ini secara permanen?')) return;
    
    try {
      await fetch(`http://localhost:3001/v1/pos/drafts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${data.token}` }
      });
      drafts = drafts.filter((d: any) => d.id !== id);
    } catch (e) {
      console.error(e);
    }
  }

  return {
    get showDraftsModal() { return showDraftsModal; },
    set showDraftsModal(val) { showDraftsModal = val; },
    get drafts() { return drafts; },
    get loadingDrafts() { return loadingDrafts; },
    saveDraft,
    openDrafts,
    loadDraft,
    deleteDraft
  };
}
