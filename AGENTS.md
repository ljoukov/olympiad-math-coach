# Hamilton Olympiad Practice (Math Coach)

## Dev (HTTPS)

Firebase Auth redirect flows require HTTPS on localhost.

- Start dev server (HTTPS): `pnpm dev` (uses `scripts/dev-https.mjs`)
- Certs are expected in `~/.localhost-certs/`:
  - `~/.localhost-certs/localhost-key.pem`
  - `~/.localhost-certs/localhost.pem`
- One-time mkcert setup (macOS):
  - `brew install mkcert nss && mkcert -install`
  - `mkdir -p ~/.localhost-certs`
  - `mkcert -key-file ~/.localhost-certs/localhost-key.pem -cert-file ~/.localhost-certs/localhost.pem localhost 127.0.0.1 ::1`

Recommended: run dev in tmux so logs stay visible:

```sh
tmux new -s hamilton-dev 'pnpm dev'
```

## Firebase Auth Helper Endpoints (`/__/…`)

Firebase serves helper endpoints under:

- `/__/auth/*` (redirect handler, iframe, etc.)
- `/__/firebase/*` (includes `init.json`)

Next App Router ignores route segments starting with `_`, so this repo rewrites those public paths to API handlers:

- `/__/auth/:path*` -> `/api/firebase-auth/:path*`
- `/__/firebase/:path*` -> `/api/firebase/:path*`

See `next.config.mjs` and the proxy routes in:

- `app/api/firebase-auth/[...path]/route.ts`
- `app/api/firebase/[...path]/route.ts`
- `app/api/firebase/init.json/route.ts` (rewrites `authDomain` to the current host)

## Auth

Auth is Firebase Authentication. Client requests include `Authorization: Bearer <Firebase ID token>`.

Supported sign-in methods:

- Google (redirect flow)
- Guest (anonymous)
- Email/password (hidden test-only flow)

Email login is intentionally not in the normal UI; it lives at:

- `/login-with-email`

Test user credentials are provided via `.env.local`:

- `TEST_USER_EMAIL_ID_PASSWORD="<email>/<firestore user id>/<password>"`

Server-side verification lives under `lib/server/` (token parsing + request user extraction).

## Firestore (Storage)

Firestore is accessed server-side via `@ljoukov/firebase-admin-cloudflare`.

Data layout:

- Per-user data: `math-coach/{userId}/*`
- Shared/admin data: `math-coach-admin/global/*`
  - Problems bank and moves are stored under `math-coach-admin/global/problems` and `math-coach-admin/global/moves`
  - Seeding is handled on-demand by `lib/server/admin-data.ts` using `lib/seed-admin-data.ts`

Main helpers:

- `lib/server/firestore.ts` (admin Firestore instance)
- `lib/server/paths.ts` (canonical collection/doc paths)
- `lib/server/admin-data.ts` (seed + list/get problems/moves)

## LLM

All LLM calls go through `@ljoukov/llm` (provider-agnostic wrapper):

- Provider entrypoint: `lib/ai/llmProvider.ts`
- Provider selection: `lib/ai/index.ts` (`AI_PROVIDER=mock` switches to the mock provider)

Optional env overrides:

- `AI_MODEL` (defaults to the current Gemini model id used in `lib/ai/llmProvider.ts`)
- `AI_PROVIDER` (`llm` or `mock`)

Credentials used by `@ljoukov/llm` come from `.env.local` (do not commit secrets):

- `OPENAI_API_KEY` (OpenAI provider)
- `CHATGPT_AUTH_JSON_B64` (ChatGPT subscription provider)
- `GOOGLE_SERVICE_ACCOUNT_JSON` (Gemini + Firestore admin access in this repo)

## Quality Gates

Use these commands before pushing:

- `pnpm format`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm check` (runs lint + typecheck + test + build)

