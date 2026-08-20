# Notification Scripts

These scripts allow you to send notifications to organizations programmatically via the command line. Perfect for sending announcements, maintenance alerts, promotional messages, and more to your users.

## Setup

### 1. Install Dependencies

The scripts require `ts-node` and `dotenv`. They should already be in your project, but if not:

```bash
npm install --save-dev ts-node dotenv firebase-admin
```

### 2. Get Firebase Admin Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** > **Service Accounts**
4. Click **Generate New Private Key**
5. This downloads a JSON file with your credentials

### 3. Set Up Environment Variables

Copy the `.env.example` file:

```bash
cp scripts/.env.example scripts/.env
```

Then open `scripts/.env` and fill in your Firebase credentials from the JSON file:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project-id.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
```

**⚠️ Important:** 
- Keep your `.env` file private and add it to `.gitignore`
- Replace actual newlines in the private key with `\n` characters
- Never commit `.env` to version control

### 4. Add to `.gitignore`

Make sure your `.gitignore` includes:

```
scripts/.env
```

## Usage

### Single Notification

Send a notification to a single organization:

```bash
npx ts-node scripts/sendNotifications.ts \
  --org-id "your-org-id" \
  --category "announcement" \
  --from "System" \
  --subject "Your subject here" \
  --preview "Your preview text here"
```

#### Options

- `--org-id` (required): The organization ID from Firestore
- `--category` (optional, default: "announcement")
  - Valid values: `subscription`, `update`, `announcement`, `sale`
- `--from` (optional, default: "System"): Who the notification is from
- `--subject` (required): Notification subject
- `--preview` (required): Preview/body text

#### Examples

```bash
# Maintenance alert
npx ts-node scripts/sendNotifications.ts \
  --org-id "club-123" \
  --category "announcement" \
  --from "System" \
  --subject "Scheduled Maintenance Tonight" \
  --preview "Platform will be down for 30 minutes starting at 2 AM UTC"

# Feature announcement
npx ts-node scripts/sendNotifications.ts \
  --org-id "club-456" \
  --category "update" \
  --from "What's new" \
  --subject "Event Check-in Now Available" \
  --preview "Attendees can check in with QR codes. Generate them from event details."

# Promotional message
npx ts-node scripts/sendNotifications.ts \
  --org-id "club-789" \
  --category "sale" \
  --from "Marketplace" \
  --subject "50% Off Premium Templates" \
  --preview "Limited weekend offer on all design templates"
```

### Batch Notifications

Send notifications to multiple organizations at once:

```bash
npx ts-node scripts/sendBatchNotifications.ts --file notifications.json
```

#### Batch File Format

Create a JSON file (e.g., `notifications.json`):

```json
{
  "notifications": [
    {
      "orgId": "org-1",
      "category": "announcement",
      "from": "System",
      "subject": "Scheduled Maintenance",
      "preview": "Platform will be unavailable for 30 minutes on Sunday at 2 AM UTC"
    },
    {
      "orgId": "org-2",
      "category": "update",
      "from": "What's new",
      "subject": "Event Check-in Feature",
      "preview": "Generate QR codes for event check-in from event details page"
    },
    {
      "orgId": "org-3",
      "category": "sale",
      "from": "Marketplace",
      "subject": "Summer Sale",
      "preview": "30% off all templates. Use code SUMMER30"
    }
  ]
}
```

Then run:

```bash
npx ts-node scripts/sendBatchNotifications.ts --file notifications.json
```

Use the provided `example-notifications.json` as a template:

```bash
npx ts-node scripts/sendBatchNotifications.ts --file scripts/example-notifications.json
```

## Notification Categories

Each notification has a category that determines how it appears in the UI:

| Category | Icon | Color | Use Case |
|----------|------|-------|----------|
| `subscription` | 💳 | Purple | Plans, billing, upgrade offers |
| `update` | 🔔 | Green | New features, improvements |
| `announcement` | 📢 | Gray | Maintenance, important info |
| `sale` | 💰 | Amber | Discounts, limited-time offers |

## Finding Organization IDs

To send notifications to specific organizations, you need their ID from Firestore:

1. Open Firebase Console > Firestore Database
2. Navigate to the `organizations` collection
3. Each organization document has an ID (shown in the left panel)
4. Use that ID in the `--org-id` parameter

## Troubleshooting

### "Missing required Firebase environment variables"

- Verify your `scripts/.env` file exists and has all required fields
- Check that paths use forward slashes and escape backslashes properly
- The private key should have `\n` for newlines, not actual line breaks

### "Invalid category"

Make sure you use one of: `subscription`, `update`, `announcement`, `sale`

### "Error sending notification: Permission denied"

- Verify your Firebase project ID is correct
- Make sure the service account email is authorized in your Firestore rules
- Check that the organization ID exists in Firestore

### Script doesn't find `ts-node`

Run: `npm install --save-dev ts-node`

## Security Notes

1. **Never commit `.env`** - Keep credentials private
2. **Rotate keys periodically** - Regenerate service account keys in Firebase Console
3. **Limit script usage** - Only run from trusted environments
4. **Audit notifications** - Monitor the notifications collection in Firestore
5. **Use environment variables** - Don't hardcode credentials

## Advanced: Programmatic Usage

You can also use these functions in your own Node.js code:

```typescript
import admin from "firebase-admin";

// Initialize Firebase (after setting up .env)
const db = admin.firestore();

// Send a notification
await db
  .collection("organizations")
  .doc("org-id")
  .collection("notifications")
  .add({
    category: "announcement",
    from: "System",
    subject: "Your subject",
    preview: "Your preview",
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
```

## Support

For issues or questions:
1. Check the examples above
2. Review your Firebase configuration
3. Verify organization IDs in Firestore
4. Check console output for error messages
