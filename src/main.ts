import Phaser from 'phaser';
import { BootScene } from './game/scenes/BootScene';
import { ShipScene } from './game/scenes/ShipScene';
import { BridgeUI } from './game/scenes/BridgeUI';
import { GalleyUI } from './game/scenes/GalleyUI';
import { EngineeringUI } from './game/scenes/EngineeringUI';
import { CloneBayUI } from './game/scenes/CloneBayUI';
import { CargoUI } from './game/scenes/CargoUI';
import { HarvestScene } from './game/scenes/HarvestScene';
import { GameOverScene } from './game/scenes/GameOverScene';
import { logger } from './utils/logger';

logger.info('Gus Must Eat v2 - Initializing');

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 800,
  height: 600,
  pixelArt: true,
  roundPixels: true,
  backgroundColor: '#050510',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, ShipScene, BridgeUI, GalleyUI, EngineeringUI, CloneBayUI, CargoUI, HarvestScene, GameOverScene],
};

const game = new Phaser.Game(config);

logger.info('Game instance created', { width: 800, height: 600 });

export default game;
