import { untrack } from 'svelte';
import { API_BASE } from '$lib/api/config';

export class CompatibilityManagerState {
  item: any;
  token: string;
  allModels: any[];

  isEditingCompat = $state(false);
  resolvedIds = $state<string[]>([]);
  unresolved = $state<string[]>([]);
  saving = $state(false);
  successMsg = $state('');

  constructor(item: any, token: string, allModels: any[]) {
    this.item = item;
    this.token = token;
    this.allModels = allModels;

    $effect.root(() => {
      $effect(() => {
        if (this.item && !this.isEditingCompat) {
          this.resolvedIds = this.item.compatibility?.map((c: any) => c.deviceModel.id) || [];
          this.unresolved = [...(this.item.unresolvedCompatibility || [])];
        }
      });
    });
  }

  startEdit() {
    this.isEditingCompat = true;
  }

  cancelEdit() {
    this.isEditingCompat = false;
    this.resolvedIds = this.item.compatibility?.map((c: any) => c.deviceModel.id) || [];
    this.unresolved = [...(this.item.unresolvedCompatibility || [])];
  }
  
  removeUnresolved(index: number) {
    this.unresolved = this.unresolved.filter((_, i) => i !== index);
  }

  async saveCompatibility() {
    this.saving = true;
    try {
      const res = await fetch(`${API_BASE}/inventory/${this.item.id}/compatibility`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          resolvedModelIds: this.resolvedIds,
          unresolvedCompatibility: this.unresolved
        })
      });
      
      if (res.ok) {
        this.successMsg = 'Kompatibilitas berhasil diperbarui.';
        this.isEditingCompat = false;
        
        setTimeout(() => {
          this.successMsg = '';
          window.location.reload(); 
        }, 1500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      this.saving = false;
    }
  }
}
