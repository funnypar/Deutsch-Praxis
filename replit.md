# DeutschPraxis

A German language learning platform for students (A1–C1) and teachers. Students practice vocabulary with spaced repetition, grammar drills, listening comprehension, and writing. Teachers manage content, classes, assignments, and view student analytics.

## Run & Operate

- `pnpm --filter @workspace/deutsch-praxis run dev` — run the frontend (port auto-assigned)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (auto-provisioned)
- Required env: `SESSION_SECRET` — JWT signing secret (set in Replit Secrets)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS + shadcn/ui, TanStack Query, wouter routing
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Auth: JWT (bcryptjs + jsonwebtoken), stored as `dp_token` in localStorage
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/deutsch-praxis/src/` — React frontend
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/lib/auth.ts` — JWT auth middleware
- `artifacts/api-server/src/lib/sm2.ts` — SM-2 spaced repetition algorithm
- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/` — Drizzle table definitions

## Data model

- `users` — id, email, password_hash, role (student|teacher), display_name, current_level (A1–C1)
- `exercises` — id, type, cefr_level, grammar_tag, prompt, options (jsonb), correct_answer, audio_url, explanation
- `vocab_items` — id, german_word, translation, example_sentence, cefr_level, tags[]
- `student_progress` — id, student_id, exercise_id, correct, attempts, last_attempted_at
- `srs_cards` — id, student_id, vocab_item_id, ease_factor, interval_days, repetitions, next_review_date
- `classes` — id, teacher_id, name
- `class_members` — class_id, student_id (composite PK)
- `class_assignments` — id, class_id, exercise_id?, vocab_item_id?, due_date

## Architecture decisions

- JWT auth: tokens signed server-side, stored in localStorage as `dp_token`, attached as `Authorization: Bearer` header via `custom-fetch.ts`
- SM-2 algorithm lives in `api-server/src/lib/sm2.ts` — server-side to prevent client tampering
- Replit's built-in PostgreSQL used instead of Supabase (no external credentials required)
- All API contracts defined in OpenAPI first; frontend hooks and server Zod schemas generated from the same spec

## Product

**Student features:** Flashcard SRS (SM-2), grammar drills (multiple choice + fill-in-the-blank), listening comprehension (Web Speech API TTS placeholder), writing practice, progress dashboard with streak/XP and weak-spot analysis.

**Teacher features:** Exercise editor, vocab item editor, class management, student analytics per class.

## Seed accounts

All passwords: `student123` / `teacher123`

- Teacher: `teacher@deutschpraxis.de` (password: `teacher123`)
- Students: `anna@example.com`, `max@example.com`, `lena@example.com` (all password: `student123`)

## User preferences

- Warm amber (not red) for wrong answers
- German special characters (ä, ö, ü, ß) supported everywhere
- Mobile-friendly from the start
- No decorative top accent bars on cards
- No emojis in the UI

## Gotchas

- After any OpenAPI spec change, run `pnpm --filter @workspace/api-spec run codegen` before using updated hooks
- The API server must be rebuilt (`pnpm run build`) after route changes — the dev script does this automatically
- Orval 8 generates Zod v4 syntax; avoid `format: email` and bare `type: object` (no properties) in the spec — use `additionalProperties: true` instead
- Express 5 wildcard routes require names: `/{*splat}` not `/*`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
