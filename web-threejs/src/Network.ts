import { Client, Room } from "@colyseus/sdk";

export class Network {
  client: Client;
  room!: Room;

  constructor(serverUrl: string) {
    this.client = new Client(serverUrl);
  }

  async connect(attempts = 1, retryDelayMs = 0): Promise<Room> {
    for (let i = 1; ; i++) {
      try {
        this.room = await this.client.joinOrCreate("battle");
        return this.room;
      } catch (e) {
        if (i >= attempts) throw e;
        console.warn(`Connect attempt ${i} failed, retrying`, e);
        await new Promise((r) => setTimeout(r, retryDelayMs));
      }
    }
  }

  sendMove(x: number, y: number) {
    this.room?.send("move", { x, y });
  }

  sendTarget(angle: number) {
    this.room?.send("target", angle);
  }

  sendShoot(shooting: boolean) {
    this.room?.send("shoot", shooting);
  }

  sendName(name: string) {
    this.room?.send("name", name);
  }
}
