<script lang="ts">
  // Device photo upload, adapted from the owner's previous project's
  // image-upload.svelte (POST multipart 'file' + 'folder' -> relative URL),
  // rewritten against our own upload endpoint/response envelope and Tailwind
  // (no external UI/icon library, matching this codebase's existing style).
  // A manual "atau URL gambar" fallback is kept alongside upload -- some
  // catalog entries (the bulk-imported ones, and the two hand-seeded demo
  // rows) already carry a real URL/path rather than something uploaded here.
  import { API_BASE } from '$lib/api/config';
  import { resolveImageUrl } from '$lib/utils/image';

  let { value = $bindable(''), token, folder = 'devices' }: {
    value: string;
    token: string;
    folder?: string;
  } = $props();

  let uploading = $state(false);
  let error = $state('');
  let fileInput: HTMLInputElement;

  async function handleFileChange(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    uploading = true;
    error = '';
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      const res = await fetch(`${API_BASE}/uploads`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message || 'Gagal mengupload gambar');
      value = result.data.url;
    } catch (err: any) {
      error = err.message;
    } finally {
      uploading = false;
      input.value = '';
    }
  }
</script>

<div class="space-y-2">
  <div class="flex items-center gap-3">
    {#if value}
      <div class="relative w-16 h-16 flex-shrink-0 group">
        <img src={resolveImageUrl(value)} alt="" class="w-16 h-16 object-cover rounded-lg border border-slate-200" />
        <button
          type="button"
          onclick={() => value = ''}
          class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Hapus gambar"
        >&times;</button>
      </div>
    {:else}
      <div class="w-16 h-16 flex-shrink-0 rounded-lg border-2 border-dashed border-slate-200"></div>
    {/if}

    <button
      type="button"
      disabled={uploading}
      onclick={() => fileInput?.click()}
      class="px-3 py-2 text-sm bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg font-medium text-slate-700 disabled:opacity-50"
    >
      {uploading ? 'Mengupload...' : 'Upload Gambar'}
    </button>
  </div>

  {#if error}
    <p class="text-xs text-red-600">{error}</p>
  {/if}

  <div>
    <label class="block text-xs text-slate-500 mb-1" for="image-url-fallback">atau URL gambar</label>
    <!-- Plain text, not type="url": the value here is often a relative
         "/uploads/..." path from our own upload endpoint, not a fully
         qualified URL -- type="url" fails native constraint validation on
         that shape, which silently blocks the whole form's submit event. -->
    <input id="image-url-fallback" type="text" bind:value class="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://...">
  </div>

  <input bind:this={fileInput} type="file" accept="image/jpeg,image/png,image/webp" class="hidden" onchange={handleFileChange}>
</div>
