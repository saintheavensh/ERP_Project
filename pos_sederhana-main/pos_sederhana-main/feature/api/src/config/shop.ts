import { config } from 'dotenv';
import path from 'path';

// Muat .env dari root proyek (2 level di atas feature/api)
config({ path: path.resolve(process.cwd(), '../../.env') });

export interface ShopConfig {
  name: string;
  address: string;
  phone: string;
  cashier: string;
  footerMessage: string;
  footerSubMessage: string;
}

export function getShopConfig(): ShopConfig {
  return {
    name: process.env.SHOP_NAME || 'NEW MAJMU Service',
    address: (process.env.SHOP_ADDRESS || '').replace(/\\n/g, '\n'),
    phone: process.env.SHOP_PHONE || '',
    cashier: process.env.SHOP_CASHIER || 'Kasir',
    footerMessage: process.env.FOOTER_MESSAGE || 'TERIMA KASIH ATAS KUNJUNGAN ANDA',
    footerSubMessage: process.env.FOOTER_SUB_MESSAGE || 'Barang yang sudah dibeli tidak dapat dikembalikan',
  };
}
