# CreaseFeed — Deploy to Firebase Hosting
## creasefeed.com · Firebase Auth + Firestore + Hosting — all one ecosystem

---

## What you need
- [ ] Firebase account → firebase.google.com
- [ ] Node.js v18+ → nodejs.org

---

## STEP 1 — Firebase project setup (15 min)

1. console.firebase.google.com → Add project → name: `creasefeed`

### Authentication
2. Build → Authentication → Get Started
3. Enable Google sign-in + Email/Password

### Firestore
4. Build → Firestore Database → Create database → production mode → us-east1

### Firestore Security Rules
5. Firestore → Rules tab → paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /games/{gameId} { allow read: if true; }
    match /stats/{statId}  { allow read: if true; }
  }
}
```

### Firebase Hosting
6. Build → Hosting → Get Started (click through the wizard)

### Get your config keys
7. Project Settings → Your apps → Web app (</>)
8. Register app: `creasefeed-web`
9. Copy all 6 values from the firebaseConfig object

---

## STEP 2 — Configure env (2 min)

```bash
cp .env.example .env
```

Fill in `.env` with your Firebase values:
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=creasefeed.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=creasefeed
VITE_FIREBASE_STORAGE_BUCKET=creasefeed.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Test locally:
```bash
npm install
npm run dev   # → http://localhost:5173
```

---

## STEP 3 — Firebase CLI (5 min)

```bash
npm install -g firebase-tools
firebase login          # opens browser
firebase projects:list  # should show: creasefeed
```

---

## STEP 4 — Build & deploy (2 min)

```bash
npm run build
firebase deploy --only hosting
```

App is live at → **https://creasefeed.web.app** ✓

---

## STEP 5 — Connect creasefeed.com (10 min)

**In Firebase Console:**
1. Hosting → Add custom domain → `creasefeed.com`
2. Copy the DNS records Firebase shows you

**In your domain registrar:**
3. Add TXT record (ownership verification)
4. Add the two A records Firebase provides
5. Add CNAME: www → creasefeed.web.app
6. Firebase auto-provisions SSL — live in 5-30 min

**Authorize domain for Google Sign-In:**
7. Authentication → Settings → Authorized domains
8. Add: `creasefeed.com` and `www.creasefeed.com`

---

## Redeploy after any change

```bash
npm run build && firebase deploy --only hosting
```

~60 seconds. That's it.

---

## Verify launch checklist

- [ ] creasefeed.com loads
- [ ] Google Sign In works
- [ ] Onboarding flow triggers on first sign-in
- [ ] Follow teams saves to Firestore
- [ ] Men's/Women's + D1/D2/D3 toggles work
- [ ] Source badge shows ESPN or Demo data
- [ ] Go Pro CTA visible

---

## Future: Server-side score polling (Cloud Functions)

Move ESPN fetching server-side so the app reads Firestore in real time:

```bash
firebase init functions
```

```js
// functions/index.js
exports.pollScores = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async () => {
    // fetch ESPN → write to Firestore
    // app reads via onSnapshot() — instant updates, no client polling
  })
```

This is the right production architecture. Do it when you have
a real data provider locked in.

---

## Swap data source (when Sportradar is ready)

In `src/hooks/useScores.jsx` — change ONE line:
```js
import * as DataSource from '../api/espn.js'       // now
import * as DataSource from '../api/sportradar.js'  // later
```

Zero other changes required.

---

## BONUS — Auto-deploy on git push (Vercel-style experience)

Get automatic deploys every time you push to GitHub — same workflow as Vercel, staying on Firebase.

### One-time setup

**1. Get a Firebase service account key**
- Firebase Console → Project Settings → Service accounts
- Click "Generate new private key" → download the JSON file

**2. Add GitHub Secrets**
Go to your GitHub repo → Settings → Secrets and variables → Actions → New secret:

| Secret name                        | Value                              |
|------------------------------------|------------------------------------|
| `FIREBASE_SERVICE_ACCOUNT`         | Paste the entire JSON file content |
| `VITE_FIREBASE_API_KEY`            | Your Firebase API key              |
| `VITE_FIREBASE_AUTH_DOMAIN`        | creasefeed.firebaseapp.com         |
| `VITE_FIREBASE_PROJECT_ID`         | creasefeed                         |
| `VITE_FIREBASE_STORAGE_BUCKET`     | creasefeed.appspot.com             |
| `VITE_FIREBASE_MESSAGING_SENDER_ID`| Your sender ID                     |
| `VITE_FIREBASE_APP_ID`             | Your app ID                        |

**3. Push to GitHub**
```bash
git add .
git commit -m "Add GitHub Actions deploy workflow"
git push origin main
```

From this point on:
- Push to `main` → **automatic production deploy** to creasefeed.com
- Open a pull request → **automatic preview URL** posted as a PR comment
- Merge PR → **automatic production deploy**

This is identical to the Vercel experience, on Firebase.

Canonical deploy method is manual firebase deploy. The GitHub Actions workflow exists but is manual-trigger only — do not re-enable auto-deploy without first verifying GitHub Secrets (FIREBASE_SERVICE_ACCOUNT, VITE_FIREBASE_) are current.
