import Phaser from 'phaser';
import { getState } from '../GameState';
import { sfx } from '../../utils/sfx';

const CYAN = '#00d9ff';
const GREEN = '#00ff88';
const RED = '#ff0054';
const YELLOW = '#ffcc00';
const WHITE = '#e0e0e0';
const GRAY = '#606060';
const PANEL_BG = 0x16213e;
const BTN_BORDER = 0x00d9ff;

export class CloneBayUI extends Phaser.Scene {
  private escKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'CloneBayUI' });
  }

  create(): void {
    const { width: W, height: H } = this.cameras.main;

    // Dark overlay
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7);
    overlay.setInteractive();

    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.escKey.on('down', () => this.closeUI());

    // Title
    this.add.text(W / 2, 30, 'CLONE BAY', {
      fontFamily: 'monospace', fontSize: '28px', color: CYAN,
    }).setOrigin(0.5);

    const state = getState();
    const { clones } = state;

    // Stats panel
    this.buildStatsPanel(W, H, clones);

    // Clone pods visualization
    this.buildClonePods(W, H, clones);

    // Close hint
    this.add.text(W / 2, H - 24, '[ESC] Close', {
      fontFamily: 'monospace', fontSize: '12px', color: GRAY,
    }).setOrigin(0.5);
  }

  private buildStatsPanel(W: number, H: number, clones: { totalSlots: number; deployedCount: number; efficiency: number }): void {
    const panelX = W / 2 - 160;
    const panelY = 70;
    const panelW = 320;
    const panelH = 120;

    const gfx = this.add.graphics();
    gfx.fillStyle(PANEL_BG, 0.95);
    gfx.fillRoundedRect(panelX, panelY, panelW, panelH, 8);
    gfx.lineStyle(1, BTN_BORDER, 0.5);
    gfx.strokeRoundedRect(panelX, panelY, panelW, panelH, 8);

    this.add.text(W / 2, panelY + 16, 'CLONE STATUS', {
      fontFamily: 'monospace', fontSize: '14px', color: CYAN,
    }).setOrigin(0.5);

    const stats = [
      { label: 'Total Slots:', value: `${clones.totalSlots}`, color: WHITE },
      { label: 'Deployed:', value: `${clones.deployedCount}`, color: clones.deployedCount > 0 ? YELLOW : GREEN },
      { label: 'Available:', value: `${clones.totalSlots - clones.deployedCount}`, color: GREEN },
      { label: 'Efficiency:', value: `${clones.efficiency} sci/clone`, color: CYAN },
    ];

    stats.forEach((stat, i) => {
      const sy = panelY + 38 + i * 20;
      this.add.text(panelX + 30, sy, stat.label, {
        fontFamily: 'monospace', fontSize: '12px', color: GRAY,
      });
      this.add.text(panelX + panelW - 30, sy, stat.value, {
        fontFamily: 'monospace', fontSize: '12px', color: stat.color,
      }).setOrigin(1, 0);
    });
  }

  private buildClonePods(W: number, H: number, clones: { totalSlots: number; deployedCount: number; efficiency: number }): void {
    const podY = 220;
    const podSpacing = 100;
    const totalPodsW = clones.totalSlots * podSpacing;
    const startX = (W - totalPodsW) / 2 + podSpacing / 2;

    // Section label
    this.add.text(W / 2, podY - 20, 'CLONE PODS', {
      fontFamily: 'monospace', fontSize: '14px', color: CYAN,
    }).setOrigin(0.5);

    for (let i = 0; i < clones.totalSlots; i++) {
      const px = startX + i * podSpacing;
      const isDeployed = i < clones.deployedCount;

      // Pod background glow
      const glow = this.add.graphics();
      glow.fillStyle(isDeployed ? 0xffcc00 : 0x00d9ff, 0.1);
      glow.fillCircle(px, podY + 50, 40);

      // Clone tube image
      const tube = this.add.image(px, podY + 40, 'furniture_clone_tube')
        .setScale(0.15);

      if (isDeployed) {
        tube.setTint(0xffcc00);
      }

      // Status label
      this.add.text(px, podY + 90, isDeployed ? 'DEPLOYED' : 'READY', {
        fontFamily: 'monospace', fontSize: '10px', color: isDeployed ? YELLOW : GREEN,
      }).setOrigin(0.5);

      // Pod number
      this.add.text(px, podY + 105, `Pod ${i + 1}`, {
        fontFamily: 'monospace', fontSize: '9px', color: GRAY,
      }).setOrigin(0.5);

      // Subtle idle animation for ready pods
      if (!isDeployed) {
        this.tweens.add({
          targets: tube,
          alpha: 0.7,
          duration: 1500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
    }

    // Science per mission calculation
    const sciPerMission = clones.totalSlots * clones.efficiency;
    const infoY = podY + 140;

    const infoGfx = this.add.graphics();
    infoGfx.fillStyle(PANEL_BG, 0.8);
    infoGfx.fillRoundedRect(W / 2 - 150, infoY, 300, 50, 6);
    infoGfx.lineStyle(1, 0x303050, 0.5);
    infoGfx.strokeRoundedRect(W / 2 - 150, infoY, 300, 50, 6);

    this.add.text(W / 2, infoY + 14, `Science per full mission: ${sciPerMission}`, {
      fontFamily: 'monospace', fontSize: '12px', color: GREEN,
    }).setOrigin(0.5);

    this.add.text(W / 2, infoY + 34, 'Use the Bridge to send clones on science missions.', {
      fontFamily: 'monospace', fontSize: '10px', color: GRAY,
    }).setOrigin(0.5);
  }

  private closeUI(): void {
    this.scene.resume('ShipScene');
    (this.scene.get('ShipScene') as any).resumeFromUI();
    this.scene.stop();
  }
}
