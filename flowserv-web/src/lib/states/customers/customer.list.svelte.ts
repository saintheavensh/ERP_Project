import { invalidateAll } from '$app/navigation';
import { API_BASE } from '$lib/api/config';

export class CustomerListState {
  // R1.10-T2 — `$state`, bukan field biasa. Pemilik (uji-R1.9 B4): "tabel tidak
  // refresh otomatis". `createCustomer()` SUDAH memanggil invalidateAll() dan
  // datanya memang datang — yang salah adalah kelas ini memegang SALINAN `data`
  // dari saat halaman pertama dibuka, jadi getter `customers` selamanya membaca
  // daftar lama sampai halaman dimuat ulang penuh.
  //
  // Bug yang sama persis sudah ditemukan & diperbaiki untuk halaman tiket di
  // H15 (lihat komentar di `tickets/ticket.detail.svelte.ts`) — perbaikannya
  // disalin dari sana, berikut `$effect` penyelaras di `+page.svelte`.
  //
  // Catatan cakupan: pola `new XState(data)` + `// svelte-ignore
  // state_referenced_locally` dipakai di 19 halaman, dan peringatan yang
  // di-ignore itu justru peringatan yang menangkap bug ini. Hanya halaman ini
  // yang diperbaiki di R1.10 — sisanya tidak disentuh tanpa bukti masalah nyata
  // (aturan Architecture Debt), dan dicatat sebagai kandidat audit R4.
  data = $state<any>(undefined);
  token: string;

  showModal = $state(false);
  newCustomer = $state({ name: '', phone: '', email: '', allowTempo: false, customerType: 'service' });
  loading = $state(false);
  errorMsg = $state('');
  // R1.10-T2 — pemilik: "tidak ada toast untuk mengetahui apakah berhasil atau
  // tidaknya penambahan pelanggan". Kosong = tidak ada pesan yang sedang tampil.
  toast = $state<{ tone: 'ok' | 'gagal'; text: string } | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  // Tahap-B — filter daftar per kategori ('' = semua).
  typeFilter = $state<'' | 'service' | 'sparepart'>('');

  constructor(data: any, token: string) {
    this.data = data;
    this.token = token;
  }

  /** Pesan singkat yang hilang sendiri. Timer lama dibatalkan supaya pesan
   *  kedua tidak ikut terhapus oleh hitungan mundur pesan pertama. */
  private tunjukkanToast(tone: 'ok' | 'gagal', text: string) {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toast = { tone, text };
    this.toastTimer = setTimeout(() => { this.toast = null; }, 4000);
  }

  get customers() {
    const all = this.data.customers || [];
    return this.typeFilter ? all.filter((c: any) => (c.customerType || 'service') === this.typeFilter) : all;
  }

  async createCustomer() {
    this.loading = true;
    this.errorMsg = '';
    try {
      const res = await fetch(`${API_BASE}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}` 
        },
        body: JSON.stringify(this.newCustomer)
      });
      
      const result = await res.json();
      if (res.ok) {
        const nama = this.newCustomer.name;
        this.showModal = false;
        this.newCustomer = { name: '', phone: '', email: '', allowTempo: false, customerType: 'service' };
        await invalidateAll();
        this.tunjukkanToast('ok', `Pelanggan "${nama}" berhasil ditambahkan.`);
      } else {
        // Ditampilkan DI DUA tempat dengan sengaja: `errorMsg` di dalam modal
        // (dekat form yang gagal) dan toast (terlihat walau modal tertutup).
        this.errorMsg = result.error?.message || 'Gagal menambahkan pelanggan';
        this.tunjukkanToast('gagal', this.errorMsg);
      }
    } catch (e) {
      this.errorMsg = 'Network error';
      this.tunjukkanToast('gagal', 'Gagal menghubungi server.');
    } finally {
      this.loading = false;
    }
  }
}
