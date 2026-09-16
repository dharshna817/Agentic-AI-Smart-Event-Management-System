const isProduction = process.env.NODE_ENV === 'production'

function safeStringify(obj) {
  try {
    return JSON.stringify(obj)
  } catch (e) {
    return String(obj)
  }
}

function write(entry) {
  if (isProduction) {
    // Emit a single-line JSON object for log aggregation
    console.log(safeStringify(entry))
  } else {
    // Pretty-print during development
    console.log(safeStringify(entry, null, 2))
  }
}

function log(level, message, meta = {}) {
  const entry = Object.assign({
    timestamp: new Date().toISOString(),
    level,
    message,
  }, meta)
  write(entry)
}

module.exports = {
  info: (msg, meta) => log('info', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  error: (msg, meta) => log('error', msg, meta),
  debug: (msg, meta) => log('debug', msg, meta),
}
