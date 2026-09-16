/**
 * Unit + Integration Tests for localDataService.js
 *
 * Run with:  node src/services/__tests__/localDataService.test.js
 * (No test runner dependency needed — pure Node assertions)
 */

// ─── Minimal localStorage shim for Node ──────────────────────────────────────
const store = new Map();
global.window = {
  localStorage: {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => store.set(k, v),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  },
};
global.localStorage = global.window.localStorage;

// ─── Import service (adjust path as needed from test runner cwd) ─────────────
// NOTE: This test file uses CommonJS-compatible dynamic import for Node 18+
async function runTests() {
  const {
    initializeLocalData, resetLocalData,
    getEvents, createEvent, updateEvent, deleteEvent,
    getVenues, createVenue, updateVenue, deleteVenue,
    getSpeakers, createSpeaker, updateSpeaker, deleteSpeaker,
    getSessions, createSession, updateSession, deleteSession,
    checkVenueAvailability, checkSpeakerAvailability,
    recommendVenues, recommendSpeakers,
    optimizeVenue, detectConflicts,
    getAnalytics, recordAttendance, submitFeedback,
  } = await import('../localDataService.js');

  let passed = 0;
  let failed = 0;

  function assert(condition, label) {
    if (condition) {
      console.log(`  ✅ PASS  ${label}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL  ${label}`);
      failed++;
    }
  }

  function assertThrows(fn, label) {
    try { fn(); console.error(`  ❌ FAIL  ${label} (expected throw)`); failed++; }
    catch { console.log(`  ✅ PASS  ${label}`); passed++; }
  }

  function section(title) { console.log(`\n── ${title} ──`); }

  // ─── Reset before each group ─────────────────────────────────────────────

  function reset() { resetLocalData(); }

  // ═══════════════════════════════════════════════════════════════════════════
  section('1. Seed & Initialization');
  // ═══════════════════════════════════════════════════════════════════════════

  reset();
  assert(getEvents().length >= 8, 'Seed: expanded event catalog includes all published events');
  assert(getEvents().some((event) => event.name === 'Future Mobility Expo' && event.start_date?.includes('2026-08-30')), 'Seed: includes the August 30 Future Mobility Expo');
  assert(getVenues().length === 5, 'Seed: 5 venues initialized');
  assert(getSpeakers().length === 6, 'Seed: 6 speakers initialized');
  assert(getSessions().length === 8, 'Seed: 8 sessions initialized');

  // Keys should not be overwritten on second call
  createEvent({ name: 'Persist Test', startDate: '2026-09-01T09:00', endDate: '2026-09-01T17:00', status: 'DRAFT' });
  initializeLocalData(); // should NOT clear the newly created event
  assert(getEvents().length >= 9, 'Seed: initializeLocalData preserves user additions and keeps the full event catalog');

  // ═══════════════════════════════════════════════════════════════════════════
  section('2. Event CRUD');
  // ═══════════════════════════════════════════════════════════════════════════

  reset();
  const ev = createEvent({ name: 'AI Summit 2027', startDate: '2027-01-10T09:00', endDate: '2027-01-10T18:00', status: 'DRAFT', location: 'Main Hall' });
  assert(ev.event_id > 0, 'createEvent: returns record with event_id');
  assert(ev.name === 'AI Summit 2027', 'createEvent: name is set');
  assert(ev.status === 'DRAFT', 'createEvent: status defaults correctly');

  const updated = updateEvent(ev.event_id, { status: 'PUBLISHED', location: 'Innovation Hub' });
  assert(updated.status === 'PUBLISHED', 'updateEvent: status updated');
  assert(updated.location === 'Innovation Hub', 'updateEvent: location updated');

  const before = getEvents().length;
  deleteEvent(ev.event_id);
  assert(getEvents().length === before - 1, 'deleteEvent: record removed');

  // ═══════════════════════════════════════════════════════════════════════════
  section('3. Venue CRUD');
  // ═══════════════════════════════════════════════════════════════════════════

  reset();
  const venue = createVenue({
    name: 'Innovation Hall',
    location: 'West Wing',
    capacity: 250,
    venueType: 'Conference Hall',
    facilities: ['Wi-Fi', 'Stage'],
    equipment: ['Microphones'],
    setupTime: 20,
    cleanupTime: 15,
    status: 'available',
  });
  assert(venue.venue_id > 0, 'createVenue: record created');
  assert(venue.capacity === 250, 'createVenue: capacity stored correctly');
  assert(Array.isArray(venue.facilities), 'createVenue: facilities is array');

  updateVenue(venue.venue_id, { status: 'maintenance' });
  assert(getVenues().find((v) => v.venue_id === venue.venue_id).status === 'maintenance', 'updateVenue: status updated');

  const vcountBefore = getVenues().length;
  deleteVenue(venue.venue_id);
  assert(getVenues().length === vcountBefore - 1, 'deleteVenue: record removed');

  // ═══════════════════════════════════════════════════════════════════════════
  section('4. Speaker CRUD');
  // ═══════════════════════════════════════════════════════════════════════════

  reset();
  const spk = createSpeaker({
    name: 'Dr. Arun Kumar',
    email: 'arun.test@example.com',
    expertise: ['ML', 'Vision'],
    languages: ['English'],
    preferredSessionTypes: ['Talk'],
    preferredTopics: ['Computer Vision'],
    status: 'active',
  });
  assert(spk.speaker_id > 0, 'createSpeaker: record created');
  assert(spk.expertise.includes('ML'), 'createSpeaker: expertise stored');

  updateSpeaker(spk.speaker_id, { status: 'inactive' });
  assert(getSpeakers().find((s) => s.speaker_id === spk.speaker_id).status === 'inactive', 'updateSpeaker: status updated');

  const scountBefore = getSpeakers().length;
  deleteSpeaker(spk.speaker_id);
  assert(getSpeakers().length === scountBefore - 1, 'deleteSpeaker: record removed');

  // ═══════════════════════════════════════════════════════════════════════════
  section('5. Capacity Validation');
  // ═══════════════════════════════════════════════════════════════════════════

  reset();
  // Venue 3 (Summit Lab) has capacity 120
  // Expected attendance 140 should be rejected
  assertThrows(
    () => createSession({
      event_id: 1, title: 'Overloaded Session',
      start_time: '2026-09-01T09:00:00', end_time: '2026-09-01T10:00:00',
      venue_id: 3, expectedAttendance: 140,
    }),
    'createSession: rejects attendance (140) > venue capacity (120)'
  );

  // Under capacity should pass
  let goodSession;
  try {
    goodSession = createSession({
      event_id: 1, title: 'Good Session',
      start_time: '2026-09-01T11:00:00', end_time: '2026-09-01T12:00:00',
      venue_id: 3, expectedAttendance: 80,
    });
    assert(goodSession.session_id > 0, 'createSession: accepts attendance (80) ≤ capacity (120)');
  } catch (e) {
    assert(false, `createSession: unexpected error — ${e.message}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  section('6. Facility Validation');
  // ═══════════════════════════════════════════════════════════════════════════

  reset();
  // Harbor Studio (venue 5) has only ['Wi-Fi','Whiteboard'] — no 'Stage'
  assertThrows(
    () => createSession({
      event_id: 1, title: 'Stage Session',
      start_time: '2026-09-02T09:00:00', end_time: '2026-09-02T10:00:00',
      venue_id: 5, expectedAttendance: 40,
      requiredFacilities: ['Stage'],
    }),
    'createSession: rejects missing required facility (Stage)'
  );

  // ═══════════════════════════════════════════════════════════════════════════
  section('7. Venue Double-Booking Prevention');
  // ═══════════════════════════════════════════════════════════════════════════

  reset();
  // Create first booking for venue 3 on Sep 5
  try {
    createSession({
      event_id: 1, title: 'First Booking',
      start_time: '2026-09-05T09:00:00', end_time: '2026-09-05T11:00:00',
      venue_id: 3, expectedAttendance: 50,
    });
  } catch (e) { /* ignore */ }

  // Second booking overlapping same venue same time must be rejected
  assertThrows(
    () => createSession({
      event_id: 2, title: 'Overlapping Booking',
      start_time: '2026-09-05T10:00:00', end_time: '2026-09-05T12:00:00',
      venue_id: 3, expectedAttendance: 50,
    }),
    'createSession: prevents venue double-booking'
  );

  // Non-overlapping time for same venue should pass
  let nonOverlap;
  try {
    nonOverlap = createSession({
      event_id: 2, title: 'Non-Overlapping',
      start_time: '2026-09-05T13:00:00', end_time: '2026-09-05T14:00:00',
      venue_id: 3, expectedAttendance: 50,
    });
    assert(nonOverlap.session_id > 0, 'createSession: allows non-overlapping same venue');
  } catch (e) {
    assert(false, `createSession: unexpected error — ${e.message}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  section('8. Speaker Overlap Prevention');
  // ═══════════════════════════════════════════════════════════════════════════

  reset();
  // Speaker 1 is assigned to session 1 (2026-08-20T09:00–10:30)
  assertThrows(
    () => createSession({
      event_id: 1, title: 'Speaker Conflict',
      start_time: '2026-08-20T09:30:00', end_time: '2026-08-20T10:00:00',
      venue_id: 2, speaker_id: 1, expectedAttendance: 50,
    }),
    'createSession: prevents speaker double-assignment'
  );

  // ═══════════════════════════════════════════════════════════════════════════
  section('9. Venue Availability Check');
  // ═══════════════════════════════════════════════════════════════════════════

  reset();
  const check1 = checkVenueAvailability(1, '2026-08-20T09:00:00', '2026-08-20T10:30:00');
  assert(!check1.available, 'checkVenueAvailability: detects existing booking conflict');
  assert(check1.conflict !== undefined, 'checkVenueAvailability: returns conflict object');

  const check2 = checkVenueAvailability(1, '2027-01-01T09:00:00', '2027-01-01T10:00:00');
  assert(check2.available, 'checkVenueAvailability: returns available for free slot');

  // ═══════════════════════════════════════════════════════════════════════════
  section('10. Speaker Availability Check');
  // ═══════════════════════════════════════════════════════════════════════════

  reset();
  const spkCheck1 = checkSpeakerAvailability(1, '2026-08-20T09:00:00', '2026-08-20T10:30:00');
  assert(!spkCheck1.available, 'checkSpeakerAvailability: detects existing assignment conflict');

  const spkCheck2 = checkSpeakerAvailability(1, '2027-02-01T09:00:00', '2027-02-01T10:00:00');
  assert(spkCheck2.available, 'checkSpeakerAvailability: returns available for free slot');

  // ═══════════════════════════════════════════════════════════════════════════
  section('11. Venue Agent Recommendations');
  // ═══════════════════════════════════════════════════════════════════════════

  reset();
  const rec = recommendVenues({ expectedAttendance: 300, requiredFacilities: ['Stage', 'Wi-Fi'], sessionType: 'Keynote' });
  assert(rec.recommended !== null, 'recommendVenues: returns a recommendation');
  assert(rec.recommended.capacityOk, 'recommendVenues: recommended venue has sufficient capacity');
  assert(Array.isArray(rec.alternatives), 'recommendVenues: returns alternatives array');

  // Query too large — no venue can fit 1000 people
  const recNone = recommendVenues({ expectedAttendance: 1000 });
  assert(recNone.recommended !== null, 'recommendVenues: still returns best-effort when no perfect match');

  // Reject venues smaller than attendance as primary recommendation
  const recBig = recommendVenues({ expectedAttendance: 1000 });
  const primary = recBig.recommended;
  assert(!primary?.capacityOk, 'recommendVenues: primary marked capacityOk=false when over capacity');

  // ═══════════════════════════════════════════════════════════════════════════
  section('12. Speaker Agent Recommendations');
  // ═══════════════════════════════════════════════════════════════════════════

  reset();
  const spkRec = recommendSpeakers({ expertise: ['AI'], sessionType: 'Keynote' });
  assert(spkRec.recommended !== null, 'recommendSpeakers: returns recommendation');
  assert(spkRec.recommended.name !== undefined, 'recommendSpeakers: recommended has name');
  assert(spkRec.recommended.matchScore > 0, 'recommendSpeakers: match score > 0');

  // Inactive speakers should not be recommended as top choice
  const inactiveFirst = spkRec.recommended?.status !== 'inactive';
  assert(inactiveFirst, 'recommendSpeakers: inactive speaker not first choice');

  // ═══════════════════════════════════════════════════════════════════════════
  section('13. Venue Optimization – Utilization Calculation');
  // ═══════════════════════════════════════════════════════════════════════════

  reset();
  // Session 1: venue 1 (cap 500), expectedAttendance 320 → 64%
  const sessions = getSessions();
  const session1 = sessions.find((s) => s.session_id === 1);
  const opt1 = optimizeVenue(session1);
  assert(opt1.utilization === 64, `optimizeVenue: utilization = ${opt1.utilization}% (expected 64%)`);
  assert(opt1.action === 'keep', 'optimizeVenue: utilization 64% → action=keep');

  // Session 3: venue 3 (cap 120), expectedAttendance 140 → >100% → upgrade
  const session3 = sessions.find((s) => s.session_id === 3);
  const opt3 = optimizeVenue(session3);
  assert(opt3.action === 'upgrade', 'optimizeVenue: over capacity → action=upgrade');

  // Build a low-attendance session for downgrade test
  const lowSess = { venue_id: 1, expectedAttendance: 30 }; // 500 cap, 30 expected = 6%
  const optLow = optimizeVenue(lowSess);
  assert(optLow.action === 'downgrade', 'optimizeVenue: severely underutilized → action=downgrade');
  assert(optLow.utilization === 6, 'optimizeVenue: utilization = 6%');

  // ═══════════════════════════════════════════════════════════════════════════
  section('14. Upgrade / Downgrade Recommendations');
  // ═══════════════════════════════════════════════════════════════════════════

  reset();
  // Over-capacity: should recommend a larger available venue
  const bigSession = { venue_id: 3, expectedAttendance: 300 }; // Summit Lab cap 120
  const upgradeOpt = optimizeVenue(bigSession);
  assert(upgradeOpt.action === 'upgrade', 'optimizeVenue: recommends upgrade for overcrowded');
  assert(upgradeOpt.alternativeVenue !== null, 'optimizeVenue: upgrade provides alternativeVenue');
  assert(Number(upgradeOpt.alternativeVenue?.capacity) >= 300, 'optimizeVenue: upgrade venue has sufficient capacity');

  // ═══════════════════════════════════════════════════════════════════════════
  section('15. Conflict Detection');
  // ═══════════════════════════════════════════════════════════════════════════

  reset();
  const conflicts = detectConflicts();
  assert(typeof conflicts === 'object', 'detectConflicts: returns object');
  assert(Array.isArray(conflicts.venueConflicts), 'detectConflicts: venueConflicts is array');
  assert(Array.isArray(conflicts.speakerConflicts), 'detectConflicts: speakerConflicts is array');
  assert(Array.isArray(conflicts.capacityConflicts), 'detectConflicts: capacityConflicts is array');
  assert(Array.isArray(conflicts.availabilityConflicts), 'detectConflicts: availabilityConflicts is array');

  // Seed data has intentional capacity conflict (session 3, venue 3)
  assert(conflicts.capacityConflicts.length > 0, 'detectConflicts: detects pre-seeded capacity conflict');

  // Venue availability: set venue 1 (used by session 1) to maintenance then re-detect
  updateVenue(1, { status: 'maintenance' });
  const conflicts2 = detectConflicts();
  assert(conflicts2.availabilityConflicts.length > 0, 'detectConflicts: detects venue availability conflict after venue set to maintenance');
  // Restore
  updateVenue(1, { status: 'available' });

  // ═══════════════════════════════════════════════════════════════════════════
  section('16. Analytics');
  // ═══════════════════════════════════════════════════════════════════════════

  reset();
  const analytics = getAnalytics();
  assert(analytics.totalEvents >= 8, 'getAnalytics: totalEvents reflects the expanded event catalog');
  assert(analytics.totalVenues === 5, 'getAnalytics: totalVenues = 5');
  assert(analytics.totalSpeakers === 6, 'getAnalytics: totalSpeakers = 6');
  assert(analytics.totalSessions === 8, 'getAnalytics: totalSessions = 8');
  assert(Array.isArray(analytics.venueUtilization), 'getAnalytics: venueUtilization is array');
  assert(analytics.venueUtilization.length === 5, 'getAnalytics: one utilization entry per venue');
  assert(typeof analytics.attendanceRate === 'string' || typeof analytics.attendanceRate === 'number', 'getAnalytics: attendanceRate present');

  // ═══════════════════════════════════════════════════════════════════════════
  section('17. localStorage Persistence');
  // ═══════════════════════════════════════════════════════════════════════════

  reset();
  const newEvent = createEvent({ name: 'Persistence Test Event', startDate: '2027-01-01T09:00', endDate: '2027-01-01T17:00' });
  assert(newEvent.event_id > 0, 'localStorage: createEvent writes to storage');

  // Re-read from storage (simulating a page reload)
  const reloaded = getEvents();
  assert(reloaded.some((e) => e.name === 'Persistence Test Event'), 'localStorage: event persists across getEvents() calls');

  const newVenue = createVenue({ name: 'Test Venue', capacity: 100, venueType: 'Studio' });
  assert(getVenues().some((v) => v.name === 'Test Venue'), 'localStorage: createVenue persists');

  const newSpeaker = createSpeaker({ name: 'Test Speaker', email: 'test@example.com', expertise: ['Testing'] });
  assert(getSpeakers().some((s) => s.name === 'Test Speaker'), 'localStorage: createSpeaker persists');

  // ═══════════════════════════════════════════════════════════════════════════
  section('18. Integration — Full Event→Session Flow');
  // ═══════════════════════════════════════════════════════════════════════════

  reset();

  // Step 1: Create event
  const integEvent = createEvent({ name: 'Integration Summit', startDate: '2027-03-01T09:00', endDate: '2027-03-01T18:00', status: 'PUBLISHED' });
  assert(integEvent.event_id > 0, 'Integration: event created');

  // Step 2: Create venue
  const integVenue = createVenue({ name: 'Integration Hall', capacity: 200, facilities: ['Wi-Fi', 'Projector'], equipment: ['Microphones'], status: 'available' });
  assert(integVenue.venue_id > 0, 'Integration: venue created');

  // Step 3: Create speaker
  const integSpeaker = createSpeaker({ name: 'Integration Speaker', email: 'integration@example.com', expertise: ['Tech'], status: 'active' });
  assert(integSpeaker.speaker_id > 0, 'Integration: speaker created');

  // Step 4: Get venue recommendations
  const integRec = recommendVenues({ expectedAttendance: 100, requiredFacilities: ['Wi-Fi'], sessionType: 'Talk' });
  const pickedVenue = integRec.ranked.find((v) => v.venue_id === integVenue.venue_id);
  assert(pickedVenue !== undefined, 'Integration: new venue appears in recommendations');
  assert(pickedVenue.matchScore > 0, 'Integration: new venue scored > 0');

  // Step 5: Get speaker recommendations
  const integSpkRec = recommendSpeakers({ expertise: ['Tech'] });
  const pickedSpeaker = integSpkRec.ranked.find((s) => s.speaker_id === integSpeaker.speaker_id);
  assert(pickedSpeaker !== undefined, 'Integration: new speaker appears in recommendations');

  // Step 6: Create session (valid)
  const integSession = createSession({
    event_id: integEvent.event_id,
    title: 'Integration Session',
    start_time: '2027-03-01T10:00:00',
    end_time: '2027-03-01T11:30:00',
    venue_id: integVenue.venue_id,
    speaker_id: integSpeaker.speaker_id,
    expectedAttendance: 100,
    requiredFacilities: ['Wi-Fi'],
    requiredEquipment: ['Microphones'],
  });
  assert(integSession.session_id > 0, 'Integration: session created with all validations passing');

  // Step 7: Verify booking and assignment were auto-created
  const { getVenueBookings, getSpeakerAssignments } = await import('../localDataService.js');
  const bookings = getVenueBookings();
  assert(bookings.some((b) => Number(b.venue_id) === Number(integVenue.venue_id)), 'Integration: venue booking auto-created');
  const assignments = getSpeakerAssignments();
  assert(assignments.some((a) => Number(a.speaker_id) === Number(integSpeaker.speaker_id)), 'Integration: speaker assignment auto-created');

  // Step 8: Record attendance
  const att = recordAttendance({ participant_email: 'test@example.com', session_id: integSession.session_id, status: 'checked-in' });
  assert(att.attendance_id > 0, 'Integration: attendance recorded');

  // Step 9: Submit feedback
  const fb = submitFeedback({ session_id: integSession.session_id, user_email: 'test@example.com', rating: 5, comment: 'Excellent!' });
  assert(fb.feedback_id > 0, 'Integration: feedback submitted');

  // Step 10: Analytics reflects new data
  const finalAnalytics = getAnalytics();
  assert(finalAnalytics.totalSessions > 8, 'Integration: analytics reflects new session');
  assert(finalAnalytics.totalFeedback >= 1, 'Integration: analytics reflects submitted feedback');

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  Tests: ${passed + failed}  |  ✅ Passed: ${passed}  |  ❌ Failed: ${failed}`);
  console.log(`${'═'.repeat(60)}\n`);
  if (failed > 0) process.exit(1);
}

runTests().catch((err) => { console.error('Test runner crashed:', err); process.exit(1); });
