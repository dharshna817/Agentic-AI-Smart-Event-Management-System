const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const adminRoutes = require('../routes/admin');

const incidentsFile = path.join(__dirname, '..', 'incidents.json');

function resetIncidents() {
  fs.writeFileSync(
    incidentsFile,
    JSON.stringify(
      [
        {
          id: 101,
          incident_id: 101,
          title: 'Demo incident',
          description: 'Network outage in Hall A',
          category: 'Network',
          priority: 'HIGH',
          status: 'WAITING FOR ADMIN VERIFICATION',
          location: 'Hall A',
          user_email: 'participant@eventai.local',
          user_name: 'Participant User',
          assigned_staff_id: 9,
          assigned_staff_email: 'staff@eventai.local',
          assigned_staff_name: 'Staff Member',
          created_at: '2026-08-23T08:00:00.000Z',
          updated_at: '2026-08-23T08:00:00.000Z',
          resolution_description: 'Replaced failed AP and restored service.',
          resolved_at: '2026-08-23T08:10:00.000Z',
          progress_notes: [{ staff_name: 'Staff Member', note: 'Monitoring', timestamp: '2026-08-23T08:05:00.000Z' }],
          timeline: [
            { action: 'Reported', actor: 'Participant User', timestamp: '2026-08-23T08:00:00.000Z', description: 'Incident raised.' },
            { action: 'Resolved', actor: 'Staff Member', timestamp: '2026-08-23T08:10:00.000Z', description: 'Issue fixed.' },
            { action: 'Waiting for Admin Verification', actor: 'Staff Member', timestamp: '2026-08-23T08:11:00.000Z', description: 'Awaiting approval.' }
          ]
        }
      ],
      null,
      2,
    ),
    'utf8',
  );
}

test('Admin can verify a waiting-for-verification incident and close it', () => {
  resetIncidents();

  const verifyOutcome = adminRoutes.verifyIncident({
    incidentId: 101,
    adminUser: { id: 1, name: 'System Admin', email: 'admin@example.com', role: 'admin' },
  });

  assert.equal(verifyOutcome.ok, true);
  assert.equal(verifyOutcome.incident.status, 'VERIFIED');
  assert.match(verifyOutcome.incident.timeline.at(-1).action, /Verified/i);

  const closeOutcome = adminRoutes.closeIncident({
    incidentId: 101,
    adminUser: { id: 1, name: 'System Admin', email: 'admin@example.com', role: 'admin' },
  });

  assert.equal(closeOutcome.ok, true);
  assert.equal(closeOutcome.incident.status, 'CLOSED');
  assert.match(closeOutcome.incident.timeline.at(-1).action, /Closed/i);
});

test('Admin verification rejects invalid status transitions', () => {
  resetIncidents();

  const outcome = adminRoutes.verifyIncident({
    incidentId: 101,
    adminUser: { id: 1, name: 'System Admin', email: 'admin@example.com', role: 'admin' },
    forceStatus: 'CLOSED',
  });

  assert.equal(outcome.ok, false);
  assert.match(outcome.message, /current status|cannot be verified/i);
});
