import * as migration_20250728_070911 from './20250728_070911';

export const migrations = [
  {
    up: migration_20250728_070911.up,
    down: migration_20250728_070911.down,
    name: '20250728_070911'
  },
];
