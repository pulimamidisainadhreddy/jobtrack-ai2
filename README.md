# JobTrack AI2 — upgraded multi-page job tracker

**This is a modified version of `pulimamidisainadhreddy/jobtrack-ai2`, inspired by the provided `React Artifact.html`.**

## What's included

| Page | URL | Features |
|---|---|---|
| Dashboard | `/dashboard` | Actual statistics, real charts, recent jobs |
| Applications | `/applications` | Search, advanced filters, create/edit/delete, CSV export |
| Kanban | `/kanban` | Drag jobs across statuses; auto-save to PostgreSQL |
| AI Assistant | `/assistant` | Local keyword-based skill comparison, follow-up email templates |
| Follow-ups | `/follow-ups` | Overdue reminders, calendar, interviews, snooze |
| Goals | `/goals` | Weekly targets, measured progress, saved counters |
| Data & Export | `/data` | Backup CSV, import CSV with duplicate prevention, privacy information |
| Login | `/login` | Password-protected, signed HttpOnly session cookie |

No fabricated applications, sample charts or hard-coded statistics are shown.

### Important distinctions from the reference HTML

The HTML file exported from a React artifact is a **compiled bundle**, not editable React source code. It also uses browser localStorage to save applications. This rebuild adapts the design and functionality into maintainable Next.js components, while preserving **Neon PostgreSQL** for application records and goals. It is **not** a byte-for-byte copy of the original HTML.

The Assistant performs a **local keyword comparison**, not a paid or external AI model. The displayed score is keyword overlap, not a real ATS or recruiter match probability. There is no third-party data collection or automatic job scraping.

## Local development (Windows 11 / VS Code)

1. Download/extract this ZIP. Open its folder in VS Code.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Put your own Neon `DATABASE_URL`, a **strong** `TRACKER_PASSWORD` (8+ characters), and a random `AUTH_SECRET` (at least 32 characters) in `.env.local`.
5. **Back up your Neon database before modifying the schema.**
6. Run `npx prisma db push` **without** `--accept-data-loss`. Prisma will add new optional application fields and the `GoalSettings` model. Read all warnings before accepting any change; never agree to drop existing data.
7. Run `npm run dev` and open `http://localhost:3000`.
8. Log in with `TRACKER_PASSWORD`.

### Deploy on Vercel (with Neon)

1. Create a **new Git branch** or copy the files into your `jobtrack-ai2` repository, after making a backup.
2. Push the changed code to GitHub.
3. In Vercel → Project → Settings → Environment Variables, configure `DATABASE_URL`, `TRACKER_PASSWORD` and `AUTH_SECRET` for Production (and Preview when needed).
4. Before deployment, apply `npx prisma db push` once from your local terminal while connected to the correct Neon database; this step is NOT included in the build script to prevent accidental destructive schema changes on every deployment.
5. Deploy from the new commit. The project uses `npm run build` (or `vercel-build`) and **does not** execute any `--accept-data-loss` operation.
6. Verify `/api/health` reports `database: connected`, sign in, and verify your existing applications on `/applications`.

### Generate AUTH_SECRET on Windows PowerShell

```powershell
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

Copy the output into your Vercel `AUTH_SECRET`. Do not paste it into any source file.

### What stayed compatible

- The existing `User`, `Application`, `Interview`, `Contact`, `Document`, `Task`, `CvVersion` and `CoverLetter` Prisma models were preserved.
- Existing `/api/applications` and `/api/applications/[id]` endpoints remain, and use the same user's historical records.
- Original `companyName`, `jobTitle`, `jobLocation`, `status`, `platform`, `notes`, `jobUrl`, and dates are compatible.
- Goals are added in `GoalSettings` and extra tracking fields are optional.

### Security limitations

- This is a private **single-user** tracker: one shared `TRACKER_PASSWORD` guards the application. It is not suitable for multiple separate accounts.
- In production, a missing/short password produces a **503 error** rather than publicly exposing private application data.
- The app does not use GitHub OAuth or email verification. Avoid storing highly sensitive documents in free-text fields.
- Session cookies last seven days and are signed using the secret or (when no other secret exists) the workspace password. Rotate both if compromised.
- Change the original tracked password if you previously exposed this site without access controls.

### Database schema upgrade warning

The project includes new **nullable** Application fields and `GoalSettings`. `prisma db push` is an explicit one-time operation. We deliberately removed the original dangerous `prisma db push --accept-data-loss` invocation from the Vercel build command.

### Tests

To check TypeScript after installing dependencies:

```bash
npm run smoke
npm run typecheck
npm run build
npm run db:check
```

Do not commit `.env.local` or real database credentials. The provided ZIP contains **source code only**, not your private data. The ZIP does not include installed `node_modules`, a production deployment, or your Neon database.
