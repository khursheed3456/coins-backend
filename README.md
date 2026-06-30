# CoinX444 — Full Stack Crypto Trading Platform

A complete crypto trading platform built for Pakistan's market with JazzCash/EasyPaisa support, referral system, real-time admin panel, and coin price engine.

---

## 🏗️ Project Structure

```
coinx444-backend/     ← Fastify API server
coinx444-frontend/    ← Next.js 14 frontend
```

---

## ⚙️ Backend Setup (Fastify)

### Prerequisites
- Node.js 18+
- PostgreSQL (local or Supabase)

### Install
```bash
cd coinx444-backend
npm install
```

### Configure
```bash
cp .env.example .env
# Edit .env with your DB credentials, SMTP settings, etc.
```

### Run Migrations & Seed Admin
```bash
npm run db:migrate
```
This creates all tables and seeds the admin user from your `.env` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`).

### Start
```bash
# Development
npm run dev

# Production
npm start
```

Server runs on `http://localhost:4000` by default.

---

## 🖥️ Frontend Setup (Next.js)

### Install
```bash
cd coinx444-frontend
npm install
```

### Configure
```bash
cp .env.example .env.local
# Edit .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:4000
# NEXT_PUBLIC_WS_URL=ws://localhost:4000
```

### Start
```bash
# Development
npm run dev

# Production
npm run build && npm start
```

Frontend runs on `http://localhost:3000`.

---

## 🔧 Environment Variables

### Backend `.env`

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | `local` or `production` |
| `LOCAL_DB_*` | Local PostgreSQL credentials |
| `SUPABASE_DB_URL` | Supabase connection string (production) |
| `PORT` | Server port (default 4000) |
| `SMTP_*` | Nodemailer SMTP config |
| `FRONTEND_URL` | Frontend URL for CORS |
| `ADMIN_EMAIL` | Admin account email |
| `ADMIN_PASSWORD` | Admin account password |

### Frontend `.env.local`

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL |
| `NEXT_PUBLIC_WS_URL` | Backend WebSocket URL |

---

## 🚀 Features

### User Features
- **Auth** — Register with referral code, email verification, opaque token sessions (no JWT)
- **Markets** — Browse all coins with live prices, 24h change, and mini sparkline charts
- **Trading** — Buy/sell coins with real-time price updates via WebSocket
- **Portfolio** — Holdings with PnL tracking, full trade history
- **Deposit** — JazzCash / EasyPaisa deposit requests (min PKR 1,000)
- **Withdrawal** — Withdraw referral earnings instantly; trading balance after buying coins (min PKR 500)
- **Referrals** — Share code, earn 30% of referral's first deposit, see verified/unverified breakdown

### Admin Features
- **Dashboard** — Live stats, pending queues at a glance
- **Coin Management** — Create coins with name, symbol, supply, market cap → price auto-calculated
- **Deposits** — Real-time WebSocket notifications, one-click approve/reject
- **Withdrawals** — Approve or reject; rejected referral withdrawals auto-refund
- **Users** — Browse all accounts, click to see balance, deposits, trades

### Price Engine
- Initial price = `marketCap / totalSupply`
- Price adjusts on every trade based on buy/sell pressure ratio
- Price history recorded every 5 minutes for chart data
- 24h change tracked automatically

---

## 🔐 Security
- **Opaque tokens** via `libsodium-wrappers-sumo` — no JWT anywhere
- Passwords hashed with `crypto_pwhash_str` (Argon2)
- Sessions expire after 7 days
- Admin routes protected by role check middleware
- WebSocket connections validated with session tokens

---

## 📡 WebSocket Endpoints

| Endpoint | Auth | Description |
|----------|------|-------------|
| `/ws/prices` | None | Live coin price updates |
| `/ws/admin?token=` | Admin token | Real-time deposit/withdrawal notifications |
| `/ws/user?token=` | User token | User-specific notifications |

---

## 🌐 API Endpoints

### Auth
```
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/verify?token=
POST /api/auth/logout
GET  /api/auth/me
```

### Coins
```
GET  /api/coins
GET  /api/coins/:id
POST /api/coins/:id/buy
POST /api/coins/:id/sell
```

### Finance
```
POST /api/finance/deposit
GET  /api/finance/deposits
POST /api/finance/withdraw
GET  /api/finance/withdrawals
```

### Portfolio
```
GET /api/portfolio/holdings
GET /api/portfolio/trades
GET /api/portfolio/referrals
GET /api/portfolio/summary
```

### Admin
```
POST  /api/admin/coins
GET   /api/admin/coins
PATCH /api/admin/coins/:id
GET   /api/admin/deposits?status=pending
PATCH /api/admin/deposits/:id/approve
PATCH /api/admin/deposits/:id/reject
GET   /api/admin/withdrawals?status=pending
PATCH /api/admin/withdrawals/:id/approve
PATCH /api/admin/withdrawals/:id/reject
GET   /api/admin/users
GET   /api/admin/users/:id
GET   /api/admin/stats
```

---

## 🗄️ Database

Uses PostgreSQL with Sequelize ORM. Tables:
- `users` — accounts, balances, referral data
- `sessions` — opaque token sessions
- `coins` — coin metadata, price, volumes
- `coin_price_history` — time-series price data for charts
- `trades` — buy/sell transactions
- `user_coin_holdings` — per-user coin balances with avg buy price
- `deposits` — deposit requests
- `withdrawals` — withdrawal requests

### Switching DB (Local ↔ Supabase)
Set `NODE_ENV=production` in `.env` to use `SUPABASE_DB_URL`.
Set `NODE_ENV=local` (default) to use local `LOCAL_DB_*` credentials.
