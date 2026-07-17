# Balot Arena v1.1.0 — Deployment from Scratch

This guide deploys the verified Balot Arena PWA using a new or existing Supabase project, GitHub, and Vercel.

## 1. Requirements

- Node.js 20.9 or newer for local testing.
- A GitHub account.
- A Supabase project.
- A Vercel account.

## 2. Extract the ZIP correctly

Extract the release ZIP. Open the extracted project folder and confirm that these items are directly inside it:

```text
package.json
package-lock.json
.npmrc
app/
components/
lib/
supabase/
tests/
```

Do not create an extra nested project folder when uploading to GitHub. `package.json` must be in the repository root.

## 3. Verify locally

From the project root, run the exact release checks:

```bash
npm ci
npm test
npm run typecheck
npm run build
```

Optional combined check, including the npm registry audit:

```bash
npm run verify
```

## 4. Create and configure Supabase

1. Create a new Supabase project.
2. Open **SQL Editor**.
3. Open `supabase/setup.sql` from this project.
4. Copy the entire file into SQL Editor and run it once.
5. Confirm that it finishes without an error.
6. Open **Project Settings → API**.
7. Copy:
   - Project URL.
   - Publishable key, normally beginning with `sb_publishable_`.

Never expose `service_role`, `sb_secret_`, database passwords, or other private keys in Vercel or browser code.

### Existing Baloot Arena database

For an existing database that already used an older Baloot Arena setup, run:

```text
supabase/v1.sql
```

Do not run both files repeatedly. `setup.sql` is for a new project; `v1.sql` is the upgrade path.

## 5. Test locally with Supabase

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxx
```

Start the application:

```bash
npm run dev
```

Open the local address shown by Next.js. Add four players, play a completed competition match, save it, then confirm that standings and player profiles update.

## 6. Upload to GitHub

### GitHub website

1. Create a new empty repository.
2. Choose **Add file → Upload files**.
3. Upload the contents of the extracted project folder.
4. Confirm that `.npmrc`, `package-lock.json`, and `package.json` are visible at the repository root.
5. Commit the upload.

### Git command line

```bash
git init
git add .
git commit -m "Deploy Balot Arena v1.1.0 PWA"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

Do not upload `.env.local`, `node_modules`, `.next`, or `*.tsbuildinfo`.

## 7. Deploy with Vercel

1. In Vercel, select **Add New → Project**.
2. Import the GitHub repository.
3. Use these settings:
   - Framework Preset: `Next.js`
   - Root Directory: `./`
   - Install Command: `npm ci`
   - Build Command: `npm run build`
4. Add these environment variables to **Production**, and preferably **Preview**:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

5. Select **Deploy**.

## 8. Post-deployment verification

After the Vercel deployment opens:

1. Add four players.
2. Start a match under **المنافسات**.
3. Confirm changing the bidder defaults score entry to the opposing team while still allowing manual changes.
4. Confirm صن and أشكل allow only دبل and enforce the 100 / below-100 condition.
5. Confirm دبل، ثري and فور award zero to the losing team and leave بلوت unmultiplied.
6. Confirm the last مكبر is treated as the effective bidder.
7. Save several rounds and confirm contextual announcements appear after the round is recorded.
8. Confirm losing with the normalized name `عبدالله شريف` shows `زخه التفتيش`, while winning does not.
9. Finish and save the match once.
10. Confirm the final Arabic summary contains no more than two result-consistent jokes, plus نجم الصكة and مفلس الصكة.
11. Open standings and player profiles and confirm they update immediately.
12. Reload the site and confirm the saved completed match remains and no duplicate match was created.

## 9. Updating later

Make changes in GitHub and push to `main`; Vercel will redeploy automatically. Before each update, run:

```bash
npm ci
npm test
npm run typecheck
npm run build
```

## 10. Verify and install the PWA

After Vercel finishes, open these URLs and confirm they load:

```text
https://YOUR-DOMAIN/manifest.webmanifest
https://YOUR-DOMAIN/sw.js
https://YOUR-DOMAIN/icons/icon-512.png
```

On iPhone:

1. Delete any older Home Screen shortcut so iOS does not retain an old icon.
2. Open the Vercel site in Safari.
3. Tap Share.
4. Choose **Add to Home Screen**.
5. Keep the name **Balot Arena**.
6. Enable **Open as Web App** if it is displayed.
7. Tap **Add**.

The PWA can reopen its cached interface, but Supabase still requires internet for players, completed-match saving, profiles, and leaderboard updates.

No Supabase SQL change is required when upgrading from v1.0.1 to v1.1.0.
