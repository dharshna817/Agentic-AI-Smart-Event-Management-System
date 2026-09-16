const test = require('node:test');
const assert = require('node:assert/strict');

const { calculateHealthScore, getHealthStatus } = require('../intelligence/healthScoreService');
const { detectRisks } = require('../intelligence/riskDetectionService');
const { analyseTrend } = require('../intelligence/trendAnalysisService');
const { buildEventIntelligence } = require('../intelligence/intelligenceService');

test('health score returns perfect score for ideal metrics', () => {
  const score = calculateHealthScore({
    registration: 100,
    attendance: 100,
    incidents: 100,
    sponsorship: 100,
    operations: 100,
  });

  assert.equal(score, 100);
  assert.equal(getHealthStatus(score), 'EXCELLENT');
});

test('health score supports warning and critical states', () => {
  assert.equal(getHealthStatus(68), 'WARNING');
  assert.equal(getHealthStatus(45), 'CRITICAL');
  assert.equal(getHealthStatus(25), 'SEVERE');
});

test('risk detection identifies medium, high, and critical conditions', () => {
  assert.deepEqual(detectRisks({
    registrationHealth: 98,
    attendanceHealth: 97,
    incidentHealth: 75,
    sponsorshipHealth: 90,
    operationalHealth: 88,
  }), []);

  const medium = detectRisks({
    registrationHealth: 78,
    attendanceHealth: 70,
    incidentHealth: 80,
    sponsorshipHealth: 82,
    operationalHealth: 74,
  });
  assert.ok(Array.isArray(medium));
  assert.ok(medium.some((risk) => risk.severity === 'MEDIUM'));

  const high = detectRisks({
    registrationHealth: 59,
    attendanceHealth: 62,
    incidentHealth: 41,
    sponsorshipHealth: 70,
    operationalHealth: 55,
  });
  assert.ok(high.some((risk) => risk.severity === 'HIGH'));

  const critical = detectRisks({
    registrationHealth: 35,
    attendanceHealth: 41,
    incidentHealth: 22,
    sponsorshipHealth: 48,
    operationalHealth: 40,
  });
  assert.ok(critical.some((risk) => risk.severity === 'CRITICAL'));
});

test('trend analysis detects direction and handles insufficient data', () => {
  assert.equal(analyseTrend([50, 60, 80]), 'IMPROVING');
  assert.equal(analyseTrend([82, 70, 55]), 'DECLINING');
  assert.equal(analyseTrend([60, 62, 61]), 'STABLE');
  assert.equal(analyseTrend([]), 'INSUFFICIENT_DATA');
});

test('event intelligence safely handles empty and missing data', () => {
  const result = buildEventIntelligence({
    event: { id: 99, name: 'Empty Event', status: 'DRAFT' },
    registrations: [],
    attendance: [],
    incidents: [],
    proposals: [],
    payments: [],
    deliverables: [],
    alerts: [],
    sponsors: [],
  });

  assert.equal(result.eventId, 99);
  assert.ok(typeof result.eventHealthScore === 'number');
  assert.ok(Array.isArray(result.risks));
  assert.ok(Array.isArray(result.insights));
  assert.ok(Array.isArray(result.recommendations));
  assert.ok(Array.isArray(result.priorityActions));
  assert.equal(result.healthStatus, 'EXCELLENT');
});
