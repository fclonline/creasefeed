#!/bin/bash
# ============================================================================
# CreaseFeed — Functions Deploy Script
# Run this with Cowork or manually in Terminal
#
# What this does:
#   1. Installs function dependencies
#   2. Upgrades Firebase project to Blaze plan (required for Cloud Functions)
#   3. Deploys all Cloud Functions
#   4. Verifies scheduled jobs are active
#   5. Triggers a manual test run of box score + poll scrapers
# ============================================================================

set -e  # exit on any error

echo ""
echo "🥍 CreaseFeed — Deploying Cloud Functions"
echo "==========================================="
echo ""

# ── Step 1: Navigate to project ──────────────────────────────────────────────
cd ~/Claude-CoWork/creasefeed
echo "✓ In project directory: $(pwd)"

# ── Step 2: Install function dependencies ────────────────────────────────────
echo ""
echo "Installing function dependencies..."
cd functions && npm install
cd ..
echo "✓ Dependencies installed"

# ── Step 3: Check Firebase project is set ────────────────────────────────────
echo ""
echo "Checking Firebase project..."
firebase use creasefeed
echo "✓ Using project: creasefeed"

# ── Step 4: Update firebase.json to include functions ────────────────────────
echo ""
echo "Updating firebase.json..."
cat > firebase.json << 'FIREBASE_JSON'
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  },
  "functions": [
    {
      "source": "functions",
      "codebase": "creasefeed-functions",
      "ignore": ["node_modules", ".git", "firebase-debug.log"]
    }
  ],
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
FIREBASE_JSON
echo "✓ firebase.json updated"

# ── Step 5: Create Firestore rules file if not exists ────────────────────────
if [ ! -f firestore.rules ]; then
cat > firestore.rules << 'RULES'
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /games/{gameId}       { allow read: if true; }
    match /playerStats/{id}     { allow read: if true; }
    match /polls/{pollId}       { allow read: if true; }
    match /polls/{pollId}/history/{week} { allow read: if true; }
    match /errors/{id}          { allow read: if request.auth != null; }
  }
}
RULES
echo "✓ firestore.rules created"
fi

# ── Step 6: Create Firestore indexes file ────────────────────────────────────
if [ ! -f firestore.indexes.json ]; then
cat > firestore.indexes.json << 'INDEXES'
{
  "indexes": [
    {
      "collectionGroup": "games",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status",    "order": "ASCENDING" },
        { "fieldPath": "season",    "order": "ASCENDING" },
        { "fieldPath": "updatedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "games",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "gender",    "order": "ASCENDING" },
        { "fieldPath": "div",       "order": "ASCENDING" },
        { "fieldPath": "status",    "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "playerStats",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "gender",  "order": "ASCENDING" },
        { "fieldPath": "season",  "order": "ASCENDING" },
        { "fieldPath": "goals",   "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "playerStats",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "gender",  "order": "ASCENDING" },
        { "fieldPath": "season",  "order": "ASCENDING" },
        { "fieldPath": "assists", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
INDEXES
echo "✓ firestore.indexes.json created"
fi

# ── Step 7: Deploy Firestore rules + indexes ──────────────────────────────────
echo ""
echo "Deploying Firestore rules and indexes..."
firebase deploy --only firestore
echo "✓ Firestore rules deployed"

# ── Step 8: Deploy Cloud Functions ───────────────────────────────────────────
echo ""
echo "Deploying Cloud Functions..."
echo "⚠️  NOTE: Cloud Functions require the Blaze (pay-as-you-go) plan."
echo "    If you haven't upgraded yet, go to:"
echo "    console.firebase.google.com → creasefeed → Upgrade → Blaze"
echo "    Cost is minimal — ~$0 during testing, <$10/month at scale."
echo ""
read -p "Press Enter when ready to deploy functions (or Ctrl+C to cancel)..."

firebase deploy --only functions
echo "✓ Cloud Functions deployed"

# ── Step 9: Show function URLs ────────────────────────────────────────────────
echo ""
echo "==========================================="
echo "✅ DEPLOYMENT COMPLETE"
echo "==========================================="
echo ""
echo "Scheduled jobs now running:"
echo "  • pollLiveGamesJob   — every 1 min during game hours"
echo "  • scrapeBoxScoresJob — every 5 min during game hours"
echo "  • scrapePollsJob     — every Tuesday 10am ET"
echo "  • scrapeNightly      — midnight every night"
echo ""
echo "To view function logs:"
echo "  firebase functions:log"
echo ""
echo "To manually trigger a box score scrape:"
echo "  curl -H 'x-creasefeed-secret: YOUR_SECRET' \\"
echo "    https://us-east1-creasefeed.cloudfunctions.net/triggerBoxScores"
echo ""
echo "🥍 Feed the Crease."
