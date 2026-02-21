import Phaser from 'phaser';
import { getState, getIngredientCount } from '../GameState';
import { INGREDIENTS, type IngredientId } from '../../data/ingredients';
import { sfx } from '../../utils/sfx';

const CYAN = '#00d9ff';
const GREEN = '#00ff88';
const RED = '#ff0054';
const YELLOW = '#ffcc00';
const WHITE = '#e0e0e0';
const GRAY = '#606060';
const PANEL_BG = 0x16213e;
const BTN_BORDER = 0x00d9ff;

const ICON_MAP: Record<string, string> = {
  stardust: 'icon_stardust',
  void_salt: 'icon_void_salt',
  nebula_nectar: 'icon_nebula_nectar',
  comet_tail: 'icon_comet_tail',
  singularity_seed: 'icon_singularity_seed',
  solar_flare_pepper: 'icon_solar_flare_pepper',
};

const RARITY_COLORS: Record<string, string> = {
  common: WHITE,
  uncommon: '#c77dff',
  rare: '#ff6b35',
};

export class CargoUI extends Phaser.Scene {
  private escKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'CargoUI' });
  }

  create(): void {
    const { width: W, height: H } = this.cameras.main;

    // Dark overlay
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7);
    overlay.setInteractive();

    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.escKey.on('down', () => this.closeUI());

    // Title
    this.add.text(W / 2, 30, 'CARGO HOLD', {
      fontFamily: 'monospace', fontSize: '28px', color: CYAN,
    }).setOrigin(0.5);

    // Capacity bar
    this.buildCapacityBar(W);

    // Ingredient grid
    this.buildIngredientGrid(W, H);

    // Close hint
    this.add.text(W / 2, H - 24, '[ESC] Close', {
      fontFamily: 'monospace', fontSize: '12px', color: GRAY,
    }).setOrigin(0.5);
  }

  private buildCapacityBar(W: number): void {
    const state = getState();
    const { currentCargo, cargoCapacity } = state.ship;
    const barY = 65;
    const barW = 400;
    const barH = 24;
    const barX = (W - barW) / 2;

    const gfx = this.add.graphics();

    // Bar background
    gfx.fillStyle(0x0d1b2a, 1);
    gfx.fillRoundedRect(barX, barY, barW, barH, 4);
    gfx.lineStyle(1, BTN_BORDER, 0.5);
    gfx.strokeRoundedRect(barX, barY, barW, barH, 4);

    // Fill bar
    const fillFrac = cargoCapacity > 0 ? currentCargo / cargoCapacity : 0;
    const fillColor = fillFrac >= 1 ? 0xff0054 : fillFrac >= 0.75 ? 0xffcc00 : 0x00ff88;
    if (fillFrac > 0) {
      const fillW = Math.max(4, (barW - 4) * fillFrac);
      gfx.fillStyle(fillColor, 0.8);
      gfx.fillRoundedRect(barX + 2, barY + 2, fillW, barH - 4, 3);
    }

    // Label
    const labelColor = fillFrac >= 1 ? RED : (fillFrac >= 0.75 ? YELLOW : GREEN);
    this.add.text(W / 2, barY + barH / 2, `${currentCargo} / ${cargoCapacity}`, {
      fontFamily: 'monospace', fontSize: '13px', color: labelColor,
    }).setOrigin(0.5);

    // Capacity text
    this.add.text(barX - 10, barY + barH / 2, 'Cargo:', {
      fontFamily: 'monospace', fontSize: '12px', color: GRAY,
    }).setOrigin(1, 0.5);
  }

  private buildIngredientGrid(W: number, H: number): void {
    const cols = 3;
    const cardW = 200;
    const cardH = 110;
    const gapX = 16;
    const gapY = 16;
    const totalGridW = cols * cardW + (cols - 1) * gapX;
    const startX = (W - totalGridW) / 2;
    const startY = 110;

    INGREDIENTS.forEach((ingredient, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = startX + col * (cardW + gapX);
      const cy = startY + row * (cardH + gapY);

      const count = getIngredientCount(ingredient.id);
      const hasAny = count > 0;

      // Card background
      const gfx = this.add.graphics();
      gfx.fillStyle(PANEL_BG, hasAny ? 0.95 : 0.6);
      gfx.fillRoundedRect(cx, cy, cardW, cardH, 8);
      gfx.lineStyle(1, hasAny ? BTN_BORDER : 0x303050, hasAny ? 0.6 : 0.3);
      gfx.strokeRoundedRect(cx, cy, cardW, cardH, 8);

      // Ingredient icon
      const iconKey = ICON_MAP[ingredient.id];
      if (iconKey) {
        this.add.image(cx + 36, cy + 36, iconKey)
          .setScale(0.1)
          .setAlpha(hasAny ? 1 : 0.3);
      }

      // Ingredient name
      this.add.text(cx + 72, cy + 14, ingredient.name, {
        fontFamily: 'monospace', fontSize: '13px', color: hasAny ? WHITE : GRAY,
      });

      // Rarity badge
      const rarityColor = RARITY_COLORS[ingredient.rarity] || WHITE;
      this.add.text(cx + 72, cy + 34, ingredient.rarity.toUpperCase(), {
        fontFamily: 'monospace', fontSize: '9px', color: rarityColor,
      });

      // Quantity - large display
      this.add.text(cx + cardW - 20, cy + 22, `${count}`, {
        fontFamily: 'monospace', fontSize: '24px', color: hasAny ? GREEN : GRAY,
      }).setOrigin(1, 0);

      // Description
      this.add.text(cx + 12, cy + 60, ingredient.description, {
        fontFamily: 'monospace', fontSize: '9px', color: GRAY,
        wordWrap: { width: cardW - 24 },
      }).setAlpha(hasAny ? 0.8 : 0.4);

      // Color swatch
      const swatchGfx = this.add.graphics();
      swatchGfx.fillStyle(Phaser.Display.Color.HexStringToColor(ingredient.color).color, hasAny ? 0.8 : 0.3);
      swatchGfx.fillRoundedRect(cx + 12, cy + cardH - 16, 30, 6, 3);
    });
  }

  private closeUI(): void {
    this.scene.resume('ShipScene');
    (this.scene.get('ShipScene') as any).resumeFromUI();
    this.scene.stop();
  }
}
