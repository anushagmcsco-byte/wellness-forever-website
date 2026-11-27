# Security Specification — Wellness Forever Pharmacy

## 1. Data Invariants
1. **Master Gate & Zero-Trust Default**: Every path under `/databases/{database}/documents` defaults to `allow read, write: if false;`.
2. **PII Isolation**: User profiles (`/users/{userId}`), medicine orders (`/orders/{orderId}` containing phone, address, and uploaded prescription), and contact enquiries (`/enquiries/{enquiryId}`) are strictly readable only by the owning authenticated user (`userId == request.auth.uid`) or a verified Admin.
3. **Immutable Ownership & Timestamps**: `userId`, `createdByUid`, and `createdAt` cannot be modified after creation. All `createdAt` and `updatedAt` timestamps must match `request.time`.
4. **Booking State Integrity**: Customers can only create orders with `status == 'pending_approval'`. Only a verified Admin can transition an order to `'approved'`, `'rejected'`, or `'dispatched'`.
5. **Email Verification Gate**: All authenticated writes require `request.auth.token.email_verified == true`.
6. **No Shadow Fields / Bounded Payloads**: Every `create` verifies `keys().hasAll(...) && keys().hasOnly(...)` and every `update` enforces `affectedKeys().hasOnly(...)` plus `isValid[Entity]()`. Strings and lists have strict `.size()` limits (prescription data URL capped at 550,000 chars; order `items` array capped at 25 entries).
7. **Zero DB Lookups in List Queries**: `allow list` rules strictly evaluate `resource.data` and token claims (`isBootstrappedAdmin()`), never invoking `get()` or `exists()`.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unverified Email Spoof**: User with `{ email: 'anusha.gmcsco@gmail.com', email_verified: false }` attempts to approve an order -> `PERMISSION_DENIED`.
2. **Self-Approval State Shortcut**: Customer creates an order in `/orders/{orderId}` with `status: 'approved'` -> `PERMISSION_DENIED`.
3. **Customer Order Tampering**: Customer updates their own order to change `status` to `'approved'` or `totalAmount` to `0.01` -> `PERMISSION_DENIED`.
4. **Shadow Field Injection**: Customer includes `isAdmin: true` or `discountOverride: 100` in order creation -> `PERMISSION_DENIED`.
5. **Identity Spoofing**: User A creates an order or enquiry with `userId: 'user_B'` -> `PERMISSION_DENIED`.
6. **ID Poisoning**: Attacker targets `/orders/` with a 500-character invalid ID containing `$` or `/` -> `PERMISSION_DENIED`.
7. **Denial of Wallet (1MB Prescription String)**: User submits `prescriptionDataUrl` exceeding 550,000 characters -> `PERMISSION_DENIED`.
8. **Unbounded Array Attack**: User submits `items` array with 30 items or invalid element type -> `PERMISSION_DENIED`.
9. **Client Timestamp Forgery**: User submits `createdAt` set to a past date instead of `request.time` -> `PERMISSION_DENIED`.
10. **PII Cross-Read**: User B tries to `get` or `list` User A's `/orders/{orderId}` or `/enquiries/{enquiryId}` -> `PERMISSION_DENIED`.
11. **Non-Admin Catalog Mutate**: Customer tries to create or edit `/medicines/{medicineId}` or `/blogs/{blogId}` -> `PERMISSION_DENIED`.
12. **Customer Forged Admin Notification**: Customer tries to create a notification with `targetRole: 'customer'` addressed to another user -> `PERMISSION_DENIED`.
