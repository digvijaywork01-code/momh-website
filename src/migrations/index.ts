// The old 20250728_070911 migration is intentionally NOT registered
// here. It was created in July 2025 before AppointmentForm + several
// block additions; re-applying it would build tables missing today's
// columns. The new `20260527_050504_initial_v2` migration was
// generated against an empty DB capturing the current schema in full,
// so applying it from a clean DB produces an exactly-correct schema.
import * as migration_20260527_050504_initial_v2 from './20260527_050504_initial_v2'

export const migrations = [
  {
    up: migration_20260527_050504_initial_v2.up,
    down: migration_20260527_050504_initial_v2.down,
    name: '20260527_050504_initial_v2',
  },
]
