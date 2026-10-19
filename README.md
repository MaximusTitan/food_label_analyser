# Snack Check — Food Label Analyser

Snap or upload a photo of a packaged-food label (or type the ingredients) and Snack Check explains what's inside in simple words: a 1–10 health score, traffic-light nutrition facts, allergen alerts, an ingredient-by-ingredient breakdown, how often to eat it, and healthier swaps. Users sign up with email and password, their scans are saved to their account in Supabase, and any two can be compared side by side. The UI is available in English and Hindi.

## Getting started

1. Create a Supabase project and run the migration in `supabase/migrations/` (SQL editor, or `supabase db push` with the Supabase CLI). It creates the `scans` table with Row Level Security.
2. Create a Vercel AI Gateway API key.
3. Configure and start the app:

```bash
pnpm install
cp .env.example .env.local   # fill in the gateway and Supabase values
pnpm dev
```

Open http://localhost:3000, sign up, and scan a label. The four "Try an example" products work without a gateway key (you still need to be signed in).

### Sign-up without email confirmation

Accounts are created on the server with the Supabase admin API and `email_confirm: true`, so users are signed in straight away and no confirmation email is sent, whatever the project's "Confirm email" setting. This needs `SUPABASE_SECRET_KEY`. If you'd rather not use the secret key, switch off **Authentication → Sign In / Providers → Email → Confirm email** in the Supabase dashboard and change `signup` in `lib/server/auth-actions.ts` to call `supabase.auth.signUp`.

| Script | What it does |
| --- | --- |
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest unit and route tests |

## How it works

1. **Read** — `POST /api/analyze` sends the photo (downscaled in the browser) or typed text through the Vercel AI Gateway (AI SDK `generateText` with `Output.object`, default model `anthropic/claude-opus-5.5`, override with `AI_MODEL`) using the schema in `lib/analysis/schema.ts`. The model only *extracts* what is printed and writes plain-language explanations in the user's language.
2. **Clean** — `lib/analysis/normalize.ts` bounds numbers, trims text, dedupes lists and derives salt from sodium.
3. **Score** — `lib/analysis/score.ts` computes the score deterministically from UK FSA traffic-light thresholds (per 100 g, or per 100 ml for drinks), fibre, trans fat and flagged ingredients. The model never picks the score, so results are consistent and testable.
4. **Keep** — the route saves the scan to the `scans` table as the signed-in user (`lib/server/scans.ts`); rows are re-validated whenever they are read.

### Security notes

- Every page except `/login` and `/signup` needs a session. `proxy.ts` refreshes the Supabase session and redirects optimistically; pages, Server Actions and the API verify the user again on the server (`lib/server/auth.ts`).
- Database access uses the publishable key with the user's session, so Row Level Security limits every query to the user's own rows. The secret key is only used to create pre-confirmed accounts.
- `AI_GATEWAY_API_KEY` and `SUPABASE_SECRET_KEY` are read only on the server (modules import `server-only`).
- Login shows the same message for an unknown email and a wrong password. Login (10 per 5 min) and sign-up (5 per 15 min) are rate-limited per IP; analysis is rate-limited per user (10/min).
- Uploads are capped at 5 MB and identified by magic bytes (JPEG, PNG, WebP), not by the declared MIME type.
- The analyze route rejects cross-site requests. Rate limits are in memory per server instance; use a shared store such as Redis if you run several instances.
- Label content is treated as data in the prompt; model output is schema-validated and bounded before use.
- Error responses only carry fixed error codes; internal details are never returned.

## Project layout

```
app/                     routes: / (scan), /login, /signup, /report/[id],
                         /report/[id]/ingredients, /report/[id]/enjoy, /history,
                         /api/analyze
proxy.ts                 session refresh and auth redirects
components/              UI for each screen
lib/analysis/            schema, normalisation and scoring
lib/server/              AI Gateway call, auth and scan data access, Server
                         Actions, upload validation, rate limiting
lib/supabase/            Supabase clients (server, admin, proxy)
lib/client/              browser helpers: image prep, API client
supabase/migrations/     database schema and RLS policies
lib/i18n/                locales, messages (en, hi) and the provider
lib/examples.ts          demo products (fictional) in every locale
```

To add a language, add it to `LOCALES` in `lib/i18n/config.ts`, create `lib/i18n/messages/<code>.ts`, add the language name in `lib/server/analyze.ts`, and add copy for the examples. The i18n tests fail until every key is translated.

Scores are general guidance, not medical advice.
