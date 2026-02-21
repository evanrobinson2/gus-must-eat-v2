import Phaser from 'phaser';
import {
  SHIP_GRID, MAP_COLS, MAP_ROWS, TILE_W, TILE_H,
  FURNITURE, INTERACTION_ZONES, PLAYER_START,
  tileToScreen, isWalkable,
  type RoomId, type InteractionZone,
} from '../ShipMap';
import { getState } from '../GameState';
import { logger } from '../../utils/logger';
import { sfx } from '../../utils/sfx';

const MOVE_DURATION = 220; // ms per tile

export class ShipScene extends Phaser.Scene {
  private isoContainer!: Phaser.GameObjects.Container;
  private player!: Phaser.GameObjects.Image;
  private playerCol!: number;
  private playerRow!: number;
  private isMoving = false;
  private facing: 'down' | 'up' | 'left' | 'right' = 'down';

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private interactKey!: Phaser.Input.Keyboard.Key;

  private promptSprite?: Phaser.GameObjects.Image;
  private promptText?: Phaser.GameObjects.Text;
  private nearbyZone?: InteractionZone;

  private statusTexts: Phaser.GameObjects.Text[] = [];

  constructor() {
    super({ key: 'ShipScene' });
  }

  create(): void {
    logger.info('ShipScene: Creating isometric ship');

    // Dark background
    this.cameras.main.setBackgroundColor(0x050510);

    // Container for all iso content (we'll center it)
    this.isoContainer = this.add.container(0, 0);

    this.renderMap();
    this.renderFurniture();
    this.spawnPlayer();
    this.setupInput();
    this.createStatusBar();
    this.updateStatusBar();

    // Center camera on the map
    const centerTile = tileToScreen(MAP_COLS / 2, MAP_ROWS / 2);
    const camOffsetX = this.cameras.main.width / 2 - centerTile.x;
    const camOffsetY = this.cameras.main.height / 2 - centerTile.y + 20;
    this.isoContainer.setPosition(camOffsetX, camOffsetY);

    // Room labels
    this.addRoomLabel(9, 1.5, 'BRIDGE');
    this.addRoomLabel(4, 5.5, 'GALLEY');
    this.addRoomLabel(15, 5.5, 'ENGINEERING');
    this.addRoomLabel(4, 11.5, 'CLONE BAY');
    this.addRoomLabel(15, 11.5, 'CARGO');
  }

  private renderMap(): void {
    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        const tile = SHIP_GRID[row][col];
        if (tile === 0) continue;

        const { x, y } = tileToScreen(col, row);

        if (tile === 1 || tile === 2) {
          const tex = tile === 1 ? 'tile_floor_metal' : 'tile_floor_grating';
          const img = this.add.image(x, y, tex)
            .setScale(TILE_W / 512) // scale the 1024 image to tile size (diamond ~512px in image)
            .setDepth(row + col);
          this.isoContainer.add(img);
        } else if (tile === 3) {
          // Wall - render as dark rectangle for now, wall sprite on top
          const img = this.add.image(x, y - 10, 'tile_wall_base')
            .setScale(TILE_W / 512)
            .setDepth(row + col + 100); // walls render above floors
          this.isoContainer.add(img);
        }
      }
    }
  }

  private renderFurniture(): void {
    for (const f of FURNITURE) {
      const { x, y } = tileToScreen(f.col, f.row);
      const scale = f.scale ?? 0.3;
      const offsetY = f.offsetY ?? 0;
      const img = this.add.image(x, y + offsetY, f.texture)
        .setScale(scale)
        .setDepth(f.row + f.col + 50); // above floor, below player if player is in front
      this.isoContainer.add(img);
    }
  }

  private spawnPlayer(): void {
    this.playerCol = PLAYER_START.col;
    this.playerRow = PLAYER_START.row;

    const { x, y } = tileToScreen(this.playerCol, this.playerRow);
    // Character sprites are pre-processed in BootScene (extracted, bg removed, trimmed)
    this.player = this.add.image(x, y - 12, 'char_down')
      .setScale(0.18)
      .setDepth(1000);
    this.isoContainer.add(this.player);
  }

  private setupInput(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    this.interactKey.on('down', () => {
      if (this.nearbyZone) {
        this.handleInteraction(this.nearbyZone);
      }
    });
  }

  update(): void {
    if (this.isMoving) return;

    // Check movement input - in isometric, directions are rotated 45 degrees
    // Up arrow = move toward top-right of screen (col+0, row-1)
    // Down arrow = move toward bottom-left (col+0, row+1)
    // Left arrow = move toward top-left (col-1, row+0)
    // Right arrow = move toward bottom-right (col+1, row+0)

    let dCol = 0;
    let dRow = 0;

    if (this.cursors.up.isDown || this.wasd.W.isDown) {
      dRow = -1; // up in iso
      this.setFacing('up');
    } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
      dRow = 1; // down in iso
      this.setFacing('down');
    } else if (this.cursors.left.isDown || this.wasd.A.isDown) {
      dCol = -1; // left in iso
      this.setFacing('left');
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      dCol = 1; // right in iso
      this.setFacing('right');
    }

    if (dCol !== 0 || dRow !== 0) {
      const newCol = this.playerCol + dCol;
      const newRow = this.playerRow + dRow;

      if (isWalkable(newCol, newRow)) {
        this.movePlayer(newCol, newRow);
      }
    }

    this.checkInteractionZones();
  }

  private setFacing(dir: 'down' | 'up' | 'left' | 'right'): void {
    if (this.facing === dir) return;
    this.facing = dir;
    this.player.setTexture(`char_${dir}`);
  }

  private movePlayer(newCol: number, newRow: number): void {
    this.isMoving = true;
    this.playerCol = newCol;
    this.playerRow = newRow;

    const { x, y } = tileToScreen(newCol, newRow);

    // Walking bob tween
    this.tweens.add({
      targets: this.player,
      x,
      y: y - 12,
      duration: MOVE_DURATION,
      ease: 'Linear',
      onComplete: () => {
        this.isMoving = false;
        this.player.setDepth(newRow + newCol + 500);
      },
    });

    // Subtle bob
    this.tweens.add({
      targets: this.player,
      scaleY: 0.17,
      duration: MOVE_DURATION / 2,
      yoyo: true,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.player.setScale(0.18);
      },
    });
  }

  private checkInteractionZones(): void {
    let found: InteractionZone | undefined;

    for (const zone of INTERACTION_ZONES) {
      const dist = Math.abs(this.playerCol - zone.col) + Math.abs(this.playerRow - zone.row);
      if (dist <= 2) {
        found = zone;
        break;
      }
    }

    if (found && found !== this.nearbyZone) {
      this.nearbyZone = found;
      this.showInteractionPrompt(found);
    } else if (!found && this.nearbyZone) {
      this.nearbyZone = undefined;
      this.hideInteractionPrompt();
    }
  }

  private showInteractionPrompt(zone: InteractionZone): void {
    this.hideInteractionPrompt();

    const { x, y } = tileToScreen(zone.col, zone.row);

    this.promptSprite = this.add.image(x, y - 40, 'interact_prompt')
      .setScale(1.5)
      .setDepth(2000);
    this.isoContainer.add(this.promptSprite);

    this.tweens.add({
      targets: this.promptSprite,
      alpha: 0.5,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    // Show prompt text in screen space (not iso)
    this.promptText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height - 80,
      `[E] ${zone.label}`,
      { fontFamily: 'monospace', fontSize: '18px', color: '#00d9ff',
        backgroundColor: '#0a0a12cc', padding: { x: 12, y: 6 } }
    ).setOrigin(0.5).setDepth(3000);
  }

  private hideInteractionPrompt(): void {
    if (this.promptSprite) {
      this.promptSprite.destroy();
      this.promptSprite = undefined;
    }
    if (this.promptText) {
      this.promptText.destroy();
      this.promptText = undefined;
    }
  }

  private handleInteraction(zone: InteractionZone): void {
    sfx.click();
    logger.info('Interaction', { room: zone.room });

    switch (zone.room) {
      case 'bridge':
        this.scene.launch('BridgeUI');
        this.scene.pause();
        break;
      case 'galley':
        this.scene.launch('GalleyUI');
        this.scene.pause();
        break;
      case 'engineering':
        this.scene.launch('EngineeringUI');
        this.scene.pause();
        break;
      case 'clonebay':
        this.scene.launch('CloneBayUI');
        this.scene.pause();
        break;
      case 'cargo':
        this.scene.launch('CargoUI');
        this.scene.pause();
        break;
    }
  }

  private addRoomLabel(col: number, row: number, text: string): void {
    const { x, y } = tileToScreen(col, row);
    const label = this.add.text(x, y - 25, text, {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#00d9ff',
    }).setOrigin(0.5).setAlpha(0.5).setDepth(200);
    this.isoContainer.add(label);
  }

  private createStatusBar(): void {
    const bar = this.add.graphics();
    bar.fillStyle(0x0a0a12, 0.9);
    bar.fillRect(0, 0, this.cameras.main.width, 36);
    bar.lineStyle(1, 0x1f4068);
    bar.lineBetween(0, 36, this.cameras.main.width, 36);
    bar.setDepth(4000);
  }

  private updateStatusBar(): void {
    for (const t of this.statusTexts) t.destroy();
    this.statusTexts = [];

    const state = getState();
    const items = [
      { text: `Science: ${state.science}`, color: '#00d9ff', x: 20 },
      { text: `Cargo: ${state.ship.currentCargo}/${state.ship.cargoCapacity}`, color: '#00ff88', x: 170 },
      { text: `Tick: ${state.race.tick}`, color: '#ffcc00', x: 350 },
      { text: `Gus: ${state.race.gusPosition.toFixed(0)}`, color: '#ff0054', x: 460 },
      { text: `Earth: ${state.race.earthPosition.toFixed(0)}`, color: '#00d9ff', x: 570 },
    ];

    for (const item of items) {
      const t = this.add.text(item.x, 10, item.text, {
        fontFamily: 'monospace', fontSize: '14px', color: item.color,
      }).setDepth(4001);
      this.statusTexts.push(t);
    }

    // Re-check every 2 seconds
    this.time.delayedCall(2000, () => {
      if (this.scene.isActive()) this.updateStatusBar();
    });
  }

  // Called when returning from a UI overlay
  resumeFromUI(): void {
    this.hideInteractionPrompt();
    this.updateStatusBar();

    const state = getState();
    if (state.gameOver) {
      this.scene.start('GameOverScene', { victory: state.victory });
    }
  }
}
