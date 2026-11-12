# Aashraya CUSAT — product recon

## Scope

- Platform: responsive web app for CUSAT students.
- Core loop: find a compatible campus donor, request a connection, and let a student register as a donor.
- Sources:  the public [Aashraya CUSAT site](https://aashraya-cusat.vercel.app/).
- Clean-room note: this rebuild uses the reference app's general search, donor list, profile, and request patterns. Interface copy and implementation are new. The Aashraya logo is included because the user specifically asked for it.

## Source observations

The Blood-Donation repository describes an Android app intended to find donors by blood type and location, allow donor selection, and place or track a request. Its README explicitly lists application logic, a web API, and social sign-in as unfinished work. The public Android screens expose search filters, donor cards, request confirmation/status, and profile/account entry points. This establishes interaction patterns, not a production backend.

The Aashraya CUSAT page is a donor registration form under the Aashraya logo. Its current fields include name, phone, blood group, body measurements, date of birth, emergency availability, district, address, department/college, and expected passing date. The rebuild keeps the CUSAT identity and donation registration goal, and adapts the fields to a student campus directory.

## Screen inventory

| ID | Screen / state | Route | Purpose | Key components | States |
|---|---|---|---|---|---|
| S01 | Discover | / | Start donor search and explain campus workflow | Header, hero, blood group filters, location/search controls, donor cards, safety note | Default, filtered, no results, mobile |
| S02 | Donor registration | / dialog | Add a student donor profile | Accessible form, consent, submit confirmation | Empty, invalid, submitted |
| S03 | Connection request | / dialog | Ask a donor to connect without revealing private contact details | Donor summary, request note, confirmation | Empty, submitted |
| S04 | About / how it works | / anchor | Explain the three-step campus process and prototype status | Steps, privacy note, medical eligibility note | Default, mobile |

## Core flows

**F01 Find a donor** — S01: choose a blood group and optional campus area, enter a name/department search, review matching profiles, choose “Request connection”. Happy path: one search and one request action.

**F02 Register as a donor** — S01 → S02: enter student contact and campus details, choose blood group and availability, accept the consent/medical review note, submit. Contact details are not shown in the demo directory.

**F03 Request blood support** — S01: open the urgent-help dialog, select a blood group and provide a short non-identifying context, then view a local preview acknowledgement. A real deployment must route requests through the CUSAT Blood Donation Cell.

## Data model inferred for a future production service

- StudentDonor: id, display name, CUSAT email, phone, blood group, department, year, campus area, availability, consent status, active status, timestamps. Contact data is private and visible only to the authorized campus coordinator.
- ConnectionRequest: id, donor id, requester id/contact, blood group, urgency, short note, status, timestamps. A production system must protect requester and patient details and avoid making medical eligibility decisions.
- CampusArea: controlled set of campus locations/hostels.

Evidence: current Aashraya registration fields and the donor search/request/profile screens in the Android repository. Confidence: medium; the source app states that its API and application logic are not implemented.

## Out of scope

- The source app's user network, personal donor data, external accounts, private APIs, and original code/assets.
- Clinical eligibility decisions, blood inventory, hospital verification, emergency dispatch, and donor-to-patient medical matching. A healthcare professional must determine donor suitability.
- Production authentication, notifications, and data storage until a CUSAT-approved backend and privacy policy exist.

## Size

M for a production-ready campus service. This local web prototype covers the discovery, registration, and request interface with clearly marked demo data; verified student accounts, secure contact routing, moderation, and notifications remain backend work.
