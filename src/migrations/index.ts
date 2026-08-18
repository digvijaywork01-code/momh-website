import * as migration_20250728_070911 from './20250728_070911';
import * as migration_20260527_050504_initial_v2 from './20260527_050504_initial_v2';
import * as migration_20260818_104430_founders_vision_blocks from './20260818_104430_founders_vision_blocks';
import * as migration_20260818_123947_art_craftsmanship_blocks from './20260818_123947_art_craftsmanship_blocks';

export const migrations = [
  {
    up: migration_20250728_070911.up,
    down: migration_20250728_070911.down,
    name: '20250728_070911',
  },
  {
    up: migration_20260527_050504_initial_v2.up,
    down: migration_20260527_050504_initial_v2.down,
    name: '20260527_050504_initial_v2',
  },
  {
    up: migration_20260818_104430_founders_vision_blocks.up,
    down: migration_20260818_104430_founders_vision_blocks.down,
    name: '20260818_104430_founders_vision_blocks',
  },
  {
    up: migration_20260818_123947_art_craftsmanship_blocks.up,
    down: migration_20260818_123947_art_craftsmanship_blocks.down,
    name: '20260818_123947_art_craftsmanship_blocks'
  },
];
