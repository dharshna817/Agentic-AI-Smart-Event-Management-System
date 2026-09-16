function generateAIInsights(metrics = {}, risks = [], trends = {}) {
  const insights = [];
  const registration = Number(metrics.registration ?? 0);
  const attendance = Number(metrics.attendance ?? 0);
  const incidents = Number(metrics.incidents ?? 0);
  const sponsorship = Number(metrics.sponsorship ?? 0);
  const operations = Number(metrics.operations ?? 0);

  if (registration > 0 && attendance > 0 && registration >= attendance + 10) {
    insights.push('Registrations are strong, but the lower attendance conversion indicates a potential check-in or follow-up issue that should be reviewed before the event opens.');
  }

  if (attendance > 0 && attendance < 70) {
    insights.push('Attendance conversion is below the desired operating level, which could create staffing, venue, and resource inefficiencies on event day.');
  }

  if (incidents < 60) {
    insights.push('Operational risk is increasing because the current incident profile is dragging the event health score below the expected threshold.');
  }

  if (sponsorship !== null && sponsorship < 70) {
    insights.push('Sponsor health is weakening due to incomplete payments or deliverables, which could affect revenue confidence and partner satisfaction.');
  }

  if (operations < 70) {
    insights.push('Operations are under moderate strain; alerts and unresolved issues require a tighter response cadence to protect execution quality.');
  }

  if (risks.length === 0 && registration >= 80 && attendance >= 80 && incidents >= 75 && sponsorship >= 75 && operations >= 75) {
    insights.push('The event is operating in a healthy range, with strong registration, attendance, and operational stability across all major dimensions.');
  }

  if (trends.registration === 'DECLINING' || trends.attendance === 'DECLINING') {
    insights.push('The current trend indicates a declining attendance pattern, which should trigger proactive staffing and promotional interventions.');
  }

  return insights.slice(0, 4);
}

module.exports = {
  generateAIInsights,
};
