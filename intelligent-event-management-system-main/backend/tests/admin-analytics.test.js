const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const adminRoutes = require('../routes/admin');

const incidentsFile = path.join(__dirname, '..', 'incidents.json');
const sponsorsFile = path.join(__dirname, '..', 'sponsors.json');
const proposalsFile = path.join(__dirname, '..', 'sponsorship_proposals.json');
const paymentsFile = path.join(__dirname, '..', 'sponsorship_payments.json');
const deliverablesFile = path.join(__dirname, '..', 'sponsorship_deliverables.json');

function seedAnalyticsSamples() {
  fs.writeFileSync(
    incidentsFile,
    JSON.stringify(
      [
        {
          id: 1,
          incident_id: 1,
          title: 'Microphone failed during keynote',
          description: 'Main microphone failed.',
          category: 'Audio/Visual',
          priority: 'CRITICAL',
          status: 'NEW',
          location: 'Main Auditorium',
          created_at: '2026-08-01T09:00:00.000Z',
          updated_at: '2026-08-01T09:15:00.000Z',
          resolved_at: null,
          verified_at: null,
          closed_at: null,
          staff_assigned_to: 'Staff A',
          timeline: [],
        },
        {
          id: 2,
          incident_id: 2,
          title: 'Chair broken in side room',
          description: 'A chair is damaged.',
          category: 'Venue',
          priority: 'LOW',
          status: 'IN PROGRESS',
          location: 'Main Auditorium',
          created_at: '2026-08-05T10:00:00.000Z',
          updated_at: '2026-08-05T10:30:00.000Z',
          resolved_at: null,
          verified_at: null,
          closed_at: null,
          staff_assigned_to: 'Staff B',
          timeline: [],
        },
        {
          id: 3,
          incident_id: 3,
          title: 'Check-in queue issue',
          description: 'Registration queue is slow.',
          category: 'Registration',
          priority: 'HIGH',
          status: 'RESOLVED',
          location: 'Registration Area',
          created_at: '2026-08-10T11:00:00.000Z',
          updated_at: '2026-08-10T11:45:00.000Z',
          resolved_at: '2026-08-10T12:00:00.000Z',
          verified_at: '2026-08-10T13:00:00.000Z',
          closed_at: '2026-08-10T14:00:00.000Z',
          staff_assigned_to: 'Staff C',
          timeline: [],
        },
        {
          id: 4,
          incident_id: 4,
          title: 'Security access alert',
          description: 'Restricted access issue.',
          category: 'Security',
          priority: 'CRITICAL',
          status: 'VERIFIED',
          location: 'Backstage',
          created_at: '2026-08-12T08:00:00.000Z',
          updated_at: '2026-08-12T08:40:00.000Z',
          resolved_at: '2026-08-12T09:00:00.000Z',
          verified_at: '2026-08-13T10:00:00.000Z',
          closed_at: null,
          staff_assigned_to: 'Staff D',
          timeline: [],
        },
      ],
      null,
      2,
    ),
    'utf8',
  );

  fs.writeFileSync(
    sponsorsFile,
    JSON.stringify(
      [
        { id: 1, name: 'Platinum One', status: 'Active' },
        { id: 2, name: 'Gold Brand', status: 'Active' },
        { id: 3, name: 'Silver Reach', status: 'Inactive' },
      ],
      null,
      2,
    ),
    'utf8',
  );

  fs.writeFileSync(
    proposalsFile,
    JSON.stringify(
      [
        { proposal_id: 'SP-1', company_name: 'Platinum One', status: 'Approved', package_id: 1, amount: 500000 },
        { proposal_id: 'SP-2', company_name: 'Gold Brand', status: 'Approved', package_id: 2, amount: 250000 },
        { proposal_id: 'SP-3', company_name: 'Silver Reach', status: 'Pending', package_id: 3, amount: 100000 },
      ],
      null,
      2,
    ),
    'utf8',
  );

  fs.writeFileSync(
    paymentsFile,
    JSON.stringify(
      [
        { proposal_id: 'SP-1', amount: 500000, due_amount: 0, status: 'Paid', sponsor_id: 1 },
        { proposal_id: 'SP-2', amount: 250000, due_amount: 125000, status: 'Pending', sponsor_id: 2 },
        { proposal_id: 'SP-3', amount: 100000, due_amount: 100000, status: 'Pending', sponsor_id: 3 },
      ],
      null,
      2,
    ),
    'utf8',
  );

  fs.writeFileSync(
    deliverablesFile,
    JSON.stringify(
      [
        { proposal_id: 'SP-1', status: 'Completed', sponsor_id: 1 },
        { proposal_id: 'SP-1', status: 'Pending', sponsor_id: 1 },
        { proposal_id: 'SP-2', status: 'In Progress', sponsor_id: 2 },
        { proposal_id: 'SP-2', status: 'Pending', sponsor_id: 2 },
        { proposal_id: 'SP-3', status: 'Pending', sponsor_id: 3 },
      ],
      null,
      2,
    ),
    'utf8',
  );
}

test('incident analytics aggregate real KPI data', () => {
  seedAnalyticsSamples();

  const result = adminRoutes.getIncidentAnalytics({ range: '30' });

  assert.equal(result.totalIncidents, 4);
  assert.equal(result.openIncidents, 2);
  assert.equal(result.inProgressIncidents, 1);
  assert.equal(result.resolvedIncidents, 1);
  assert.equal(result.verifiedIncidents, 1);
  assert.equal(result.closedIncidents, 0);
  assert.equal(result.criticalIncidents, 2);
  assert.equal(result.highPriorityIncidents, 1);
  assert.equal(result.byCategory['Audio/Visual'], 1);
  assert.equal(result.byPriority.CRITICAL, 2);
  assert.equal(result.byLocation['Main Auditorium'], 2);
  assert.ok(result.trend.length >= 1);
});

test('same-day future-dated incidents remain in analytics results', () => {
  fs.writeFileSync(
    incidentsFile,
    JSON.stringify(
      [
        {
          id: 101,
          incident_id: 101,
          title: 'Chair damaged in conference room',
          description: 'Table leg is loose.',
          category: 'Venue',
          priority: 'LOW',
          status: 'NEW',
          location: 'Grand Auditorium',
          created_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
          resolved_at: null,
          verified_at: null,
          closed_at: null,
          timeline: [],
        },
      ],
      null,
      2,
    ),
    'utf8',
  );

  const result = adminRoutes.getIncidentAnalytics({ range: '30' });

  assert.equal(result.totalIncidents, 1);
  assert.equal(result.openIncidents, 1);
  assert.equal(result.byCategory.Venue, 1);
});

test('sponsorship analytics aggregate real performance data', () => {
  seedAnalyticsSamples();

  const result = adminRoutes.getSponsorshipAnalytics({ range: '30' });

  assert.equal(result.totalSponsors, 3);
  assert.equal(result.activeSponsors, 2);
  assert.equal(result.pendingPayments, 2);
  assert.equal(result.pendingDeliverables, 4);
  assert.equal(result.totalSponsorshipValue, 750000);
  assert.equal(result.packageBreakdown['Platinum'], 1);
  assert.equal(result.deliverableStatus.Pending, 3);
  assert.equal(result.paymentStatus.Paid, 1);
  assert.ok(result.sponsorPerformance.length >= 1);
});
