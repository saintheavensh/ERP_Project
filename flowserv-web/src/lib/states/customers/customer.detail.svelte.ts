import { invalidateAll } from '$app/navigation';

export class CustomerDetailState {
  data: any;
  token: string;

  showModal = $state(false);
  newAsset = $state({ assetType: '', brand: '', model: '', serialNumber: '' });
  loading = $state(false);
  errorMsg = $state('');

  constructor(data: any, token: string) {
    this.data = data;
    this.token = token;
  }

  get customer() { return this.data.customer; }
  get assets() { return this.data.assets; }

  async createAsset() {
    this.loading = true;
    this.errorMsg = '';
    try {
      const res = await fetch(`http://localhost:3001/v1/customers/${this.customer.id}/assets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify(this.newAsset)
      });
      
      const result = await res.json();
      if (res.ok) {
        this.showModal = false;
        this.newAsset = { assetType: '', brand: '', model: '', serialNumber: '' };
        await invalidateAll();
      } else {
        this.errorMsg = result.error?.message || 'Failed to create asset';
      }
    } catch (e) {
      this.errorMsg = 'Network error';
    } finally {
      this.loading = false;
    }
  }
}
