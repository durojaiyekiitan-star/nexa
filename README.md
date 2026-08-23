# Nexa

**AI-Powered Education Funding & Opportunity Network — Powered by the Interledger Protocol**

Nexa connects talented students with sponsors and organizations anywhere in the world. AI matches students to learning roadmaps and sponsors; real, live Interledger payments move funds across borders and currencies, in any amount.

---

## What's actually built

- **Landing page** — rotating value-proposition hero, animated ambient background, cursor-following glow, scroll-reveal animations
- **Auth & roles** — Student / Sponsor / Organization signup and login via Supabase Auth, with role-based navigation and route guards (a sponsor can't access student-only pages and vice versa)
- **AI skill assessment** — rule-based scoring engine (no external LLM calls) that builds a personalized learning roadmap from real, curated courses (Coursera / Udemy / edX — real titles and providers, not live-fetched)
- **AI opportunity matching** — sponsors are shown students ranked by a graduated skill-adjacency algorithm (exact matches score 100%, related skills score proportionally higher than unrelated ones)
- **Student dashboard** — roadmap progress, funding goals (create from a roadmap item, delete with a required reason + simulated refund), sponsor activity feed
- **Sponsor dashboard** — student-first nested view (expand a student to see all their active goals), editable sponsor interests, aggregate impact stats
- **Funding flow** — two payment paths, side by side:
  - **Simulated** — an animated 4-hop visualization, safe and instant, used as the reliable demo fallback
  - **Real** — a genuine Interledger Open Payments integration: real wallets, a real interactive approval redirect to the sponsor's own wallet, and real value moving on the Interledger test network between two independent, user-linked wallets
- **Organization dashboard** — scholarship program creation, platform-wide funding stats
- **Account settings** — editable profile (first/middle/last name, country), password change, personal Interledger wallet linking
- **Mandatory wallet linking** — Students and Sponsors must link a real Interledger test wallet at signup (Organizations don't need one); an in-app guide walks new users through getting one

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Icons | lucide-react |
| Database + Auth | Supabase (Postgres, Row Level Security, Supabase Auth) |
| Payments | Interledger Open Payments (`@interledger/open-payments`), real testnet integration |
| Hosting | Vercel |

---

## Project structure

```
app/
  page.tsx                    # Landing page
  signup/, login/, settings/  # Auth + account management
  assessment/                 # AI skill assessment + roadmap
  student/dashboard/          # Student dashboard
  sponsor/dashboard/          # Sponsor dashboard
  organization/                # Organization dashboard
  funding/                    # Payment flow (simulated + real ILP)
  ilp/callback/                # Where sponsors land after approving a real payment
  api/ilp/initiate/, complete/ # Server-side Open Payments API routes
  error.tsx, not-found.tsx    # Styled error boundary + 404

components/
  Sidebar.tsx                 # Collapsible left nav (role-aware)
  TopRightAuth.tsx             # Login/Signup/greeting widget, top-right
  CursorGlow.tsx                # Interactive background effect
  RevealOnScroll.tsx            # Scroll-triggered fade/slide wrapper
  WalletSetupGuide.tsx          # Expandable "how to get a test wallet" guide

lib/
  ai-engine.ts                 # Skill assessment, roadmap, matching — all pure functions
  ilp/client.ts, sessions.ts    # Interledger client + session persistence
  supabase/client.ts, server.ts, middleware.ts
  auth/roles.ts                # Role definitions + role-based redirect targets
  utils/names.ts, funding.ts, wallet.ts  # Shared formatting/validation helpers
```

---

## Local setup

### 1. Install

```bash
npm install
```

### 2. Environment variables (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

NEXA_WALLET_ADDRESS=https://ilp.interledger-test.dev/nexa
NEXA_KEY_ID=your-key-id
NEXA_PRIVATE_KEY_PATH=./keys/nexa-private.key
```

Ask a current team member for the Supabase project credentials and the Nexa Interledger wallet's private key file (**never** commit the key file or `.env.local` — both are gitignored).

### 3. Database

Fastest option: ask to be added as a collaborator on the existing Supabase project — the schema is already live there.

Setting up a fresh Supabase project instead? Run these SQL files, in this order, in the Supabase SQL Editor (ask the team for the actual files — this list reflects the order tables/policies were introduced):

1. Initial schema — `profiles`, `student_profiles`, `sponsor_profiles`, `funding_goals`, `contributions`, `scholarship_programs` + RLS policies
2. Name split (`first_name`/`middle_name`/`last_name`), `ilp_wallet_address`, `has_logged_in_before`
3. `refunds` table (goal-deletion audit trail)
4. DELETE policies for `funding_goals` and `contributions` (required for goal deletion to actually persist)
5. Relax `funding_goals.amount_needed` constraint to allow `0` (free courses)
6. `ilp_pending_sessions` table (persistent ILP session storage, replacing an earlier in-memory version)
7. Format constraint on `ilp_wallet_address`

### 4. Run it

```bash
npm run dev
```

---

## Getting a test Interledger wallet (for real payments)

1. Go to **wallet.interledger-test.dev** and create an account.
2. Create a wallet, copy its address (shown as `$ilp.interledger-test.dev/yourname`).
3. Paste it into Settings (or at signup) — either the `$` form or `https://` form works, it's normalized automatically.

**Important, learned the hard way:** a sponsor and the student they're funding must use wallets from **different** `wallet.interledger-test.dev` logins. Two wallets under the same login as counterparties to each other causes real payment requests to time out unpredictably.

---

## How the real payment flow works

Nexa has its own dedicated Interledger identity (`NEXA_WALLET_ADDRESS`/`NEXA_KEY_ID`/private key) that signs every Open Payments request. It never touches a user's private key — instead, each real transfer uses an interactive GNAP grant: the sponsor gets redirected to their **own** wallet to approve, then redirected back. This is what lets Nexa facilitate real, specific peer-to-peer payments between whichever two real users are involved, without custody of anyone's funds or keys.

---

## Known limitations (by design, not bugs)

- **Course data is curated, not live-fetched.** Real course titles/providers/pricing from Coursera/Udemy/edX, refreshed manually — not a live API integration (Coursera's partner API isn't self-serve).
- **The simulated payment flow is intentional, not a placeholder.** It's the reliable fallback if the live Interledger test network is slow or down mid-demo.
- **No "forgot password" flow** for logged-out users (only change-password while logged in).
- **A partially-failed signup** (auth account created, profile insert fails) can leave an account in a stuck state — not handled with a rollback/retry yet.
- **Email confirmation is disabled** in Supabase Auth for frictionless demo signup — reconsider before treating this as a real public product.

---

## Deployment

Deployed on Vercel. Two things that specifically matter for this stack:

- **The private key must be set as `NEXA_PRIVATE_KEY_BASE64`** in Vercel's environment variables, not `NEXA_PRIVATE_KEY_PATH` — Vercel's serverless functions have no persistent filesystem to read a key file from.
- **`next.config.ts` needs both `serverExternalPackages` and `outputFileTracingIncludes`** for the `@interledger/open-payments` package's `.yaml` spec files to actually get bundled into the deployed API routes — this is already configured in the repo; don't remove it.
