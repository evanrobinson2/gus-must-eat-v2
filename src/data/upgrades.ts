export type UpgradeCategory = 'ship' | 'clone' | 'recipe';

export type UpgradeEffectType =
  | 'cargo_capacity'
  | 'weapon_damage'
  | 'shield_hits'
  | 'clone_efficiency'
  | 'clone_slots'
  | 'unlock_recipes';

export interface UpgradeEffect {
  type: UpgradeEffectType;
  value: number;
}

export type UpgradeId =
  | 'cargo_1'
  | 'cargo_2'
  | 'weapons_1'
  | 'weapons_2'
  | 'shields_1'
  | 'shields_2'
  | 'efficiency_1'
  | 'efficiency_2'
  | 'capacity_1'
  | 'capacity_2'
  | 'cookbook_1'
  | 'cookbook_2'
  | 'cookbook_3';

export interface Upgrade {
  id: UpgradeId;
  name: string;
  description: string;
  category: UpgradeCategory;
  cost: number;
  effect: UpgradeEffect;
  requires?: UpgradeId;  // Prerequisite upgrade
}

export const UPGRADES: Upgrade[] = [
  // ============================================================================
  // Ship Upgrades
  // ============================================================================
  {
    id: 'cargo_1',
    name: 'Cargo Bay I',
    description: 'Expanded storage racks. +2 cargo capacity.',
    category: 'ship',
    cost: 10,
    effect: { type: 'cargo_capacity', value: 2 },
  },
  {
    id: 'cargo_2',
    name: 'Cargo Bay II',
    description: 'Compressed storage system. +3 cargo capacity.',
    category: 'ship',
    cost: 25,
    effect: { type: 'cargo_capacity', value: 3 },
    requires: 'cargo_1',
  },
  {
    id: 'weapons_1',
    name: 'Weapons Array I',
    description: 'Improved targeting. +20% weapon damage.',
    category: 'ship',
    cost: 15,
    effect: { type: 'weapon_damage', value: 2 },
  },
  {
    id: 'weapons_2',
    name: 'Weapons Array II',
    description: 'Heavy cannons. +30% weapon damage.',
    category: 'ship',
    cost: 35,
    effect: { type: 'weapon_damage', value: 3 },
    requires: 'weapons_1',
  },
  {
    id: 'shields_1',
    name: 'Shield Generator I',
    description: 'Reinforced barrier. +1 shield hit.',
    category: 'ship',
    cost: 20,
    effect: { type: 'shield_hits', value: 1 },
  },
  {
    id: 'shields_2',
    name: 'Shield Generator II',
    description: 'Reactive shielding. +2 shield hits.',
    category: 'ship',
    cost: 45,
    effect: { type: 'shield_hits', value: 2 },
    requires: 'shields_1',
  },

  // ============================================================================
  // Clone Upgrades
  // ============================================================================
  {
    id: 'efficiency_1',
    name: 'Clone Training I',
    description: 'Better research protocols. +2 science per clone.',
    category: 'clone',
    cost: 10,
    effect: { type: 'clone_efficiency', value: 2 },
  },
  {
    id: 'efficiency_2',
    name: 'Clone Training II',
    description: 'Advanced methodologies. +3 science per clone.',
    category: 'clone',
    cost: 25,
    effect: { type: 'clone_efficiency', value: 3 },
    requires: 'efficiency_1',
  },
  {
    id: 'capacity_1',
    name: 'Clone Bay Expansion I',
    description: 'Additional cloning pod. +1 clone slot.',
    category: 'clone',
    cost: 30,
    effect: { type: 'clone_slots', value: 1 },
  },
  {
    id: 'capacity_2',
    name: 'Clone Bay Expansion II',
    description: 'Another cloning pod. +1 clone slot.',
    category: 'clone',
    cost: 60,
    effect: { type: 'clone_slots', value: 1 },
    requires: 'capacity_1',
  },

  // ============================================================================
  // Recipe Research
  // ============================================================================
  {
    id: 'cookbook_1',
    name: 'Cookbook Volume I',
    description: 'Research advanced recipes. Unlocks 2 new dishes.',
    category: 'recipe',
    cost: 15,
    effect: { type: 'unlock_recipes', value: 1 },
  },
  {
    id: 'cookbook_2',
    name: 'Cookbook Volume II',
    description: 'Complex culinary techniques. Unlocks 2 new dishes.',
    category: 'recipe',
    cost: 35,
    effect: { type: 'unlock_recipes', value: 2 },
    requires: 'cookbook_1',
  },
  {
    id: 'cookbook_3',
    name: 'Cookbook Volume III',
    description: 'Master chef secrets. Unlocks 2 ultimate dishes.',
    category: 'recipe',
    cost: 55,
    effect: { type: 'unlock_recipes', value: 3 },
    requires: 'cookbook_2',
  },
];

export function getUpgrade(id: UpgradeId): Upgrade {
  const upgrade = UPGRADES.find(u => u.id === id);
  if (!upgrade) throw new Error(`Unknown upgrade: ${id}`);
  return upgrade;
}

export function getUpgradesByCategory(category: UpgradeCategory): Upgrade[] {
  return UPGRADES.filter(u => u.category === category);
}

export function getAvailableUpgrades(purchased: Set<UpgradeId>): Upgrade[] {
  return UPGRADES.filter(u => {
    if (purchased.has(u.id)) return false;
    if (u.requires && !purchased.has(u.requires)) return false;
    return true;
  });
}
