const { calculateHealthScore, getHealthStatus } = require('./healthScoreService');
const { detectRisks } = require('./riskDetectionService');
const { analyseTrend } = require('./trendAnalysisService');
const { generateAIInsights } = require('./insightService');
const { buildRecommendations, buildPriorityActions } = require('./recommendationService');

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function clampTo100(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.min(100, Math.max(0, numeric));
}

function computeRegistrationMetrics(registrations = []) {
  const total = registrations.length;
  if (!total) {
    return {
      registration: 100,
      totalRegistrations: 0,
      confirmedRegistrations: 0,
      pendingRegistrations: 0,
      cancelledRegistrations: 0,
      conversion: 100,
    };
  }

  const confirmed = registrations.filter((item) => String(item.status || '').toLowerCase() === 'confirmed').length;
  const pending = registrations.filter((item) => String(item.status || '').toLowerCase() === 'pending').length;
  const cancelled = registrations.filter((item) => String(item.status || '').toLowerCase() === 'cancelled').length;
  const conversion = Math.round((confirmed / total) * 100);

  return {
    registration: conversion,
    totalRegistrations: total,
    confirmedRegistrations: confirmed,
    pendingRegistrations: pending,
    cancelledRegistrations: cancelled,
    conversion,
  };
}

function computeAttendanceMetrics(attendance = []) {
  const total = attendance.length;
  if (!total) {
    return {
      attendance: 100,
      checkedIn: 0,
      noShows: 0,
      checkInRate: 100,
    };
  }

  const checkedIn = attendance.filter((item) => String(item.status || '').toLowerCase() === 'checked-in').length;
  const noShows = attendance.filter((item) => String(item.status || '').toLowerCase() === 'no-show').length;
  const checkInRate = Math.round((checkedIn / total) * 100);

  return {
    attendance: checkInRate,
    checkedIn,
    noShows,
    checkInRate,
  };
}

function computeIncidentMetrics(incidents = []) {
  const total = incidents.length;
  if (!total) {
    return {
      incidents: 100,
      totalIncidents: 0,
      openIncidents: 0,
      resolvedIncidents: 0,
      criticalIncidents: 0,
      highPriorityIncidents: 0,
      incidentHealth: 100,
    };
  }

  const open = incidents.filter((item) => !['CLOSED', 'VERIFIED', 'RESOLVED'].includes(String(item.status || '').toUpperCase())).length;
  const resolved = incidents.filter((item) => ['RESOLVED', 'VERIFIED', 'CLOSED'].includes(String(item.status || '').toUpperCase())).length;
  const critical = incidents.filter((item) => String(item.priority || '').toUpperCase() === 'CRITICAL').length;
  const high = incidents.filter((item) => String(item.priority || '').toUpperCase() === 'HIGH').length;
  const incidentHealth = Math.max(0, 100 - (open * 14) - (critical * 18) - (high * 8));

  return {
    incidents: clampTo100(incidentHealth),
    totalIncidents: total,
    openIncidents: open,
    resolvedIncidents: resolved,
    criticalIncidents: critical,
    highPriorityIncidents: high,
    incidentHealth: clampTo100(incidentHealth),
  };
}

function computeSponsorshipMetrics(proposals = [], payments = [], deliverables = [], sponsors = []) {
  const totalSponsorCount = sponsors.length || proposals.length;
  if (!totalSponsorCount && !payments.length && !deliverables.length) {
    return {
      sponsorship: 100,
      totalSponsors: 0,
      activeSponsors: 0,
      approvedProposals: 0,
      pendingPayments: 0,
      pendingDeliverables: 0,
      paymentCompletionRate: 100,
      deliverableCompletionRate: 100,
      sponsorshipHealth: 100,
    };
  }

  const activeSponsors = sponsors.filter((item) => String(item.status || '').toLowerCase() === 'active').length;
  const approved = proposals.filter((item) => String(item.status || '').toLowerCase() === 'approved').length;
  const pendingPayments = payments.filter((item) => Number(item.due_amount || 0) > 0 || String(item.status || '').toLowerCase() === 'pending').length;
  const pendingDeliverables = deliverables.filter((item) => ['pending', 'in progress', 'overdue'].includes(String(item.status || '').trim().toLowerCase())).length;
  const completionRate = deliverables.length ? Math.round((deliverables.filter((item) => String(item.status || '').toLowerCase() === 'completed').length / deliverables.length) * 100) : 100;
  const paymentRate = payments.length ? Math.round((payments.filter((item) => String(item.status || '').toLowerCase() === 'paid').length / payments.length) * 100) : 100;
  const sponsorshipScore = Math.max(0, Math.min(100, Math.round((completionRate * 0.55) + (paymentRate * 0.45))));

  return {
    sponsorship: sponsorshipScore,
    totalSponsors: totalSponsorCount,
    activeSponsors,
    approvedProposals: approved,
    pendingPayments,
    pendingDeliverables,
    paymentCompletionRate: paymentRate,
    deliverableCompletionRate: completionRate,
    sponsorshipHealth: sponsorshipScore,
  };
}

function computeOperationsMetrics(alerts = [], openIncidents = 0) {
  const openAlerts = alerts.filter((item) => !['RESOLVED', 'DISMISSED'].includes(String(item.status || '').toUpperCase())).length;
  const criticalAlerts = alerts.filter((item) => String(item.priority || '').toUpperCase() === 'CRITICAL' && !['RESOLVED', 'DISMISSED'].includes(String(item.status || '').toUpperCase())).length;
  const operationalScore = Math.max(0, 100 - (openAlerts * 12) - (criticalAlerts * 18) - (openIncidents * 6));

  return {
    operations: clampTo100(operationalScore),
    operationalHealth: clampTo100(operationalScore),
    activeAlerts: openAlerts,
    criticalAlerts,
  };
}

function buildEventIntelligence(input = {}) {
  const {
    event = {},
    registrations = [],
    attendance = [],
    incidents = [],
    proposals = [],
    payments = [],
    deliverables = [],
    alerts = [],
    sponsors = [],
  } = input;

  const registrationMetrics = computeRegistrationMetrics(registrations);
  const attendanceMetrics = computeAttendanceMetrics(attendance);
  const incidentMetrics = computeIncidentMetrics(incidents);
  const sponsorshipMetrics = computeSponsorshipMetrics(proposals, payments, deliverables, sponsors);
  const operationalMetrics = computeOperationsMetrics(alerts, incidentMetrics.openIncidents);

  const weights = { registration: 0.2, attendance: 0.2, incidents: 0.25, sponsorship: 0.15, operations: 0.2 };
  const metrics = {
    registration: registrationMetrics.registration,
    attendance: attendanceMetrics.attendance,
    incidents: incidentMetrics.incidents,
    sponsorship: sponsorshipMetrics.sponsorship,
    operations: operationalMetrics.operations,
  };

  const eventHealthScore = calculateHealthScore(metrics, weights);
  const healthStatus = getHealthStatus(eventHealthScore);

  // Identify lowest factor & construct primary factor explanation
  const dimensionNames = {
    registration: 'Registration',
    attendance: 'Attendance',
    incidents: 'Incident',
    sponsorship: 'Sponsorship',
    operations: 'Operational',
  };

  let lowestFactor = 'registration';
  let lowestScore = metrics.registration;

  Object.entries(metrics).forEach(([key, val]) => {
    if (val < lowestScore) {
      lowestScore = val;
      lowestFactor = key;
    }
  });

  const primaryReducingFactorReason = lowestScore >= 90
    ? 'All operational dimensions are functioning within expected healthy operating levels.'
    : `${dimensionNames[lowestFactor]} health (${lowestScore}/100) is currently the primary factor reducing the overall event health score.`;

  const riskList = detectRisks({
    registrationHealth: metrics.registration,
    attendanceHealth: metrics.attendance,
    incidentHealth: metrics.incidents,
    sponsorshipHealth: metrics.sponsorship,
    operationalHealth: metrics.operations,
  });

  const trendKey = {
    registration: analyseTrend(registrations.map((item) => Number(item?.trend_value ?? item?.score ?? 0)).filter((value) => Number.isFinite(value))),
    attendance: analyseTrend(attendance.map((item) => Number(item?.trend_value ?? item?.score ?? 0)).filter((value) => Number.isFinite(value))),
    incidents: analyseTrend(incidents.map((item) => Number(item?.trend_value ?? item?.score ?? 0)).filter((value) => Number.isFinite(value))),
    sponsorship: analyseTrend(payments.map((item) => Number(item?.amount || 0)).filter((value) => Number.isFinite(value))),
  };

  const directionMap = {
    IMPROVING: '↑',
    STABLE: '→',
    DECLINING: '↓',
    INSUFFICIENT_DATA: '?',
  };

  const trendsList = [
    { category: 'Registration', metricName: 'Registration Pipeline', trend: trendKey.registration, direction: directionMap[trendKey.registration] },
    { category: 'Attendance', metricName: 'Check-in Rate', trend: trendKey.attendance, direction: directionMap[trendKey.attendance] },
    { category: 'Incidents', metricName: 'Operational Incidents', trend: trendKey.incidents, direction: directionMap[trendKey.incidents] },
    { category: 'Sponsorship', metricName: 'Sponsorship Deliverables', trend: trendKey.sponsorship, direction: directionMap[trendKey.sponsorship] },
  ];

  const insights = generateAIInsights(metrics, riskList, trendKey);
  const recommendations = buildRecommendations(insights, riskList);
  const priorityActions = buildPriorityActions(recommendations);

  const healthBreakdown = {
    registration: { score: metrics.registration, status: getHealthStatus(metrics.registration), weight: '20%', weightValue: 0.2 },
    attendance: { score: metrics.attendance, status: getHealthStatus(metrics.attendance), weight: '20%', weightValue: 0.2 },
    incidents: { score: metrics.incidents, status: getHealthStatus(metrics.incidents), weight: '25%', weightValue: 0.25 },
    sponsorship: { score: metrics.sponsorship, status: getHealthStatus(metrics.sponsorship), weight: '15%', weightValue: 0.15 },
    operations: { score: metrics.operations, status: getHealthStatus(metrics.operations), weight: '20%', weightValue: 0.2 },
  };

  return {
    eventId: event?.id ?? event?.event_id ?? null,
    eventName: event?.name || 'Event Intelligence Engine',
    eventHealthScore,
    healthStatus,
    metrics,
    healthBreakdown,
    lowestFactor,
    primaryReducingFactorReason,
    risks: riskList,
    trends: trendsList,
    insights,
    recommendations,
    priorityActions,
    generatedAt: new Date().toISOString(),
    reason: primaryReducingFactorReason,
    breakdown: metrics,
    metadata: {
      registrationMetrics,
      attendanceMetrics,
      incidentMetrics,
      sponsorshipMetrics,
      operationalMetrics,
    },
  };
}

module.exports = {
  buildEventIntelligence,
  computeRegistrationMetrics,
  computeAttendanceMetrics,
  computeIncidentMetrics,
  computeSponsorshipMetrics,
  computeOperationsMetrics,
};
