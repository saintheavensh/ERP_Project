# FlowServ API — Hono + Drizzle
#
# ⚠️ Konteks build-nya adalah ROOT REPO, bukan flowserv-api/. Repo ini monorepo
# npm workspaces: `node_modules` di-hoist ke root, jadi `npm ci` dari dalam
# flowserv-api/ akan menghasilkan pohon dependensi yang tidak lengkap.
# Lihat `context: .` di docker-compose.yml.

# Node 24 = jalur LTS yang aktif (rilis Okt 2025, dukungan sampai 2028).
# Ditulis sebagai versi mayor tanpa patch: `24-alpine` ikut menerima perbaikan
# keamanan tiap kali image dibangun ulang, tapi TIDAK pernah melompat ke mayor
# berikutnya diam-diam — lompatan mayor adalah keputusan, bukan efek samping
# dari `docker compose build`.
FROM node:24-alpine

WORKDIR /app

# Dependensi lebih dulu, terpisah dari kode sumber: selama package-lock.json
# tidak berubah, lapisan ini dipakai ulang dan deploy berikutnya tidak
# mengunduh ulang apa pun. Di VPS dengan bandwidth terbatas ini terasa.
COPY package.json package-lock.json ./
COPY flowserv-api/package.json ./flowserv-api/
COPY flowserv-web/package.json ./flowserv-web/

# `--workspace` supaya dependensi flowserv-web (SvelteKit, Playwright, ~ratusan MB)
# tidak ikut masuk ke image API.
#
# Dev-dependencies SENGAJA ikut dipasang: API ini dijalankan lewat `tsx`, dan tsx
# terdaftar sebagai devDependency. Alternatifnya menambah langkah kompilasi tsc
# yang belum pernah dipakai proyek ini sama sekali — menambah jalur build baru
# yang tak teruji tepat saat pertama kali masuk produksi adalah risiko yang lebih
# besar daripada image yang lebih gemuk.
RUN npm ci --workspace=flowserv-api --include-workspace-root

COPY flowserv-api ./flowserv-api

WORKDIR /app/flowserv-api

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3001

EXPOSE 3001

# Healthcheck memakai endpoint yang memang sudah ada sejak Phase 1 dan yang
# benar-benar menyentuh database (`{"status":"ok","database":"connected"}`) —
# bukan sekadar "proses Node hidup". Compose memakainya untuk menahan Nginx
# sampai API benar-benar siap melayani.
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3001/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["npx", "tsx", "src/index.ts"]
