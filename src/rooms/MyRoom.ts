import { Room, Client } from 'colyseus';
import { MyRoomState, Player } from './schema/MyRoomState';

export class MyRoom extends Room<MyRoomState> {
  onCreate(options: any) {
    this.setState(new MyRoomState());

    this.onMessage(
      0,
      (
        client,
        data: { left: boolean; right: boolean; up: boolean; down: boolean }
      ) => {
        const player = this.state.players.get(client.sessionId);
        const velocity = 2;
        if (data.left) {
          player.x -= velocity;
        } else if (data.right) {
          player.x += velocity;
        }

        if (data.up) {
          player.y -= velocity;
        } else if (data.down) {
          player.y += velocity;
        }
      }
    );
  }

  onJoin(client: Client, options: any) {
    const mapWidth = 800;
    const mapHeight = 600;
    const player = new Player();

    player.x = Math.random() * mapWidth;
    player.y = Math.random() * mapHeight;

    this.state.players.set(client.sessionId, player);
  }

  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, 'left!');
    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    console.log('room', this.roomId, 'disposing...');
  }
}
