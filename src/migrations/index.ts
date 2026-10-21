import * as migration_20250728_070911 from './20250728_070911';
import * as migration_20260527_050504_initial_v2 from './20260527_050504_initial_v2';
import * as migration_20260818_104430_founders_vision_blocks from './20260818_104430_founders_vision_blocks';
import * as migration_20260818_123947_art_craftsmanship_blocks from './20260818_123947_art_craftsmanship_blocks';
import * as migration_20260827_095503_architecture_blocks from './20260827_095503_architecture_blocks';
import * as migration_20260902_073136_art_craftsmanship_overlay_cards from './20260902_073136_art_craftsmanship_overlay_cards';
import * as migration_20260902_103528_flux_single_carousel from './20260902_103528_flux_single_carousel';
import * as migration_20261007_121934_privacy_policy_blocks from './20261007_121934_privacy_policy_blocks';
import * as migration_20261016_104012_contact_page_fields from './20261016_104012_contact_page_fields';
import * as migration_20261017_100728_press_grid_block from './20261017_100728_press_grid_block';
import * as migration_20261021_093343_site_map_block from './20261021_093343_site_map_block';
import * as migration_20261021_115510_review_carousel_block from './20261021_115510_review_carousel_block';

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
    name: '20260818_123947_art_craftsmanship_blocks',
  },
  {
    up: migration_20260827_095503_architecture_blocks.up,
    down: migration_20260827_095503_architecture_blocks.down,
    name: '20260827_095503_architecture_blocks',
  },
  {
    up: migration_20260902_073136_art_craftsmanship_overlay_cards.up,
    down: migration_20260902_073136_art_craftsmanship_overlay_cards.down,
    name: '20260902_073136_art_craftsmanship_overlay_cards',
  },
  {
    up: migration_20260902_103528_flux_single_carousel.up,
    down: migration_20260902_103528_flux_single_carousel.down,
    name: '20260902_103528_flux_single_carousel',
  },
  {
    up: migration_20261007_121934_privacy_policy_blocks.up,
    down: migration_20261007_121934_privacy_policy_blocks.down,
    name: '20261007_121934_privacy_policy_blocks',
  },
  {
    up: migration_20261016_104012_contact_page_fields.up,
    down: migration_20261016_104012_contact_page_fields.down,
    name: '20261016_104012_contact_page_fields',
  },
  {
    up: migration_20261017_100728_press_grid_block.up,
    down: migration_20261017_100728_press_grid_block.down,
    name: '20261017_100728_press_grid_block',
  },
  {
    up: migration_20261021_093343_site_map_block.up,
    down: migration_20261021_093343_site_map_block.down,
    name: '20261021_093343_site_map_block',
  },
  {
    up: migration_20261021_115510_review_carousel_block.up,
    down: migration_20261021_115510_review_carousel_block.down,
    name: '20261021_115510_review_carousel_block'
  },
];
