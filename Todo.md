MASTER PROMPT — REBUILD, DEBUG AND PRODUCTION-HARDEN “AASHRAYA”

CUSAT Student Blood Donation Platform

You are an expert full-stack engineer, product architect, UI/UX designer, Supabase engineer and QA engineer.

Your task is to fully inspect, debug, rebuild and production-harden the existing blood-donation application in:

https://github.com/Com-Adarsh/blooddonation

The final product must be a professional CUSAT student blood-donation platform called:

AASHRAYA

CUSAT BLOOD DONATION CELL

Do NOT simply apply the existing "aashraya-frontend-patch.md".

The existing implementation contains partial work and mismatches. Treat the current repository as a starting point, perform a complete technical audit, and then rebuild the application into one coherent production-ready system.

---

1. REFERENCE SOURCES

Use these references to understand the intended product.

Primary existing project

Repository:

https://github.com/Com-Adarsh/blooddonation

This is the repository that must ultimately contain the rebuilt application.

Preserve useful existing functionality, but do not assume that the existing implementation is correct.

---

Blood donation UX/functionality reference

Repository:

https://github.com/Amine-Smahi/Blood-Donation

Study this repository as a functional reference for the blood-donation workflow.

Extract the useful product concepts:

- donor discovery
- blood-group filtering
- donor/location-oriented search
- donor profiles
- blood requests
- connection between requester and donor
- request status
- donor availability
- privacy-oriented contact handling
- notification-oriented workflow
- simple, understandable blood-donation UX

DO NOT copy its source code.

DO NOT copy its original branding, text, assets or proprietary content.

Reimplement the useful functionality using the current project's own architecture.

The source repository is an older Android/Java/XML project and explicitly has unfinished API/application-logic areas, so do not blindly reproduce its architecture.

---

Aashraya reference website

https://aashraya-cusat.vercel.app/

Study the live website for:

- Aashraya branding
- logo
- visual identity
- registration intent
- donor registration fields
- CUSAT-specific context

The current Aashraya registration page contains:

- Full Name
- Phone Number
- Blood Group
- Weight
- Height
- Date of Birth
- Emergency Availability
- District
- Address
- Department / College
- Expected Passing Date

Preserve these requirements in the new application where appropriate.

Use the Aashraya name and the official Aashraya logo requested by the project owner.

---

2. REPLICA-STYLE WORKFLOW

Follow this workflow strictly:

PHASE 1 — RECON

Before changing code:

1. Inspect the entire "Com-Adarsh/blooddonation" repository.
2. Inspect:
   - package.json
   - source files
   - Supabase migrations
   - README
   - architecture.md
   - recon.md
   - frontend patch
   - public assets
   - environment configuration
3. Inspect the complete Git history where useful.
4. Identify the actual current database schema.
5. Identify all Supabase RPC functions.
6. Identify all tables.
7. Identify all RLS policies.
8. Identify frontend/backend function mismatches.
9. Identify dead code.
10. Identify preview/demo logic.
11. Identify broken imports.
12. Identify missing migrations.
13. Identify missing environment variables.
14. Identify deployment assumptions.
15. Identify accessibility and mobile issues.
16. Identify security problems.

Do not make assumptions based only on README files.

The actual code and database migrations are authoritative.

---

3. CURRENT KNOWN PROBLEMS TO INVESTIGATE

The current repository appears to contain several inconsistencies.

Audit and fix all of them rather than assuming the previous patch solved them.

Problem A — Frontend/backend mismatch

The frontend currently calls functions such as:

- "registerDonor"
- "addBloodRequest"
- "getDonors"
- "getDonorContact"

The backend and database must expose exactly compatible interfaces.

Create a single consistent contract.

---

Problem B — Aashraya fields are incomplete

The frontend patch attempts to add:

- DOB
- weight
- height
- district
- address
- expected passing date
- availability

But these fields must exist consistently across:

Frontend → validation → backend → database → RPC → coordinator UI.

No field may exist only in the frontend.

---

Problem C — Blood request schema

The application calls:

"blood_requests"

Verify that this table actually exists in the current Supabase migrations.

If it does not, create it properly.

It must support at minimum:

- id
- requester_user_id
- blood_group
- urgency
- needed_by
- district
- location
- note
- status
- created_at
- updated_at

Add appropriate indexes and RLS.

---

Problem D — Private donor information

Sensitive donor information MUST NOT appear in the public donor directory.

Sensitive fields include:

- phone
- email
- date of birth
- address
- weight
- height
- expected passing date

Public donor cards should show only safe information such as:

- first name / anonymized display name
- blood group
- department
- study year
- campus area
- district
- availability

Private details should only be accessible through authorized coordinator workflows and, where appropriate, the donor themselves.

---

Problem E — Coordinator access

Implement a proper coordinator role.

Do not rely on frontend-only authorization.

Coordinator authorization must be enforced by Supabase/RLS/RPC.

Coordinator capabilities:

- view donor requests
- view blood-support requests
- approve/decline requests
- mark requests fulfilled/closed
- view private donor contact information when necessary
- deactivate donor profiles
- review donor details
- see request history
- manage active/inactive donor status

Every sensitive contact lookup should be auditable.

---

4. AUTHENTICATION

Use Supabase Auth.

Preferred flow:

Student

1. Open Aashraya.
2. Sign in using CUSAT/institution-approved email.
3. Receive secure authentication link/OTP.
4. Return to the application.
5. Access donor directory and request features.
6. Register/update donor profile.

Do NOT store passwords manually.

Do NOT create a custom password system.

Do NOT put service-role keys in frontend code.

Do NOT expose private Supabase credentials through "VITE_" variables.

Use only the publishable/anon-safe key in the browser.

---

5. CUSAT EMAIL VALIDATION

Implement configurable institution email validation.

Do not hard-code a domain unless the actual approved CUSAT student email domain is verified.

Create a configuration such as:

"ALLOWED_EMAIL_DOMAINS"

The system should support future adjustment by the administrator.

If email-domain restriction cannot safely be confirmed, fail safely by allowing coordinator-controlled verification rather than blocking legitimate students incorrectly.

---

6. DONOR REGISTRATION

Create a polished multi-section registration experience.

Fields:

Personal

- Full name
- Date of birth
- Phone
- Email

Blood information

- Blood group
- Weight
- Height

CUSAT information

- Department
- Study year
- Campus area
- District
- Expected passing date

Availability

Options:

- Anytime / Emergency
- Daytime only
- Weekends only

Address

Private address field.

Consent

Require explicit consent explaining:

- information is used for blood-donation coordination
- contact details are private
- medical eligibility is determined by healthcare professionals
- donor can deactivate availability

---

7. AGE VALIDATION

Donors must be at least 18.

Do not use an approximate "365.25" calculation as the only validation.

Implement proper calendar-based age validation.

Reject:

- future DOB
- invalid DOB
- age below 18

Display a clear error.

---

8. DONOR PROFILE

Create donor profiles with:

- anonymized/public display name
- blood group badge
- department
- study year
- campus
- district
- availability
- active status

Example public card:

Akhil R.
A+

Department of Statistics · 2nd Year

CUSAT Main Campus · Ernakulam

Available: Anytime / Emergency

[Request Connection]

Never show phone/email/address publicly.

---

9. DONOR SEARCH

Implement:

Blood group filter

- All
- A+
- A-
- B+
- B-
- AB+
- AB-
- O+
- O-

District filter

All Kerala districts.

Campus area filter

Use database-driven campus areas.

Search

Search:

- donor display name
- department
- study year
- campus area
- district

Availability filter

Allow users to find donors based on availability.

Results

Show:

- number of matching donors
- empty state
- loading state
- error state

Use debounced search where appropriate.

---

10. BLOOD SUPPORT REQUEST

Add a dedicated:

“Need Blood Support?”

flow.

Fields:

- Blood group required
- Urgency
- Needed-by date
- District
- Location / hospital area
- Short context

Do NOT request unnecessary patient-identifying information.

Explicitly warn users:

“Do not enter patient names, medical records or unnecessary personal information.”

For immediate emergencies:

“Contact the hospital/emergency services directly.”

The platform must never claim that it provides emergency medical dispatch.

---

11. CONNECTION REQUEST

When a student finds a donor:

1. Click “Request Connection”.
2. Show donor summary.
3. Do not reveal phone number.
4. Allow short note.
5. Select urgency.
6. Submit request.
7. Create a request record.
8. Notify/route to coordinator.
9. Coordinator reviews request.
10. Coordinator can approve/decline.
11. Only then should private contact routing occur according to the configured workflow.

Prevent duplicate active requests between the same requester and donor.

---

12. REQUEST STATUS

Use clear states:

- Pending
- Accepted
- Declined
- Closed

Optionally:

- Fulfilled
- Expired

The status must be reflected consistently in:

- student activity
- coordinator dashboard
- notifications

---

13. DONOR AVAILABILITY

Allow donors to:

- activate profile
- deactivate profile
- update availability

Inactive donors must disappear from public search.

Add an optional reconfirmation/expiry mechanism so old donor availability does not remain indefinitely.

---

14. COORDINATOR DASHBOARD

Create a professional coordinator dashboard.

Sections:

Overview

- Active donors
- Pending connection requests
- Pending blood-support requests
- Active blood groups
- Recent activity

Donor management

- Search donors
- Filter blood group
- Filter district
- Filter department
- Active/inactive
- View private details where authorized
- Deactivate donor

Connection requests

Display:

- donor
- blood group
- requester
- urgency
- date
- status
- note

Actions:

- Approve
- Decline
- Close

Blood-support requests

Display:

- blood group
- urgency
- needed-by date
- district
- location
- status

Actions:

- Approve
- Decline
- Close

---

15. DATABASE ARCHITECTURE

Use Supabase PostgreSQL.

Design a clean schema rather than accumulating patches.

Suggested tables:

student_donors

- id
- user_id
- display_name
- blood_group
- department
- study_year
- campus_area_id
- district
- availability
- consent_at
- is_active
- created_at
- updated_at

private.donor_contacts

- donor_id
- email
- phone
- date_of_birth
- weight_kg
- height_cm
- address
- expected_passing_date
- updated_at

campus_areas

- id
- name
- active
- created_at

connection_requests

- id
- donor_id
- requester_user_id
- request_blood_group
- urgency
- note
- status
- created_at
- updated_at

blood_requests

- id
- requester_user_id
- blood_group
- urgency
- needed_by
- district
- location
- note
- status
- created_at
- updated_at

private.coordinators

- user_id
- created_at

audit_logs

For sensitive coordinator operations.

At minimum:

- id
- actor_user_id
- action
- entity_type
- entity_id
- created_at
- metadata

Do not store unnecessary sensitive information inside logs.

---

16. SUPABASE SECURITY

Enable RLS on every user-facing table.

Never rely only on frontend checks.

Students can:

- read permitted public donor information
- manage their own donor profile
- create their own requests
- read their own requests

Students cannot:

- read other donors' phone numbers
- read other donors' addresses
- read private donor details
- modify another donor
- modify coordinator status

Coordinators can perform authorized moderation operations.

Private schema must remain protected.

Do not expose service-role credentials.

---

17. RPC FUNCTIONS

Create secure RPC functions where direct table access is inappropriate.

Examples:

"register_my_donor()"

"get_my_private_profile()"

"coordinator_contact_for_donor()"

"deactivate_donor()"

"is_campus_coordinator()"

"update_request_status()"

Use:

- "security definer" only where justified
- fixed "search_path"
- explicit authorization
- minimal returned columns

Do not create insecure RPC functions that bypass RLS for arbitrary users.

---

18. NOTIFICATIONS

Implement a notification architecture.

Minimum viable approach:

Email notification

When a request is submitted:

- notify coordinator

When coordinator accepts:

- notify requester/donor according to privacy rules

When request status changes:

- notify relevant user

Use Supabase Edge Functions or another secure server-side mechanism.

Never send private donor contact details to arbitrary users.

Build notification logic so that another provider can be added later.

---

19. DESIGN

The visual identity should be:

AASHRAYA

CUSAT BLOOD DONATION CELL

Use the Aashraya logo from the supplied Aashraya reference.

Design language:

- professional
- humanitarian
- trustworthy
- modern
- clean
- student-friendly
- mobile-first

Use a restrained blood-red + white + dark-neutral palette.

Avoid:

- excessive gradients
- childish illustrations
- generic hospital stock imagery
- clutter
- huge unnecessary animations

---

20. RESPONSIVE UI

The application must work properly at:

- 320px
- 375px
- 390px
- 412px
- 768px
- 1024px
- 1280px+
- desktop widescreen

Test:

- Android Chrome
- desktop Chrome
- Safari-like mobile viewport
- keyboard navigation

Forms must never overflow horizontally.

Dialogs must become full-screen/mobile sheets when appropriate.

---

21. ACCESSIBILITY

Implement:

- semantic HTML
- labels
- keyboard navigation
- focus management
- visible focus states
- ARIA only when necessary
- accessible dialogs
- accessible form errors
- sufficient contrast
- screen-reader-friendly status messages

Do not use clickable "<div>" elements where buttons/links should be used.

---

22. REMOVE DEMO CONFUSION

The current application contains a preview mode with sample donors.

For the production build:

Do NOT make fake donors look real.

Choose one of these approaches:

Preferred

Production mode displays only real Supabase donor profiles.

If there are zero donors:

Show:

“No donors registered yet.”

Development

If demo mode is retained, it must be clearly controlled through an environment variable and visibly labeled.

Never accidentally deploy fake donor profiles as production data.

---

23. ERROR HANDLING

Every network operation needs:

- loading state
- success state
- error state
- retry option where appropriate

Never silently fail.

Use user-friendly messages.

Do not expose raw PostgreSQL/Supabase errors to normal users.

Example:

Instead of:

"duplicate key value violates unique constraint..."

show:

“This donor profile already exists for your account.”

---

24. FORM VALIDATION

Validate both frontend and backend.

Validate:

- required fields
- email
- phone
- DOB
- age
- weight
- height
- passing date
- blood group
- department
- district
- address length
- notes
- needed-by date

Never trust browser-side validation alone.

---

25. DATA PRIVACY

Treat donor data as sensitive.

Public directory:

SAFE:

- name
- blood group
- department
- study year
- district
- campus
- availability

PRIVATE:

- phone
- email
- DOB
- weight
- height
- address
- passing date

Do not put private information into:

- public API responses
- donor cards
- page source
- localStorage
- public URLs
- query strings
- analytics events

---

26. SECURITY AUDIT

Before completion, actively test:

- unauthenticated API access
- student accessing another student's profile
- student accessing private contacts
- student modifying another donor
- student changing request status
- coordinator privilege escalation
- RPC authorization
- RLS bypass
- service key exposure
- environment variable exposure
- XSS through notes/name/address
- SQL injection
- duplicate request creation
- duplicate donor creation

Fix every vulnerability discovered.

---

27. DATA INTEGRITY

Ensure:

- one donor profile per authenticated student
- no duplicate active connection requests
- no orphaned private contact records
- valid blood groups
- valid request statuses
- valid campus areas
- timestamps automatically maintained
- foreign keys correctly configured

Use transactions/RPC where multiple tables must be updated together.

---

28. MIGRATION CLEANUP

Do NOT tell the user to manually guess which migration files to run.

Create a clean migration sequence.

Review all existing migrations.

If necessary:

- consolidate
- rename
- add missing migration
- repair incompatible migrations

Document exactly:

1. fresh database setup
2. existing database upgrade
3. seed data
4. coordinator setup

Do not destroy existing production data.

If destructive migration is unavoidable, stop and explicitly document the migration risk before applying it.

---

29. ENVIRONMENT

Use:

".env.example"

Document:

"VITE_SUPABASE_URL"

"VITE_SUPABASE_PUBLISHABLE_KEY"

Any server-side secrets must NOT use "VITE_".

Never commit:

- ".env"
- service role key
- API secrets
- private tokens

---

30. VERCEL DEPLOYMENT

Make the repository deployable to Vercel.

Verify:

- build command
- output directory
- SPA routing
- environment variables
- Supabase redirect URLs
- production URL
- favicon
- logo
- asset paths

Do not assume that a root-level logo asset will work if the build expects "public/".

---

31. FIX CHARACTER ENCODING

The current source contains visible encoding corruption such as malformed characters.

Search the entire project for:

- "â"
- "€™"
- "â€“"
- "â†"
- "âˆ"
- other mojibake

Convert all source files to UTF-8.

Verify Malayalam/English text renders correctly.

---

32. LOGO

Use the Aashraya logo from:

https://aashraya-cusat.vercel.app/

Do not reference a remote image URL if it can be bundled locally.

Store the final logo under:

"public/"

Use an appropriate filename such as:

"public/aashraya-logo.*"

Verify that the logo works after a production Vite/Vercel build.

---

33. ARCHITECTURE CLEANUP

Do not leave business logic scattered throughout giant template strings.

If the current code is difficult to maintain, refactor into components/modules.

Suggested structure:

src/
components/
pages/
dialogs/
services/
lib/
auth/
coordinator/
donor/
requests/
styles/

Keep database logic separate from UI logic.

---

34. TESTING

Run:

"npm install"

Then:

"npm run build"

If a test suite exists, run it.

If not, add meaningful automated tests where practical.

At minimum test:

Auth

- sign in
- sign out
- session restore

Donor

- registration
- validation
- duplicate profile
- deactivate
- update

Search

- blood group
- district
- campus
- search
- no results

Requests

- connection request
- blood request
- duplicate request
- request status

Coordinator

- authorization
- queue
- approve
- decline
- close
- private contact access

Security

- RLS
- unauthorized access

---

35. BROWSER QA

After building, test the actual application.

Test:

1. Landing page
2. Sign-in
3. Donor registration
4. Donor directory
5. Search
6. Blood group filtering
7. District filtering
8. Request connection
9. Need blood support
10. My activity
11. Coordinator login
12. Coordinator queue
13. Private contact access
14. Donor deactivation
15. Mobile navigation
16. Mobile forms
17. Error states
18. Empty states
Logout
Refresh/session persistence
Do not stop at npm run build.
A successful build does NOT mean the application works.
36. PRODUCTION DATA MODE
The final deployed application must behave as a real application.
Do not leave language such as:
“Preview only”
“Nothing is sent”
“Sample data”
unless the application is intentionally running in development/demo mode.
Production should use Supabase.
37. UX IMPROVEMENTS
Make the product feel like a real CUSAT service rather than a coding demo.
Landing page:
AASHRAYA
“CUSAT students, here for each other.”
Primary actions:
[Find a donor]
[Register as donor]
Secondary:
[Need blood support]
[How it works]
Include a concise privacy/safety statement.
38. IMPORTANT MEDICAL SAFETY
Aashraya is a connection and coordination platform.
Do NOT:
determine medical eligibility
promise donor compatibility
guarantee blood availability
claim emergency dispatch
replace medical professionals
provide medical diagnosis
Clearly state that medical eligibility and transfusion decisions belong to qualified medical professionals.
39. CLEAN-ROOM IMPLEMENTATION RULE
Use the reference applications to understand:
workflows
information architecture
useful features
interaction patterns
Do not copy:
source code
proprietary backend
private data
original user accounts
original API credentials
private content
unrelated copyrighted assets
The final application must be an independent implementation.
40. FINAL ACCEPTANCE CRITERIA
The rebuild is NOT complete until all of these are true:
[ ] Application builds successfully
[ ] No JavaScript console errors
[ ] No broken imports
[ ] No mojibake/encoding corruption
[ ] Aashraya branding works
[ ] Logo loads in production
[ ] Supabase authentication works
[ ] Student session persists
[ ] Donor registration works
[ ] Donor fields are stored correctly
[ ] Private fields are protected
[ ] Public donor directory works
[ ] Blood group filters work
[ ] District filtering works
[ ] Campus filtering works
[ ] Search works
[ ] Connection requests work
[ ] Blood-support requests work
[ ] Needed-by date works
[ ] Request statuses work
[ ] My activity works
[ ] Coordinator authorization works
[ ] Coordinator queue works
[ ] Coordinator can approve/decline/close
[ ] Coordinator contact access is protected
[ ] Donor deactivation works
[ ] RLS is verified
[ ] No service-role key is exposed
[ ] No fake production donors
[ ] Mobile UI works
[ ] Desktop UI works
[ ] Accessibility basics pass
[ ] Error states work
[ ] Empty states work
[ ] Vercel build works
[ ] Production assets work
[ ] Supabase redirect configuration is documented
[ ] Fresh database setup is documented
[ ] Existing database migration path is documented
41. FINAL DELIVERABLE
After completing the rebuild, provide a concise technical report containing:
A. What was wrong
List every important bug/mismatch discovered.
B. What was rebuilt
List frontend, backend, database and security changes.
C. Database changes
List every migration/table/RPC/RLS change.
D. Authentication
Explain the final authentication architecture.
E. Security
Explain how private donor information is protected.
F. Testing
Report:
build result
tests run
browser QA
responsive QA
security checks
G. Deployment
Provide exact Vercel and Supabase configuration steps.
H. Remaining limitations
Only list genuine remaining limitations.
Do not claim something is working unless it was actually tested.
MOST IMPORTANT INSTRUCTION
Do NOT make another superficial patch.
Do NOT merely modify aashraya-frontend-patch.md.
Do NOT assume the existing migrations are correct.
Do NOT assume the existing frontend/backend contract is correct.
Inspect → diagnose → redesign architecture where necessary → implement → migrate → build → test → security audit → fix → test again.
The final result must be a coherent, production-ready:
AASHRAYA
CUSAT BLOOD DONATION CELL
for CUSAT students, combining the strongest functional concepts from the blood-donation reference with the Aashraya identity and the existing Supabase foundation.
