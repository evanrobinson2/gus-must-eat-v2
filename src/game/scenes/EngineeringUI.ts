import Phaser from 'phaser';
import {
  getState, purchaseUpgrade, canPurchaseUpgrade,
} from '../GameState';
import { getUpgradesByCategory, type UpgradeId, type UpgradeCategory } from '../../data/upgrades';
import { sfx } from '../../utils/sfx';

const CYAN = '#00d9ff';
const GREEN = '#00ff88';
const RED = '#ff0054';
const YELLOW = '#ffcc00';
const WHITE = '#e0e0e0';
const GRAY = '#606060';
const PANEL_BG = 0x16213e;
const BTN_BG = 0x1f4068;
const BTN_BORDER = 0x00d9ff;

interface ColumnDef {
  title: string;
  category: UpgradeCategory;
}

const COLUMNS: ColumnDef[] = [
  { title: 'SHIP', category: 'ship' },
  { title: 'CLONES', category: 'clone' },
  { title: 'RECIPES', category: 'recipe' },
];

export class EngineeringUI extends Phaser.Scene {
  private escKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'EngineeringUI' });
  }

  create(): void {
    const { width: W, height: H } = this.cameras.main;

    // Dark overlay
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7);
    overlay.setInteractive();

    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.escKey.on('down', () => this.closeUI());

    // Title
    this.add.text(W / 2, 30, 'ENGINEERING - UPGRADES', {
      fontFamily: 'monospace', fontSize: '24px', color: CYAN,
    }).setOrigin(0.5);

    // Science display
    const state = getState();
    this.add.text(W / 2, 58, `Available Science: ${state.science}`, {
      fontFamily: 'monospace', fontSize: '16px', color: YELLOW,
    }).setOrigin(0.5);

    this.buildColumns(W, H);

    // Close hint
    this.add.text(W / 2, H - 24, '[ESC] Close', {
      fontFamily: 'monospace', fontSize: '12px', color: GRAY,
    }).setOrigin(0.5);
  }

  private buildColumns(W: number, H: number): void {
    const state = getState();
    const colCount = COLUMNS.length;
    const colW = 220;
    const totalW = colCount * colW + (colCount - 1) * 16;
    const startX = (W - totalW) / 2;
    const startY = 90;

    COLUMNS.forEach((colDef, ci) => {
      const cx = startX + ci * (colW + 16);

      // Column header panel
      const headerGfx = this.add.graphics();
      headerGfx.fillStyle(PANEL_BG, 0.95);
      headerGfx.fillRoundedRect(cx, startY, colW, 30, { tl: 8, tr: 8, bl: 0, br: 0 });
      headerGfx.lineStyle(1, BTN_BORDER, 0.5);
      headerGfx.strokeRoundedRect(cx, startY, colW, 30, { tl: 8, tr: 8, bl: 0, br: 0 });

      this.add.text(cx + colW / 2, startY + 15, colDef.title, {
        fontFamily: 'monospace', fontSize: '13px', color: CYAN,
      }).setOrigin(0.5);

      // Upgrades in this category
      const upgrades = getUpgradesByCategory(colDef.category);
      const cardH = 90;
      const cardGap = 8;

      // Column body background
      const bodyH = upgrades.length * (cardH + cardGap) + 10;
      const bodyGfx = this.add.graphics();
      bodyGfx.fillStyle(0x0d1b2a, 0.8);
      bodyGfx.fillRoundedRect(cx, startY + 30, colW, bodyH, { tl: 0, tr: 0, bl: 8, br: 8 });

      upgrades.forEach((upgrade, ui) => {
        const uy = startY + 40 + ui * (cardH + cardGap);
        const owned = state.upgrades.purchased.has(upgrade.id);
        const canBuy = canPurchaseUpgrade(upgrade.id);
        const locked = !owned && !canBuy;

        // Card bg
        const cardGfx = this.add.graphics();
        cardGfx.fillStyle(owned ? 0x1a3a2a : PANEL_BG, 0.9);
        cardGfx.fillRoundedRect(cx + 6, uy, colW - 12, cardH, 6);
        if (owned) {
          cardGfx.lineStyle(1, 0x00ff88, 0.5);
        } else if (canBuy) {
          cardGfx.lineStyle(1, BTN_BORDER, 0.6);
        } else {
          cardGfx.lineStyle(1, 0x303050, 0.4);
        }
        cardGfx.strokeRoundedRect(cx + 6, uy, colW - 12, cardH, 6);

        // Upgrade name
        this.add.text(cx + 14, uy + 8, upgrade.name, {
          fontFamily: 'monospace', fontSize: '12px', color: owned ? GREEN : (canBuy ? WHITE : GRAY),
        });

        // Cost
        if (owned) {
          this.add.text(cx + colW - 20, uy + 8, 'OWNED', {
            fontFamily: 'monospace', fontSize: '10px', color: GREEN,
          }).setOrigin(1, 0);
        } else {
          this.add.text(cx + colW - 20, uy + 8, `${upgrade.cost} sci`, {
            fontFamily: 'monospace', fontSize: '10px', color: canBuy ? YELLOW : GRAY,
          }).setOrigin(1, 0);
        }

        // Description
        this.add.text(cx + 14, uy + 26, upgrade.description, {
          fontFamily: 'monospace', fontSize: '9px', color: GRAY,
          wordWrap: { width: colW - 28 },
        });

        // Buy button (only if can purchase)
        if (canBuy) {
          const btnX = cx + colW / 2 - 36;
          const btnY = uy + cardH - 28;
          const btnW = 60;
          const btnH = 22;

          const btnGfx = this.add.graphics();
          btnGfx.fillStyle(BTN_BG, 1);
          btnGfx.fillRoundedRect(btnX, btnY, btnW, btnH, 4);
          btnGfx.lineStyle(1, BTN_BORDER, 1);
          btnGfx.strokeRoundedRect(btnX, btnY, btnW, btnH, 4);

          this.add.text(btnX + btnW / 2, btnY + btnH / 2, 'Buy', {
            fontFamily: 'monospace', fontSize: '11px', color: CYAN,
          }).setOrigin(0.5);

          const hitZone = this.add.zone(btnX + btnW / 2, btnY + btnH / 2, btnW, btnH)
            .setInteractive({ useHandCursor: true });

          hitZone.on('pointerover', () => {
            btnGfx.clear();
            btnGfx.fillStyle(0x00d9ff, 0.3);
            btnGfx.fillRoundedRect(btnX, btnY, btnW, btnH, 4);
            btnGfx.lineStyle(1, BTN_BORDER, 1);
            btnGfx.strokeRoundedRect(btnX, btnY, btnW, btnH, 4);
          });

          hitZone.on('pointerout', () => {
            btnGfx.clear();
            btnGfx.fillStyle(BTN_BG, 1);
            btnGfx.fillRoundedRect(btnX, btnY, btnW, btnH, 4);
            btnGfx.lineStyle(1, BTN_BORDER, 1);
            btnGfx.strokeRoundedRect(btnX, btnY, btnW, btnH, 4);
          });

          hitZone.on('pointerdown', () => {
            const success = purchaseUpgrade(upgrade.id);
            if (success) {
              sfx.click();
              this.scene.restart();
            }
          });
        } else if (locked && !owned) {
          // Show locked indicator
          if (upgrade.requires) {
            this.add.text(cx + colW / 2, uy + cardH - 16, `Requires: ${upgrade.requires}`, {
              fontFamily: 'monospace', fontSize: '9px', color: RED,
            }).setOrigin(0.5);
          }
        }
      });
    });
  }

  private closeUI(): void {
    this.scene.resume('ShipScene');
    (this.scene.get('ShipScene') as any).resumeFromUI();
    this.scene.stop();
  }
}
