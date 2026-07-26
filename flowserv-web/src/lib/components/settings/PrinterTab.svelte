<script lang="ts">
  import { API_BASE } from '$lib/api/config';
  import { PRINTER_AGENT_URL } from '$lib/api/printer-agent';
  import PrinterScanPicker from './PrinterScanPicker.svelte';

  let { data } = $props<{ data: any }>();
  let devices = $derived(data.printerDevices || []);
  let templates = $derived(data.printerTemplates || []);
  let assignments = $derived(data.printerAssignments || []);
  let branches = $derived(data.branches || []);

  const DOCUMENT_TYPES: Array<{ id: string; label: string }> = [
    { id: 'receipt', label: 'Struk' },
    { id: 'invoice_a4', label: 'Invoice A4' },
    // Seeded (plan Q2) but no print trigger yet anywhere in the app — still
    // configurable here so the assignment exists once a trigger is added.
    { id: 'label', label: 'Label Garansi' },
  ];

  const CONNECTION_LABELS: Record<string, string> = {
    usb: 'USB', network: 'Jaringan', serial: 'Serial', os_printer: 'Printer OS (A4)',
    win32: 'Printer Windows (Pindai Otomatis)',
  };

  function branchName(branchId: string): string {
    return branches.find((b: any) => b.id === branchId)?.name ?? '-';
  }

  function documentTypeLabel(dt: string): string {
    return DOCUMENT_TYPES.find((d) => d.id === dt)?.label ?? dt;
  }

  function assignmentFor(branchId: string, documentType: string) {
    return assignments.find((a: any) => a.branchId === branchId && a.documentType === documentType);
  }

  // ---- Devices ----

  interface DeviceForm { branchId: string; name: string; connectionType: string; connectionAddress: string; paperSize: string; }
  const emptyDeviceForm = (): DeviceForm => ({ branchId: branches[0]?.id ?? '', name: '', connectionType: 'usb', connectionAddress: '', paperSize: '80mm' });

  let showAddDevice = $state(false);
  let deviceForm = $state<DeviceForm>(emptyDeviceForm());
  let deviceLoading = $state(false);
  let deviceErrorMsg = $state('');

  let editingDeviceId = $state<string | null>(null);
  let editDeviceForm = $state<DeviceForm>(emptyDeviceForm());
  let editDeviceLoading = $state(false);
  let editDeviceErrorMsg = $state('');

  async function addDevice() {
    deviceLoading = true;
    deviceErrorMsg = '';
    try {
      const res = await fetch(`${API_BASE}/printer/devices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.token}` },
        body: JSON.stringify({
          branchId: deviceForm.branchId,
          name: deviceForm.name,
          connectionType: deviceForm.connectionType,
          connectionAddress: deviceForm.connectionAddress || undefined,
          paperSize: deviceForm.paperSize,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message || 'Gagal menambah printer');
      window.location.reload();
    } catch (err: any) {
      deviceErrorMsg = err.message;
      deviceLoading = false;
    }
  }

  function openEditDevice(device: any) {
    editingDeviceId = device.id;
    editDeviceErrorMsg = '';
    editDeviceForm = {
      branchId: device.branchId,
      name: device.name,
      connectionType: device.connectionType,
      connectionAddress: device.connectionAddress ?? '',
      paperSize: device.paperSize,
    };
  }

  // ---- Test print (per registered device) ----
  // Lets the admin re-verify "is this printer actually integrated correctly"
  // at any time, not just right after picking it in the add/edit modal --
  // useful after moving cables, restarting the agent, or just doubting a
  // config from last week. Only applies to thermal devices; A4 (os_printer)
  // never goes through the agent (spec rule 2), so window.print() itself is
  // the only meaningful "test" for those, already exercised on real invoices.
  type TestPrintStatus = 'idle' | 'printing' | 'printed' | 'failed';
  let testPrintStatus = $state<Record<string, TestPrintStatus>>({});
  let testPrintErrorMsg = $state<Record<string, string>>({});

  async function testPrintDevice(device: any) {
    testPrintStatus = { ...testPrintStatus, [device.id]: 'printing' };
    try {
      const res = await fetch(`${PRINTER_AGENT_URL}/test-print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperSize: device.paperSize }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Test cetak gagal');
      testPrintStatus = { ...testPrintStatus, [device.id]: 'printed' };
    } catch (err: any) {
      testPrintStatus = { ...testPrintStatus, [device.id]: 'failed' };
      testPrintErrorMsg = { ...testPrintErrorMsg, [device.id]: err.message || 'Agent printer tidak terdeteksi.' };
    }
  }

  async function saveEditDevice() {
    if (!editingDeviceId) return;
    editDeviceLoading = true;
    editDeviceErrorMsg = '';
    try {
      const res = await fetch(`${API_BASE}/printer/devices/${editingDeviceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.token}` },
        body: JSON.stringify({
          name: editDeviceForm.name,
          connectionType: editDeviceForm.connectionType,
          connectionAddress: editDeviceForm.connectionAddress || null,
          paperSize: editDeviceForm.paperSize,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message || 'Gagal menyimpan perubahan');
      window.location.reload();
    } catch (err: any) {
      editDeviceErrorMsg = err.message;
      editDeviceLoading = false;
    }
  }

  // ---- Assignment matrix ----
  // A device can't change branch after creation, so the branch picker in the
  // assign modal is fixed to the slot's own branch (not editable) -- only
  // device + template are chosen. Templates are filtered to the slot's
  // documentType AND (once a device is picked) that device's paperSize, so
  // the client can never submit a combination the server would reject with
  // PAPER_SIZE_MISMATCH / TEMPLATE_DOCUMENT_TYPE_MISMATCH.

  let assignBranchId = $state<string | null>(null);
  let assignDocumentType = $state<string | null>(null);
  let assignDeviceId = $state('');
  let assignTemplateId = $state('');
  let assignLoading = $state(false);
  let assignErrorMsg = $state('');

  let devicesForAssignBranch = $derived(devices.filter((d: any) => d.branchId === assignBranchId));
  let selectedAssignDevice = $derived(devices.find((d: any) => d.id === assignDeviceId));
  let templatesForAssignSlot = $derived(
    templates.filter((t: any) => t.documentType === assignDocumentType && (!selectedAssignDevice || t.paperSize === selectedAssignDevice.paperSize))
  );

  function openAssign(branchId: string, documentType: string) {
    assignBranchId = branchId;
    assignDocumentType = documentType;
    assignErrorMsg = '';
    const existing = assignmentFor(branchId, documentType);
    assignDeviceId = existing?.printerDeviceId ?? devicesForAssignAt(branchId)[0]?.id ?? '';
    assignTemplateId = existing?.printerTemplateId ?? '';
  }

  function devicesForAssignAt(branchId: string) {
    return devices.filter((d: any) => d.branchId === branchId);
  }

  function closeAssign() {
    assignBranchId = null;
    assignDocumentType = null;
  }

  async function submitAssign() {
    if (!assignBranchId || !assignDocumentType || !assignDeviceId || !assignTemplateId) {
      assignErrorMsg = 'Pilih printer dan template.';
      return;
    }
    assignLoading = true;
    assignErrorMsg = '';
    try {
      const res = await fetch(`${API_BASE}/printer/assignments`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.token}` },
        body: JSON.stringify({
          branchId: assignBranchId,
          documentType: assignDocumentType,
          printerDeviceId: assignDeviceId,
          printerTemplateId: assignTemplateId,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message || 'Gagal menyimpan pengaturan printer');
      window.location.reload();
    } catch (err: any) {
      assignErrorMsg = err.message;
      assignLoading = false;
    }
  }
</script>

<div class="space-y-8">
  <!-- Devices -->
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="font-semibold text-slate-900">Printer Terdaftar</h2>
        <p class="text-sm text-slate-500">Printer fisik per cabang (thermal 58/80mm atau printer OS untuk A4).</p>
      </div>
      <button
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm shadow-sm transition-colors"
        onclick={() => { deviceForm = emptyDeviceForm(); deviceErrorMsg = ''; showAddDevice = true; }}
      >
        + Tambah Printer
      </button>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden" data-testid="printer-devices-table">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[640px] text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
              <th class="p-4">Nama</th>
              <th class="p-4">Cabang</th>
              <th class="p-4">Koneksi</th>
              <th class="p-4">Ukuran Kertas</th>
              <th class="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {#each devices as device (device.id)}
              <tr class="hover:bg-slate-50 transition-colors">
                <td class="p-4 font-medium text-slate-900">{device.name}</td>
                <td class="p-4 text-slate-600">{branchName(device.branchId)}</td>
                <td class="p-4 text-slate-600">{CONNECTION_LABELS[device.connectionType] ?? device.connectionType}</td>
                <td class="p-4 text-slate-600">{device.paperSize}</td>
                <td class="p-4 text-right space-y-1">
                  <div class="flex justify-end items-center gap-3">
                    {#if device.paperSize !== 'A4'}
                      <button
                        class="text-slate-600 hover:text-slate-900 text-sm font-medium disabled:opacity-50"
                        disabled={testPrintStatus[device.id] === 'printing'}
                        onclick={() => testPrintDevice(device)}
                        data-testid="test-print-device-button"
                      >
                        {testPrintStatus[device.id] === 'printing' ? 'Mencetak...' : 'Test Cetak'}
                      </button>
                    {/if}
                    <button class="text-blue-600 hover:text-blue-800 text-sm font-medium" onclick={() => openEditDevice(device)}>Edit</button>
                  </div>
                  {#if testPrintStatus[device.id] === 'printed'}
                    <p class="text-xs text-green-700" data-testid="test-print-device-status">Terkirim — cek hasil cetak fisik.</p>
                  {:else if testPrintStatus[device.id] === 'failed'}
                    <p class="text-xs text-red-700" data-testid="test-print-device-status">Gagal: {testPrintErrorMsg[device.id]}</p>
                  {/if}
                </td>
              </tr>
            {:else}
              <tr>
                <td colspan="5" class="p-8 text-center text-slate-500">Belum ada printer terdaftar.</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- Templates (read-only — the WYSIWYG editor is a Phase 7 task) -->
  <div class="space-y-4">
    <div>
      <h2 class="font-semibold text-slate-900">Template Cetak</h2>
      <p class="text-sm text-slate-500">
        Template bawaan per jenis dokumen &amp; ukuran kertas. Mengedit tata letak template
        belum tersedia di UI ini — direncanakan sebagai editor WYSIWYG di fase berikutnya.
      </p>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden" data-testid="printer-templates-table">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[520px] text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
              <th class="p-4">Nama Template</th>
              <th class="p-4">Jenis Dokumen</th>
              <th class="p-4">Ukuran Kertas</th>
              <th class="p-4">Default</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {#each templates as template (template.id)}
              <tr class="hover:bg-slate-50 transition-colors">
                <td class="p-4 font-medium text-slate-900">{template.name}</td>
                <td class="p-4 text-slate-600">{documentTypeLabel(template.documentType)}</td>
                <td class="p-4 text-slate-600">{template.paperSize}</td>
                <td class="p-4">
                  {#if template.isDefault}
                    <span class="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">Default</span>
                  {/if}
                </td>
              </tr>
            {:else}
              <tr>
                <td colspan="4" class="p-8 text-center text-slate-500">Belum ada template.</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- Assignment matrix -->
  <div class="space-y-4">
    <div>
      <h2 class="font-semibold text-slate-900">Pengaturan Cetak per Cabang</h2>
      <p class="text-sm text-slate-500">Tentukan printer &amp; template mana yang dipakai untuk tiap jenis dokumen, per cabang.</p>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden" data-testid="printer-assignment-matrix">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[640px] text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
              <th class="p-4">Cabang</th>
              {#each DOCUMENT_TYPES as dt (dt.id)}
                <th class="p-4">{dt.label}</th>
              {/each}
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {#each branches as branch (branch.id)}
              <tr class="hover:bg-slate-50 transition-colors">
                <td class="p-4 font-medium text-slate-900">{branch.name}</td>
                {#each DOCUMENT_TYPES as dt (dt.id)}
                  {@const current = assignmentFor(branch.id, dt.id)}
                  <td class="p-4" data-testid="assign-cell-{branch.id}-{dt.id}">
                    {#if current}
                      <div class="text-sm text-slate-700">{current.device?.name}</div>
                      <div class="text-xs text-slate-400">{current.template?.name}</div>
                    {:else}
                      <span class="text-xs text-slate-400">Belum diatur</span>
                    {/if}
                    <button
                      class="block mt-1 text-blue-600 hover:text-blue-800 text-xs font-medium"
                      onclick={() => openAssign(branch.id, dt.id)}
                    >
                      Atur
                    </button>
                  </td>
                {/each}
              </tr>
            {:else}
              <tr>
                <td colspan={DOCUMENT_TYPES.length + 1} class="p-8 text-center text-slate-500">Belum ada cabang.</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>

{#if showAddDevice}
  <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
      <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
        <h3 class="font-semibold text-lg text-slate-900">Tambah Printer</h3>
        <button class="text-slate-400 hover:text-slate-600" aria-label="Tutup" onclick={() => showAddDevice = false}>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <form onsubmit={(e) => { e.preventDefault(); addDevice(); }} class="p-6 space-y-4 overflow-y-auto">
        {#if deviceErrorMsg}
          <div class="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">{deviceErrorMsg}</div>
        {/if}
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="device-branch">Cabang *</label>
          <select id="device-branch" bind:value={deviceForm.branchId} required class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
            {#each branches as branch (branch.id)}
              <option value={branch.id}>{branch.name}</option>
            {/each}
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="device-name">Nama Printer *</label>
          <input id="device-name" type="text" bind:value={deviceForm.name} required class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="mis. Epson TM-T82 - Kasir 2">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="device-connection">Jenis Koneksi *</label>
          <select id="device-connection" bind:value={deviceForm.connectionType} required class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
            <option value="win32">Printer Windows (Pindai Otomatis)</option>
            <option value="usb">USB</option>
            <option value="network">Jaringan</option>
            <option value="serial">Serial</option>
            <option value="os_printer">Printer OS (A4)</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="device-address">
            {deviceForm.connectionType === 'win32' ? 'Nama Printer Windows' : 'Alamat Koneksi (Opsional)'}
          </label>
          <input id="device-address" type="text" bind:value={deviceForm.connectionAddress} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder={deviceForm.connectionType === 'win32' ? 'mis. POS-80' : 'mis. USB001 atau 192.168.1.50'}>
          {#if deviceForm.connectionType === 'win32'}
            <div class="mt-2">
              <PrinterScanPicker bind:connectionAddress={deviceForm.connectionAddress} bind:deviceName={deviceForm.name} paperSize={deviceForm.paperSize} />
            </div>
          {/if}
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="device-paper">Ukuran Kertas *</label>
          <select id="device-paper" bind:value={deviceForm.paperSize} required class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
            <option value="58mm">58mm</option>
            <option value="80mm">80mm</option>
            <option value="A4">A4</option>
          </select>
        </div>
        <div class="pt-2 flex justify-end gap-3">
          <button type="button" class="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors" onclick={() => showAddDevice = false}>Batal</button>
          <button type="submit" disabled={deviceLoading} class="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
            {deviceLoading ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

{#if editingDeviceId}
  <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
      <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
        <h3 class="font-semibold text-lg text-slate-900">Edit Printer</h3>
        <button class="text-slate-400 hover:text-slate-600" aria-label="Tutup" onclick={() => editingDeviceId = null}>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <form onsubmit={(e) => { e.preventDefault(); saveEditDevice(); }} class="p-6 space-y-4 overflow-y-auto">
        {#if editDeviceErrorMsg}
          <div class="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">{editDeviceErrorMsg}</div>
        {/if}
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="edit-device-name">Nama Printer *</label>
          <input id="edit-device-name" type="text" bind:value={editDeviceForm.name} required class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="edit-device-connection">Jenis Koneksi *</label>
          <select id="edit-device-connection" bind:value={editDeviceForm.connectionType} required class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
            <option value="win32">Printer Windows (Pindai Otomatis)</option>
            <option value="usb">USB</option>
            <option value="network">Jaringan</option>
            <option value="serial">Serial</option>
            <option value="os_printer">Printer OS (A4)</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="edit-device-address">
            {editDeviceForm.connectionType === 'win32' ? 'Nama Printer Windows' : 'Alamat Koneksi (Opsional)'}
          </label>
          <input id="edit-device-address" type="text" bind:value={editDeviceForm.connectionAddress} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
          {#if editDeviceForm.connectionType === 'win32'}
            <div class="mt-2">
              <PrinterScanPicker bind:connectionAddress={editDeviceForm.connectionAddress} bind:deviceName={editDeviceForm.name} paperSize={editDeviceForm.paperSize} />
            </div>
          {/if}
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="edit-device-paper">Ukuran Kertas *</label>
          <select id="edit-device-paper" bind:value={editDeviceForm.paperSize} required class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
            <option value="58mm">58mm</option>
            <option value="80mm">80mm</option>
            <option value="A4">A4</option>
          </select>
        </div>
        <p class="text-xs text-slate-400">Cabang tidak dapat diubah setelah printer dibuat.</p>
        <div class="pt-2 flex justify-end gap-3">
          <button type="button" class="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors" onclick={() => editingDeviceId = null}>Batal</button>
          <button type="submit" disabled={editDeviceLoading} class="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
            {editDeviceLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

{#if assignBranchId && assignDocumentType}
  <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
        <h3 class="font-semibold text-lg text-slate-900">
          Atur Printer &mdash; {documentTypeLabel(assignDocumentType)}
        </h3>
        <button class="text-slate-400 hover:text-slate-600" aria-label="Tutup" onclick={closeAssign}>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <form onsubmit={(e) => { e.preventDefault(); submitAssign(); }} class="p-6 space-y-4">
        {#if assignErrorMsg}
          <div class="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">{assignErrorMsg}</div>
        {/if}
        <p class="text-sm text-slate-500">Cabang: <span class="font-medium text-slate-700">{branchName(assignBranchId)}</span></p>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="assign-device">Printer *</label>
          <select id="assign-device" bind:value={assignDeviceId} required class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
            <option value="" disabled>Pilih printer</option>
            {#each devicesForAssignBranch as device (device.id)}
              <option value={device.id}>{device.name} ({device.paperSize})</option>
            {/each}
          </select>
          {#if devicesForAssignBranch.length === 0}
            <p class="text-xs text-red-600 mt-1">Cabang ini belum punya printer terdaftar.</p>
          {/if}
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="assign-template">Template *</label>
          <select id="assign-template" bind:value={assignTemplateId} required class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
            <option value="" disabled>Pilih template</option>
            {#each templatesForAssignSlot as template (template.id)}
              <option value={template.id}>{template.name}</option>
            {/each}
          </select>
          {#if assignDeviceId && templatesForAssignSlot.length === 0}
            <p class="text-xs text-red-600 mt-1">Tidak ada template {documentTypeLabel(assignDocumentType)} untuk ukuran kertas printer ini.</p>
          {/if}
        </div>

        <div class="pt-2 flex justify-end gap-3">
          <button type="button" class="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors" onclick={closeAssign}>Batal</button>
          <button type="submit" disabled={assignLoading} class="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
            {assignLoading ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
