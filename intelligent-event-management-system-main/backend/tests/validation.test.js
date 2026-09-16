const test = require("node:test");
const assert = require("node:assert/strict");

const { hasTimeOverlap, buildConflictMessage } = require("../lib/validation");

test("detects overlapping time ranges", () => {
  assert.equal(
    hasTimeOverlap(
      "2026-08-15T14:00:00",
      "2026-08-15T15:30:00",
      "2026-08-15T15:00:00",
      "2026-08-15T16:00:00",
    ),
    true,
  );

  assert.equal(
    hasTimeOverlap(
      "2026-08-15T14:00:00",
      "2026-08-15T15:00:00",
      "2026-08-15T15:00:00",
      "2026-08-15T16:00:00",
    ),
    false,
  );
});

test("builds a human-readable venue conflict message", () => {
  const message = buildConflictMessage(
    "Venue",
    "Hall B",
    "2026-08-15T14:00:00",
    "2026-08-15T15:30:00",
  );

  assert.match(message, /Venue conflict:/);
  assert.match(message, /Hall B/);
  assert.match(message, /14:00/);
});

test("rejects non-overlapping windows as valid", () => {
  assert.equal(
    hasTimeOverlap(
      "2026-08-15T09:00:00",
      "2026-08-15T10:00:00",
      "2026-08-15T10:30:00",
      "2026-08-15T11:00:00",
    ),
    false,
  );
});
