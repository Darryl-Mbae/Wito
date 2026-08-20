# Scripts Setup Guide

## Prerequisites

The scripts require `firebase-admin` and `dotenv` packages to be installed.

### Installation

```bash
npm install firebase-admin dotenv
```

These are already installed in your project.

## Firebase Authentication Setup

The scripts use Firebase Admin SDK to manage your Firestore database.

### Step 1: Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** (gear icon)
4. Click **Service Accounts** tab
5. Click **Generate New Private Key**
6. Save the downloaded JSON file safely

### Step 2: Set Environment Variable for Local Development

For local development, set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable:

**Windows (PowerShell):**
```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\firebase-key.json"
npx ts-node scripts/clearTemplatePurchases.ts --help
```

**Windows (CMD):**
```cmd
set GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\firebase-key.json
npx ts-node scripts/clearTemplatePurchases.ts --help
```

**Mac/Linux:**
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/firebase-key.json"
npx ts-node scripts/clearTemplatePurchases.ts --help
```

### Step 3: Ensure .env Has Firebase Project ID

Your `.env` should already have the VITE_FIREBASE_PROJECT_ID:

```env
VITE_FIREBASE_PROJECT_ID=rada-b60ad
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
# ... other VITE_FIREBASE_* variables
```

### Step 4: Add to .gitignore

Make sure sensitive files are in `.gitignore`:

```
.env
.env.local
firebase-key.json
google-application-credentials.json
```

## Available Scripts

### 1. Clear Template Purchases

Remove all template marketplace purchases (testing/reset).

```bash
# Clear purchases for one buyer
npx ts-node scripts/clearTemplatePurchases.ts --user-id "user123"

# Clear sales for one seller (resets to 0 sales, 0 revenue)
npx ts-node scripts/clearTemplatePurchases.ts --seller-id "seller456"

# Clear ALL template purchases
npx ts-node scripts/clearTemplatePurchases.ts --all
```

### 2. Clear All Transactions and Sales

Remove ALL transaction types (more aggressive reset).

```bash
npx ts-node scripts/clearTransactionsAndSales.ts --user-id "user123"
```

This clears:
- All transactions (purchases, sales, credits, etc.)
- All notifications
- Resets credits to 0
- Resets seller earnings to 0

### 3. Send Notifications

```bash
npx ts-node scripts/sendNotifications.ts
npx ts-node scripts/sendBatchNotifications.ts
```

## Troubleshooting

### "ERR_MODULE_NOT_FOUND: Cannot find package 'firebase-admin'"

Run: `npm install firebase-admin dotenv`

### "Missing VITE_FIREBASE_PROJECT_ID in .env file"

Make sure your `.env` has `VITE_FIREBASE_PROJECT_ID`:

```env
VITE_FIREBASE_PROJECT_ID=rada-b60ad
```

### "PERMISSION_DENIED" or "UNAUTHENTICATED" errors

This means the `GOOGLE_APPLICATION_CREDENTIALS` is not set or invalid:

1. Download a fresh Firebase service account key from Firebase Console
2. Set the environment variable properly:
   - **PowerShell:** `$env:GOOGLE_APPLICATION_CREDENTIALS="path/to/firebase-key.json"`
   - **CMD:** `set GOOGLE_APPLICATION_CREDENTIALS=path/to/firebase-key.json`
   - **Bash:** `export GOOGLE_APPLICATION_CREDENTIALS="/path/to/firebase-key.json"`

### "firebase_admin_1.default.initializeApp is not a function"

Make sure you're using the correct Firebase Admin import and initialization.

## Best Practices

1. **Always test with `--user-id` first** before using `--all`
2. **Back up your Firestore** before running destructive scripts
3. **Keep firebase-key.json out of version control** - never commit it
4. **Use .gitignore to protect sensitive files**
5. **Test in development first** before running on production
6. **Rotate service account keys periodically**

## Example Workflow

```bash
# 1. Download Firebase service account key
# Go to Firebase Console → Project Settings → Service Accounts → Generate New Private Key

# 2. Set environment variable
$env:GOOGLE_APPLICATION_CREDENTIALS="firebase-key.json"

# 3. Test the script
npx ts-node scripts/clearTemplatePurchases.ts --help

# 4. Clear a specific user's purchases for testing
npx ts-node scripts/clearTemplatePurchases.ts --user-id "test-user-123"

# 5. Verify the changes in Firebase Console
```

## Security Notes

⚠️ **Never commit service account keys to version control!**

The scripts use Firebase Admin SDK which requires authentication. The service account key is sensitive and should:
- Never be committed to git
- Never be shared publicly
- Only be used in server-side environments
- Be rotated periodically
- Be stored securely

Keep your `.gitignore` updated with:
```
firebase-key.json
google-application-credentials.json
.env
.env.local
```
