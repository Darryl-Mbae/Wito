# Notification Management Scripts

These scripts allow you to send notifications to organizations and sellers without exposing sensitive logic in the UI.

## Files

- **`sendNotifications.ts`** — Core notification logic
- **`manageNotifications.ts`** — Admin manager interface
- **`notificationsCLI.ts`** — CLI runner for backend/scheduled tasks

## Quick Start

### From React Code

```typescript
import { NotificationManager } from 'src/scripts/manageNotifications'

// Broadcast to all users
await NotificationManager.broadcastFeature(
  'New Template Editor',
  'We redesigned the template editor for better performance'
)

// Notify seller about sale
await NotificationManager.notifyTemplateSold(
  sellerUserId,
  'Birthday Invitation Template',
  500 // KES amount
)

// Send announcement to specific orgs
await NotificationManager.announce(
  ['org1', 'org2', 'org3'],
  'Marketplace Maintenance',
  'We will be down for 30 minutes on Saturday'
)

// Alert single org about billing
await NotificationManager.alertBilling(
  'org123',
  'Your credits are running low. Consider buying more.'
)

// Welcome new seller to marketplace
await NotificationManager.welcomeToMarketplace(
  'org123',
  'Your Company Name'
)
```

### From CLI / Node Script

```bash
# Broadcast announcement to all users
npx ts-node src/scripts/notificationsCLI.ts \
  --type=all \
  --template=announcement \
  --title="Maintenance Window" \
  --message="The marketplace will be down Saturday 10pm-11pm UTC"

# Notify seller about template sale
npx ts-node src/scripts/notificationsCLI.ts \
  --type=seller \
  --userId=seller_user_id \
  --template=templateSold \
  --templateName="Event Flyer" \
  --amount=500

# Send to batch of orgs
npx ts-node src/scripts/notificationsCLI.ts \
  --type=batch \
  --orgIds=org1,org2,org3 \
  --template=announcement \
  --title="New Feature" \
  --message="Check out our new dashboard!"

# Alert about billing
npx ts-node src/scripts/notificationsCLI.ts \
  --type=single \
  --orgId=org123 \
  --template=billing \
  --message="Your trial expires in 7 days"

# Welcome new seller
npx ts-node src/scripts/notificationsCLI.ts \
  --type=single \
  --orgId=org123 \
  --template=welcome \
  --orgName="Creative Events Inc"
```

## API Reference

### `sendNotifications.ts`

#### `sendNotificationToOrg(orgId, payload)`

Send a single notification to one organization.

```typescript
await sendNotificationToOrg('org123', {
  category: 'announcement',
  from: 'Wito',
  subject: 'Hello!',
  preview: 'This is a test notification'
})
```

#### `sendNotificationToOrgs(orgIds, payload)`

Send the same notification to multiple organizations.

```typescript
const result = await sendNotificationToOrgs(
  ['org1', 'org2', 'org3'],
  payload
)
// { success: 3, failed: 0 }
```

#### `sendNotificationToAll(payload)`

Broadcast to all organizations in the system.

```typescript
const result = await sendNotificationToAll(payload)
```

#### `sendNotificationToSeller(userId, payload)`

Send notification to all organizations owned by a user.

```typescript
await sendNotificationToSeller('user123', payload)
```

#### `NOTIFICATION_TEMPLATES`

Pre-built templates for common notifications:

- `welcomeToMarketplace(orgName)`
- `templateSold(templateName, amount)`
- `newFeature(featureName, description)`
- `billingAlert(message)`
- `announcement(title, message)`

### `manageNotifications.ts`

#### `NotificationManager.*` helpers

Convenience methods for common scenarios:

- `notifyTemplateSold(sellerUserId, templateName, amount)`
- `broadcastFeature(featureName, description)`
- `announce(orgIds, title, message)`
- `alertBilling(orgId, message)`
- `welcomeToMarketplace(orgId, orgName)`
- `sendCustom(request)` — Send any custom notification

## Notification Types

### Categories

- `subscription` — Plans & Billing (purple)
- `update` — What's New (green)
- `announcement` — General announcements (gray)
- `sale` — Sales & Revenue (amber)

### Structure

Each notification has:

- **category** — One of the above types
- **from** — Who sent it (e.g., "Billing", "Marketplace", "Wito")
- **subject** — Main title
- **preview** — Short description (shown in list)
- **time** — Auto-set to current timestamp
- **read** — Auto-set to false

## Storage

Notifications are stored in Firebase under:

```
organizations/{orgId}/notifications/{notificationId}
```

Each notification document contains:

```typescript
{
  category: 'announcement',
  from: 'Wito',
  subject: 'Hello!',
  preview: '...',
  read: false,
  createdAt: Timestamp
}
```

## Security Notes

1. **Keep CLI scripts on backend** — Don't expose these to frontend bundle
2. **Use environment variables** — All Firebase config is loaded from `.env`
3. **Audit logs** — Consider logging who sent what and when in production
4. **Rate limiting** — Add limits if using from admin panel to prevent spam
5. **Permissions** — Only admins should have access to these functions

## Best Practices

✅ **Do:**
- Use pre-built templates when possible
- Test on a few organizations first before broadcasting to all
- Include clear, actionable preview text
- Use appropriate categories so users can filter

❌ **Don't:**
- Send duplicate notifications without checking if already sent
- Use overly long subject lines (truncates in list)
- Send marketing spam — use announcements wisely
- Expose these functions in unauthenticated routes

## Troubleshooting

**"Failed to fetch organizations"**
- Check Firebase credentials in `.env`
- Verify Firestore security rules allow reading organizations

**"Notification sent but not appearing"**
- Verify org has notifications subcollection (auto-created)
- Check that user is looking at correct organization
- Confirm read status in Firestore (should be `false`)

**"CLI command not found"**
- Make sure `ts-node` is installed: `npm install -D ts-node`
- Run from project root directory
- Check Node version (requires 14+)
