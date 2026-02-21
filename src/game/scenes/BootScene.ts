import Phaser from 'phaser';
import { loadFromStorage } from '../GameState';
import { logger } from '../../utils/logger';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    logger.info('BootScene: Loading assets');

    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    // Loading bar
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x1a1a2e, 0.8);
    progressBox.fillRect(w / 2 - 160, h / 2 - 25, 320, 50);

    const progressBar = this.add.graphics();
    const loadingText = this.add.text(w / 2, h / 2 - 50, 'Loading...', {
      fontFamily: 'monospace', fontSize: '20px', color: '#00d9ff',
    }).setOrigin(0.5);

    this.load.on('progress', (v: number) => {
      progressBar.clear();
      progressBar.fillStyle(0x00d9ff, 1);
      progressBar.fillRect(w / 2 - 150, h / 2 - 15, 300 * v, 30);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });

    const base = './assets';

    // Portraits
    this.load.image('portrait_gus', `${base}/portraits/portrait_gus.png`);
    this.load.image('portrait_gus_eating', `${base}/portraits/portrait_gus_eating.png`);

    // Tiles
    this.load.image('tile_floor_metal', `${base}/tiles/tile_floor_metal.png`);
    this.load.image('tile_floor_grating', `${base}/tiles/tile_floor_grating.png`);
    this.load.image('tile_wall_base', `${base}/tiles/tile_wall_base.png`);

    // Furniture
    this.load.image('furniture_bridge_console', `${base}/tiles/furniture_bridge_console.png`);
    this.load.image('furniture_viewscreen', `${base}/tiles/furniture_viewscreen.png`);
    this.load.image('furniture_stove', `${base}/tiles/furniture_stove.png`);
    this.load.image('furniture_clone_tube', `${base}/tiles/furniture_clone_tube.png`);
    this.load.image('furniture_cargo_crate', `${base}/tiles/furniture_cargo_crate.png`);
    this.load.image('furniture_upgrade_terminal', `${base}/tiles/furniture_upgrade_terminal.png`);

    // Character sprites (use as single frames per direction)
    this.load.image('char_down', `${base}/sprites/char_player_down.png`);
    this.load.image('char_up', `${base}/sprites/char_player_up.png`);
    this.load.image('char_left', `${base}/sprites/char_player_left.png`);
    this.load.image('char_right', `${base}/sprites/char_player_right.png`);

    // Item icons
    this.load.image('icon_stardust', `${base}/items/icon_stardust.png`);
    this.load.image('icon_void_salt', `${base}/items/icon_void_salt.png`);
    this.load.image('icon_nebula_nectar', `${base}/items/icon_nebula_nectar.png`);
    this.load.image('icon_comet_tail', `${base}/items/icon_comet_tail.png`);
    this.load.image('icon_singularity_seed', `${base}/items/icon_singularity_seed.png`);
    this.load.image('icon_solar_flare_pepper', `${base}/items/icon_solar_flare_pepper.png`);

    // Harvest scene
    this.load.image('harvest_ship', `${base}/harvest/harvest_player_ship.png`);
    this.load.image('harvest_enemy', `${base}/harvest/harvest_enemy.png`);
    this.load.image('harvest_asteroid_large', `${base}/harvest/harvest_asteroid_large.png`);
    this.load.image('harvest_asteroid_small', `${base}/harvest/harvest_asteroid_small.png`);
    this.load.image('harvest_bg', `${base}/harvest/harvest_bg_nebula.png`);

    // Generate simple textures for bullets and pickups
    this.createProceduralSprites();
  }

  private createProceduralSprites(): void {
    // Bullet
    const bullet = this.make.graphics({ x: 0, y: 0 });
    bullet.fillStyle(0xffcc00, 0.4);
    bullet.fillCircle(3, 6, 3);
    bullet.fillStyle(0xffee66, 1);
    bullet.fillRect(1, 1, 4, 10);
    bullet.fillStyle(0xffffff, 1);
    bullet.fillRect(2, 2, 2, 6);
    bullet.generateTexture('bullet', 6, 12);
    bullet.destroy();

    // Pickup glow
    const pickup = this.make.graphics({ x: 0, y: 0 });
    pickup.fillStyle(0x00ff88, 0.8);
    pickup.beginPath();
    pickup.moveTo(8, 1); pickup.lineTo(14, 8); pickup.lineTo(8, 15); pickup.lineTo(2, 8);
    pickup.closePath();
    pickup.fillPath();
    pickup.fillStyle(0xaaffdd, 0.6);
    pickup.beginPath();
    pickup.moveTo(8, 3); pickup.lineTo(11, 8); pickup.lineTo(8, 11); pickup.lineTo(5, 8);
    pickup.closePath();
    pickup.fillPath();
    pickup.generateTexture('pickup', 16, 16);
    pickup.destroy();

    // Interaction prompt circle
    const prompt = this.make.graphics({ x: 0, y: 0 });
    prompt.lineStyle(2, 0x00d9ff, 0.8);
    prompt.strokeCircle(16, 16, 14);
    prompt.fillStyle(0x00d9ff, 0.15);
    prompt.fillCircle(16, 16, 14);
    prompt.generateTexture('interact_prompt', 32, 32);
    prompt.destroy();
  }

  create(): void {
    const loaded = loadFromStorage();
    logger.info('BootScene: Assets loaded', { savedGameLoaded: loaded });

    // Process character sprites: extract first frame, remove white bg, trim
    this.processCharacterSprites();

    this.scene.start('ShipScene');
  }

  private processCharacterSprites(): void {
    const directions = ['down', 'up', 'left', 'right'];

    for (const dir of directions) {
      const key = `char_${dir}`;
      const source = this.textures.get(key).getSourceImage() as HTMLImageElement;

      // Extract first frame (left quarter of the 4-frame sprite sheet)
      const frameW = Math.floor(source.width / 4);
      const frameH = source.height;

      const canvas = document.createElement('canvas');
      canvas.width = frameW;
      canvas.height = frameH;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(source, 0, 0, frameW, frameH, 0, 0, frameW, frameH);

      // Remove white/near-white background
      const imageData = ctx.getImageData(0, 0, frameW, frameH);
      const d = imageData.data;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        if (r > 215 && g > 215 && b > 215) {
          d[i + 3] = 0;
        }
      }
      ctx.putImageData(imageData, 0, 0);

      // Find bounding box of non-transparent pixels
      let minX = frameW, minY = frameH, maxX = 0, maxY = 0;
      for (let y = 0; y < frameH; y++) {
        for (let x = 0; x < frameW; x++) {
          const idx = (y * frameW + x) * 4;
          if (d[idx + 3] > 0) {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
      }

      // Create trimmed canvas
      const trimW = maxX - minX + 1;
      const trimH = maxY - minY + 1;
      const trimCanvas = document.createElement('canvas');
      trimCanvas.width = trimW;
      trimCanvas.height = trimH;
      const trimCtx = trimCanvas.getContext('2d')!;
      trimCtx.putImageData(ctx.getImageData(minX, minY, trimW, trimH), 0, 0);

      // Replace texture with the processed version
      this.textures.remove(key);
      this.textures.addCanvas(key, trimCanvas);

      logger.info(`Processed char sprite: ${key}`, { originalW: source.width, trimW, trimH });
    }
  }
}
