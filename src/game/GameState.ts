import { type IngredientId } from '../data/ingredients';
import { RECIPES, type Recipe } from '../data/recipes';
import { UPGRADES, type UpgradeId } from '../data/upgrades';
import { logger } from '../utils/logger';

// ============================================================================
// Types
// ============================================================================

export interface RaceState {
  earthPosition: number;
  gusPosition: number;
  earthSpeed: number;
  gusSpeed: number;
  earthModifier: number;  // Temporary bonus/penalty
  gusModifier: number;    // Temporary bonus/penalty
  modifierDuration: number; // Ticks remaining
  tick: number;
}

export interface Inventory {
  [key: string]: number;  // ingredientId -> count
}

export interface CloneState {
  totalSlots: number;
  deployedCount: number;
  efficiency: number;  // Science per clone per mission
}

export interface ShipState {
  cargoCapacity: number;
  currentCargo: number;
  weaponDamage: number;
  shieldHits: number;
  maxShieldHits: number;
}

export interface UpgradeState {
  purchased: Set<UpgradeId>;
}

export interface RecipeState {
  unlocked: Set<string>;  // Recipe IDs
}

export interface GameState {
  race: RaceState;
  inventory: Inventory;
  science: number;
  clones: CloneState;
  ship: ShipState;
  upgrades: UpgradeState;
  recipes: RecipeState;
  currentLocation: ShipLocation;
  gameOver: boolean;
  victory: boolean;
}

export type ShipLocation = 'bridge' | 'galley' | 'engineering' | 'clonebay' | 'cargo';

// ============================================================================
// Constants
// ============================================================================

const TRACK_LENGTH = 100;
const EARTH_START = 50;
const GUS_START = 0;
const BASE_EARTH_SPEED = 2;
const BASE_GUS_SPEED = 3;
const BASE_CLONE_SLOTS = 2;
const BASE_CLONE_EFFICIENCY = 5;
const BASE_CARGO_CAPACITY = 10;
const BASE_WEAPON_DAMAGE = 10;
const BASE_SHIELD_HITS = 2;

// ============================================================================
// State Management
// ============================================================================

function createInitialState(): GameState {
  // Start with basic recipes unlocked
  const unlockedRecipes = new Set<string>();
  RECIPES.filter(r => !r.requiresResearch).forEach(r => unlockedRecipes.add(r.id));

  return {
    race: {
      earthPosition: EARTH_START,
      gusPosition: GUS_START,
      earthSpeed: BASE_EARTH_SPEED,
      gusSpeed: BASE_GUS_SPEED,
      earthModifier: 0,
      gusModifier: 0,
      modifierDuration: 0,
      tick: 0,
    },
    inventory: {},
    science: 0,
    clones: {
      totalSlots: BASE_CLONE_SLOTS,
      deployedCount: 0,
      efficiency: BASE_CLONE_EFFICIENCY,
    },
    ship: {
      cargoCapacity: BASE_CARGO_CAPACITY,
      currentCargo: 0,
      weaponDamage: BASE_WEAPON_DAMAGE,
      shieldHits: BASE_SHIELD_HITS,
      maxShieldHits: BASE_SHIELD_HITS,
    },
    upgrades: {
      purchased: new Set(),
    },
    recipes: {
      unlocked: unlockedRecipes,
    },
    currentLocation: 'bridge',
    gameOver: false,
    victory: false,
  };
}

let state: GameState = createInitialState();

// ============================================================================
// Public API
// ============================================================================

export function getState(): GameState {
  return state;
}

export function resetState(): void {
  state = createInitialState();
  clearSave();
  logger.info('Game state reset');
}

export function setLocation(location: ShipLocation): void {
  state.currentLocation = location;
  logger.debug('Location changed', { location });
}

// ============================================================================
// Race Management
// ============================================================================

export function tickRace(): { gameOver: boolean; victory: boolean } {
  const { race } = state;

  // Apply modifiers
  const effectiveGusSpeed = race.gusSpeed + race.gusModifier;
  const effectiveEarthSpeed = race.earthSpeed + race.earthModifier;

  // Move entities
  race.gusPosition += Math.max(0, effectiveGusSpeed);
  race.earthPosition += effectiveEarthSpeed;

  // Decay modifiers
  if (race.modifierDuration > 0) {
    race.modifierDuration--;
    if (race.modifierDuration === 0) {
      race.earthModifier = 0;
      race.gusModifier = 0;
      logger.debug('Recipe effects expired');
    }
  }

  race.tick++;

  logger.info('Race tick', {
    tick: race.tick,
    gus: race.gusPosition,
    earth: race.earthPosition,
  });

  // Check win/lose
  if (race.earthPosition >= TRACK_LENGTH) {
    state.victory = true;
    state.gameOver = true;
    logger.info('Victory! Earth reached the flywheel');
    clearSave();
    return { gameOver: true, victory: true };
  }

  if (race.gusPosition >= race.earthPosition) {
    state.victory = false;
    state.gameOver = true;
    logger.info('Defeat! Gus caught Earth');
    clearSave();
    return { gameOver: true, victory: false };
  }

  saveToStorage();
  return { gameOver: false, victory: false };
}

export function applyRecipeEffect(gusModifier: number, earthModifier: number, duration: number): void {
  state.race.gusModifier = gusModifier;
  state.race.earthModifier = earthModifier;
  state.race.modifierDuration = duration;
  logger.info('Recipe effect applied', { gusModifier, earthModifier, duration });
}

// ============================================================================
// Inventory Management
// ============================================================================

export function addIngredient(ingredientId: IngredientId, count: number = 1): boolean {
  const newTotal = (state.inventory[ingredientId] || 0) + count;
  const newCargo = state.ship.currentCargo + count;

  if (newCargo > state.ship.cargoCapacity) {
    logger.warn('Cargo full, cannot add ingredient', { ingredientId, count });
    return false;
  }

  state.inventory[ingredientId] = newTotal;
  state.ship.currentCargo = newCargo;
  logger.debug('Ingredient added', { ingredientId, count, total: newTotal });
  return true;
}

export function removeIngredient(ingredientId: IngredientId, count: number = 1): boolean {
  const current = state.inventory[ingredientId] || 0;
  if (current < count) {
    logger.warn('Not enough ingredients', { ingredientId, have: current, need: count });
    return false;
  }

  state.inventory[ingredientId] = current - count;
  state.ship.currentCargo -= count;
  logger.debug('Ingredient removed', { ingredientId, count });
  return true;
}

export function getIngredientCount(ingredientId: IngredientId): number {
  return state.inventory[ingredientId] || 0;
}

export function hasIngredients(requirements: Record<string, number>): boolean {
  for (const [id, count] of Object.entries(requirements)) {
    if (getIngredientCount(id as IngredientId) < count) {
      return false;
    }
  }
  return true;
}

// ============================================================================
// Science Management
// ============================================================================

export function addScience(amount: number): void {
  state.science += amount;
  logger.debug('Science added', { amount, total: state.science });
}

export function spendScience(amount: number): boolean {
  if (state.science < amount) {
    logger.warn('Not enough science', { have: state.science, need: amount });
    return false;
  }
  state.science -= amount;
  logger.debug('Science spent', { amount, remaining: state.science });
  return true;
}

// ============================================================================
// Clone Management
// ============================================================================

export function deployClones(count: number): number {
  const available = state.clones.totalSlots - state.clones.deployedCount;
  const toAdd = Math.min(count, available);
  state.clones.deployedCount += toAdd;
  logger.debug('Clones deployed', { count: toAdd });
  return toAdd;
}

export function returnClones(): number {
  const scienceEarned = state.clones.deployedCount * state.clones.efficiency;
  const returned = state.clones.deployedCount;
  state.clones.deployedCount = 0;
  addScience(scienceEarned);
  logger.info('Clones returned', { count: returned, science: scienceEarned });
  return scienceEarned;
}

// ============================================================================
// Upgrade Management
// ============================================================================

export function canPurchaseUpgrade(upgradeId: UpgradeId): boolean {
  const upgrade = UPGRADES.find(u => u.id === upgradeId);
  if (!upgrade) return false;
  if (state.upgrades.purchased.has(upgradeId)) return false;
  if (upgrade.requires && !state.upgrades.purchased.has(upgrade.requires)) return false;
  if (state.science < upgrade.cost) return false;
  return true;
}

export function purchaseUpgrade(upgradeId: UpgradeId): boolean {
  if (!canPurchaseUpgrade(upgradeId)) return false;

  const upgrade = UPGRADES.find(u => u.id === upgradeId)!;
  spendScience(upgrade.cost);
  state.upgrades.purchased.add(upgradeId);

  // Apply upgrade effect
  switch (upgrade.effect.type) {
    case 'cargo_capacity':
      state.ship.cargoCapacity += upgrade.effect.value;
      break;
    case 'weapon_damage':
      state.ship.weaponDamage += upgrade.effect.value;
      break;
    case 'shield_hits':
      state.ship.maxShieldHits += upgrade.effect.value;
      state.ship.shieldHits += upgrade.effect.value;
      break;
    case 'clone_efficiency':
      state.clones.efficiency += upgrade.effect.value;
      break;
    case 'clone_slots':
      state.clones.totalSlots += upgrade.effect.value;
      break;
    case 'unlock_recipes':
      // Unlock next tier of recipes
      const tier = upgrade.effect.value;
      RECIPES.filter(r => r.tier === tier).forEach(r => state.recipes.unlocked.add(r.id));
      break;
  }

  logger.info('Upgrade purchased', { upgradeId, effect: upgrade.effect });
  saveToStorage();
  return true;
}

// ============================================================================
// Recipe Management
// ============================================================================

export function getUnlockedRecipes(): Recipe[] {
  return RECIPES.filter(r => state.recipes.unlocked.has(r.id));
}

export function cookRecipe(recipeId: string): boolean {
  const recipe = RECIPES.find(r => r.id === recipeId);
  if (!recipe) {
    logger.warn('Recipe not found', { recipeId });
    return false;
  }

  if (!state.recipes.unlocked.has(recipeId)) {
    logger.warn('Recipe not unlocked', { recipeId });
    return false;
  }

  if (!hasIngredients(recipe.ingredients)) {
    logger.warn('Missing ingredients for recipe', { recipeId });
    return false;
  }

  // Consume ingredients
  for (const [id, count] of Object.entries(recipe.ingredients)) {
    removeIngredient(id as IngredientId, count);
  }

  // Apply effect
  applyRecipeEffect(recipe.effect.gusModifier, recipe.effect.earthModifier, recipe.effect.duration);

  logger.info('Recipe cooked', { recipeId, effect: recipe.effect });
  saveToStorage();
  return true;
}

// ============================================================================
// Ship Management
// ============================================================================

export function takeDamage(): boolean {
  state.ship.shieldHits--;
  logger.debug('Shield hit', { remaining: state.ship.shieldHits });
  return state.ship.shieldHits <= 0;
}

export function repairShields(): void {
  state.ship.shieldHits = state.ship.maxShieldHits;
  logger.debug('Shields repaired', { shields: state.ship.shieldHits });
}

// ============================================================================
// Serialization & Persistence
// ============================================================================

const SAVE_KEY = 'gus_must_eat_save';

export function serializeState(): string {
  return JSON.stringify({
    ...state,
    upgrades: {
      purchased: Array.from(state.upgrades.purchased),
    },
    recipes: {
      unlocked: Array.from(state.recipes.unlocked),
    },
  });
}

export function deserializeState(json: string): void {
  const parsed = JSON.parse(json);
  state = {
    ...parsed,
    upgrades: {
      purchased: new Set(parsed.upgrades.purchased),
    },
    recipes: {
      unlocked: new Set(parsed.recipes.unlocked),
    },
  };
  logger.info('State loaded from save');
}

export function saveToStorage(): void {
  try {
    localStorage.setItem(SAVE_KEY, serializeState());
    logger.debug('Game saved to localStorage');
  } catch (e) {
    logger.warn('Failed to save game', e);
  }
}

export function loadFromStorage(): boolean {
  try {
    const data = localStorage.getItem(SAVE_KEY);
    if (data) {
      deserializeState(data);
      if (state.gameOver) {
        // Don't restore a finished game
        resetState();
        return false;
      }
      logger.info('Game loaded from localStorage');
      return true;
    }
  } catch (e) {
    logger.warn('Failed to load game', e);
  }
  return false;
}

export function clearSave(): void {
  localStorage.removeItem(SAVE_KEY);
  logger.debug('Save data cleared');
}
