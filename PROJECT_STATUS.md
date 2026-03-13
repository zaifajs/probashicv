# ProbashiCV - Project Status

Last updated: 2026-03-07

## Project Overview

ProbashiCV is an MVP multilingual Europass-style CV builder for Bangladeshi expats in Europe.

Monorepo structure:

```
probashicv/
  frontend/   Vue 3 + Vite + Tailwind + Pinia + Router + i18n
  backend/    Node.js + Express + Prisma + PostgreSQL + OpenAI + Puppeteer
```

## Current State

- Core backend and frontend are scaffolded and functional.
- PostgreSQL database `probashicv` exists and Prisma migration `init` is applied.
- Guest-first builder flow is enabled.
- OpenAI integration is connected and working when quota is available.
- Dev servers are currently stopped (ports 4000 and 5173 were cleaned).

## Implemented Features

### Auth (JWT)
- `POST /api/auth/register`
- `POST /api/auth/login`
- Password hashing via `bcryptjs`

### CV CRUD
- `GET /api/cv` (auth)
- `POST /api/cv` (auth)
- `GET /api/cv/:id` (auth)
- `PUT /api/cv/:id` (auth)
- `DELETE /api/cv/:id` (auth)

### CV Data Model
- Stored as JSON in `cvs.cv_data` (`JSONB`)
- Includes:
  - Personal info (name, job title, address, phone, email, photo)
  - Work experience
  - Education
  - Skills
  - Languages

### Public CV
- `GET /api/public/cv/:slug`
- Frontend page: `/cv/:slug`

### AI Text Generation
- `POST /api/ai/generate`
- Model: `gpt-4o-mini`
- Current behavior:
  - Rewrites professionally
  - Translates to selected output language
  - Suitable for CV usage
- Auth requirement removed so guests can use it.

### PDF Export
- `GET /api/cv/:id/pdf` (auth)
- Puppeteer output:
  - `format: "A4"`
  - `printBackground: true`

### Photo Upload
- Backend stores files in `backend/uploads`
- Auth path: `POST /api/cv/:id/photo`
- For guests, photo is kept client-side as base64 for preview/local draft.

### Multilingual UI
- Vue i18n configured with:
  - `frontend/src/i18n/en.json`
  - `frontend/src/i18n/bn.json`
  - `frontend/src/i18n/pt.json`

## Guest-First Flow (Important)

Implemented to avoid forcing login before building:

- `/builder/:id?` is public (no auth guard).
- Home "Start Building" sends users to `/builder`.
- Router fallback redirects unauthenticated `/dashboard` access to `/builder`.
- Guest save stores draft in localStorage key:
  - `probashicv_guest_draft`
- Guest PDF:
  - falls back to `window.print()` with message.
- Logged-in users can save to DB and export backend-generated PDF.

## Key Files

- Backend:
  - `backend/src/app.js`
  - `backend/src/server.js`
  - `backend/src/routes/auth.js`
  - `backend/src/routes/cv.js`
  - `backend/src/routes/public.js`
  - `backend/src/routes/ai.js`
  - `backend/prisma/schema.prisma`
- Frontend:
  - `frontend/src/router/index.js`
  - `frontend/src/pages/Home.vue`
  - `frontend/src/pages/CVBuilder.vue`
  - `frontend/src/components/CvPreview.vue`
  - `frontend/src/components/AITextAssistant.vue`
  - `frontend/src/store/cv.js`

## Environment

Backend `.env` required values:

- `PORT=4000`
- `DATABASE_URL=postgresql://huzaifa@localhost:5432/probashicv?schema=public`
- `JWT_SECRET=...`
- `OPENAI_API_KEY=...`
- `FRONTEND_URL=http://localhost:5173`

Frontend `.env`:

- `VITE_API_URL=http://localhost:4000`

## Run Commands

From repo root (`probashicv`):

- Install:
  - `npm install`
- Backend dev:
  - `npm run dev:backend`
- Frontend dev:
  - `npm run dev:frontend`
- Frontend build:
  - `npm run build`

## First 10 Minutes Checklist

1. Copy env files:
   - Backend: create `backend/.env` with required variables.
   - Frontend: create `frontend/.env` with required variables.
2. Ensure PostgreSQL is running and database `probashicv` exists.
3. Install dependencies from repo root:
   - `npm install`
4. Start backend:
   - `npm run dev:backend`
5. Start frontend in another terminal:
   - `npm run dev:frontend`
6. Open app and verify:
   - Home page loads.
   - `/builder` is accessible without login.
   - AI assistant responds (if OpenAI quota is available).
7. Optional auth verification:
   - Register/login works and `/dashboard` is accessible when authenticated.

## API Smoke Checks (curl)

Assumes backend is running at `http://localhost:4000`.

Register:

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Password123!"}'
```

Login:

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123!"}'
```

Create CV (replace `JWT_TOKEN`):

```bash
curl -X POST http://localhost:4000/api/cv \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -d '{"title":"My CV","cvData":{"personalInfo":{"name":"Test User"}}}'
```

AI Generate (guest-accessible):

```bash
curl -X POST http://localhost:4000/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{
    "text":"Worked as helper in construction for 2 years.",
    "type":"experience",
    "language":"en"
  }'
```

## Notes / Caveats

- Backend `dev` script uses polling watcher to avoid macOS watch limit:
  - `nodemon --legacy-watch src/server.js`
- If OpenAI quota is exceeded, AI route returns OpenAI 429.
- During active development, old running processes can cause `EADDRINUSE` on port 4000; kill old process and restart.

## Known Broken / Intentionally Deferred

- Guest photo upload is not persisted to backend; preview remains local/base64 only until user authentication flow is completed.
- Guest PDF export uses browser print fallback (`window.print()`), so output quality depends on browser print CSS.
- No server-side schema validation yet on CV payloads (relies on frontend shape and DB JSONB storage).

## Suggested Next Improvements

1. Add auth-to-guest draft merge (when guest logs in, offer to import local draft to DB).
2. Add backend validation (Zod/Joi) for CV payload safety.
3. Improve print stylesheet for best browser-PDF output in guest mode.
4. Add tests:
   - API smoke tests
   - Frontend route + store behavior tests
5. Add deployment files:
   - systemd or PM2 config
   - Nginx reverse proxy sample

## Next Sprint Definition Of Done

- Guest-to-auth draft merge implemented with explicit user prompt and successful DB persistence.
- Server-side validation added for CV create/update payloads with clear 4xx error responses.
- Guest-mode print stylesheet improved for consistent A4 output across major browsers.
- Basic automated coverage added:
  - API smoke tests for auth/CV/AI.
  - Frontend tests for guest routing and draft persistence behavior.
- Deployment starter docs/config committed (PM2 or systemd, plus Nginx sample).
