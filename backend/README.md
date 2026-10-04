# Bhagwati Kisan Mart — Backend API

Production NestJS backend for Bhagwati Kisan Mart, an e-commerce platform for agricultural inputs (pesticides, seeds, fertilizers) in Uttar Pradesh.

---

## Technology Stack

- **Framework:** NestJS (TypeScript, Node.js)
- **Database:** Supabase (PostgreSQL) with connection pooler
- **Cache & Rate Limiting:** Upstash (Redis)
- **SMS Gateway:** MSG91 (DLT approved phone/OTP flow)
- **Object Storage:** Cloudflare R2 (Product media)
- **Architecture Patterns:** Repository Pattern, Finite State Machine, Strategy Pattern (Payments & Fulfillment), Event-Driven Decoupling (`@nestjs/event-emitter`)

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

### 3. Run Locally
```bash
# Start development server with live reload
npm run start:dev

# Start production build
npm run build
npm run start:prod
```
The API boots with global prefix `/api/v1` on `http://localhost:4000/api/v1`.

---

## Testing

```bash
# Run unit tests (75+ tests across 20 suites)
npm test

# Run end-to-end integration tests (30+ tests across 5 suites)
npm run test:e2e

# Build verification
npm run build
```

---

## Postman API Collection

A complete Postman Collection and Local Environment preset are provided in [`backend/postman/`](./postman):

- **Collection:** [`postman/Bhagwati_Kisan_Mart.postman_collection.json`](./postman/Bhagwati_Kisan_Mart.postman_collection.json)
- **Environment:** [`postman/Bhagwati_Kisan_Mart_Local.postman_environment.json`](./postman/Bhagwati_Kisan_Mart_Local.postman_environment.json)
- **Testing Guide:** [`postman/README.md`](./postman/README.md)

Import both files into Postman to test all 21 endpoints with automated token chaining (zero manual copy-pasting required).
