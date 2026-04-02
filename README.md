# CV Builder MVP

Multilingual Europass-style CV builder for Bangladeshi expats in Europe.

## Monorepo Structure

```
probashicv/
  frontend/   Vue 3 + Vite + Tailwind + Pinia + Router + i18n
  backend/    Express + Prisma + PostgreSQL + OpenAI + Puppeteer
```

## Quick Start

1. Install dependencies:

```bash
cd probashicv
npm install
```

2. Configure environment:

- Copy `backend/.env.example` to `backend/.env`
- Copy `frontend/.env.example` to `frontend/.env`

3. Run Prisma:

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
```

4. Start apps:

```bash
cd ..
npm run dev:backend
npm run dev:frontend
```

## Production Commands

- Backend start: `npm run start` (from repo root)
- Frontend build: `npm run build` (from repo root)

## Implemented API Routes

- Auth:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
- CV:
  - `GET /api/cv`
  - `POST /api/cv`
  - `GET /api/cv/:id`
  - `PUT /api/cv/:id`
  - `DELETE /api/cv/:id`
  - `POST /api/cv/:id/photo`
  - `GET /api/cv/:id/pdf`
- Public:
  - `GET /api/public/cv/:slug`
- AI:
  - `POST /api/ai/generate`
