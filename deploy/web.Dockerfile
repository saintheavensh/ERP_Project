# FlowServ Web — SvelteKit (adapter-node)
#
# Dua tahap. Tahap build butuh seluruh dev-dependency SvelteKit (~ratusan MB);
# tahap jalan tidak butuh satu pun — `adapter-node` menghasilkan `build/` yang
# berdiri sendiri. Tanpa pemisahan ini, image produksinya membawa Vite,
# Playwright, dan svelte-check ke VPS tanpa guna.
#
# ⚠️ Konteks build = ROOT REPO (npm workspaces, node_modules di-hoist).

# ---------- Tahap 1: build ----------
FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY flowserv-api/package.json ./flowserv-api/
COPY flowserv-web/package.json ./flowserv-web/

RUN npm ci --workspace=flowserv-web --include-workspace-root

COPY flowserv-web ./flowserv-web

WORKDIR /app/flowserv-web

# Alamat API TIDAK dibekukan di sini.
#
# `$env/dynamic/public` dibaca saat RUNTIME, bukan saat build (beda dengan
# `$env/static/public`). Artinya satu image yang sama bisa dipakai untuk domain
# mana pun — ganti `PUBLIC_API_URL` di .env, restart, selesai. Kalau ia dibekukan
# saat build, setiap ganti domain berarti build ulang seluruh frontend.
RUN npm run build

# ---------- Tahap 2: jalan ----------
FROM node:24-alpine AS runner

WORKDIR /app

# Hanya dependensi produksi. `--omit=dev` di sini yang membuang Vite dkk.
COPY package.json package-lock.json ./
COPY flowserv-api/package.json ./flowserv-api/
COPY flowserv-web/package.json ./flowserv-web/
RUN npm ci --workspace=flowserv-web --include-workspace-root --omit=dev

COPY --from=builder /app/flowserv-web/build ./flowserv-web/build

WORKDIR /app/flowserv-web

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

CMD ["node", "build"]
