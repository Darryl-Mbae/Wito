# Clear Template Purchases Script

## Overview

This script removes all template marketplace purchases from your database. It's useful for testing/resetting user stats to 0 sales and 0 revenue.

## What It Does

### Clears:
- ✅ All "template-purchase" transactions (buyer side - money spent)
- ✅ All "sale" transactions (seller side - money earned)
- ✅ Seller earnings/credits from template sales
- ✅ Sales count and revenue on seller dashboard

### Keeps:
- ✅ Templates in marketplace (products stay)
- ✅ Credit purchase transactions
- ✅ Other transaction types (withdrawals, etc.)
- ✅ User account data
- ✅ Template ownership records

## Usage

### Clear purchases for one buyer (user spent money)

```bash
npx ts-node scripts/clearTemplatePurchases.ts --user-id "buyer123"
```

### Clear sales for one seller (user earned money)

```bash
npx ts-node scripts/clearTemplatePurchases.ts --seller-id "seller456"
```

### Clear ALL template purchases from ALL users

```bash
npx ts-node scripts/clearTemplatePurchases.ts --all
```

⚠️ **Warning**: The `--all` flag is destructive. Use with caution!

## Setup

Before running, configure your Firebase service account credentials in `.env`:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@...iam.gserviceaccount.com
FIREBASE_CLIENT_ID=123456789
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
```

Get these from your Firebase project:
1. Go to Firebase Console → Project Settings
2. Service Accounts tab
3. Generate new private key (if needed)
4. Copy the JSON values to `.env`

## Examples

### Example 1: Reset a user to 0 sales

User `uid:abc123` sold some templates and now has revenue. Reset them:

```bash
npx ts-node scripts/clearTemplatePurchases.ts --seller-id "abc123"
```

**Result:**
- Sales count: 0
- Revenue: 0 KES
- All "sale" transactions deleted
- Credits adjusted down by earned amount

### Example 2: Clear test purchases

You purchased templates as `uid:test456` for testing. Remove those purchases:

```bash
npx ts-node scripts/clearTemplatePurchases.ts --user-id "test456"
```

**Result:**
- All template purchases removed from transaction history
- "template-purchase" transactions deleted
- Seller didn't get any credits for these (removed on seller side too)

### Example 3: Full reset for testing

Clear ALL template activity across the entire system:

```bash
npx ts-node scripts/clearTemplatePurchases.ts --all
```

**Result:**
- Every user's template purchases removed
- Every seller's template sales removed
- All seller earnings reset
- Transaction history cleaned
- Seller dashboard shows 0 sales, 0 revenue

## Output Example

```
🔔 Initializing Firebase...

🗑️  Clearing template sales for seller: abc123xyz

✅ Summary:
   Template sales deleted: 5
   Credits reset: 400 KES

✨ Done!
```

## Troubleshooting

### "Missing required Firebase environment variables"

Make sure you have `.env` file with all Firebase service account credentials.

Check `.env.example` for the required fields.

### "Permission denied" error

Your Firebase service account might not have permission. Make sure:
1. The private key is valid
2. Service account has Firestore read/write permissions
3. No firestore rules are blocking admin access

### Script runs but doesn't delete anything

Possible reasons:
- User ID doesn't exist
- No template purchases for that user
- Wrong transaction type name (check Firestore directly)

## Safety Notes

- ✅ This script is **safe** - it only affects template transactions
- ✅ It **doesn't delete** templates themselves
- ✅ It **doesn't delete** user accounts
- ⚠️ The `--all` flag is destructive and non-reversible
- 💡 Consider backing up your Firestore before using `--all`

## See Also

- `clearTransactionsAndSales.ts` - Clears ALL transaction types for a user
- `CLEAR_TRANSACTIONS.md` - Documentation for clearing all transactions
