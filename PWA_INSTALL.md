# Balot Arena PWA installation

## Deploy through GitHub and Vercel

1. Extract the release ZIP.
2. Upload the **contents** of the extracted folder to the root of the existing GitHub repository. `package.json` must be at the repository root.
3. Commit and push the files. Vercel will create a new deployment automatically.
4. In Vercel, keep these environment variables configured for Production, Preview, and Development:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
5. Build settings:
   - Framework: Next.js
   - Install command: `npm ci`
   - Build command: `npm run build`
   - Root directory: `./`
6. After deployment, verify:
   - `/manifest.webmanifest`
   - `/sw.js`
   - `/icons/icon-512.png`

No Supabase SQL change is required for the PWA release.

## Install on iPhone

1. Delete any older Balot Arena Home Screen shortcut so iOS does not keep an old icon.
2. Open the deployed website in **Safari**.
3. Tap the Share button.
4. Choose **Add to Home Screen**.
5. Keep the name `Balot Arena`.
6. Enable **Open as Web App** if iOS shows that option.
7. Tap **Add**.

The installed app opens in standalone mode. Internet is still required to load Supabase data, save completed matches, and update profiles or the leaderboard.
