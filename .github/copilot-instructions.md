# EcoLoop - AI Coding Agent Instructions

## Project Overview
EcoLoop is a waste management gamification platform for educational institutions built with Next.js 15, Supabase, and shadcn/ui. Users deposit waste at QR-coded bins, earn EcoPoints based on weight, and redeem points at a store. Three role-based dashboards: `user`, `worker`, and `admin`.

## Architecture Patterns

### Authentication & Authorization
- **Supabase SSR**: Three distinct client patterns that must NOT be mixed:
  - `lib/supabase/client.ts`: Browser-only client for Client Components
  - `lib/supabase/server.ts`: Server-only client for Server Components/Actions  
  - `lib/supabase/middleware.ts`: Middleware-only client for route protection
- **Critical**: Server clients MUST be created per-request (Fluid compute requirement) - never store in globals
- **Middleware pattern**: `middleware.ts` redirects unauthenticated users to `/auth/login`, except for `/` and `/auth/*` routes
- **Role-based routing**: Root `/` page checks user role and redirects to `/admin`, `/worker`, or `/user`

### Database Schema & Business Logic
- **Role-based access**: `user_role` enum (`user`, `worker`, `admin`) drives RLS policies in `002_row_level_security.sql`
- **Points system**: 
  - Base points per deposit: Recyclable=10, Organic=8, Non-recyclable=5
  - Additional points by weight: `amount * POINTS_PER_KG[waste_type]`
  - Points automatically updated via `update_user_points_after_transaction()` trigger
- **Weight tracking**: Bins have `current_weight` (kg) and `capacity_percentage` (0-100). Max capacity: 120kg
- **Critical triggers**: Points auto-update on transaction insert, stock auto-deducts on redemption insert (see `003_functions_and_triggers.sql`)

### Component Architecture
- **Server Components by default**: All `app/**/*.tsx` pages are async Server Components fetching data directly
- **Client Components**: Marked with `"use client"` - used for forms, interactive UI, and Supabase browser client
- **shadcn/ui**: Component library configured in `components.json` - uses `cn()` utility from `lib/utils.ts` for className merging
- **Pattern**: Server pages fetch data and pass to client components as props (see `app/admin/page.tsx` → `AdminDashboard`)

### Key Integration Patterns
- **QR Scanner**: `components/user/qr-scanner.tsx` uses `html5-qrcode` library to scan `waste_bins.qr_code`, validates bin, prompts for weight input, then inserts transaction
- **Form validation**: Uses `react-hook-form` + `zod` + `@hookform/resolvers` (dependencies present but pattern not yet widely implemented)
- **Styling**: Tailwind CSS v4 with `cn()` utility. CSS variables defined in `globals.css`, configured via `components.json`

## Development Workflows

### Database Setup (Must run in order)
```bash
# Run SQL scripts in Supabase SQL Editor:
scripts/001_create_tables.sql       # Schema & indexes
scripts/002_row_level_security.sql  # RLS policies  
scripts/003_functions_and_triggers.sql  # Auto-update logic
scripts/004_seed_data.sql           # Sample data
scripts/005_create_admin_user.sql OR 006_create_admin_alternative.sql  # Admin setup
scripts/007_add_delete_policies.sql # Delete permissions
scripts/008_add_current_weight.sql  # Weight tracking
```
See `ADMIN_SETUP.md` for admin user creation (default: `admin@ecoloop.edu` / `Admin123!`)

### Running the App
```bash
pnpm install
pnpm dev  # Runs on http://localhost:3000
pnpm build  # TypeScript errors ignored (next.config.mjs)
```

### Environment Variables (Required)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Project-Specific Conventions

### File Organization
- **Route structure mirrors roles**: `app/admin/*`, `app/user/*`, `app/worker/*` contain role-specific pages
- **Component organization**: `components/admin/*`, `components/user/*`, `components/worker/*` for role-specific Client Components; `components/ui/*` for shadcn components
- **Critical**: Page components in `app/*` are Server Components; dashboard/interactive components are Client Components in `components/*`

### TypeScript Configuration
- Build errors ignored via `next.config.mjs` - fix types when practical but won't block builds
- Path alias: `@/*` maps to project root (defined in `tsconfig.json` and `components.json`)

### Data Fetching Pattern
Server pages directly query Supabase:
```typescript
const supabase = await createClient()  // Note: await required in Next.js 15
const { data } = await supabase.from('table').select('*')
```

Client components use browser client:
```typescript
const supabase = createClient()  // No await for browser client
```

### Common Gotchas
- **Supabase client**: Wrong client context (server/browser) causes auth bugs - check file imports
- **Middleware**: Changes require dev server restart
- **RLS policies**: If queries mysteriously return empty, check RLS in `002_row_level_security.sql`
- **Triggers**: Points/stock updates happen automatically - don't manually update in application code
- **QR codes**: Must match `waste_bins.qr_code` exactly (stored as text, not UUIDs)

## Key Files to Reference
- `middleware.ts` - Auth redirect logic
- `lib/supabase/*` - Client creation patterns (critical to use correctly)
- `app/page.tsx` - Role-based routing logic
- `scripts/003_functions_and_triggers.sql` - Automatic points/stock management
- `components/user/qr-scanner.tsx` - Weight-based points calculation example
- `ADMIN_SETUP.md` - Admin user creation steps

## Language & Localization
- Spanish (`es`) is primary language (see `app/layout.tsx` metadata and UI text)
- UI strings are hardcoded in components - no i18n library currently used
