export type IngredientId =
  | 'stardust'
  | 'void_salt'
  | 'nebula_nectar'
  | 'comet_tail'
  | 'singularity_seed'
  | 'solar_flare_pepper';

export type IngredientRarity = 'common' | 'uncommon' | 'rare';

export interface Ingredient {
  id: IngredientId;
  name: string;
  description: string;
  rarity: IngredientRarity;
  color: string;  // Hex color for UI
  spawnWeight: number;  // Higher = more common in asteroid fields
}

export const INGREDIENTS: Ingredient[] = [
  {
    id: 'stardust',
    name: 'Stardust',
    description: 'Glittering cosmic powder, remnants of ancient stars.',
    rarity: 'common',
    color: '#e0e0e0',
    spawnWeight: 30,
  },
  {
    id: 'void_salt',
    name: 'Void Salt',
    description: 'Dark crystalline substance from the spaces between galaxies.',
    rarity: 'common',
    color: '#1a1a2e',
    spawnWeight: 30,
  },
  {
    id: 'nebula_nectar',
    name: 'Nebula Nectar',
    description: 'Pink luminescent fluid harvested from stellar nurseries.',
    rarity: 'uncommon',
    color: '#c77dff',
    spawnWeight: 20,
  },
  {
    id: 'comet_tail',
    name: 'Comet Tail',
    description: 'Frozen strand of ice and cosmic dust.',
    rarity: 'uncommon',
    color: '#00d9ff',
    spawnWeight: 20,
  },
  {
    id: 'singularity_seed',
    name: 'Singularity Seed',
    description: 'A tiny, contained gravitational anomaly. Handle with care.',
    rarity: 'rare',
    color: '#4a0080',
    spawnWeight: 10,
  },
  {
    id: 'solar_flare_pepper',
    name: 'Solar Flare Pepper',
    description: 'Burning chunk of stellar plasma. Extremely spicy.',
    rarity: 'rare',
    color: '#ff6b35',
    spawnWeight: 10,
  },
];

export function getIngredient(id: IngredientId): Ingredient {
  const ingredient = INGREDIENTS.find(i => i.id === id);
  if (!ingredient) throw new Error(`Unknown ingredient: ${id}`);
  return ingredient;
}

export function getIngredientsByRarity(rarity: IngredientRarity): Ingredient[] {
  return INGREDIENTS.filter(i => i.rarity === rarity);
}

// Weighted random selection for asteroid spawning
export function randomIngredient(): IngredientId {
  const totalWeight = INGREDIENTS.reduce((sum, i) => sum + i.spawnWeight, 0);
  let random = Math.random() * totalWeight;

  for (const ingredient of INGREDIENTS) {
    random -= ingredient.spawnWeight;
    if (random <= 0) {
      return ingredient.id;
    }
  }

  return INGREDIENTS[0].id;
}
