import Phaser from 'phaser';
import { getState, resetState } from '../GameState';
import { logger } from '../../utils/logger';
import { sfx } from '../../utils/sfx';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data: { victory: boolean }): void {
    const { victory } = data;
    const state = getState();

    logger.info('GameOverScene', { victory, finalTick: state.race.tick });

    if (victory) sfx.victory(); else sfx.defeat();

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a12, 1);
    bg.fillRect(0, 0, 800, 600);

    for (let i = 0; i < 80; i++) {
      bg.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.2, 0.8));
      bg.fillCircle(Phaser.Math.Between(0, 800), Phaser.Math.Between(0, 600), Phaser.Math.FloatBetween(0.5, 1.5));
    }

    // Gus portrait
    const gusTexture = victory ? 'portrait_gus_eating' : 'portrait_gus';
    const gus = this.add.image(400, victory ? 180 : 180, gusTexture).setScale(0.35);
    if (!victory) {
      this.tweens.add({ targets: gus, scale: 0.4, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    // Title
    const titleText = victory ? 'EARTH ESCAPED!' : 'GUS DEVOURED EARTH';
    const titleColor = victory ? '#00ff88' : '#ff0054';
    this.add.text(400, 320, titleText, {
      fontFamily: 'monospace', fontSize: '36px', color: titleColor,
    }).setOrigin(0.5);

    const subtitle = victory
      ? 'The Cosmic Flywheel accelerated Earth to safety.'
      : 'Your planet was delicious. Gus thanks you.';
    this.add.text(400, 360, subtitle, {
      fontFamily: 'monospace', fontSize: '14px', color: '#a0a0a0',
    }).setOrigin(0.5);

    // Stats
    this.add.text(400, 410, '--- MISSION STATS ---', {
      fontFamily: 'monospace', fontSize: '16px', color: '#00d9ff',
    }).setOrigin(0.5);

    const stats = [
      `Ticks: ${state.race.tick}  |  Science: ${state.science}  |  Upgrades: ${state.upgrades.purchased.size}  |  Recipes: ${state.recipes.unlocked.size}`,
    ];
    this.add.text(400, 440, stats[0], {
      fontFamily: 'monospace', fontSize: '12px', color: '#e0e0e0',
    }).setOrigin(0.5);

    // Try Again button
    this.createButton(300, 510, 'Try Again', '#00d9ff', () => {
      resetState();
      this.scene.start('ShipScene');
    });

    this.createButton(500, 510, 'Quit', '#606060', () => {
      window.location.reload();
    });
  }

  private createButton(x: number, y: number, text: string, borderColor: string, callback: () => void): void {
    const container = this.add.container(x, y);
    const bg = this.add.graphics();
    const color = Phaser.Display.Color.HexStringToColor(borderColor).color;
    bg.fillStyle(0x1f4068, 1);
    bg.fillRoundedRect(-70, -25, 140, 50, 8);
    bg.lineStyle(2, color);
    bg.strokeRoundedRect(-70, -25, 140, 50, 8);

    const label = this.add.text(0, 0, text, {
      fontFamily: 'monospace', fontSize: '18px', color: '#e0e0e0',
    }).setOrigin(0.5);

    container.add([bg, label]);
    container.setSize(140, 50);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(color, 0.3);
      bg.fillRoundedRect(-70, -25, 140, 50, 8);
      bg.lineStyle(2, color);
      bg.strokeRoundedRect(-70, -25, 140, 50, 8);
    });
    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x1f4068, 1);
      bg.fillRoundedRect(-70, -25, 140, 50, 8);
      bg.lineStyle(2, color);
      bg.strokeRoundedRect(-70, -25, 140, 50, 8);
    });
    container.on('pointerdown', callback);
  }
}
