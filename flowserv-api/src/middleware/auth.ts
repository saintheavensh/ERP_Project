import { Context, Next } from 'hono';
import { jwt } from 'hono/jwt';
import { errorResponse } from '../lib/response';

export type JwtPayload = {
  userId: string;
  tenantId: string;
  roleId: string;
  roleName: string;
  exp: number;
};

// ---------------------------------------------------------------------------
// Phase 11 — kunci penanda tangan token.
//
// Sampai 2026-08-05 baris ini berbunyi:
//
//   process.env.JWT_SECRET || 'super-secret-fallback-key-do-not-use-in-prod'
//
// Cadangan itu **ada di dalam kode yang di-commit**, jadi siapa pun yang bisa
// membaca repo ini dapat membuat token yang valid untuk server mana pun yang
// lupa mengisi `JWT_SECRET` — termasuk memalsukan `tenantId` dan `roleName`,
// yaitu SELURUH batas keamanan aplikasi ini sekaligus. PHASES.md sudah
// menandainya sebagai syarat sebelum VPS sejak awal.
//
// Sekarang: **gagal saat start**, bukan diam-diam memakai cadangan. Server yang
// mati dengan pesan jelas jauh lebih baik daripada server yang menyala dengan
// kunci yang diketahui publik — kesalahan yang tak akan pernah terlihat sampai
// seseorang memanfaatkannya.
//
// Longgar HANYA di luar produksi, supaya `npm run dev` dan `npm test` tetap
// jalan tanpa berkas `.env`. Pembedanya `NODE_ENV`, dan Dockerfile produksi
// menyetelnya ke `production` — jadi jalur longgar itu tak mungkin aktif di VPS.
// ---------------------------------------------------------------------------
const DEV_JWT_SECRET = 'dev-only-insecure-key';

function resolveJwtSecret(): string {
  const fromEnv = process.env.JWT_SECRET?.trim();
  if (fromEnv) return fromEnv;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'JWT_SECRET wajib diisi saat NODE_ENV=production. Buat satu nilai acak ' +
      'panjang (mis. `openssl rand -base64 48`) lalu simpan di .env server. ' +
      'Server sengaja menolak menyala tanpa ini.'
    );
  }

  console.warn(
    '[auth] JWT_SECRET tidak diset — memakai kunci pengembangan yang TIDAK aman. ' +
    'Ini hanya boleh terjadi di komputer pengembang.'
  );
  return DEV_JWT_SECRET;
}

export const JWT_SECRET = resolveJwtSecret();

// Auth middleware to verify JWT
import { HTTPException } from 'hono/http-exception';

export const requireAuth = async (c: Context, next: Next) => {
  const jwtMiddleware = jwt({
    secret: JWT_SECRET,
    alg: 'HS256' 
  });

  return jwtMiddleware(c, async () => {
    const payload = c.get('jwtPayload') as JwtPayload;
    if (!payload || !payload.userId || !payload.tenantId) {
      throw new HTTPException(401, { message: 'Invalid token payload' });
    }
    await next();
  });
};

// Helper to get typed context
export const getAuthContext = (c: Context): JwtPayload => {
  return c.get('jwtPayload') as JwtPayload;
};
