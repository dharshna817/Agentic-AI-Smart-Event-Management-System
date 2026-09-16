function clampNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function analyseTrend(values = []) {
  const series = Array.isArray(values) ? values.map((value) => clampNumber(value, 0)) : [];

  if (series.length < 2) {
    return 'INSUFFICIENT_DATA';
  }

  const first = series[0];
  const last = series[series.length - 1];
  const delta = last - first;
  const range = Math.max(1, Math.abs(first));

  if (Math.abs(delta) <= Math.max(2, range * 0.05)) {
    return 'STABLE';
  }

  if (delta > 0) {
    return 'IMPROVING';
  }

  return 'DECLINING';
}

module.exports = {
  analyseTrend,
};
