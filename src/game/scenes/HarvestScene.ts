import Phaser from 'phaser';
import { getState, addIngredient, tickRace } from '../GameState';
import { randomIngredient, INGREDIENTS, type IngredientId } from '../../data/ingredients';
import { logger } from '../../utils/logger';
import { sfx } from '../../utils/sfx';

const GAME_DURATION = 60000;
const ASTEROID_SPAWN_INTERVAL = 800;
const ENEMY_SPAWN_INTERVAL = 3000;
const PLAYER_SPEED = 300;
const PLAYER_ROTATION_SPEED = 200;
const BULLET_SPEED = 500;
const FIRE_RATE = 200;

export class HarvestScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private bullets!: Phaser.Physics.Arcade.Group;
  private asteroids!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;
  private pickups!: Phaser.Physics.Arcade.Group;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private spaceKey!: Phaser.Input.Keyboard.Key;

  private lastFired = 0;
  private timeRemaining = GAME_DURATION;
  private collectedIngredients: Map<IngredientId, number> = new Map();
  private shieldsRemaining = 0;
  private cargoCollected = 0;
  private cargoCapacity = 0;
  private enemiesDestroyed = 0;

  private timerText!: Phaser.GameObjects.Text;
  private cargoText!: Phaser.GameObjects.Text;
  private shieldsText!: Phaser.GameObjects.Text;

  private asteroidSpawnTimer!: Phaser.Time.TimerEvent;
  private enemySpawnTimer!: Phaser.Time.TimerEvent;
  private gameTimer!: Phaser.Time.TimerEvent;

  constructor() {
    super({ key: 'HarvestScene' });
  }

  create(): void {
    logger.info('HarvestScene: Starting harvest mission');

    const state = getState();
    this.shieldsRemaining = state.ship.shieldHits;
    this.cargoCapacity = state.ship.cargoCapacity;
    this.cargoCollected = 0;
    this.collectedIngredients.clear();
    this.enemiesDestroyed = 0;

    this.createBackground();
    this.createPlayer();
    this.createGroups();
    this.createUI();
    this.setupInput();
    this.startSpawners();

    this.timeRemaining = GAME_DURATION;
    this.gameTimer = this.time.addEvent({
      delay: 1000,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true,
    });
  }

  private createBackground(): void {
    // Nebula background
    this.add.image(400, 300, 'harvest_bg').setDisplaySize(800, 600).setDepth(0);

    // Add some extra subtle stars on top
    const stars = this.add.graphics();
    for (let i = 0; i < 60; i++) {
      const x = Phaser.Math.Between(0, 800);
      const y = Phaser.Math.Between(0, 600);
      const alpha = Phaser.Math.FloatBetween(0.3, 0.9);
      stars.fillStyle(0xffffff, alpha);
      stars.fillCircle(x, y, Phaser.Math.FloatBetween(0.5, 1.2));
    }
    stars.setDepth(1);
  }

  private createPlayer(): void {
    this.player = this.physics.add.sprite(400, 300, 'harvest_ship')
      .setScale(0.06)
      .setCollideWorldBounds(true)
      .setDrag(100)
      .setMaxVelocity(PLAYER_SPEED)
      .setDepth(100);
  }

  private createGroups(): void {
    this.bullets = this.physics.add.group({ defaultKey: 'bullet', maxSize: 20 });
    this.asteroids = this.physics.add.group();
    this.enemies = this.physics.add.group();
    this.pickups = this.physics.add.group();

    this.physics.add.overlap(this.bullets, this.asteroids, this.bulletHitAsteroid as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);
    this.physics.add.overlap(this.bullets, this.enemies, this.bulletHitEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);
    this.physics.add.overlap(this.player, this.pickups, this.collectPickup as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);
    this.physics.add.overlap(this.player, this.enemies, this.playerHitEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);
    this.physics.add.overlap(this.player, this.asteroids, this.playerHitAsteroid as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);
  }

  private createUI(): void {
    this.timerText = this.add.text(400, 20, 'Time: 60', {
      fontFamily: 'monospace', fontSize: '20px', color: '#ffcc00',
    }).setOrigin(0.5, 0).setDepth(200);

    this.cargoText = this.add.text(20, 20, `Cargo: 0/${this.cargoCapacity}`, {
      fontFamily: 'monospace', fontSize: '16px', color: '#00ff88',
    }).setDepth(200);

    this.shieldsText = this.add.text(20, 45, `Shields: ${this.shieldsRemaining}`, {
      fontFamily: 'monospace', fontSize: '16px', color: '#00d9ff',
    }).setDepth(200);

    this.add.text(400, 580, 'WASD/Arrows to move | SPACE to fire', {
      fontFamily: 'monospace', fontSize: '12px', color: '#606060',
    }).setOrigin(0.5).setDepth(200);
  }

  private setupInput(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  private startSpawners(): void {
    this.asteroidSpawnTimer = this.time.addEvent({ delay: ASTEROID_SPAWN_INTERVAL, callback: this.spawnAsteroid, callbackScope: this, loop: true });
    this.enemySpawnTimer = this.time.addEvent({ delay: ENEMY_SPAWN_INTERVAL, callback: this.spawnEnemy, callbackScope: this, loop: true });
  }

  private spawnAsteroid(): void {
    const side = Phaser.Math.Between(0, 3);
    let x: number, y: number, vx: number, vy: number;
    switch (side) {
      case 0: x = Phaser.Math.Between(0, 800); y = -30; vx = Phaser.Math.Between(-50, 50); vy = Phaser.Math.Between(50, 100); break;
      case 1: x = 830; y = Phaser.Math.Between(0, 600); vx = Phaser.Math.Between(-100, -50); vy = Phaser.Math.Between(-50, 50); break;
      case 2: x = Phaser.Math.Between(0, 800); y = 630; vx = Phaser.Math.Between(-50, 50); vy = Phaser.Math.Between(-100, -50); break;
      default: x = -30; y = Phaser.Math.Between(0, 600); vx = Phaser.Math.Between(50, 100); vy = Phaser.Math.Between(-50, 50);
    }

    const ingredientId = randomIngredient();
    const ingredient = INGREDIENTS.find(i => i.id === ingredientId)!;
    const isLarge = Phaser.Math.Between(0, 1) === 1;
    const texture = isLarge ? 'harvest_asteroid_large' : 'harvest_asteroid_small';

    const asteroid = this.asteroids.create(x, y, texture) as Phaser.Physics.Arcade.Sprite;
    asteroid.setScale(isLarge ? 0.05 : 0.035);
    asteroid.setVelocity(vx, vy);
    asteroid.setTint(Phaser.Display.Color.HexStringToColor(ingredient.color).color);
    asteroid.setData('ingredientId', ingredientId);
    asteroid.setData('health', isLarge ? 2 : 1);
    asteroid.setDepth(50);
  }

  private spawnEnemy(): void {
    const side = Phaser.Math.Between(0, 3);
    let x: number, y: number;
    switch (side) {
      case 0: x = Phaser.Math.Between(0, 800); y = -30; break;
      case 1: x = 830; y = Phaser.Math.Between(0, 600); break;
      case 2: x = Phaser.Math.Between(0, 800); y = 630; break;
      default: x = -30; y = Phaser.Math.Between(0, 600);
    }

    const enemy = this.enemies.create(x, y, 'harvest_enemy') as Phaser.Physics.Arcade.Sprite;
    enemy.setScale(0.04);
    enemy.setData('health', 2);
    enemy.setDepth(50);
    this.physics.moveToObject(enemy, this.player, 80);
  }

  update(time: number): void {
    if (this.timeRemaining <= 0) return;
    this.handleInput(time);
    this.updateEnemyMovement();
    this.cleanupOffscreen();
  }

  private handleInput(time: number): void {
    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      this.player.setAngularVelocity(-PLAYER_ROTATION_SPEED);
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      this.player.setAngularVelocity(PLAYER_ROTATION_SPEED);
    } else {
      this.player.setAngularVelocity(0);
    }

    if (this.cursors.up.isDown || this.wasd.W.isDown) {
      const angle = Phaser.Math.DegToRad(this.player.angle - 90);
      this.player.setAcceleration(Math.cos(angle) * PLAYER_SPEED * 2, Math.sin(angle) * PLAYER_SPEED * 2);
    } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
      const angle = Phaser.Math.DegToRad(this.player.angle - 90);
      this.player.setAcceleration(-Math.cos(angle) * PLAYER_SPEED, -Math.sin(angle) * PLAYER_SPEED);
    } else {
      this.player.setAcceleration(0, 0);
    }

    if (this.spaceKey.isDown && time > this.lastFired + FIRE_RATE) {
      this.fireBullet();
      this.lastFired = time;
    }
  }

  private fireBullet(): void {
    const bullet = this.bullets.get(this.player.x, this.player.y) as Phaser.Physics.Arcade.Sprite;
    if (!bullet) return;
    sfx.laser();
    bullet.setActive(true).setVisible(true).setAngle(this.player.angle).setDepth(90);
    const angle = Phaser.Math.DegToRad(this.player.angle - 90);
    bullet.setVelocity(Math.cos(angle) * BULLET_SPEED, Math.sin(angle) * BULLET_SPEED);
    this.time.delayedCall(2000, () => { if (bullet.active) { bullet.setActive(false).setVisible(false); } });
  }

  private updateEnemyMovement(): void {
    this.enemies.children.iterate((obj: Phaser.GameObjects.GameObject) => {
      const e = obj as Phaser.Physics.Arcade.Sprite;
      if (e.active) this.physics.moveToObject(e, this.player, 80);
      return true;
    });
  }

  private cleanupOffscreen(): void {
    const margin = 100;
    this.asteroids.children.iterate((obj: Phaser.GameObjects.GameObject) => {
      const s = obj as Phaser.Physics.Arcade.Sprite;
      if (s.x < -margin || s.x > 800 + margin || s.y < -margin || s.y > 600 + margin) s.destroy();
      return true;
    });
  }

  private bulletHitAsteroid(bullet: Phaser.GameObjects.GameObject, asteroid: Phaser.GameObjects.GameObject): void {
    const b = bullet as Phaser.Physics.Arcade.Sprite;
    const a = asteroid as Phaser.Physics.Arcade.Sprite;
    b.setActive(false).setVisible(false);
    const health = a.getData('health') - 1;
    a.setData('health', health);
    if (health <= 0) {
      sfx.explosion();
      this.spawnPickup(a.x, a.y, a.getData('ingredientId') as IngredientId);
      // Screen shake on destroy
      this.cameras.main.shake(80, 0.003);
      a.destroy();
    } else {
      this.tweens.add({ targets: a, alpha: 0.5, duration: 50, yoyo: true });
    }
  }

  private bulletHitEnemy(bullet: Phaser.GameObjects.GameObject, enemy: Phaser.GameObjects.GameObject): void {
    const b = bullet as Phaser.Physics.Arcade.Sprite;
    const e = enemy as Phaser.Physics.Arcade.Sprite;
    b.setActive(false).setVisible(false);
    const health = e.getData('health') - 1;
    e.setData('health', health);
    if (health <= 0) {
      this.enemiesDestroyed++;
      sfx.explosion();
      this.cameras.main.shake(100, 0.005);
      e.destroy();
    } else {
      this.tweens.add({ targets: e, alpha: 0.5, duration: 50, yoyo: true });
    }
  }

  private spawnPickup(x: number, y: number, ingredientId: IngredientId): void {
    const ingredient = INGREDIENTS.find(i => i.id === ingredientId)!;
    const pickup = this.pickups.create(x, y, 'pickup') as Phaser.Physics.Arcade.Sprite;
    pickup.setTint(Phaser.Display.Color.HexStringToColor(ingredient.color).color);
    pickup.setData('ingredientId', ingredientId);
    pickup.setDepth(80);
    this.tweens.add({ targets: pickup, y: y - 10, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.time.delayedCall(5000, () => { if (pickup.active) pickup.destroy(); });
  }

  private collectPickup(_player: Phaser.GameObjects.GameObject, pickup: Phaser.GameObjects.GameObject): void {
    const p = pickup as Phaser.Physics.Arcade.Sprite;
    if (this.cargoCollected >= this.cargoCapacity) return;
    const ingredientId = p.getData('ingredientId') as IngredientId;
    const current = this.collectedIngredients.get(ingredientId) || 0;
    this.collectedIngredients.set(ingredientId, current + 1);
    this.cargoCollected++;
    sfx.pickup();
    this.cargoText.setText(`Cargo: ${this.cargoCollected}/${this.cargoCapacity}`);
    p.destroy();
  }

  private playerHitEnemy(_p: Phaser.GameObjects.GameObject, enemy: Phaser.GameObjects.GameObject): void {
    (enemy as Phaser.Physics.Arcade.Sprite).destroy();
    this.takeDamage();
  }

  private playerHitAsteroid(_p: Phaser.GameObjects.GameObject, asteroid: Phaser.GameObjects.GameObject): void {
    (asteroid as Phaser.Physics.Arcade.Sprite).destroy();
    this.takeDamage();
  }

  private takeDamage(): void {
    this.shieldsRemaining--;
    sfx.damage();
    this.shieldsText.setText(`Shields: ${this.shieldsRemaining}`);
    this.cameras.main.shake(150, 0.01);
    this.tweens.add({ targets: this.player, alpha: 0.3, duration: 100, yoyo: true, repeat: 2 });
    if (this.shieldsRemaining <= 0) this.endMission(true);
  }

  private updateTimer(): void {
    this.timeRemaining -= 1000;
    const seconds = Math.max(0, Math.floor(this.timeRemaining / 1000));
    this.timerText.setText(`Time: ${seconds}`);
    if (this.timeRemaining <= 0) this.endMission(false);
  }

  private endMission(aborted: boolean): void {
    this.asteroidSpawnTimer.destroy();
    this.enemySpawnTimer.destroy();
    this.gameTimer.destroy();

    this.collectedIngredients.forEach((count, ingredientId) => {
      for (let i = 0; i < count; i++) addIngredient(ingredientId);
    });

    sfx.missionEnd();
    const result = tickRace();

    // Results overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, 800, 600).setDepth(300);

    const panel = this.add.graphics();
    panel.fillStyle(0x16213e, 0.95);
    panel.fillRoundedRect(200, 150, 400, 300, 16);
    panel.lineStyle(3, 0x00d9ff);
    panel.strokeRoundedRect(200, 150, 400, 300, 16);
    panel.setDepth(301);

    this.add.text(400, 180, aborted ? 'MISSION ABORTED' : 'MISSION COMPLETE', {
      fontFamily: 'monospace', fontSize: '24px', color: aborted ? '#ff0054' : '#00ff88',
    }).setOrigin(0.5).setDepth(302);

    let y = 230;
    this.add.text(400, y, `Cargo Collected: ${this.cargoCollected}`, { fontFamily: 'monospace', fontSize: '16px', color: '#e0e0e0' }).setOrigin(0.5).setDepth(302);
    y += 30;
    this.add.text(400, y, `Enemies Destroyed: ${this.enemiesDestroyed}`, { fontFamily: 'monospace', fontSize: '16px', color: '#e0e0e0' }).setOrigin(0.5).setDepth(302);
    y += 50;
    this.add.text(400, y, 'Click to continue...', { fontFamily: 'monospace', fontSize: '14px', color: '#606060' }).setOrigin(0.5).setDepth(302);

    this.input.once('pointerdown', () => {
      if (result.gameOver) {
        this.scene.start('GameOverScene', { victory: result.victory });
      } else {
        this.scene.start('ShipScene');
      }
    });
  }
}
