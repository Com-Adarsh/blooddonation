# Aashraya CUSAT — architecture

## Current prototype

- Web: semantic HTML, CSS, and browser JavaScript so the preview runs without a build step.
- Data: clearly labeled in-memory sample profiles. Registration and request actions remain in the active browser session; the UI does not claim to contact real students.
- Deployment: any static host. Do not treat this prototype as a live donor registry.

## Production recommendation

- Frontend: Next.js + TypeScript on Vercel for routing and server-side authorization.
- Database/auth: Supabase Postgres and Supabase Auth, restricted to verified CUSAT addresses and coordinator-approved roles.
- Contact routing: server-side notification workflow to a CUSAT coordinator; never expose donor phone numbers in public search results.
- Notifications: opt-in email first; add SMS only after consent, operational ownership, and delivery costs are confirmed.

## Schema sketch

student_donors: UUID PK; verified_user_id (unique FK); display_name; private_email; private_phone; blood_group check over O/A/B/AB with Rh sign; department; study_year; campus_area; availability; consent_at; is_active; created_at; updated_at.

connection_requests: UUID PK; donor_id FK; requester_user_id FK; request_blood_group; urgency; note; status check over pending/accepted/declined/closed; created_at; updated_at. Store patient identifiers only if an approved operational workflow requires them.

campus_areas: UUID PK; name; active.

Indexes: donors(blood_group, campus_area, is_active), donors(verified_user_id), connection_requests(donor_id, status, created_at), connection_requests(requester_user_id, created_at).

Access rules: enable row-level security. Students can create and update only their own donor profile and requests. Only the assigned campus coordinator can read contact details or route requests. Public search returns a safe projection without email or phone. Audit sensitive coordinator access. Offer account deletion and donor availability opt-out.

## Routes and build order

| Method / route | Purpose | Access | Flow |
|---|---|---|---|
| GET /api/donors?bloodGroup=&area= | Return safe matching profiles | Verified campus member | F01 |
| POST /api/donors | Create/update donor profile | Verified student | F02 |
| POST /api/connection-requests | Create consented connection request | Verified student | F03 |
| GET /api/connection-requests | Show own request status | Requester / assigned coordinator | F03 |
| PATCH /api/connection-requests/:id | Coordinator updates status | Coordinator | F03 |

Milestones: (1) authentication and campus verification, (2) private donor profile and safe directory projection, (3) coordinator-mediated request flow, (4) consented notifications and audit logs.

## Constraints

Donor availability changes quickly; add expiry/reconfirmation. Keep contact information server-side. Rate-limit search and request creation. Requests must be idempotent. Do not infer clinical suitability or promise a donor match. Provide a visible emergency path to the user's hospital/local emergency services.
