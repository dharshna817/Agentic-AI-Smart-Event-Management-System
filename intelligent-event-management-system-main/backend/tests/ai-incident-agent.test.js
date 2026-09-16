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
          title: 'Microphone stopped working during keynote.',
          description: 'The main auditorium microphone failed during the keynote session and the audience cannot hear the speaker.',
          category: 'Audio/Visual',
          priority: 'HIGH',
          status: 'NEW',
          location: 'Grand Auditorium',
          user_email: 'participant@eventai.local',
          user_name: 'Participant User',
          created_at: '2026-08-23T08:00:00.000Z',
          updated_at: '2026-08-23T08:00:00.000Z',
          timeline: [
            { action: 'Incident Reported', actor: 'Participant User', timestamp: '2026-08-23T08:00:00.000Z', description: 'Incident raised.' }
          ]
        }
      ],
      null,
      2,
    ),
    'utf8',
  );
}

test('AI incident agent classifies a microphone outage as audio/visual and high priority', () => {
  resetIncidents();

  const result = adminRoutes.analyzeIncident({ incidentId: 101, adminUser: { id: 1, name: 'System Admin', email: 'admin@example.com', role: 'admin' } });

  assert.equal(result.ok, true);
  assert.equal(result.analysis.category, 'Audio/Visual');
  assert.equal(result.analysis.severity, 'HIGH');
  assert.equal(result.analysis.priority, 'HIGH');
  assert.equal(result.analysis.recommendedStaffType, 'AV / Technical Support');
  assert.equal(result.analysis.escalationRecommendation, 'YES');
  assert.match(result.analysis.summary, /microphone|keynote/i);
});

test('AI incident agent handles a minor venue issue quietly and keeps workflow intact', () => {
  resetIncidents();
  const incidents = JSON.parse(fs.readFileSync(incidentsFile, 'utf8'));
  incidents[0].title = 'One chair is damaged in the conference room.';
  incidents[0].description = 'A chair in the side room is broken and needs replacement.';
  incidents[0].category = 'Venue';
  fs.writeFileSync(incidentsFile, JSON.stringify(incidents, null, 2), 'utf8');

  const result = adminRoutes.analyzeIncident({ incidentId: 101, adminUser: { id: 1, name: 'System Admin', email: 'admin@example.com', role: 'admin' } });

  assert.equal(result.ok, true);
  assert.equal(result.analysis.category, 'Venue');
  assert.equal(result.analysis.priority, 'LOW');
  assert.equal(result.analysis.riskLevel, 'LOW');
  assert.equal(result.analysis.escalationRecommendation, 'NO');
});
