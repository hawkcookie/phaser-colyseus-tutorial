import { Schema } from '@colyseus/schema';
import { MapSchema } from '@colyseus/schema';
import { Client, Room } from 'colyseus.js';
import Phaser from 'phaser';

interface Player extends Schema {
  x: number;
  y: number;
}
type RoomState = {
  players: MapSchema<Player>;
};
// custom scene class
export class GameScene extends Phaser.Scene {
  client = new Client('ws://localhost:2567');
  room: Room<RoomState>;
  playEntities: { [sessionId: string]: any } = {};
  inputPayload = {
    left: false,
    right: false,
    up: false,
    down: false,
  };
  cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys;
  currentPlayer: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;

  preload() {
    // preload scene
    this.load.image(
      'ship_0001',
      'https://cdn.glitch.global/3e033dcd-d5be-4db4-99e8-086ae90969ec/ship_0001.png'
    );
    this.cursorKeys = this.input.keyboard.createCursorKeys();
  }

  async create() {
    // create scene
    try {
      this.room = await this.client.joinOrCreate('my_room');
    } catch (e) {
      console.error(e);
    }

    this.room.state.players.onAdd = (player: Player, sessionId: string) => {
      const entity = this.physics.add.image(player.x, player.y, 'ship_0001');
      this.playEntities[sessionId] = entity;
      if (sessionId === this.room.sessionId) {
        this.currentPlayer = entity;
      } else {
        player.onChange = (changes) => {
          console.log('自分も？');
          entity.setX(player.x);
          entity.setY(player.y);
          changes.forEach((change) => {
            // console.log(change);
            // const { field, value } = change;
            // if (field === 'x') {
            //   entity.setX(value);
            // }
            // if (field === 'y') {
            //   entity.setY(value);
            // }
          });
        };
      }
    };

    this.room.state.players.onRemove = (player: Player, sessionId: string) => {
      const entity = this.playEntities[sessionId];
      if (entity) {
        entity.destroy();
        delete this.playEntities[sessionId];
      }
    };
  }

  update(time: number, delta: number): void {
    // game loop
    if (!this.room) return;
    if (!this.currentPlayer) return;

    this.inputPayload.left = this.cursorKeys.left.isDown;
    this.inputPayload.right = this.cursorKeys.right.isDown;
    this.inputPayload.up = this.cursorKeys.up.isDown;
    this.inputPayload.down = this.cursorKeys.down.isDown;
    this.room.send(0, this.inputPayload);
    const velocity = 2;
    if (this.inputPayload.left) {
      this.currentPlayer.x -= velocity;
    } else if (this.inputPayload.right) {
      this.currentPlayer.x += velocity;
    }

    if (this.inputPayload.up) {
      this.currentPlayer.y -= velocity;
    } else if (this.inputPayload.down) {
      this.currentPlayer.y += velocity;
    }
  }
}

// game config
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#b6d53c',
  parent: 'phaser-example',
  physics: { default: 'arcade' },
  pixelArt: true,
  scene: [GameScene],
};

// instantiate the game
const game = new Phaser.Game(config);
