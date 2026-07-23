<script lang="ts">
  let { data } = $props<{ data: any }>();
  let methods = $derived(data.paymentMethods || []);
</script>

<div class="space-y-4">
  <!-- Read-only: GET /v1/settings/payment-methods exists, but there is no
       create/edit endpoint for this resource yet — showing edit controls
       that call nothing would be exactly the "dead button" class of bug
       Track F existed to fix. Methods are managed via the seed for now. -->
  <p class="text-sm text-slate-500">
    Metode pembayaran aktif untuk tenant ini. Menambah/mengedit metode pembayaran belum
    tersedia di UI — hubungi pengembang untuk perubahan.
  </p>

  <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full min-w-[420px] text-left border-collapse">
        <thead>
          <tr class="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
            <th class="p-4">Nama</th>
            <th class="p-4">Tipe</th>
            <th class="p-4">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          {#each methods as method (method.id)}
            <tr class="hover:bg-slate-50 transition-colors">
              <td class="p-4 font-medium text-slate-900">{method.name}</td>
              <td class="p-4 text-slate-600 capitalize">{method.type}</td>
              <td class="p-4">
                <span class="text-xs font-medium px-2 py-1 rounded-full {method.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}">
                  {method.isActive ? 'Aktif' : 'Nonaktif'}
                </span>
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="3" class="p-8 text-center text-slate-500">Belum ada metode pembayaran.</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>
