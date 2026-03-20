# Km Teller — Project Guide

Mobile-first PWA for daily kilometer tracking (zakelijke ritten / business trips). Built for employer billing — exports data to an Excel template matching the employer's format.

## Tech Stack
- React 18 + TypeScript + Vite 6
- Tailwind CSS v3
- Zustand + localStorage (persist middleware)
- vite-plugin-pwa with registerType: 'autoUpdate'
- Google Identity Services (OAuth implicit grant via redirect)
- fflate for Excel file manipulation

## Key Files
- `src/types/index.ts` — KmReading, KmEntry, AppSettings, BackupData, TabId
- `src/store/kmStore.ts` — Zustand store with persist, Google Drive backup logic
- `src/lib/calculations.ts` — calculateKm(), isEntryComplete(), isEntryPartial()
- `src/lib/dateUtils.ts` — Dutch date helpers, getWorkdaysForMonth()
- `src/lib/excelExport.ts` — exportMonthToExcel() using employer template (`public/template.xlsx`)
- `src/lib/googleAuth.ts` — OAuth redirect flow for Google Drive
- `src/lib/googleDrive.ts` — backup/restore to visible Google Drive folder
- `src/hooks/useAutoBackup.ts` — auto-backup on entry changes
- `src/components/layout/AppShell.tsx` — 3-tab shell (Overzicht, Exporteer, Instellingen)

## GitHub Repos & Deployment
- **Live:** `asanders98/kilometer-teller-PWA` → `asanders98.github.io/kilometer-teller-PWA`
- **Test:** `asanders98/kilometer-teller-PWA-test` → `asanders98.github.io/kilometer-teller-PWA-test`
- Both deploy via GitHub Actions to GitHub Pages on push to `main`
- Test app has red icon, live app has blue icon
- Local git remotes: `origin` = live, `test` = test repo

## Versioning
- `package.json` holds major.minor (e.g. `0.2.0`)
- Patch auto-increments per deploy using `github.run_number` (e.g. `0.2.28`)
- **IMPORTANT:** The `run-name` in both workflow files (`.github/workflows/deploy.yml` and `deploy-test.yml`) has major.minor hardcoded. When bumping major/minor in `package.json`, ALSO update the `run-name` to match.
- Major = breaking changes (data format changes), Minor = new features, Patch = auto (bug fixes, tweaks)

## Workflow & Conventions
- **Always create PRs** for the production repo — never push directly to main
- **Test repo** can receive direct pushes — it's a playground
- Develop & test on test repo first → verify on iOS → create PR for production
- App UI is in **Dutch**
- User tests on a real iPhone — Claude Preview can't validate iOS-specific features (share sheet, PWA install, etc.)

## Google Drive Backup
- OAuth Client ID: `686288945131-hhqr00inum01oatgns12sllo7jljns7h.apps.googleusercontent.com`
- Scope: `drive.file` — saves to a visible "Kilometer Teller" folder in user's Drive
- Uses redirect flow (not popup) — iOS PWA standalone mode doesn't support popups
- Live app: `km-teller-backup.json`, Test app: `km-teller-backup-test.json`
- Auto-backup triggers on every entry change
- App is in Google "testing" mode — test users must be added manually (up to 100)

## iOS PWA Gotchas
- Icon changes require removing and re-adding the app to home screen (iOS caches icons at install time)
- Service worker updates require fully closing and reopening the app
- File downloads must use Web Share API (`navigator.share()`) — blob URL downloads don't work on iOS Safari
- OAuth must use redirect flow, not popup flow

## Excel Export
- Template: `public/template.xlsx` (matches employer format)
- 7 columns: Datum | Km vertrek thuis | Km 1e post | Km laatste post | Km terug thuis | Totaal | Beroepsmatig
- Formulas in Totaal (E-B) and Beroepsmatig (D-C) columns, plus SUM rows at bottom
- Pre-computed cached values alongside formulas so iOS Files previewer shows correct numbers
- `fullCalcOnLoad="1"` set in workbook.xml to force Excel recalculation on open

## Dev Setup
- `npm run dev` → port 5173
- `npm run build` → production build
- npm install may fail locally with "Invalid Version" (semver bug in npm 11 + existing node_modules) — works fine in CI
