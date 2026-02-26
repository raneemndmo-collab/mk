# Admin Knowledge Base — Monthly Key

> Last updated: 2026-02-26 | Version: 1.0

---

## 1. Roles & Permissions {#roles}

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| **Admin** | Full platform manager | All permissions: users, properties, bookings, settings, KB |
| **Staff** | Support team member | View users, manage bookings, reply messages, maintenance tickets |
| **Landlord** | Property owner | Add/edit own properties, accept/reject bookings, message tenants |
| **Tenant** | Renter | Search, book, request maintenance, message landlord |

### Managing Permissions
- Path: `/admin/permissions`
- Each role's permissions can be customized granularly
- Available permissions: MANAGE_USERS, MANAGE_PROPERTIES, MANAGE_BOOKINGS, MANAGE_CITIES, MANAGE_KNOWLEDGE, MANAGE_SETTINGS

---

## 2. Standard Operating Procedures (SOPs) {#sops}

### 2.1 Property Management {#property-management}

#### Adding a New Property
1. Landlord clicks "List Your Property" from the menu
2. Fills in bilingual data (Arabic + English):
   - Title and description
   - Type (Apartment/Villa/Studio/Duplex/Furnished Room/Compound/Hotel Apartment)
   - Monthly price and security deposit
   - Bedrooms, bathrooms, area
   - Amenities (parking, pool, gym, etc.)
   - House rules
3. Uploads photos (max 10 photos, each under 5MB)
4. Submits for review → Status: "Pending Review"
5. Admin reviews and approves or rejects with reason

#### Updating a Property
- Landlord edits from Dashboard → My Properties → Edit
- Major changes (price, photos) require re-review

#### Property Statuses
| Status | Description |
|--------|-------------|
| Draft | Not yet submitted for review |
| Pending | Awaiting admin approval |
| Active | Visible to tenants |
| Inactive | Temporarily hidden |
| Rejected | Rejected with reason |

### 2.2 Booking Management {#bookings}

#### Booking Lifecycle
1. Tenant requests booking → Status: "Pending"
2. Landlord approves or rejects
3. After approval → Tenant pays (deposit + first month + 5% service fee)
4. After payment → Status: "Confirmed"
5. At check-in → Status: "Active"
6. At checkout → Status: "Completed"

#### Cancellation
- Before landlord approval: Free cancellation
- After approval, before payment: Free cancellation
- After payment: Subject to contract terms

### 2.3 Emergency Maintenance Tickets {#emergency-maintenance}

#### Creating an Emergency Ticket
1. Path: `/admin/emergency-maintenance`
2. Select property and tenant
3. Choose category: Plumbing, Electrical, HVAC, Safety, Fire, Other
4. Set priority: Normal, Important, Urgent, Critical
5. Attach photos/video if needed
6. Assign maintenance technician

#### Ticket Tracking
| Status | Description |
|--------|-------------|
| Submitted | Ticket created |
| Acknowledged | Team received the ticket |
| In Progress | Technician working on fix |
| Completed | Issue resolved |
| Cancelled | Ticket cancelled |

### 2.4 Messaging Workflows {#messaging}

- Tenants and landlords communicate via internal messaging
- Path: `/messages`
- Admin can monitor all conversations
- Notifications sent automatically on new messages

### 2.5 WhatsApp Configuration {#whatsapp}

#### Enable/Disable
- Path: `/admin/settings` → WhatsApp tab
- Toggle WhatsApp floating button
- Set WhatsApp number
- Customize welcome message

#### Message Templates
- Property inquiry template
- Booking request template
- Maintenance request template

---

## 3. Troubleshooting {#troubleshooting}

### 3.1 Photos Not Showing {#photos-not-showing}
**Possible causes:**
- Image exceeds 5MB → Ask landlord to resize
- Unsupported format → Must be JPG, PNG, or WebP
- Broken image URL → Check S3/storage link
- Browser cache → Clear browser cache

**Resolution:**
1. Check image size and format
2. Try re-uploading the image
3. If persistent, check server logs

### 3.2 Filters Not Working {#filters-not-working}
**Possible causes:**
- No properties match filters → Broaden search criteria
- Database connection issue → Check server logs
- Stale cache → Clear browser cache

### 3.3 OTP Issues {#otp-issues}
**Possible causes:**
- Incorrect phone number → Verify with country code (+966)
- OTP provider down → Check SMS provider settings
- Expired OTP → Request new code (valid for 5 minutes)

### 3.4 Permission Issues {#permission-issues}
- Check user role at `/admin/permissions`
- Ensure required permission is enabled for the role
- For landlords, verify the property is registered under their account

---

## 4. Internal FAQ {#internal-faq}

### How to add a new city?
1. Edit `shared/service_areas.ts`
2. Add the city with its districts
3. Push changes → Railway auto-deploys

### How to update the knowledge base?
1. Edit `docs/kb/kb.ar.md` and `docs/kb/kb.en.md`
2. Push changes → Knowledge updates on deploy

### How to change the hero image/video?
1. Admin Dashboard → Settings → "Hero" tab
2. Choose background type (image or video)
3. Upload file or enter URL
4. Adjust overlay opacity
5. Save

### How to handle a tenant complaint?
1. Check booking and property details
2. Contact landlord via messages
3. If emergency maintenance, create an emergency ticket
4. Follow up until resolved and notify tenant

---

## 5. Response Templates {#response-templates}

### General Inquiry
> Hello! Thank you for contacting Monthly Key. How can we help you?

### Complaint Response
> We apologize for the inconvenience. We will follow up on your issue immediately and respond within 24 hours.

### Emergency Maintenance
> Your request has been received. Our maintenance team will contact you within one hour.

### Unavailable City
> We currently serve Riyadh only. Jeddah and Madinah are coming soon — we'll notify you upon launch.

---

## 6. Glossary {#glossary}

| Term | Definition |
|------|-----------|
| **Monthly Rent** | Rental contract for one or more months |
| **Security Deposit** | Refundable amount paid at booking, returned at checkout |
| **Service Fee** | 5% of rent paid to the platform |
| **OTP** | One-Time Password sent to phone for verification |
| **CMS** | Content Management System — platform settings |
| **KB** | Knowledge Base — this document |
| **SOP** | Standard Operating Procedure |
| **FAB** | Floating Action Button — WhatsApp/AI assistant |
