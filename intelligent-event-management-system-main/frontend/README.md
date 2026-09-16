# Agentic AI for Smart Event Management Operations

A full-stack agentic AI event management platform built with **React + Vite + Tailwind CSS + Framer Motion**. All data is persisted via **localStorage** for local/demo usage — no backend required.

---

## Quick Start

```bash
cd "intelligent event management system/frontend"
npm install
npm run dev
```

Open → [http://localhost:5173](http://localhost:5173)

---

## Demo Credentials

| Role  | Email                        | Password   |
|-------|------------------------------|------------|
| Admin | `admin@eventai.local`        | `admin123` |
| User  | `participant@eventai.local`  | `user123`  |

---

## localStorage Demo Data

On first load, the app **automatically seeds** localStorage with realistic sample data:

| Key                  | Contents                                 | Count |
|----------------------|------------------------------------------|-------|
| `events`             | AI Tech Summit, Women in AI Forum, Smart Cities Expo | 3 |
| `venues`             | Grand Auditorium, Innovation Hall, Summit Lab, Sky Pavilion, Harbor Studio | 5 |
| `speakers`           | Dr. Aisha Verma, Rohan Patel, Priya Nair, Dr. Arun Kumar, Sana Ali, Meera Shah | 6 |
| `sessions`           | Opening Keynote, Designing Trustworthy AI, AI in Smart Cities… | 8 |
| `venueBookings`      | Confirmed bookings for all seeded sessions | 6 |
| `speakerAssignments` | Speaker-to-session assignments           | 7 |
| `attendance`         | Sample check-in / check-out records      | 3 |
| `feedback`           | Ratings and comments from sample users   | 2 |
| `registrations`      | Participant registrations                | 2 |
| `notifications`      | System alerts                            | 2 |

> **Seed data initializes only when the key does not exist.** Admin-created records (venues, speakers, events, sessions) are never overwritten on page refresh.

---

## Pre-seeded Conflict Examples

The seed data intentionally includes conflicts for testing:

- **Capacity conflict** — Session #3 "AI in Smart Cities" expects 140 attendees at Summit Lab (capacity 120)
- **Inactive speaker** — Sessions #7 and #8 assigned to Meera Shah who is `inactive`
- **Maintenance venue** — Session #4 "Women Leading AI" references Sky Pavilion which is in `maintenance`

These are visible in the **Conflicts** panel in the Admin Dashboard.

---

## Admin Flows

### Log in as Admin → `/admin/dashboard`

| Sidebar Tab          | What You Can Do |
|----------------------|-----------------|
| **Overview**         | Live KPIs: events, venues, speakers, sessions, conflicts, utilization |
| **Events**           | Create / Edit / Delete / Publish / Unpublish events |
| **Venue Agent**      | Create / Edit / Delete / Activate / Deactivate venues; Run AI venue recommendations by attendance, facilities, equipment, session type |
| **Speakers**         | Create / Edit / Delete / Activate / Deactivate speakers; Run Speaker Agent recommendations by expertise, topic, session type |
| **Sessions**         | Create / Edit / Delete / Reschedule sessions with full validation (venue capacity, facility match, double-booking, speaker conflicts) |
| **Schedule**         | Chronological view of all sessions grouped by day |
| **Venue Optimization** | Upgrade / downgrade recommendations per session, utilization bars |
| **Conflicts**        | 4-category conflict scan: venue double-booking, speaker overlap, capacity exceeded, venue availability issues |
| **Attendance**       | Manually record check-in / check-out; view recent records |
| **Analytics**        | Session counts, attendance rate, no-show rate, avg rating, venue utilization bars |
| **Notifications**    | Send notifications to admins or users; view history |

---

## User Flows

### Log in as User → `/user/dashboard`

| Sidebar Tab           | What You Can Do |
|-----------------------|-----------------|
| **Dashboard**         | Stats: registered events, upcoming sessions, check-ins, unread alerts |
| **Browse Events**     | View published events, expand sessions, register for sessions |
| **Registered Events** | Your registration history and IDs |
| **My Schedule**       | Sessions from your registered events |
| **Upcoming Sessions** | All future sessions across the platform |
| **QR Pass**           | Generate & download your event QR pass |
| **Check-In History**  | Your personal attendance records |
| **Feedback**          | Star rating + comment submission; view your feedback history |
| **Notifications**     | User-targeted notifications from Admin |
| **Profile**           | Update name and phone; email is immutable |

---

## Venue Agent

The Venue Agent (`recommendVenues()` in `localDataService.js`) scores every venue against session requirements:

| Criterion                 | Points |
|---------------------------|--------|
| Capacity ≥ expected attendance | +30 |
| All required facilities present | +20 |
| Availability window open       | +20 |
| All required equipment present | +15 |
| Venue type matches preference  | +10 |
| Venue status = available       | +5  |
| Session type keyword match     | +5  |

- Venues with capacity < expected attendance are **rejected as primary** recommendations
- Double-booking is **prevented** — `checkVenueAvailability()` rejects conflicting time windows
- Returns: `{ recommended, alternatives[3], ranked[] }` with reasons for each decision

---

## Speaker Agent

The Speaker Agent (`recommendSpeakers()` in `localDataService.js`) scores speakers:

| Criterion              | Points |
|------------------------|--------|
| Expertise match        | +30 + 10×matches |
| Topic match            | +20 |
| Availability open      | +20 |
| Session type preference| +15 |
| Language match         | +10 |
| Speaker status = active| +5  |

- Speaker overlap is **prevented** — `checkSpeakerAvailability()` rejects conflicting assignments
- Inactive speakers are excluded from recommendations
- Returns: `{ recommended, alternatives[3] }` with match reasons

---

## Venue Optimization

`optimizeVenue(session)` computes `expectedAttendance / venueCapacity × 100`:

| Utilization | Action     | Recommendation                        |
|-------------|------------|---------------------------------------|
| > attendance | upgrade   | Find larger available venue           |
| < 35%       | downgrade  | Find smaller venue (saves space)      |
| 35–85%      | keep       | Current venue is optimal              |
| No venue    | assign     | Recommend best-fit venue              |

---

## Session Validation Rules

Before saving any session (create or update), the system checks:

1. Start time < end time
2. Event is selected
3. Venue exists and status = `available`
4. Expected attendance ≤ venue capacity
5. All required facilities present in venue
6. All required equipment present in venue
7. No venue booking conflicts for the time window
8. Speaker status = `active`
9. No speaker assignment conflicts for the time window

If **any check fails**, the session is **not saved** and a descriptive error toast is shown.

---

## Data Service API

Located at `src/services/localDataService.js`:

```js
// Events
getEvents() / createEvent(payload) / updateEvent(id, payload) / deleteEvent(id)

// Venues
getVenues() / createVenue(payload) / updateVenue(id, payload) / deleteVenue(id)

// Speakers
getSpeakers() / createSpeaker(payload) / updateSpeaker(id, payload) / deleteSpeaker(id)

// Sessions (with full validation)
getSessions() / createSession(payload) / updateSession(id, payload) / deleteSession(id)

// Availability checks
checkVenueAvailability(venueId, start, end, excludeBookingId?)
checkSpeakerAvailability(speakerId, start, end, excludeAssignmentId?)

// AI Agents
recommendVenues({ expectedAttendance, requiredFacilities, requiredEquipment, sessionType, preferredVenueType, startTime, endTime })
recommendSpeakers({ expertise, topic, sessionType, languages, startTime, endTime })

// Optimization & Conflicts
optimizeVenue(session)
detectConflicts()

// Attendance & Feedback
recordAttendance(payload) / submitFeedback(payload)

// Analytics
getAnalytics() / getAdminOverview()

// Seed / Reset
initializeLocalData()   // seeds only missing keys
resetLocalData()        // wipes all keys and re-seeds
```

---

## How to Reset Demo Data

Open browser DevTools console and run:

```js
// Reset all data to seed defaults
import('/src/services/localDataService.js').then(m => m.resetLocalData())
// OR simply:
localStorage.clear(); location.reload();
```

Or in any browser console:
```js
localStorage.clear(); location.reload();
```

---

## Complete Test Workflow

1. Open app → log in as `admin@eventai.local` / `admin123`
2. **Overview** → verify 3 events, 5 venues, 6 speakers, 8 sessions
3. **Venue Agent** → run query: attendance=200, required facilities=[Wi-Fi, Stage] → Grand Auditorium recommended
4. **Speakers** → run agent: expertise=[AI], sessionType=Keynote → Dr. Aisha Verma recommended
5. **Sessions** → Create session: set venue=Harbor Studio (cap 90), attendance=150 → blocked with capacity error
6. **Sessions** → Create valid session with a free venue and speaker → succeeds
7. **Schedule** → see new session in chronological view
8. **Venue Optimization** → underutilized sessions flagged yellow, over-capacity flagged red
9. **Conflicts** → 3 pre-seeded conflicts visible (capacity, inactive speaker, maintenance venue)
10. **Analytics** → attendance rate, no-show rate, venue utilization bars, avg rating
11. Log out → log in as `participant@eventai.local` / `user123`
12. **Browse Events** → expand AI Tech Summit → register for a session
13. **My Schedule** → session appears
14. **Feedback** → submit 5-star rating for Opening Keynote
15. Refresh page → all Admin data and user feedback persists ✅

---

## Project Structure

```
frontend/src/
├── main.jsx                      ← initializeLocalData() called on startup
├── App.jsx                       ← Routing + ProtectedRoute
├── services/
│   └── localDataService.js       ← Complete data layer (1247 lines)
├── pages/
│   ├── AdminDashboard.jsx        ← Admin sidebar + tab router
│   └── UserDashboard.jsx         ← User sidebar + tab router
└── components/
    └── dashboard/
        ├── admin/
        │   ├── DashboardContent.jsx   ← Overview KPI cards
        │   ├── VenueAgentPanel.jsx    ← Venue CRUD + Venue Agent
        │   ├── AdminPanels.jsx        ← Events, Speakers, Sessions, Schedule,
        │   │                             VenueOptimization, Conflicts, Analytics,
        │   │                             Attendance, Notifications
        │   └── StubPanels.jsx
        └── user/
            ├── UserPanels.jsx         ← Dashboard, Browse Events, Registered,
            │                             My Schedule, Upcoming, QR Pass,
            │                             Attendance, Feedback, Notifications, Profile
            └── StubPanels.jsx
```

---

## Tech Stack

| Layer       | Technology |
|-------------|------------|
| Framework   | React 18 + Vite 5 |
| Styling     | Tailwind CSS 3 + custom glass/gradient tokens |
| Animation   | Framer Motion 11 |
| Data        | localStorage (no backend required) |
| Charts      | Recharts 2 |
| Icons       | Lucide React |
| Toasts      | React Hot Toast |
| QR Code     | qrcode |
| Routing     | React Router 6 |
