<script lang="ts">
  import { API_BASE } from '$lib/api/config';
  import ThermalPreview from '$lib/components/print/ThermalPreview.svelte';
  import A4Invoice from '$lib/components/print/A4Invoice.svelte';

  /**
   * Phase 7.2 — editor template nota + pratinjau.
   *
   * Pratinjaunya TIDAK digambar ulang di sini. Ia memanggil
   * `POST /v1/printer/templates/preview`, yang menjalankan mesin render yang
   * sama persis dengan cetak sungguhan, lalu hasilnya ditampilkan oleh dua
   * komponen yang juga dipakai mencetak beneran (ThermalPreview / A4Invoice).
   * Itulah yang membuat "preview sama dengan kenyataannya" bukan sekadar
   * klaim: tak ada jalur render kedua yang bisa berselisih.
   */

  interface LayoutConfig {
    header: { showStoreName: boolean; showAddress: boolean; showPhone: boolean; showLogo: boolean };
    items: { showLineSubtotal: boolean; showDescription: boolean };
    extra: { showCashierName: boolean; showTicketInfo: boolean; showSignature: boolean };
    footer: { note: string | null; warrantyPolicy: string | null };
  }

  let { token, template, onclose, onsaved }: {
    token: string;
    template: any;
    onclose: () => void;
    onsaved: () => void;
  } = $props();

  function normalize(raw: any): LayoutConfig {
    return {
      header: {
        showStoreName: raw?.header?.showStoreName ?? true,
        showAddress: raw?.header?.showAddress ?? false,
        showPhone: raw?.header?.showPhone ?? false,
        showLogo: raw?.header?.showLogo ?? false,
      },
      items: {
        showLineSubtotal: raw?.items?.showLineSubtotal ?? false,
        showDescription: raw?.items?.showDescription ?? false,
      },
      extra: {
        showCashierName: raw?.extra?.showCashierName ?? false,
        showTicketInfo: raw?.extra?.showTicketInfo ?? false,
        showSignature: raw?.extra?.showSignature ?? false,
      },
      footer: {
        note: raw?.footer?.note ?? '',
        warrantyPolicy: raw?.footer?.warrantyPolicy ?? '',
      },
    };
  }

  // svelte-ignore state_referenced_locally
  let name = $state(template.name as string);
  // svelte-ignore state_referenced_locally
  let config = $state<LayoutConfig>(normalize(template.layoutConfig));

  let preview = $state<any>(null);
  let previewError = $state('');
  let saving = $state(false);
  let errorMsg = $state('');

  let isThermal = $derived(template.paperSize === '58mm' || template.paperSize === '80mm');
  let isTicketDocument = $derived(template.documentType === 'label' || template.documentType === 'tanda_terima');

  /**
   * Sakelar mana yang benar-benar berpengaruh pada jenis dokumen ini.
   *
   * Menampilkan sakelar yang tak mengubah apa pun adalah bug yang sama dengan
   * tombol mati: owner mengiranya rusak. Label & tanda terima punya bentuk
   * tetap (bukan nota bernilai uang), jadi hanya bagian kepala & catatan yang
   * relevan; kolom subtotal dan tanda tangan khusus A4.
   */
  let SECTIONS = $derived([
    {
      id: 'header', title: 'Bagian Atas',
      fields: [
        { key: 'showStoreName', label: 'Nama toko', hint: 'Baris paling atas nota.', applies: true },
        { key: 'showAddress', label: 'Alamat cabang', hint: 'Memakan 1–2 baris di kertas kecil.', applies: true },
        { key: 'showPhone', label: 'Nomor telepon', hint: 'Supaya pelanggan bisa menghubungi balik.', applies: true },
        { key: 'showLogo', label: 'Logo', hint: 'Hanya A4 — printer thermal tak mencetak gambar di sini.', applies: template.paperSize === 'A4' },
      ],
    },
    {
      id: 'items', title: 'Rincian Barang & Jasa',
      fields: [
        { key: 'showLineSubtotal', label: 'Subtotal per baris', hint: 'Kolom tambahan di kanan tiap item.', applies: !isTicketDocument },
        { key: 'showDescription', label: 'Keterangan panjang per item', hint: 'Hanya A4 — kertas kecil tak cukup lebar.', applies: !isTicketDocument && template.paperSize === 'A4' },
      ],
    },
    {
      id: 'extra', title: 'Tambahan',
      fields: [
        { key: 'showCashierName', label: 'Nama kasir', hint: 'Siapa yang melayani transaksi ini.', applies: !isTicketDocument },
        { key: 'showTicketInfo', label: 'Info servis (teknisi, keluhan)', hint: 'Untuk nota yang berasal dari tiket servis.', applies: true },
        { key: 'showSignature', label: 'Kolom tanda tangan', hint: 'Hanya A4.', applies: template.paperSize === 'A4' },
      ],
    },
  ]);

  /**
   * Ambil pratinjau dari server tiap kali rancangannya berubah.
   *
   * Ditunda 250ms: mengetik catatan kaki huruf demi huruf tak perlu satu
   * request per ketukan, tapi jedanya cukup pendek supaya tetap terasa langsung.
   */
  $effect(() => {
    const body = JSON.stringify({
      documentType: template.documentType,
      paperSize: template.paperSize,
      layoutConfig: {
        ...config,
        footer: {
          note: config.footer.note?.trim() ? config.footer.note : null,
          warrantyPolicy: config.footer.warrantyPolicy?.trim() ? config.footer.warrantyPolicy : null,
        },
      },
    });
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/printer/templates/preview`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body,
        });
        const result = await res.json();
        if (res.ok) { preview = result.data; previewError = ''; }
        else previewError = result.error?.message || 'Gagal memuat pratinjau';
      } catch { previewError = 'Gagal memuat pratinjau'; }
    }, 250);
    return () => clearTimeout(timer);
  });

  async function save() {
    saving = true;
    errorMsg = '';
    try {
      const res = await fetch(`${API_BASE}/printer/templates/${template.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name,
          layoutConfig: {
            ...config,
            footer: {
              note: config.footer.note?.trim() ? config.footer.note : null,
              warrantyPolicy: config.footer.warrantyPolicy?.trim() ? config.footer.warrantyPolicy : null,
            },
          },
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message || 'Gagal menyimpan template');
      onsaved();
    } catch (err: any) {
      errorMsg = err.message;
    } finally {
      saving = false;
    }
  }
</script>

<div class="fixed inset-0 bg-black/40 flex items-start sm:items-center justify-center p-0 sm:p-4 z-50 overflow-y-auto">
  <div class="bg-white sm:rounded-xl shadow-lg w-full max-w-5xl my-0 sm:my-8" data-testid="template-editor">
    <div class="flex flex-wrap items-center justify-between gap-2 p-4 border-b border-slate-200">
      <div class="min-w-0">
        <h2 class="font-bold text-lg text-slate-900">Edit Template Nota</h2>
        <p class="text-xs text-slate-500">
          {template.documentType} &middot; {template.paperSize} &middot; pratinjau di samping memakai
          mesin cetak yang sama dengan cetakan sungguhan
        </p>
      </div>
      <button onclick={onclose} class="text-sm text-slate-500 hover:text-slate-900">Tutup</button>
    </div>

    {#if errorMsg}
      <div class="m-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200" data-testid="template-error">{errorMsg}</div>
    {/if}

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
      <!-- Pengaturan -->
      <div class="space-y-4">
        <div>
          <label for="tpl-name" class="block text-xs font-medium text-slate-600 mb-1">Nama template</label>
          <input id="tpl-name" bind:value={name}
            class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        {#each SECTIONS as section (section.id)}
          {@const fields = section.fields.filter((f) => f.applies)}
          {#if fields.length > 0}
            <fieldset class="border border-slate-200 rounded-lg p-3">
              <legend class="text-xs font-medium text-slate-600 px-1">{section.title}</legend>
              <div class="space-y-2">
                {#each fields as field (field.key)}
                  <label class="flex items-start gap-2 text-sm">
                    <input type="checkbox" class="mt-1"
                      bind:checked={(config as any)[section.id][field.key]}
                      data-testid="layout-flag-{section.id}-{field.key}" />
                    <span>
                      <b>{field.label}</b>
                      <span class="block text-xs text-slate-500">{field.hint}</span>
                    </span>
                  </label>
                {/each}
              </div>
            </fieldset>
          {/if}
        {/each}

        <fieldset class="border border-slate-200 rounded-lg p-3">
          <legend class="text-xs font-medium text-slate-600 px-1">Catatan Kaki</legend>
          <label for="footer-note" class="block text-xs text-slate-500 mb-1">Catatan pendek</label>
          <input id="footer-note" bind:value={config.footer.note}
            placeholder="mis. Garansi servis 7 hari"
            data-testid="footer-note"
            class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          {#if template.paperSize === 'A4'}
            <label for="footer-policy" class="block text-xs text-slate-500 mt-3 mb-1">
              Ketentuan garansi lengkap (A4)
            </label>
            <textarea id="footer-policy" bind:value={config.footer.warrantyPolicy} rows="3"
              placeholder="Teks panjang syarat & ketentuan garansi."
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"></textarea>
          {/if}
        </fieldset>
      </div>

      <!-- Pratinjau -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-xs font-medium text-slate-600">Pratinjau</h3>
          <span class="text-[11px] text-slate-400">data contoh, bukan transaksi asli</span>
        </div>
        <div class="bg-slate-100 rounded-lg p-3 overflow-x-auto max-h-[60vh] overflow-y-auto" data-testid="template-preview">
          {#if previewError}
            <p class="text-sm text-red-600">{previewError}</p>
          {:else if !preview}
            <p class="text-sm text-slate-500">Memuat pratinjau...</p>
          {:else if isThermal || preview.blocks}
            <ThermalPreview blocks={preview.blocks ?? []} paperSize={preview.paperSize} />
          {:else if preview.data}
            <div class="bg-white p-2 origin-top-left scale-[0.75] w-[133%]">
              <A4Invoice data={preview.data} />
            </div>
          {/if}
        </div>
      </div>
    </div>

    <div class="flex justify-end gap-2 p-4 border-t border-slate-200">
      <button onclick={onclose} class="px-4 py-2 text-sm text-slate-600 hover:text-slate-900">Batal</button>
      <button onclick={save} disabled={saving}
        class="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
        data-testid="save-template">
        {saving ? 'Menyimpan...' : 'Simpan Template'}
      </button>
    </div>
  </div>
</div>
