// Ship layout: 0=void, 1=metal floor, 2=grating floor, 3=wall
// The ship is oriented with bridge at top, cargo at bottom
// 20 cols x 16 rows

export const TILE_W = 64; // isometric diamond width
export const TILE_H = 32; // isometric diamond height

export const MAP_COLS = 20;
export const MAP_ROWS = 16;

// prettier-ignore
export const SHIP_GRID: number[][] = [
  // col: 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19
  /*  0 */ [0, 0, 0, 0, 0, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 0, 0, 0, 0, 0],
  /*  1 */ [0, 0, 0, 0, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 0, 0, 0, 0],
  /*  2 */ [0, 0, 0, 0, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 0, 0, 0, 0],
  /*  3 */ [0, 0, 0, 0, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 0, 0, 0, 0],
  /*  4 */ [0, 0, 0, 0, 3, 3, 3, 3, 2, 2, 2, 2, 3, 3, 3, 3, 0, 0, 0, 0],
  /*  5 */ [0, 3, 3, 3, 3, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 3, 3, 3, 3, 0],
  /*  6 */ [0, 3, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 3, 0],
  /*  7 */ [0, 3, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 3, 0],
  /*  8 */ [0, 3, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 3, 0],
  /*  9 */ [0, 3, 3, 3, 3, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 3, 3, 3, 3, 0],
  /* 10 */ [0, 0, 0, 0, 3, 3, 3, 3, 2, 2, 2, 2, 3, 3, 3, 3, 0, 0, 0, 0],
  /* 11 */ [0, 3, 3, 3, 3, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 3, 3, 3, 3, 0],
  /* 12 */ [0, 3, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 3, 0],
  /* 13 */ [0, 3, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 3, 0],
  /* 14 */ [0, 3, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 3, 0],
  /* 15 */ [0, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 0],
];

export type RoomId = 'bridge' | 'galley' | 'engineering' | 'clonebay' | 'cargo' | 'corridor';

export interface FurnitureDef {
  id: string;
  texture: string;
  col: number;
  row: number;
  room: RoomId;
  interactable: boolean;
  scale?: number;
  offsetY?: number; // pixel offset for tall objects
}

export const FURNITURE: FurnitureDef[] = [
  // Bridge (rows 1-3, cols 5-14)
  { id: 'viewscreen',   texture: 'furniture_viewscreen',      col: 9,  row: 1,  room: 'bridge',      interactable: false, scale: 0.4, offsetY: -30 },
  { id: 'console',      texture: 'furniture_bridge_console',  col: 9,  row: 3,  room: 'bridge',      interactable: true,  scale: 0.35, offsetY: -10 },

  // Galley (rows 6-8, cols 2-7)
  { id: 'stove',        texture: 'furniture_stove',           col: 4,  row: 7,  room: 'galley',      interactable: true,  scale: 0.3 },

  // Engineering (rows 6-8, cols 12-17)
  { id: 'terminal',     texture: 'furniture_upgrade_terminal', col: 15, row: 7,  room: 'engineering', interactable: true,  scale: 0.35 },

  // Clone Bay (rows 12-14, cols 2-7)
  { id: 'tube1',        texture: 'furniture_clone_tube',      col: 3,  row: 13, room: 'clonebay',    interactable: true,  scale: 0.25, offsetY: -20 },
  { id: 'tube2',        texture: 'furniture_clone_tube',      col: 5,  row: 13, room: 'clonebay',    interactable: false, scale: 0.25, offsetY: -20 },

  // Cargo (rows 12-14, cols 12-17)
  { id: 'crates',       texture: 'furniture_cargo_crate',     col: 15, row: 13, room: 'cargo',       interactable: true,  scale: 0.3 },
];

// Interaction zones: map tile positions to rooms
export interface InteractionZone {
  room: RoomId;
  col: number;
  row: number;
  label: string;
}

export const INTERACTION_ZONES: InteractionZone[] = [
  { room: 'bridge',      col: 9,  row: 3,  label: 'Bridge Console' },
  { room: 'galley',      col: 4,  row: 7,  label: 'Cooking Station' },
  { room: 'engineering', col: 15, row: 7,  label: 'Upgrade Terminal' },
  { room: 'clonebay',    col: 3,  row: 13, label: 'Clone Tubes' },
  { room: 'cargo',       col: 15, row: 13, label: 'Cargo Crates' },
];

// Player spawn position
export const PLAYER_START = { col: 9, row: 5 };

// Convert tile coords to screen (isometric)
export function tileToScreen(col: number, row: number): { x: number; y: number } {
  return {
    x: (col - row) * (TILE_W / 2),
    y: (col + row) * (TILE_H / 2),
  };
}

// Convert screen coords to tile (inverse isometric)
export function screenToTile(x: number, y: number): { col: number; row: number } {
  const col = Math.round((x / (TILE_W / 2) + y / (TILE_H / 2)) / 2);
  const row = Math.round((y / (TILE_H / 2) - x / (TILE_W / 2)) / 2);
  return { col, row };
}

// Check if a tile is walkable
export function isWalkable(col: number, row: number): boolean {
  if (row < 0 || row >= MAP_ROWS || col < 0 || col >= MAP_COLS) return false;
  const tile = SHIP_GRID[row][col];
  return tile === 1 || tile === 2;
}
