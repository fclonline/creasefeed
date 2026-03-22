# CreaseFeed — Cowork Deployment Instructions
# Hand this to Cowork after completing the Firebase Console steps yourself

---

## CONTEXT
I am deploying a React/Vite web app called CreaseFeed to Firebase Hosting.
The project zip is called creasefeed.zip.
I have already:
- Created a Firebase project called "creasefeed"
- Enabled Authentication (Google + Email/Password)
- Created a Firestore database
- Enabled Firebase Hosting
- Generated a Firebase service account key (JSON file)
- Have all 6 Firebase config values ready

---

## TASK 1 — Unzip and verify the project

1. Unzip creasefeed.zip to a folder called creasefeed
2. Open a terminal inside the creasefeed folder
3. Run: npm install
4. Confirm it completes with no errors
5. Tell me what version of Node is installed

---

## TASK 2 — Create the .env file

Create a file called .env in the creasefeed folder.
I will provide you with the following values — paste them in exactly:

VITE_FIREBASE_API_KEY=[I will provide this]
VITE_FIREBASE_AUTH_DOMAIN=[I will provide this]
VITE_FIREBASE_PROJECT_ID=creasefeed
VITE_FIREBASE_STORAGE_BUCKET=[I will provide this]
VITE_FIREBASE_MESSAGING_SENDER_ID=[I will provide this]
VITE_FIREBASE_APP_ID=[I will provide this]

---

## TASK 3 — Test the build

1. Run: npm run build
2. Confirm a /dist folder is created
3. Confirm there are no build errors
4. Tell me the total build size

---

## TASK 4 — Install Firebase CLI and log in

1. Run: npm install -g firebase-tools
2. Run: firebase --version to confirm it installed
3. Run: firebase login
   - This will open a browser window — tell me when it opens
   - I will sign in with my Google account
   - Tell me when login is confirmed

---

## TASK 5 — Link project to Firebase

1. Run: firebase use creasefeed
2. Confirm the project is linked
3. Run: firebase deploy --only hosting
4. Tell me the Hosting URL it gives you (should be creasefeed.web.app)
5. Open that URL and confirm the site loads

---

## TASK 6 — Create GitHub repository

1. Go to github.com (I will be logged in)
2. Create a new PRIVATE repository called: creasefeed
3. Do NOT initialize with README or .gitignore
4. Copy the repository URL

---

## TASK 7 — Push code to GitHub

In the creasefeed folder run these commands in order:

```
git init
git add .
git commit -m "Initial CreaseFeed deployment"
git branch -M main
git remote add origin [paste the GitHub repo URL from Task 6]
git push -u origin main
```

Confirm all files are pushed successfully.

---

## TASK 8 — Add GitHub Actions secrets

1. Go to the GitHub repo → Settings → Secrets and variables → Actions
2. Add each of these secrets one by one (I will provide the values):

   Secret name: FIREBASE_SERVICE_ACCOUNT
   Value: [I will paste the entire contents of my Firebase service account JSON file]

   Secret name: VITE_FIREBASE_API_KEY
   Value: [same as .env]

   Secret name: VITE_FIREBASE_AUTH_DOMAIN
   Value: [same as .env]

   Secret name: VITE_FIREBASE_PROJECT_ID
   Value: creasefeed

   Secret name: VITE_FIREBASE_STORAGE_BUCKET
   Value: [same as .env]

   Secret name: VITE_FIREBASE_MESSAGING_SENDER_ID
   Value: [same as .env]

   Secret name: VITE_FIREBASE_APP_ID
   Value: [same as .env]

3. Confirm all 7 secrets are saved

---

## TASK 9 — Trigger and verify auto-deploy

1. Make a small change to any file (example: add a comment to README.md)
2. Run:
   ```
   git add .
   git commit -m "Test auto-deploy"
   git push origin main
   ```
3. Go to the GitHub repo → Actions tab
4. Watch the deploy workflow run
5. Confirm it completes with a green checkmark
6. Open creasefeed.web.app and confirm the site is live

---

## TASK 10 — Confirm final checklist

Please verify each of these and report back:

- [ ] creasefeed.web.app loads in browser
- [ ] Firebase Hosting shows the deployment in the console
- [ ] GitHub repo has all project files
- [ ] GitHub Actions workflow ran successfully (green)
- [ ] Auto-deploy is confirmed working (push → live in ~90 seconds)

---

## NOTES FOR COWORK

- Do not enter any passwords or API keys yourself — ask me to provide them
- If any step fails, stop and tell me exactly what the error says
- Do not skip steps or combine them — do them in order
- The .env file should NEVER be committed to GitHub (it is in .gitignore already)
- If firebase login opens a browser, pause and wait for me to authenticate

---

## AFTER COWORK IS DONE — You do these yourself

These require your domain registrar login and cannot be delegated:

1. Firebase Console → Hosting → Add custom domain → creasefeed.com
2. Add the DNS records Firebase gives you to your domain registrar
3. Firebase Console → Authentication → Settings → Authorized domains
   → Add creasefeed.com and www.creasefeed.com
4. Wait 5-30 min for SSL to provision
5. Visit creasefeed.com and confirm it loads
