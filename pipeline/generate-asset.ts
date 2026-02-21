import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// Config
// ============================================================================

const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  // Try loading from parent .env
  const envPath = path.join(__dirname, '..', '..', 'roguelike', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/OPENAI_API_KEY=(.+)/);
    if (match) {
      process.env.OPENAI_API_KEY = match[1].trim();
    }
  }
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ============================================================================
// Style Guide
// ============================================================================

const STYLE_GUIDE = {
  iso_tile: `isometric pixel art, 2:1 diamond perspective viewed from above at 30 degrees, GBA-era aesthetic, limited palette of 16-24 colors, clean crisp pixels, no anti-aliasing, 1px dark outline on objects, transparent background`,

  pixel_character: `pixel art character sprite, GBA-era RPG style, 32x32 pixel character, limited palette of 12-16 colors, clean readable pixels, no anti-aliasing, 1px dark outline, transparent background`,

  item_icon: `pixel art item icon, clean 32x32 sprite, GBA-era aesthetic, vibrant colors, 1px dark outline, transparent background, game UI icon style`,

  portrait: `digital illustration, semi-realistic painted style with slight pixel art influence, rich colors, dramatic lighting, game character portrait`,

  scene_bg: `pixel art game background, detailed environment art, atmospheric lighting, GBA/DS-era aesthetic, limited but rich palette`,

  harvest_sprite: `top-down pixel art game sprite, clean readable at small size, vibrant colors, 1px dark outline, transparent background, arcade shooter style`,
};

// ============================================================================
// Asset Definitions
// ============================================================================

interface AssetDef {
  id: string;
  category: string;
  subdir: string;
  size: '1024x1024' | '1536x1024' | '1024x1536';
  style: keyof typeof STYLE_GUIDE;
  prompt: string;
}

const ASSETS: Record<string, AssetDef> = {
  // --- Isometric Tiles ---
  'tile_floor_metal': {
    id: 'tile_floor_metal',
    category: 'tiles',
    subdir: 'tiles',
    size: '1024x1024',
    style: 'iso_tile',
    prompt: 'A single isometric metal floor tile for a spaceship interior. Dark steel blue-gray metal plating with subtle panel lines and small rivets. Slight worn texture. The tile should be a single diamond-shaped isometric tile.',
  },
  'tile_floor_grating': {
    id: 'tile_floor_grating',
    category: 'tiles',
    subdir: 'tiles',
    size: '1024x1024',
    style: 'iso_tile',
    prompt: 'A single isometric floor grating tile for a spaceship. Metal grating with visible gaps showing darkness below, industrial look. Diamond-shaped isometric tile.',
  },
  'tile_wall_base': {
    id: 'tile_wall_base',
    category: 'tiles',
    subdir: 'tiles',
    size: '1024x1024',
    style: 'iso_tile',
    prompt: 'An isometric spaceship wall segment. Dark navy metal wall with cyan accent lights/strips along the base. Futuristic paneling. Shows the wall face and top edge in isometric view.',
  },

  // --- Room Furniture ---
  'furniture_bridge_console': {
    id: 'furniture_bridge_console',
    category: 'tiles',
    subdir: 'tiles',
    size: '1024x1024',
    style: 'iso_tile',
    prompt: 'An isometric spaceship command console/control panel. Large curved display screen showing star map, multiple smaller screens, holographic projections in cyan, buttons and switches. Sci-fi bridge station. Viewed from isometric perspective.',
  },
  'furniture_viewscreen': {
    id: 'furniture_viewscreen',
    category: 'tiles',
    subdir: 'tiles',
    size: '1536x1024',
    style: 'iso_tile',
    prompt: 'A large isometric spaceship viewscreen/window showing deep space with stars and a distant purple nebula. The frame is dark metal with cyan accent lighting. Wide panoramic screen mounted on a wall, seen from isometric perspective.',
  },
  'furniture_stove': {
    id: 'furniture_stove',
    category: 'tiles',
    subdir: 'tiles',
    size: '1024x1024',
    style: 'iso_tile',
    prompt: 'An isometric futuristic space kitchen cooking station. Glowing burners with blue flame, pots and pans, steam rising, ingredient containers nearby. Sci-fi galley equipment. Isometric perspective.',
  },
  'furniture_clone_tube': {
    id: 'furniture_clone_tube',
    category: 'tiles',
    subdir: 'tiles',
    size: '1024x1024',
    style: 'iso_tile',
    prompt: 'An isometric cloning tube/pod. Tall glass cylinder with green glowing liquid inside, a humanoid figure floating inside, bubbles rising, metal base and cap with tubes and wires. Sci-fi clone vat. Isometric perspective.',
  },
  'furniture_cargo_crate': {
    id: 'furniture_cargo_crate',
    category: 'tiles',
    subdir: 'tiles',
    size: '1024x1024',
    style: 'iso_tile',
    prompt: 'Isometric cargo crates stacked in a spaceship hold. Metal shipping containers in various sizes, some with glowing labels and hazard markings. Industrial space freight. Isometric perspective.',
  },
  'furniture_upgrade_terminal': {
    id: 'furniture_upgrade_terminal',
    category: 'tiles',
    subdir: 'tiles',
    size: '1024x1024',
    style: 'iso_tile',
    prompt: 'An isometric engineering upgrade terminal. A workbench with holographic display showing a ship schematic, tools scattered around, glowing circuit boards, soldering equipment. Sci-fi workshop station. Isometric perspective.',
  },

  // --- Player Character ---
  'char_player_down': {
    id: 'char_player_down',
    category: 'sprites',
    subdir: 'sprites',
    size: '1024x1024',
    style: 'pixel_character',
    prompt: 'A pixel art space pilot character walking sprite sheet. 4 frames of walking animation facing downward (toward camera). The character wears a blue flight suit with cyan accents, short brown hair, determined expression. Each frame shows a different step in the walk cycle. Arrange the 4 frames in a horizontal row. 32x32 pixels per frame.',
  },
  'char_player_up': {
    id: 'char_player_up',
    category: 'sprites',
    subdir: 'sprites',
    size: '1024x1024',
    style: 'pixel_character',
    prompt: 'A pixel art space pilot character walking sprite sheet. 4 frames of walking animation facing upward (away from camera). The character wears a blue flight suit with cyan accents, short brown hair. Back view. Each frame shows a different step in the walk cycle. Arrange the 4 frames in a horizontal row. 32x32 pixels per frame.',
  },
  'char_player_left': {
    id: 'char_player_left',
    category: 'sprites',
    subdir: 'sprites',
    size: '1024x1024',
    style: 'pixel_character',
    prompt: 'A pixel art space pilot character walking sprite sheet. 4 frames of walking animation facing left. The character wears a blue flight suit with cyan accents, short brown hair. Side profile view. Each frame shows a different step in the walk cycle. Arrange the 4 frames in a horizontal row. 32x32 pixels per frame.',
  },
  'char_player_right': {
    id: 'char_player_right',
    category: 'sprites',
    subdir: 'sprites',
    size: '1024x1024',
    style: 'pixel_character',
    prompt: 'A pixel art space pilot character walking sprite sheet. 4 frames of walking animation facing right. The character wears a blue flight suit with cyan accents, short brown hair. Side profile view. Each frame shows a different step in the walk cycle. Arrange the 4 frames in a horizontal row. 32x32 pixels per frame.',
  },

  // --- Gus Portrait ---
  'portrait_gus': {
    id: 'portrait_gus',
    category: 'portraits',
    subdir: 'portraits',
    size: '1024x1024',
    style: 'portrait',
    prompt: 'A dramatic portrait of Gus, a giant cosmic tardigrade creature. Gus is moon-sized, floating in deep space with stars behind. Purple and pink coloring with bioluminescent patches. Eight stubby chubby legs. Huge dopey eyes with a big open drooling mouth showing excitement about food. Cute but intimidating. Cosmic horror meets adorable pet energy. Rich purple, pink, and deep space colors.',
  },
  'portrait_gus_eating': {
    id: 'portrait_gus_eating',
    category: 'portraits',
    subdir: 'portraits',
    size: '1024x1024',
    style: 'portrait',
    prompt: 'A dramatic portrait of Gus, a giant cosmic tardigrade creature, happily eating. Closed eyes with a blissful satisfied expression, crumbs floating around in zero gravity. Purple and pink coloring with glowing bioluminescent spots. Eight stubby legs curled in contentment. Rich purple, pink, and deep space background.',
  },

  // --- Ingredient Icons ---
  'icon_stardust': {
    id: 'icon_stardust',
    category: 'items',
    subdir: 'items',
    size: '1024x1024',
    style: 'item_icon',
    prompt: 'A pixel art game icon of Stardust - a pile of shimmering white-silver cosmic powder with tiny sparkles and star-shaped glints. Magical glittering space dust. On transparent background.',
  },
  'icon_void_salt': {
    id: 'icon_void_salt',
    category: 'items',
    subdir: 'items',
    size: '1024x1024',
    style: 'item_icon',
    prompt: 'A pixel art game icon of Void Salt - dark purple-black crystalline chunks that seem to absorb light. Deep purple crystals with a faint dark aura. On transparent background.',
  },
  'icon_nebula_nectar': {
    id: 'icon_nebula_nectar',
    category: 'items',
    subdir: 'items',
    size: '1024x1024',
    style: 'item_icon',
    prompt: 'A pixel art game icon of Nebula Nectar - a small vial or droplet of glowing pink-purple luminescent liquid. Ethereal cosmic fluid that glows. On transparent background.',
  },
  'icon_comet_tail': {
    id: 'icon_comet_tail',
    category: 'items',
    subdir: 'items',
    size: '1024x1024',
    style: 'item_icon',
    prompt: 'A pixel art game icon of Comet Tail - a frozen cyan-blue ice crystal fragment trailing sparkles. Icy glowing comet debris. On transparent background.',
  },
  'icon_singularity_seed': {
    id: 'icon_singularity_seed',
    category: 'items',
    subdir: 'items',
    size: '1024x1024',
    style: 'item_icon',
    prompt: 'A pixel art game icon of Singularity Seed - a tiny dark purple-black orb with visible gravitational distortion warping space around it. A miniature contained black hole. On transparent background.',
  },
  'icon_solar_flare_pepper': {
    id: 'icon_solar_flare_pepper',
    category: 'items',
    subdir: 'items',
    size: '1024x1024',
    style: 'item_icon',
    prompt: 'A pixel art game icon of Solar Flare Pepper - a blazing orange-red pepper-shaped chunk of stellar plasma, radiating heat waves and small flames. Fiery cosmic food item. On transparent background.',
  },

  // --- Harvest Scene ---
  'harvest_player_ship': {
    id: 'harvest_player_ship',
    category: 'harvest',
    subdir: 'harvest',
    size: '1024x1024',
    style: 'harvest_sprite',
    prompt: 'A top-down view pixel art spaceship for an arcade shooter game. Small sleek blue and cyan spacecraft with glowing engine trails. Detailed hull plating, cockpit window, wing-mounted weapons. 64x64 pixel sprite. On transparent background.',
  },
  'harvest_asteroid_large': {
    id: 'harvest_asteroid_large',
    category: 'harvest',
    subdir: 'harvest',
    size: '1024x1024',
    style: 'harvest_sprite',
    prompt: 'A top-down pixel art large asteroid for a space shooter game. Craggy gray-brown space rock with visible craters, surface detail, and slight color variation. Chunky irregular shape. 48x48 pixel sprite. On transparent background.',
  },
  'harvest_asteroid_small': {
    id: 'harvest_asteroid_small',
    category: 'harvest',
    subdir: 'harvest',
    size: '1024x1024',
    style: 'harvest_sprite',
    prompt: 'A top-down pixel art small asteroid for a space shooter game. Small craggy space rock with one or two craters. Irregular rounded shape. 24x24 pixel sprite. On transparent background.',
  },
  'harvest_enemy': {
    id: 'harvest_enemy',
    category: 'harvest',
    subdir: 'harvest',
    size: '1024x1024',
    style: 'harvest_sprite',
    prompt: 'A top-down pixel art alien antibody enemy for a space shooter game. Organic blobby red-pink creature with pseudopods/tentacles, a single angry eye, pulsing with hostile energy. It is one of Gus the tardigrade\'s immune cells defending against the player. 32x32 pixel sprite. On transparent background.',
  },
  'harvest_bg_nebula': {
    id: 'harvest_bg_nebula',
    category: 'harvest',
    subdir: 'harvest',
    size: '1024x1024',
    style: 'scene_bg',
    prompt: 'A space background for an arcade shooter game. Deep dark space with a beautiful purple and blue nebula, distant stars of varying brightness, subtle cosmic dust clouds. Rich but dark enough to not distract from gameplay. No planets or large objects.',
  },
};

// ============================================================================
// Generation
// ============================================================================

async function generateAsset(assetId: string): Promise<string | null> {
  const def = ASSETS[assetId];
  if (!def) {
    console.error(`Unknown asset: ${assetId}`);
    console.log('Available assets:', Object.keys(ASSETS).join(', '));
    return null;
  }

  const fullPrompt = `${def.prompt}\n\nStyle: ${STYLE_GUIDE[def.style]}`;
  const outputDir = path.join(ASSETS_DIR, def.subdir);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `${def.id}.png`);

  console.log(`\nGenerating: ${def.id}`);
  console.log(`  Category: ${def.category}`);
  console.log(`  Size: ${def.size}`);
  console.log(`  Prompt: ${fullPrompt.substring(0, 120)}...`);

  try {
    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt: fullPrompt,
      n: 1,
      size: def.size,
    });

    // Handle both URL and b64_json response formats
    const imageData = response.data?.[0];
    if (!imageData) {
      console.error('  No image data in response');
      return null;
    }

    if (imageData.b64_json) {
      const buffer = Buffer.from(imageData.b64_json, 'base64');
      fs.writeFileSync(outputPath, buffer);
    } else if (imageData.url) {
      const imageResponse = await fetch(imageData.url);
      const arrayBuffer = await imageResponse.arrayBuffer();
      fs.writeFileSync(outputPath, Buffer.from(arrayBuffer));
    } else {
      console.error('  Response has neither b64_json nor url');
      return null;
    }

    console.log(`  Saved: ${outputPath}`);
    return outputPath;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`  Generation failed: ${msg}`);
    return null;
  }
}

// ============================================================================
// CLI
// ============================================================================

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--list') {
  console.log('Available assets:\n');
  const categories = new Map<string, string[]>();
  for (const [id, def] of Object.entries(ASSETS)) {
    const list = categories.get(def.category) || [];
    list.push(id);
    categories.set(def.category, list);
  }
  for (const [cat, ids] of categories) {
    console.log(`  ${cat}:`);
    for (const id of ids) {
      console.log(`    - ${id}`);
    }
  }
  console.log(`\nUsage: tsx pipeline/generate-asset.ts <asset_id> [asset_id2 ...]`);
  console.log('       tsx pipeline/generate-asset.ts --all');
  console.log('       tsx pipeline/generate-asset.ts --category tiles');
  process.exit(0);
}

async function main() {
  let assetIds: string[] = [];

  if (args[0] === '--all') {
    assetIds = Object.keys(ASSETS);
  } else if (args[0] === '--category') {
    const cat = args[1];
    assetIds = Object.entries(ASSETS)
      .filter(([_, def]) => def.category === cat)
      .map(([id]) => id);
    if (assetIds.length === 0) {
      console.error(`No assets in category: ${cat}`);
      process.exit(1);
    }
  } else {
    assetIds = args;
  }

  console.log(`Generating ${assetIds.length} asset(s)...\n`);

  const results: { id: string; path: string | null }[] = [];

  for (const id of assetIds) {
    const resultPath = await generateAsset(id);
    results.push({ id, path: resultPath });
  }

  console.log('\n=== Results ===');
  for (const r of results) {
    console.log(`  ${r.id}: ${r.path ? 'OK' : 'FAILED'}`);
  }
}

main().catch(console.error);
