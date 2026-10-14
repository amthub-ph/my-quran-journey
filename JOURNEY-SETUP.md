# My Qur’an Journey — setup and checkpoints

Project folder: `C:\Users\admin\OneDrive\Desktop\my-quran-journey`

The existing colors, Inter UI font, and Noto Naskh Arabic font are retained. All 114 surahs use one reader. No Qur’an verses were generated or manually reconstructed.

## 1. Set up the new Supabase tables

Open this exact file in VS Code:

`C:\Users\admin\OneDrive\Desktop\my-quran-journey\supabase\migrations\202610130001_journey.sql`

1. Open the Supabase dashboard for the same project used by your existing app.
2. Choose **SQL Editor → New query**.
3. Copy the entire SQL file, paste it into the editor, and click **Run**.
4. In Table Editor, confirm `journey_progress`, `journey_bookmarks`, and `journey_reminders` exist.

This is an additive migration. It leaves the existing `profiles` table alone. Each new table has row-level security: signed-in users can access only their own rows. Every saved verse key is checked against the correct verse count for its surah. The migration can be rerun.

**Checkpoint:** after logging in, the dashboard should say “Begin your journey” instead of showing the old example at 2:42. A database warning means the migration or connection still needs attention. An error must never be treated as a successful save.

## 2. Enable Quran Foundation English and audio

The Arabic reader works from the local Tanzil file independently. English and audio use Quran Foundation’s authenticated Content API.

1. Visit https://dev-console.quran.foundation/ and create a backend/server application.
2. Obtain its client ID and client secret. Do not paste the secret into chat.
3. Open `C:\Users\admin\OneDrive\Desktop\my-quran-journey\.env.local`.
4. Keep your existing Supabase settings. Add the settings below, filling the two blank values locally:

```dotenv
QF_CLIENT_ID=
QF_CLIENT_SECRET=
QF_ENV=prelive
QF_TRANSLATION_ID=20
QF_RECITATION_ID=7
```

The server validates the chosen English translation and recitation against the provider’s catalogs and displays their attribution. These settings must never have a `NEXT_PUBLIC_` prefix.

New Quran Foundation apps start in **pre-live**, whose dataset currently includes only surahs 1 and 2. For English/audio across all 114 surahs, request production access and then set `QF_ENV=production` with the matching production credentials. Do not mix environments.

Reference: https://api-docs.quran.com/docs/quickstart/

**Checkpoint:** open surah 1. Arabic should appear immediately; English and a named recitation should load after credentials are configured. Without credentials, an explicit notice appears while Arabic stays usable. The player requires pressing Play and an internet connection. It plays the current ayah; changing ayah pauses it.

## 3. Restart the app

In the VS Code terminal for the project, press **Ctrl+C**, then run:

```powershell
npm.cmd run dev
```

Open http://localhost:3000/auth/login and sign in normally.

For a production build and local production check:

```powershell
npm.cmd run build
npm.cmd run start
```

Only run one app server on a given port. The separate temporary validation server uses port 3100 and can be stopped after review.

## 4. Reader checkpoints

1. Open http://localhost:3000/quran. Confirm 114 surahs, from Al-Fatihah to An-Nas.
2. Search for `114`; open An-Nas. Confirm Arabic is present and Go to offers ayat 1–6.
3. Open http://localhost:3000/quran/2?ayah=255. Confirm the position is `2:255` and the progress bar is about 89%.
4. Change the display between Arabic, Arabic + English, and Arabic + Tagalog.
5. Select **Next ayah**. The position and percentage should change together.
6. Choose **Pause & Save** and wait for “Saved exactly at …”. Return to Dashboard; Resume must open that exact surah and ayah.
7. Refresh, sign out, and sign back in. Resume should retain the saved position.
8. Try `/quran/115` and `/quran/2?ayah=999`. They should show a not-found page, never a fabricated verse.

The percentage is **position within the current surah**, not a claim that all earlier verses or the whole Qur’an were completed. Daily reading totals, streaks, and juz completion are not fabricated from a saved position. Position changes are saved only with **Pause & Save**. Save before following another link.

## 5. Bookmark checkpoints

1. In the reader at `2:255`, choose **Bookmark ayah** and wait for confirmation.
2. Open http://localhost:3000/bookmarks. Choose the saved entry; it should return to `2:255`.
3. Remove the bookmark and refresh. It should stay removed.
4. In a different account, confirm the first account’s bookmarks and progress are not visible.

## 6. Reminders and notifications

Open http://localhost:3000/reminders.

1. Choose **Enable notifications** and allow the browser prompt if you want notifications.
2. Choose **Send test notification**. Your browser/OS may hide it in the notification center or silence it in Focus/Do Not Disturb mode.
3. Set a date/time two minutes ahead and choose **Once**. Save it.
4. Optional: click **Enable reminder sound for this session** at the bottom of the page.
5. Keep the app open. The reminder checker runs every 15 seconds and also on window focus. It shows an in-app message and, when permitted, a system notification; sound requires an active audio session.
6. Test **Every 24 hours**, **Every 7 days**, pause, re-enable, and delete.

Times are entered in the device’s local time zone and stored as UTC instants. Repeats are fixed 24-hour or 168-hour intervals, explicitly labeled this way. They are not daylight-saving-aware “same local clock time” rules. Overdue reminders are coalesced into one delivery when the app resumes. Multiple tabs use an atomic compare-and-update to avoid claiming the same occurrence twice. Delivery remains best effort: a crash after claiming can lose a notification.

**Limits:** a browser/PWA cannot guarantee an alarm when closed, suspended, offline, blocked by the OS, or on a sleeping device. Closed-app Web Push is not configured. That would require a server scheduler, stored push subscriptions, VAPID credentials, deployment, and device testing. A service worker alone does not provide a reliable future alarm timer.

## 7. Install the PWA

On a supported desktop browser, use the **Install app** button when it appears, or the browser’s installation menu. On iPhone/iPad, use Safari → Share → Add to Home Screen, open the installed app, then enable notifications. Notification support depends on the OS/browser.

Localhost is suitable for development. A deployed PWA requires HTTPS. A phone visiting a computer’s plain HTTP LAN address does not have the same secure-context privileges as localhost.

**Checkpoint:** confirm an app icon and standalone window after installation. Turn off networking and navigate: the app should show a clear offline page. This is an installable PWA with an offline fallback, **not a complete offline Qur’an library**. An already-open reader retains the loaded Arabic surah. Authenticated pages, Supabase records, and API responses are never cached by the service worker.

## Sources and republication

- Arabic: Tanzil Uthmani 1.1, Ḥafṣ ʿan ʿĀṣim. Downloaded directly from https://tanzil.net/download/ on 2026-10-13. The exact download and original copyright block are retained in `data/quran-uthmani.txt`. No normalization, trimming of verse content, or spelling changes are applied. License: https://tanzil.net/docs/text_license . The source file’s SHA-256 is in `data/source-manifest.json`.
- Surah names and counts: Quran.com chapter API, https://api.quran.com/api/v4/chapters?language=en . Verified against all 6,236 imported verse keys.
- English and audio: Quran Foundation Content API, configured with your app credentials. Translator and reciter attribution come from resource catalogs. Confirm your approved resource usage before public distribution.
- Tagalog: Rowwad Translation Center’s `tagalog_rwwad`, QuranEnc. The live catalog confirmed version **1.1.4**. The app reads the current version rather than hard-coding it, preserves translation text and footnotes, and refreshes cached responses daily. https://quranenc.com/tl/browse/tagalog_rwwad and https://quranenc.com/en/home/api . QuranEnc’s published terms permit republication with unchanged content, publisher/source attribution, version/transcript information, updates, reporting notes to the source, and no inappropriate advertising. No message has been sent to the publisher. This project adds no advertisements.

## File-by-file map

Every relative path below is inside `C:\Users\admin\OneDrive\Desktop\my-quran-journey\`.

| File | Purpose |
| --- | --- |
| `data/quran-uthmani.txt` | Unmodified official Arabic download and license |
| `data/chapters.json` | All 114 surah names/counts |
| `data/source-manifest.json` | Source provenance and SHA-256 |
| `lib/quran.ts` | Shared verse-key validation and position calculation |
| `lib/quran-server.ts` | Arabic import, server-only Quran Foundation credentials, Tagalog provider |
| `app/api/quran/[key]/route.ts` | Authenticated per-ayah translation/audio endpoint |
| `app/quran/page.tsx` | Surah directory route |
| `components/surah-list.tsx` | Accessible searchable 114-surah list |
| `app/quran/[surah]/page.tsx` | One dynamic reader route for every surah |
| `components/reader.tsx` | Arabic/display options/audio/navigation/save/bookmarks |
| `app/actions/journey.ts` | Authenticated progress and bookmark mutations |
| `components/saved-position.tsx` | Saved progress and Resume card |
| `app/protected/page.tsx` | Dashboard connected to saved data |
| `app/protected/layout.tsx` | Removes the unrelated starter header/footer |
| `app/progress/page.tsx` | Saved reading position page |
| `app/bookmarks/page.tsx`, `components/bookmark-list.tsx` | Bookmark list and removal |
| `app/reminders/page.tsx`, `components/reminders.tsx` | Schedule editor and permission flow |
| `lib/reminders.ts` | Repeat interval calculations |
| `components/pwa.tsx` | Service worker registration, install prompt, active-app reminders |
| `app/manifest.ts`, `public/icons/` | PWA metadata and icons |
| `public/sw.js`, `public/offline.html` | Safe offline fallback and notification click behavior |
| `app/layout.tsx`, `app/globals.css` | PWA integration and existing design styles |
| `lib/supabase/proxy.ts` | Public PWA assets and preserved cookies on auth redirects |
| `next.config.ts` | Bundles the Arabic file for server deployment; worker headers |
| `.env.quran.example` | Server-only content configuration template |
| `supabase/migrations/202610130001_journey.sql` | Tables, verse constraints, and per-user access policies |
| `tests/journey.test.cjs` | Verse integrity, invalid keys, repeat schedules, mocked provider tests |

## Verification performed

- Production build, TypeScript, and targeted ESLint checks passed.
- Five automated tests passed, including complete source integrity and boundary checks across all 114 surahs.
- Tanzil download and QuranEnc Tagalog metadata/sample endpoint were accessed successfully.
- Quran Foundation adapter was tested with explicit non-Qur’an fixtures; live credentialed English/audio is pending your credentials.
- Live database writes, multi-account RLS behavior, device notification delivery, installation, and signed-in responsive layouts still require the checkpoints above. They have not been claimed as completed tests.

Run the focused tests in the project terminal:

```powershell
node --test tests/journey.test.cjs
```

## Restore if needed

The application step creates a timestamped backup of every replaced file under `.journey-backups` inside the project before copying changes. Newly added paths are listed in the delivery manifest. Your `.env.local` and installed dependencies are not overwritten.
