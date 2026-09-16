function normalizeScore(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.min(100, Math.max(0, numeric));
}

function priorityForSeverity(severity) {
  if (severity === 'CRITICAL') return 'P1';
  if (severity === 'HIGH') return 'P2';
  if (severity === 'MEDIUM') return 'P3';
  return 'P4';
}

function detectRisks(metrics = {}) {
  const registration = normalizeScore(metrics.registrationHealth ?? metrics.registration);
  const attendance = normalizeScore(metrics.attendanceHealth ?? metrics.attendance);
  const incidents = normalizeScore(metrics.incidentHealth ?? metrics.incidents);
  const sponsorship = normalizeScore(metrics.sponsorshipHealth ?? metrics.sponsorship);
  const operations = normalizeScore(metrics.operationalHealth ?? metrics.operations);

  const risks = [];

  if (registration < 75) {
    risks.push({
      id: 'RISK-REGISTRATION',
      title: 'Registration momentum is weakening',
      description: 'The registration pipeline is below the expected operating threshold and may reduce event demand.',
      category: 'Registration',
      severity: registration < 35 ? 'CRITICAL' : registration < 55 ? 'HIGH' : 'MEDIUM',
      priority: priorityForSeverity(registration < 35 ? 'CRITICAL' : registration < 55 ? 'HIGH' : 'MEDIUM'),
      impact: 'Lower pre-event conversion may constrain audience reach and revenue planning.',
      sourceMetric: 'registrationHealth',
      detectedAt: new Date().toISOString(),
      recommendedAction: 'Increase outreach and follow-up on pending registrations before the event day.',
    });
  }

  if (attendance < 75) {
    risks.push({
      id: 'RISK-ATTENDANCE',
      title: 'Attendance conversion is below target',
      description: 'A weak check-in percentage indicates the event may not be converting registrations into attendance.',
      category: 'Attendance',
      severity: attendance < 45 ? 'CRITICAL' : attendance < 60 ? 'HIGH' : 'MEDIUM',
      priority: priorityForSeverity(attendance < 45 ? 'CRITICAL' : attendance < 60 ? 'HIGH' : 'MEDIUM'),
      impact: 'Operational staffing and venue planning may be out of balance with actual attendance.',
      sourceMetric: 'attendanceHealth',
      detectedAt: new Date().toISOString(),
      recommendedAction: 'Deploy additional check-in support and review on-site entry flow bottlenecks.',
    });
  }

  if (incidents < 75) {
    risks.push({
      id: 'RISK-INCIDENTS',
      title: 'Operational risk is elevated',
      description: 'Incident health is deteriorating and unresolved issues may affect event continuity.',
      category: 'Operations',
      severity: incidents < 30 ? 'CRITICAL' : incidents < 50 ? 'HIGH' : 'MEDIUM',
      priority: priorityForSeverity(incidents < 30 ? 'CRITICAL' : incidents < 50 ? 'HIGH' : 'MEDIUM'),
      impact: 'Guest experience and staff efficiency may decline if major issues remain unresolved.',
      sourceMetric: 'incidentHealth',
      detectedAt: new Date().toISOString(),
      recommendedAction: 'Escalate unresolved high-severity incidents to the operations lead immediately.',
    });
  }

  if (sponsorship !== null && sponsorship < 75) {
    risks.push({
      id: 'RISK-SPONSORSHIP',
      title: 'Sponsor commitments are not fully on track',
      description: 'Sponsorship health is below expectation due to missed payments or incomplete deliverables.',
      category: 'Sponsorship',
      severity: sponsorship < 35 ? 'CRITICAL' : sponsorship < 55 ? 'HIGH' : 'MEDIUM',
      priority: priorityForSeverity(sponsorship < 35 ? 'CRITICAL' : sponsorship < 55 ? 'HIGH' : 'MEDIUM'),
      impact: 'Revenue assurance and sponsor experience may be impacted before and during the event.',
      sourceMetric: 'sponsorshipHealth',
      detectedAt: new Date().toISOString(),
      recommendedAction: 'Review pending sponsor invoices or deliverables and assign follow-up ownership.',
    });
  }

  if (operations < 75) {
    risks.push({
      id: 'RISK-OPERATIONS',
      title: 'Operational readiness is slipping',
      description: 'The event is showing stress in staffing, alert handling, or process readiness.',
      category: 'Operations',
      severity: operations < 35 ? 'CRITICAL' : operations < 55 ? 'HIGH' : 'MEDIUM',
      priority: priorityForSeverity(operations < 35 ? 'CRITICAL' : operations < 55 ? 'HIGH' : 'MEDIUM'),
      impact: 'Event execution risk may rise if operational issues remain unaddressed.',
      sourceMetric: 'operationalHealth',
      detectedAt: new Date().toISOString(),
      recommendedAction: 'Review active alerts and redistribute staffing focus to the most exposed operational functions.',
    });
  }

  return risks;
}

module.exports = {
  detectRisks,
};
