# Zaitoon Pakistan (زیتون پاکستان)

> **Artisanal Pakistani Olive Oils, Wild Raw Honey, Salt-Cured Table Olives & Botanical Infusions**  
> Complete full-stack e-commerce platform built with **Node.js + Express.js + MongoDB**, **React 19 + TypeScript + Vite Storefront**, and a dedicated **Admin Management Portal**.

---

## 🏛️ System Architecture

```text
oil/
├── backend/       # Node.js + Express.js REST API (/api/*) + MongoDB Mongoose
├── frontend/      # Customer Storefront (React 19, TypeScript, Vite, Tailwind CSS)
└── admin/         # Operations Admin Panel (React 19, TypeScript, Vite, Tailwind CSS)
```

| Component | Port | Technology | Purpose |
| :--- | :--- | :--- | :--- |
| **Backend** | `5000` | Node.js, Express, MongoDB (Mongoose), JWT, Helmet | Authoritative e-commerce REST API, inventory management, order dispatch, security sanitizers |
| **Storefront** | `5173` | React 19, TypeScript, Vite, Tailwind CSS | Public customer-facing storefront (Guest checkout, Wishlist, Bag, Order Tracking, Blog) |
| **Admin Panel**| `3000` | React 19, TypeScript, Vite, Tailwind CSS | Restricted operations portal (Analytics dashboard, TCS dispatch, Catalog, Coupons, Inquiries) |

---

## 🚀 Prerequisites

- **Node.js**: `v20.0.0` or higher (tested with Node 22/24)
- **MongoDB**: `v7.0+` (local community server or MongoDB Atlas)
- **Git**

---

## 🛠️ Step-by-Step Setup Guide

### 1. MongoDB Database

Ensure your MongoDB instance is running locally or prepare a connection string:

```bash
# If using local MongoDB on Windows:
mongod --dbpath "C:\data\db" --port 27017
```

---

### 2. Backend Setup (`/backend`)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install production and dev dependencies:
   ```bash
   npm install
   ```
3. Create your environment configuration:
   ```bash
   cp .env.example .env
   ```
   *Verify that `PORT=5000` and `MONGO_URI=mongodb://127.0.0.1:27017/zaitoon_pakistan`.*

4. **Seed the database** with initial products, coupons, blogs, and admin account:
   ```bash
   npm run seed
   ```

5. Start the backend development server:
   ```bash
   npm run dev
   # Or for production start:
   npm start
   ```
   *The backend will boot on `http://localhost:5000` and announce `/api/health` 200 OK.*

---

### 3. Storefront Setup (`/frontend`)

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Create your environment file:
   ```bash
   cp .env.example .env
   ```
   *Contains `VITE_API_BASE_URL=http://localhost:5000/api`.*

4. Start the storefront development server:
   ```bash
   npm run dev
   ```
   *Access the customer store at `http://localhost:5173`.*

---

### 4. Admin Panel Setup (`/admin`)

1. Open a third terminal and navigate to the admin panel directory:
   ```bash
   cd admin
   ```
2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Create your environment file:
   ```bash
   cp .env.example .env
   ```
   *Contains `VITE_API_BASE_URL=http://localhost:5000/api`.*

4. Start the admin development server:
   ```bash
   npm run dev
   ```
   *Access the Admin Management Panel at `http://localhost:3000`.*

---

## 🔑 Default Admin Credentials

When the database is seeded (`npm run seed`), a Super Administrator account is created:

- **Email**: `admin@zaitoonpakistan.pk`
- **Password**: `ZaitoonAdmin2026!`
- **Role**: `super_admin`

---

## 🔒 Security & Quality Audits

The system includes built-in automated security scanners and integration test suites:

### Backend Security Audit
Scans for CVEs, NoSQL query injection, unescaped regex ReDoS patterns, missing RBAC/auth guards, unsafe file uploads, mass assignment, and CSV injection:
```bash
cd backend
npm run security:audit
```

### Backend REST API End-to-End Suite
Runs a 55-point automated verification against the live MongoDB instance exercising auth, dispatch stages, stock deduction and restoration, and file validation:
```bash
cd backend
node scripts/verifyAdminEndpoints.js
```

### Admin Panel Frontend Security Audit
Audits dependencies, checks against unsanitized `dangerouslySetInnerHTML`, validates auth token storage, and confirms XSS protection:
```bash
cd admin
npm run security:audit
```

### Production Build & Typecheck
```bash
# In admin:
cd admin
npm run lint
npm run build

# In frontend:
cd frontend
npm run lint
npm run build
```

---

## 📦 Key Platform Capabilities

- **Customer Storefront**:
  - 100% Guest-friendly browsing & checkout (no forced signup or customer password friction).
  - Cash on Delivery (COD) & Direct Bank Transfer (IBFT) payment support.
  - Live order tracking by reference (e.g. `ZP-1042`) with courier tracking codes.
  - Real-time coupon engine with discount percentages and maximum caps.
  - Customer review submissions with moderation workflow.
  - Orchard Journal blog reader and Harvest Newsletter subscription.

- **Admin Portal**:
  - Live analytics dashboard (revenue aggregations, city-wise order distribution, low stock alerts).
  - Multi-stage order dispatch workflow (`Pending` -> `Confirmed` -> `Cold Packed` -> `Dispatched` with TCS code -> `Delivered`).
  - Safe order cancellation with **atomic inventory stock restoration**.
  - Product catalog CRUD, stock level quick-adjustments, and safe media uploads.
  - Coupon management (toggle status, usage tracking).
  - Customer inquiry CRM and newsletter subscriber CSV streaming export.

---

## 📄 License

ISC © Zaitoon Pakistan
