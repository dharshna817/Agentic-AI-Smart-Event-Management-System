const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const adminRoutes = require('../routes/admin');

const incidentsFile = path.join(__dirname, '..', 'incidents.json');
const alertsFile = path.join(__dirname, '..', 'alerts.json');
const proposalsFile = path.join(__dirname, '..', 'sponsorship_proposals.json');
const paymentsFile = path.join(__dirname, '..', 'sponsorship_payments.json');
const deliverablesFile = path.join(__dirname, '..', 'sponsorship_deliverables.json');

function resetSeed() {
  fs.writeFileSync(
    proposalsFile,
    JSON.stringify([], null, 2),
    'utf8',
  );

  fs.writeFileSync(
    paymentsFile,
    JSON.stringify([], null, 2),
    'utf8',
  );

  fs.writeFileSync(
    deliverablesFile,
    JSON.stringify([], null, 2),
    'utf8',
  );

  fs.writeFileSync(
    incidentsFile,
    JSON.stringify(
      [
        {
          id: 201,
          incident_id: 201,
          title: 'Microphone failed during keynote',
          description: 'The main auditorium microphone failed during the keynote session and the audience cannot hear the speaker.',
          category: 'Audio/Visual',
          priority: 'CRITICAL',
          severity: 'HIGH',
          status: 'NEW',
          location: 'Grand Auditorium',
          user_email: 'participant@eventai.local',
          user_name: 'Participant User',
          created_at: '2026-08-23T08:00:00.000Z',
          updated_at: '2026-08-23T08:00:00.000Z',
          timeline: [
            { action: 'Incident Reported', actor: 'Participant User', timestamp: '2026-08-23T08:00:00.000Z', description: 'Incident raised.' }
          ]
        },
        {
          id: 202,
          incident_id: 202,
          title: 'Chair damaged in side room',
          description: 'A chair in the side room is broken and needs replacement.',
          category: 'Venue',
          priority: 'LOW',
          severity: 'LOW',
          status: 'RESOLVED',
          location: 'Side Room',
          user_email: 'participant@eventai.local',
          user_name: 'Participant User',
          created_at: '2026-08-23T07:00:00.000Z',
          updated_at: '2026-08-23T07:15:00.000Z',
          timeline: [
            { action: 'Incident Reported', actor: 'Participant User', timestamp: '2026-08-23T07:00:00.000Z', description: 'Incident raised.' }
          ]
        }
      ],
      null,
      2,
    ),
    'utf8',
  );

  fs.writeFileSync(
    alertsFile,
    JSON.stringify([], null, 2),
    'utf8',
  );
}

test('Critical incident generates a CRITICAL operational alert and duplicate prevention works', () => {
  resetSeed();

  const first = adminRoutes.generateOperationalAlerts();
  const second = adminRoutes.generateOperationalAlerts();

  assert.equal(first.ok, true);
  assert.equal(first.createdCount >= 1, true);
  assert.equal(first.alerts.some((alert) => String(alert.priority) === 'CRITICAL' && String(alert.sourceType) === 'incident'), true);
  assert.equal(second.alerts.length, first.alerts.length);
});

test('Low-priority minor venue issue does not create urgent operational alert', () => {
  resetSeed();

  const result = adminRoutes.generateOperationalAlerts();
  const urgent = result.alerts.filter((alert) => ['CRITICAL', 'HIGH'].includes(String(alert.priority).toUpperCase()));

  assert.equal(urgent.length, 1);
  assert.equal(result.alerts.some((alert) => String(alert.title).includes('Chair') || String(alert.title).includes('venue')), false);
});

test('Open low-priority incidents still generate a low operational alert for admin awareness', () => {
  resetSeed();
  const incidents = JSON.parse(fs.readFileSync(incidentsFile, 'utf8'));
  incidents[0].status = 'NEW';
  incidents[0].priority = 'LOW';
  incidents[0].title = 'Minor lighting issue in side hall';
  incidents[0].description = 'A side hall light is flickering and needs review.';
  fs.writeFileSync(incidentsFile, JSON.stringify(incidents, null, 2), 'utf8');

  const result = adminRoutes.generateOperationalAlerts();
  const lowAlerts = result.alerts.filter((alert) => String(alert.priority).toUpperCase() === 'LOW');

  assert.equal(lowAlerts.length >= 1, true);
  assert.equal(result.alerts.some((alert) => String(alert.title).includes('lighting') || String(alert.description).includes('light')), true);
});

test('Admin can acknowledge and resolve an operational alert', () => {
  resetSeed();

  const generated = adminRoutes.generateOperationalAlerts();
  const alert = generated.alerts[0];

  const ackOutcome = adminRoutes.acknowledgeAlert({ alertId: alert.id, adminUser: { id: 1, name: 'System Admin', email: 'admin@example.com', role: 'admin' } });
  assert.equal(ackOutcome.ok, true);
  assert.equal(ackOutcome.alert.status, 'ACKNOWLEDGED');

  const resolveOutcome = adminRoutes.resolveAlert({ alertId: alert.id, adminUser: { id: 1, name: 'System Admin', email: 'admin@example.com', role: 'admin' } });
  assert.equal(resolveOutcome.ok, true);
  assert.equal(resolveOutcome.alert.status, 'RESOLVED');
});
