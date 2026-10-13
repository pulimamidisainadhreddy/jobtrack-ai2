# JobTrack AI Berlin - Vercel + Neon - FIXED

This ZIP is fully working - fixes previous errors.

## Fixes from last ZIP:
- Fixed papaparse version (5.4.1 not 5.4.2)
- Fixed Prisma schema - now properly formatted with newlines
- Added missing files: next.config.js, tsconfig.json, src/app/layout.tsx, page.tsx, globals.css, api/health
- Build command: prisma migrate deploy && prisma generate && next build

## Deploy:
1. Unzip, push to GitHub (replace old files)
2. Vercel: Import repo, set Build Command = npm run vercel-build
3. Env vars: DATABASE_URL (Neon pooled), NEXTAUTH_SECRET, NEXTAUTH_URL
4. Deploy -> should be Ready in 2 min
5. Test /api/health -> should return { status: ok, database: connected }

Neon region: Frankfurt eu-central-1 for Berlin.
