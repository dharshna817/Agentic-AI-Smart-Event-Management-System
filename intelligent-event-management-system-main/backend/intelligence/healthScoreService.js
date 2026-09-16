const DEFAULT_WEIGHTS = {
  registration: 0.2,
  attendance: 0.2,
  incidents: 0.25,
  sponsorship: 0.15,
  operations: 0.2,
};

function clampScore(value, min = 0, max = 100) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.min(max, Math.max(min, numeric));
}

function calculateHealthScore(metrics = {}, weights = DEFAULT_WEIGHTS) {
  const entries = Object.entries(weights)
    .map(([key, weight]) => {
      const raw = metrics[key];
      if (raw === null || raw === undefined || raw === 'N/A') {
        return null;
      }
      const numeric = clampScore(raw, 0, 100);
      return { key, value: numeric, weight: Number(weight) || 0 };
    })
    .filter(Boolean);

  if (!entries.length) {
    return 0;
  }

  const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);
  const weightedTotal = entries.reduce((sum, entry) => sum + (entry.value * entry.weight), 0);

  if (totalWeight <= 0) {
    return 0;
  }

  return Math.round((weightedTotal / totalWeight) * 10) / 10;
}

function getHealthStatus(score) {
  const numeric = clampScore(score, 0, 100);

  if (numeric >= 90) return 'EXCELLENT';
  if (numeric >= 75) return 'HEALTHY';
  if (numeric >= 60) return 'WARNING';
  if (numeric >= 40) return 'CRITICAL';
  return 'SEVERE';
}

module.exports = {
  DEFAULT_WEIGHTS,
  calculateHealthScore,
  getHealthStatus,
};
