import Phaser from 'phaser';
import {
  getState, cookRecipe, getUnlockedRecipes, hasIngredients, getIngredientCount,
} from '../GameState';
import { sfx } from '../../utils/sfx';
import type { IngredientId } from '../../data/ingredients';

const CYAN = '#00d9ff';
const GREEN = '#00ff88';
const RED = '#ff0054';
const YELLOW = '#ffcc00';
const WHITE = '#e0e0e0';
const GRAY = '#606060';
const PANEL_BG = 0x16213e;
const BTN_BG = 0x1f4068;
const BTN_BORDER = 0x00d9ff;

const ICON_MAP: Record<string, string> = {
  stardust: 'icon_stardust',
  void_salt: 'icon_void_salt',
  nebula_nectar: 'icon_nebula_nectar',
  comet_tail: 'icon_comet_tail',
  singularity_seed: 'icon_singularity_seed',
  solar_flare_pepper: 'icon_solar_flare_pepper',
};

export class GalleyUI extends Phaser.Scene {
  private escKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'GalleyUI' });
  }

  create(): void {
    const { width: W, height: H } = this.cameras.main;

    // Dark overlay
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7);
    overlay.setInteractive();

    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.escKey.on('down', () => this.closeUI());

    // Title
    this.add.text(W / 2, 30, 'GALLEY - COOKING STATION', {
      fontFamily: 'monospace', fontSize: '24px', color: CYAN,
    }).setOrigin(0.5);

    // Gus portrait
    this.add.image(70, 30, 'portrait_gus_eating').setScale(0.12).setOrigin(0, 0);

    this.buildRecipeGrid(W, H);

    // Close hint
    this.add.text(W / 2, H - 24, '[ESC] Close', {
      fontFamily: 'monospace', fontSize: '12px', color: GRAY,
    }).setOrigin(0.5);
  }

  private buildRecipeGrid(W: number, H: number): void {
    const recipes = getUnlockedRecipes().filter(r => r.id !== 'mystery_mush');

    const cols = 3;
    const cardW = 210;
    const cardH = 180;
    const gapX = 16;
    const gapY = 16;
    const totalGridW = cols * cardW + (cols - 1) * gapX;
    const startX = (W - totalGridW) / 2;
    const startY = 80;

    // Scrollable area — show up to 2 rows
    const maxVisible = cols * 2;

    recipes.slice(0, maxVisible).forEach((recipe, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = startX + col * (cardW + gapX);
      const cy = startY + row * (cardH + gapY);

      const canCook = hasIngredients(recipe.ingredients as Record<string, number>);

      // Card background
      const gfx = this.add.graphics();
      gfx.fillStyle(PANEL_BG, 0.95);
      gfx.fillRoundedRect(cx, cy, cardW, cardH, 8);
      gfx.lineStyle(1, canCook ? 0x00ff88 : 0x303050, 0.7);
      gfx.strokeRoundedRect(cx, cy, cardW, cardH, 8);

      // Recipe name
      this.add.text(cx + cardW / 2, cy + 14, recipe.name, {
        fontFamily: 'monospace', fontSize: '13px', color: canCook ? GREEN : WHITE,
      }).setOrigin(0.5);

      // Ingredient icons row
      const ingredientEntries = Object.entries(recipe.ingredients) as [IngredientId, number][];
      const iconStartX = cx + 12;
      const iconY = cy + 42;

      ingredientEntries.forEach(([ingId, needed], j) => {
        const iconKey = ICON_MAP[ingId];
        const have = getIngredientCount(ingId);
        const enough = have >= needed;

        if (iconKey) {
          this.add.image(iconStartX + j * 36, iconY, iconKey)
            .setScale(0.06)
            .setOrigin(0, 0.5)
            .setAlpha(enough ? 1 : 0.4);
        }

        this.add.text(iconStartX + j * 36 + 20, iconY, `${have}/${needed}`, {
          fontFamily: 'monospace', fontSize: '10px', color: enough ? GREEN : RED,
        }).setOrigin(0, 0.5);
      });

      // Description
      this.add.text(cx + 8, cy + 68, recipe.description, {
        fontFamily: 'monospace', fontSize: '10px', color: GRAY,
        wordWrap: { width: cardW - 16 },
      });

      // Effect summary
      const effectParts: string[] = [];
      if (recipe.effect.gusModifier !== 0) {
        effectParts.push(`Gus ${recipe.effect.gusModifier > 0 ? '+' : ''}${recipe.effect.gusModifier}`);
      }
      if (recipe.effect.earthModifier !== 0) {
        effectParts.push(`Earth +${recipe.effect.earthModifier}`);
      }
      effectParts.push(`${recipe.effect.duration}t`);

      this.add.text(cx + 8, cy + 108, effectParts.join(' | '), {
        fontFamily: 'monospace', fontSize: '10px', color: YELLOW,
      });

      // Cook button
      const btnX = cx + cardW / 2 - 50;
      const btnY = cy + cardH - 38;
      const btnW = 100;
      const btnH = 28;

      const btnGfx = this.add.graphics();
      if (canCook) {
        btnGfx.fillStyle(0x004422, 1);
        btnGfx.fillRoundedRect(btnX, btnY, btnW, btnH, 4);
        btnGfx.lineStyle(1, 0x00ff88, 1);
        btnGfx.strokeRoundedRect(btnX, btnY, btnW, btnH, 4);
      } else {
        btnGfx.fillStyle(0x222222, 1);
        btnGfx.fillRoundedRect(btnX, btnY, btnW, btnH, 4);
        btnGfx.lineStyle(1, 0x404040, 1);
        btnGfx.strokeRoundedRect(btnX, btnY, btnW, btnH, 4);
      }

      this.add.text(btnX + btnW / 2, btnY + btnH / 2, canCook ? 'Cook' : 'Need Ingredients', {
        fontFamily: 'monospace', fontSize: canCook ? '12px' : '9px', color: canCook ? GREEN : GRAY,
      }).setOrigin(0.5);

      if (canCook) {
        const hitZone = this.add.zone(btnX + btnW / 2, btnY + btnH / 2, btnW, btnH)
          .setInteractive({ useHandCursor: true });

        hitZone.on('pointerover', () => {
          btnGfx.clear();
          btnGfx.fillStyle(0x00ff88, 0.3);
          btnGfx.fillRoundedRect(btnX, btnY, btnW, btnH, 4);
          btnGfx.lineStyle(1, 0x00ff88, 1);
          btnGfx.strokeRoundedRect(btnX, btnY, btnW, btnH, 4);
        });

        hitZone.on('pointerout', () => {
          btnGfx.clear();
          btnGfx.fillStyle(0x004422, 1);
          btnGfx.fillRoundedRect(btnX, btnY, btnW, btnH, 4);
          btnGfx.lineStyle(1, 0x00ff88, 1);
          btnGfx.strokeRoundedRect(btnX, btnY, btnW, btnH, 4);
        });

        hitZone.on('pointerdown', () => {
          const success = cookRecipe(recipe.id);
          if (success) {
            sfx.cook();
            // Refresh the scene to show updated state
            this.scene.restart();
          }
        });
      }
    });

    if (recipes.length === 0) {
      this.add.text(W / 2, H / 2, 'No recipes unlocked yet.\nVisit Engineering to research cookbooks.', {
        fontFamily: 'monospace', fontSize: '14px', color: GRAY,
        align: 'center',
      }).setOrigin(0.5);
    }
  }

  private closeUI(): void {
    this.scene.resume('ShipScene');
    (this.scene.get('ShipScene') as any).resumeFromUI();
    this.scene.stop();
  }
}
