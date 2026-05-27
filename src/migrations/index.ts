// Migrations array intentionally empty — production uses `push: true` on
// the postgresAdapter (see src/payload.config.ts) so schema is synced
// directly from the live block/collection config. The pre-existing July
// 2025 migration file in this folder predates major schema changes
// (AppointmentForm + recent block additions) and would corrupt the DB
// if re-applied. Switch back to migration-based deploys by:
//   1. Running `pnpm payload migrate:create --name <name>` to generate
//      a fresh migration from the current config
//   2. Re-importing the generated migration here
//   3. Setting `push: false` in postgresAdapter
//   4. Restoring `payload migrate && next build` in package.json's
//      `payload:migrate` script.
export const migrations = []

