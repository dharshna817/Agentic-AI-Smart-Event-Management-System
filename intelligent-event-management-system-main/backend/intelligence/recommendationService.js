function buildRecommendations(insights = [], risks = []) {
  const recommendations = [];

  if (insights.some((item) => /attendance|check-in|conversion/i.test(item))) {
    recommendations.push({
      id: 'REC-ATTENDANCE',
      title: 'Optimize check-in and attendance conversion',
      description: 'Deploy more front-of-house staff and streamline entry flow to improve attendance conversion.',
      reason: 'Attendance conversion is below target and directly affects event operational quality.',
      priority: 'P1',
      relatedRiskOrInsight: 'Attendance conversion',
      suggestedAction: 'Add staffing and simplify the check-in path at the main entrances.',
      expectedImpact: 'Improved on-time check-ins and reduced queue pressure.',
    });
  }

  if (insights.some((item) => /incident|risk|operations/i.test(item)) || risks.some((item) => item.category === 'Operations')) {
    recommendations.push({
      id: 'REC-OPERATIONS',
      title: 'Escalate unresolved operational issues',
      description: 'Review and escalate all active high- and critical-impact incident tickets to the operations lead.',
      reason: 'Operational risk is rising and unresolved issues are reducing the event health score.',
      priority: 'P1',
      relatedRiskOrInsight: 'Operational risk',
      suggestedAction: 'Assign owners to each critical incident and review recovery status every 30 minutes.',
      expectedImpact: 'Faster resolution and fewer disruptions during event execution.',
    });
  }

  if (insights.some((item) => /sponsor|deliverable|payment/i.test(item))) {
    recommendations.push({
      id: 'REC-SPONSOR',
      title: 'Review sponsor commitments and deliverables',
      description: 'Follow up on remaining sponsor payments and pending deliverables before event execution starts.',
      reason: 'Sponsor health is weakening and accuracy of partner fulfilment matters for event delivery and revenue.',
      priority: 'P2',
      relatedRiskOrInsight: 'Sponsorship health',
      suggestedAction: 'Notify sponsor contacts, confirm deadlines, and resolve overdue deliverables.',
      expectedImpact: 'Higher sponsor satisfaction and reduced revenue risk.',
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      id: 'REC-MONITOR',
      title: 'Maintain active monitoring',
      description: 'Continue routine operational monitoring and keep current alert thresholds in place.',
      reason: 'No critical issues are currently requiring intervention.',
      priority: 'P3',
      relatedRiskOrInsight: 'General monitoring',
      suggestedAction: 'Continue scheduled reviews of health metrics and operational alerts.',
      expectedImpact: 'Sustained event stability and early detection of emerging issues.',
    });
  }

  return recommendations;
}

function buildPriorityActions(recommendations = []) {
  const actions = recommendations.map((item) => ({
    ...item,
    priorityLevel: item.priority || 'P3',
  }));

  return actions.sort((a, b) => {
    const order = { P1: 1, P2: 2, P3: 3, P4: 4 };
    return (order[a.priorityLevel] ?? 99) - (order[b.priorityLevel] ?? 99);
  });
}

module.exports = {
  buildRecommendations,
  buildPriorityActions,
};
