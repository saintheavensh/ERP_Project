import { invalidateAll } from '$app/navigation';

export class CustomerListState {
  data: any;
  token: string;

  showModal = $state(false);
  newCustomer = $state({ name: '', phone: '', email: '' });
  loading = $state(false);
  errorMsg = $state('');

  constructor(data: any, token: string) {
    this.data = data;
    this.token = token;
  }

  get customers() { return this.data.customers; }

  async createCustomer() {
    this.loading = true;
    this.errorMsg = '';
    try {
      const res = await fetch('http://localhost:3001/v1/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}` 
        },
        body: JSON.stringify(this.newCustomer)
      });
      
      const result = await res.json();
      if (res.ok) {
        this.showModal = false;
        this.newCustomer = { name: '', phone: '', email: '' };
        await invalidateAll();
      } else {
        this.errorMsg = result.error?.message || 'Failed to create customer';
      }
    } catch (e) {
      this.errorMsg = 'Network error';
    } finally {
      this.loading = false;
    }
  }
}
