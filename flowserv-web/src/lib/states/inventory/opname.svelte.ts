import { API_BASE } from '$lib/api/config';

export type BrandLine = { brandId: string; quantity: number; unitCost: number; sellingPrice: number };
export type OpnameItem = { inventoryItemId: string; name: string; categoryName: string; universalCode: string; sku: string; skipped: boolean; brandLines: BrandLine[] };

export class OpnameState {
  data: any;
  branchId = $state('00000000-0000-0000-0000-000000000000');
  loading = $state(false);
  errorMsg = $state('');
  successMsg = $state('');
  editableItems = $state<OpnameItem[]>([]);

  // Isi awal dibangun langsung di constructor, BUKAN di dalam $effect.
  //
  // Versi lama membungkusnya dalam `$effect.root(() => $effect(...))` dengan
  // penjaga `editableItems.length === 0`. Efek itu MEMBACA editableItems lalu
  // MENULISinya, jadi begitu daftar item kosong — yang terjadi setiap kali semua
  // produk sudah diinisialisasi — ia menulis array kosong BARU, referensinya
  // berubah, $state menandainya kotor, dan efeknya jalan lagi selamanya.
  // Loop itu memakan main thread sampai halaman tidak pernah selesai dirender.
  //
  // Lebih parah lagi: root effect-nya tidak pernah di-dispose (nilai kembalian
  // $effect.root dibuang), sehingga loop tetap berjalan SETELAH pindah halaman —
  // itu sebabnya URL berganti tapi layar tidak ikut berganti.
  //
  // Data ini hanya perlu dibaca sekali saat mount (server load yang mengirimnya,
  // dan tiap navigasi membuat instance OpnameState baru), jadi tidak ada alasan
  // memakai efek sama sekali.
  constructor(data: any) {
    this.data = data;

    this.editableItems = (data.inventoryItems || []).map((item: any) => ({
      inventoryItemId: item.id,
      name: item.name,
      categoryName: item.category?.name || '-',
      universalCode: item.universalCode,
      sku: item.sku,
      skipped: false,
      brandLines: [{
        brandId: '',
        quantity: 1,
        unitCost: 0,
        sellingPrice: parseFloat(item.sellingPrice) || 0
      }]
    }));
  }

  get partBrands() {
    return this.data.partBrands || [];
  }

  addBrandLine(itemIndex: number) {
    this.editableItems[itemIndex].brandLines = [
      ...this.editableItems[itemIndex].brandLines, 
      { brandId: '', quantity: 1, unitCost: 0, sellingPrice: 0 }
    ];
  }

  removeBrandLine(itemIndex: number, lineIndex: number) {
    if (this.editableItems[itemIndex].brandLines.length > 1) {
      this.editableItems[itemIndex].brandLines = this.editableItems[itemIndex].brandLines.filter((_: any, i: number) => i !== lineIndex);
    }
  }

  async submitOpname() {
    this.errorMsg = '';
    this.successMsg = '';
    
    const items: any[] = [];
    const skippedItemIds: string[] = [];
    let hasAction = false;

    for (const product of this.editableItems) {
      if (product.skipped) {
        skippedItemIds.push(product.inventoryItemId);
        hasAction = true;
      } else {
        const validLines = product.brandLines.filter((l: BrandLine) => l.quantity > 0);
        if (validLines.length > 0) {
          hasAction = true;
          validLines.forEach((l: BrandLine) => {
            items.push({
              inventoryItemId: product.inventoryItemId,
              brandId: l.brandId || null,
              quantity: l.quantity,
              unitCost: l.unitCost,
              sellingPrice: l.sellingPrice
            });
          });
        }
      }
    }

    if (!hasAction) {
      this.errorMsg = 'Anda belum mengisi stok atau men-skip item apapun.';
      return;
    }

    this.loading = true;
    try {
      const res = await fetch(`${API_BASE}/opname`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.data.token}`
        },
        body: JSON.stringify({
          branchId: this.branchId,
          items,
          skippedItemIds
        })
      });
      
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed to submit opname');
      
      this.successMsg = `Berhasil! ${items.length} stok baru telah dimasukkan dan ${skippedItemIds.length} item dilewati.`;
      
      setTimeout(() => {
        this.editableItems = this.editableItems.filter(p => !this.productWasProcessed(p.inventoryItemId, items, skippedItemIds));
        this.successMsg = '';
      }, 3000);
      
    } catch (err: any) {
      this.errorMsg = err.message;
    } finally {
      this.loading = false;
    }
  }

  productWasProcessed(id: string, submittedItems: any[], skippedIds: string[]) {
    if (skippedIds.includes(id)) return true;
    if (submittedItems.some(si => si.inventoryItemId === id)) return true;
    return false;
  }
}
