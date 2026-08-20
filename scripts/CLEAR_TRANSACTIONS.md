# Clear Transactions & Sales Script

This script clears all transaction and sales data for testing purposes. Perfect for resetting your dashboard while keeping your marketplace products available.

## What Gets Cleared

✅ **User Data:**
- All transactions (purchases, sales, credits)
- All notifications
- User credits reset to 0

✅ **Organization Data:**
- All organization transaction logs
- Transaction history per organization

## What Stays

✅ **Preserved:**
- All marketplace templates/products
- User account information
- Organization information
- Purchased template ownership records
- Template metadata

This way you can test the marketplace and transaction flows without any transaction history.

## Usage

### Quick Start

```bash
npx ts-node scripts/clearTransactionsAndSales.ts --user-id "your-user-id"
```

### Find Your User ID

You can find your user ID in:
1. Firebase Console > Authentication > Copy User ID
2. Or from the URL after logging in (check dev tools network tab)
3. Or from transaction logs in Firestore

### With Organization

The script automatically finds and clears all organizations the user belongs to.

### Example

```bash
# Replace with your actual Firebase User ID
npx ts-node scripts/clearTransactionsAndSales.ts --user-id "abc123xyz456"
```

## Output Example

```
🔔 Initializing Firebase...

📊 Clearing data for user: abc123xyz456

🗑️  Deleting user transactions...
   ✓ Deleted 5 transactions
🗑️  Deleting user notifications...
   ✓ Deleted 2 notifications
💰 Resetting user credits to 0...
   ✓ Credits reset
🗑️  Deleting organization transactions...
   ✓ Deleted 8 organization transactions

✅ Summary:
   Transactions cleared: 5
   Notifications cleared: 2
   Organization transactions cleared: 8
   Credits reset to: 0

💡 Templates in marketplace are still available for testing!

✨ Done!
```

## Environment Setup

Make sure your `.env` file in the scripts directory has Firebase credentials:

```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project-id.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
```

## Testing Workflow

1. **Publish templates** to marketplace
2. **Make purchases/sales** to test flows
3. **Run this script** to reset data
4. **Dashboard shows:** 0 sales, 0 income, 0 credits
5. **Marketplace still has:** All your templates
6. Repeat for testing

## Why This is Useful

- ✅ Test fresh dashboard views
- ✅ Verify transaction calculations reset properly
- ✅ Keep marketplace products for new test scenarios
- ✅ No need to republish templates
- ✅ Clean state for demo/screenshot purposes
- ✅ Reset seller stats while preserving inventory

## Safety Notes

- ⚠️ This clears real transaction data - use on test accounts only
- ✅ Marketplace products are preserved
- ✅ No permanent Firebase data is deleted from marketplace
- ✅ User account remains intact
