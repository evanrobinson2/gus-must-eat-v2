import type { IngredientId } from './ingredients';

export interface RecipeEffect {
  gusModifier: number;    // Negative = slow Gus, Positive = speed up Gus
  earthModifier: number;  // Positive = speed up Earth
  duration: number;       // Ticks
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: Partial<Record<IngredientId, number>>;
  effect: RecipeEffect;
  tier: number;           // 0 = starting, 1-3 = unlockable
  requiresResearch: boolean;
}

export const RECIPES: Recipe[] = [
  // ============================================================================
  // Tier 0 - Starting Recipes
  // ============================================================================
  {
    id: 'dust_soup',
    name: 'Dust Soup',
    description: 'A simple broth of stardust. Mildly filling.',
    ingredients: { stardust: 2 },
    effect: { gusModifier: -1, earthModifier: 0, duration: 2 },
    tier: 0,
    requiresResearch: false,
  },
  {
    id: 'void_crackers',
    name: 'Void Crackers',
    description: 'Crunchy snacks that give Earth a slight boost.',
    ingredients: { void_salt: 2 },
    effect: { gusModifier: 0, earthModifier: 1, duration: 2 },
    tier: 0,
    requiresResearch: false,
  },
  {
    id: 'nebula_smoothie',
    name: 'Nebula Smoothie',
    description: 'Sweet and tangy. Gus loves it.',
    ingredients: { nebula_nectar: 1, stardust: 1 },
    effect: { gusModifier: -2, earthModifier: 0, duration: 1 },
    tier: 0,
    requiresResearch: false,
  },
  {
    id: 'comet_popsicle',
    name: 'Comet Popsicle',
    description: 'Frozen treat that energizes the ship.',
    ingredients: { comet_tail: 2 },
    effect: { gusModifier: 0, earthModifier: 2, duration: 1 },
    tier: 0,
    requiresResearch: false,
  },

  // ============================================================================
  // Tier 1 - Cookbook I
  // ============================================================================
  {
    id: 'singularity_stew',
    name: 'Singularity Stew',
    description: 'Dense and heavy. Slows Gus considerably.',
    ingredients: { singularity_seed: 1, void_salt: 1 },
    effect: { gusModifier: -3, earthModifier: 0, duration: 2 },
    tier: 1,
    requiresResearch: true,
  },
  {
    id: 'solar_flare_wings',
    name: 'Solar Flare Wings',
    description: 'Spicy! Gives Earth a burst of speed.',
    ingredients: { solar_flare_pepper: 1, stardust: 1 },
    effect: { gusModifier: 0, earthModifier: 3, duration: 1 },
    tier: 1,
    requiresResearch: true,
  },

  // ============================================================================
  // Tier 2 - Cookbook II
  // ============================================================================
  {
    id: 'cosmic_casserole',
    name: 'Cosmic Casserole',
    description: 'A hearty mix of common and uncommon ingredients. Long-lasting effect.',
    ingredients: { stardust: 1, void_salt: 1, nebula_nectar: 1, comet_tail: 1 },
    effect: { gusModifier: -2, earthModifier: 0, duration: 4 },
    tier: 2,
    requiresResearch: true,
  },
  {
    id: 'event_horizon_cake',
    name: 'Event Horizon Cake',
    description: 'So delicious Gus completely stops to savor it.',
    ingredients: { singularity_seed: 1, nebula_nectar: 1 },
    effect: { gusModifier: -999, earthModifier: 0, duration: 1 }, // Gus skips a tick
    tier: 2,
    requiresResearch: true,
  },

  // ============================================================================
  // Tier 3 - Cookbook III
  // ============================================================================
  {
    id: 'everything_bagel',
    name: 'The Everything Bagel',
    description: 'Contains a bit of everything in the cosmos.',
    ingredients: {
      stardust: 1,
      void_salt: 1,
      nebula_nectar: 1,
      comet_tail: 1,
      singularity_seed: 1,
      solar_flare_pepper: 1,
    },
    effect: { gusModifier: -5, earthModifier: 0, duration: 3 },
    tier: 3,
    requiresResearch: true,
  },
  {
    id: 'tardigrade_tart',
    name: 'Tardigrade Tart',
    description: 'Made specifically for tardigrade taste buds. Induces deep sleep.',
    ingredients: { singularity_seed: 2, solar_flare_pepper: 1 },
    effect: { gusModifier: -999, earthModifier: 0, duration: 2 }, // Gus sleeps for 2 ticks
    tier: 3,
    requiresResearch: true,
  },

  // ============================================================================
  // Mystery Mush (failed recipe)
  // ============================================================================
  {
    id: 'mystery_mush',
    name: 'Mystery Mush',
    description: 'Something went wrong. Gus is not pleased.',
    ingredients: {},  // Special case - made from invalid combinations
    effect: { gusModifier: 1, earthModifier: 0, duration: 1 },
    tier: -1,
    requiresResearch: false,
  },
];

export function getRecipe(id: string): Recipe | undefined {
  return RECIPES.find(r => r.id === id);
}

export function getRecipesByTier(tier: number): Recipe[] {
  return RECIPES.filter(r => r.tier === tier);
}

export function findMatchingRecipe(ingredients: Partial<Record<IngredientId, number>>): Recipe | undefined {
  // Check if ingredients match any known recipe exactly
  for (const recipe of RECIPES) {
    if (recipe.id === 'mystery_mush') continue;

    const recipeKeys = Object.keys(recipe.ingredients).sort();
    const inputKeys = Object.keys(ingredients).sort();

    if (recipeKeys.length !== inputKeys.length) continue;
    if (!recipeKeys.every((k, i) => k === inputKeys[i])) continue;

    const matches = recipeKeys.every(key => {
      const id = key as IngredientId;
      return recipe.ingredients[id] === ingredients[id];
    });

    if (matches) return recipe;
  }

  return undefined;
}
