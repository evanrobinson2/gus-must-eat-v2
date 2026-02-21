import Phaser from 'phaser';
import {
  getState, tickRace, deployClones, returnClones, addScience,
} from '../GameState';
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

const TRACK_LENGTH = 100;

export class BridgeUI extends Phaser.Scene {
  private escKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'BridgeUI' });
  }

  create(): void {
    const { width: W, height: H } = this.cameras.main;

    // Semi-transparent dark overlay
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7);
    overlay.setInteractive(); // block clicks through to ShipScene

    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.escKey.on('down', () => this.closeUI());

    // Title
    this.add.text(W / 2, 30, 'BRIDGE', {
      fontFamily: 'monospace', fontSize: '28px', color: CYAN,
    }).setOrigin(0.5);

    // Portrait on the left
    this.add.image(140, H / 2 - 40, 'portrait_gus').setScale(0.3);
    this.add.text(140, H / 2 + 80, 'Captain Gus', {
      fontFamily: 'monospace', fontSize: '14px', color: YELLOW,
    }).setOrigin(0.5);

    this.buildRaceTrack(W, H);
    this.buildButtons(W, H);
    this.buildStats(W, H);
  }

  private buildRaceTrack(W: number, H: number): void {
    const state = getState();
    const { race } = state;

    const trackX = W / 2 + 40;
    const trackTop = 80;
    const trackBottom = H - 140;
    const trackHeight = trackBottom - trackTop;

    // Track panel background
    const gfx = this.add.graphics();
    gfx.fillStyle(PANEL_BG, 0.9);
    gfx.fillRoundedRect(trackX - 60, trackTop - 20, 200, trackHeight + 60, 8);
    gfx.lineStyle(1, BTN_BORDER, 0.5);
    gfx.strokeRoundedRect(trackX - 60, trackTop - 20, 200, trackHeight + 60, 8);

    // Track label
    this.add.text(trackX + 40, trackTop - 10, 'RACE TRACK', {
      fontFamily: 'monospace', fontSize: '12px', color: CYAN,
    }).setOrigin(0.5);

    // Vertical track line
    gfx.lineStyle(2, 0x303050, 1);
    gfx.lineBetween(trackX + 40, trackTop + 20, trackX + 40, trackBottom);

    // Tick marks every 10 units
    for (let i = 0; i <= 10; i++) {
      const yPos = trackBottom - (i / 10) * (trackBottom - trackTop - 20);
      gfx.lineStyle(1, 0x404060, 0.6);
      gfx.lineBetween(trackX + 30, yPos, trackX + 50, yPos);
      this.add.text(trackX + 55, yPos, `${i * 10}`, {
        fontFamily: 'monospace', fontSize: '9px', color: GRAY,
      }).setOrigin(0, 0.5);
    }

    // Flywheel target at top (position 100)
    const flyY = trackTop + 20;
    this.add.text(trackX + 40, flyY - 12, 'FLYWHEEL', {
      fontFamily: 'monospace', fontSize: '10px', color: YELLOW,
    }).setOrigin(0.5);
    gfx.fillStyle(0xffcc00, 0.8);
    gfx.fillCircle(trackX + 40, flyY, 6);

    // Earth position
    const earthFrac = Math.min(race.earthPosition / TRACK_LENGTH, 1);
    const earthY = trackBottom - earthFrac * (trackBottom - trackTop - 20);
    gfx.fillStyle(0x00aaff, 1);
    gfx.fillCircle(trackX + 25, earthY, 8);
    this.add.text(trackX - 5, earthY, 'E', {
      fontFamily: 'monospace', fontSize: '11px', color: '#00ccff',
    }).setOrigin(0.5);

    // Gus position
    const gusFrac = Math.min(race.gusPosition / TRACK_LENGTH, 1);
    const gusY = trackBottom - gusFrac * (trackBottom - trackTop - 20);
    gfx.fillStyle(0xff0054, 1);
    gfx.fillCircle(trackX + 55, gusY, 8);
    this.add.text(trackX + 75, gusY, 'G', {
      fontFamily: 'monospace', fontSize: '11px', color: RED,
    }).setOrigin(0.5);

    // Start label
    this.add.text(trackX + 40, trackBottom + 12, 'START', {
      fontFamily: 'monospace', fontSize: '10px', color: GRAY,
    }).setOrigin(0.5);
  }

  private buildStats(W: number, H: number): void {
    const state = getState();
    const { race } = state;

    const statsX = W - 200;
    const statsY = 80;

    const gfx = this.add.graphics();
    gfx.fillStyle(PANEL_BG, 0.9);
    gfx.fillRoundedRect(statsX - 20, statsY - 10, 200, 200, 8);
    gfx.lineStyle(1, BTN_BORDER, 0.5);
    gfx.strokeRoundedRect(statsX - 20, statsY - 10, 200, 200, 8);

    this.add.text(statsX + 80, statsY, 'STATUS', {
      fontFamily: 'monospace', fontSize: '12px', color: CYAN,
    }).setOrigin(0.5);

    const lines = [
      { label: 'Tick:', value: `${race.tick}`, color: WHITE },
      { label: 'Earth Pos:', value: `${race.earthPosition.toFixed(1)}`, color: CYAN },
      { label: 'Earth Spd:', value: `${race.earthSpeed}`, color: CYAN },
      { label: 'Gus Pos:', value: `${race.gusPosition.toFixed(1)}`, color: RED },
      { label: 'Gus Spd:', value: `${race.gusSpeed}`, color: RED },
      { label: 'Gap:', value: `${(race.earthPosition - race.gusPosition).toFixed(1)}`, color: YELLOW },
    ];

    lines.forEach((line, i) => {
      this.add.text(statsX, statsY + 24 + i * 22, line.label, {
        fontFamily: 'monospace', fontSize: '12px', color: GRAY,
      });
      this.add.text(statsX + 100, statsY + 24 + i * 22, line.value, {
        fontFamily: 'monospace', fontSize: '12px', color: line.color,
      });
    });

    // Active modifiers
    if (race.modifierDuration > 0) {
      const modY = statsY + 24 + lines.length * 22 + 10;
      this.add.text(statsX, modY, 'ACTIVE EFFECTS:', {
        fontFamily: 'monospace', fontSize: '11px', color: GREEN,
      });
      if (race.gusModifier !== 0) {
        this.add.text(statsX, modY + 18, `Gus: ${race.gusModifier > 0 ? '+' : ''}${race.gusModifier} (${race.modifierDuration}t)`, {
          fontFamily: 'monospace', fontSize: '11px', color: race.gusModifier < 0 ? GREEN : RED,
        });
      }
      if (race.earthModifier !== 0) {
        this.add.text(statsX, modY + 36, `Earth: +${race.earthModifier} (${race.modifierDuration}t)`, {
          fontFamily: 'monospace', fontSize: '11px', color: GREEN,
        });
      }
    }
  }

  private buildButtons(W: number, H: number): void {
    const btnY = H - 80;

    // Harvest Mission button
    this.createButton(W / 2 - 140, btnY, 200, 44, 'Harvest Mission', GREEN, () => {
      sfx.click();
      this.scene.stop('ShipScene');
      this.scene.stop();
      this.scene.start('HarvestScene');
    });

    // Science Mission button
    this.createButton(W / 2 + 80, btnY, 200, 44, 'Science Mission', CYAN, () => {
      sfx.click();
      const state = getState();
      const deployed = deployClones(state.clones.totalSlots);
      if (deployed > 0) {
        const scienceEarned = returnClones();
        const result = tickRace();

        // Refresh the entire scene
        this.scene.restart();

        if (result.gameOver) {
          sfx.missionEnd();
          this.time.delayedCall(300, () => {
            this.closeUI();
          });
        }
      }
    });

    // Close hint
    this.add.text(W / 2, H - 24, '[ESC] Close', {
      fontFamily: 'monospace', fontSize: '12px', color: GRAY,
    }).setOrigin(0.5);
  }

  private createButton(
    x: number, y: number, w: number, h: number,
    label: string, color: string, callback: () => void,
  ): void {
    const gfx = this.add.graphics();
    gfx.fillStyle(BTN_BG, 1);
    gfx.fillRoundedRect(x, y, w, h, 6);
    gfx.lineStyle(2, BTN_BORDER, 1);
    gfx.strokeRoundedRect(x, y, w, h, 6);

    const text = this.add.text(x + w / 2, y + h / 2, label, {
      fontFamily: 'monospace', fontSize: '14px', color,
    }).setOrigin(0.5);

    const hitZone = this.add.zone(x + w / 2, y + h / 2, w, h).setInteractive({ useHandCursor: true });

    hitZone.on('pointerover', () => {
      gfx.clear();
      gfx.fillStyle(0x00d9ff, 0.3);
      gfx.fillRoundedRect(x, y, w, h, 6);
      gfx.lineStyle(2, BTN_BORDER, 1);
      gfx.strokeRoundedRect(x, y, w, h, 6);
    });

    hitZone.on('pointerout', () => {
      gfx.clear();
      gfx.fillStyle(BTN_BG, 1);
      gfx.fillRoundedRect(x, y, w, h, 6);
      gfx.lineStyle(2, BTN_BORDER, 1);
      gfx.strokeRoundedRect(x, y, w, h, 6);
    });

    hitZone.on('pointerdown', callback);
  }

  private closeUI(): void {
    this.scene.resume('ShipScene');
    (this.scene.get('ShipScene') as any).resumeFromUI();
    this.scene.stop();
  }
}
