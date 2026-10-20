import { defineRoom, defineServer, playground, monitor, Server } from "colyseus";
import { BattleRoom } from "./rooms/BattleRoom";
import { onEdgegap, startLifecycle } from "./edgegap";

const port = parseInt(process.env.PORT || "2567");

const server = defineServer({
  rooms: {
    battle: defineRoom(BattleRoom)
  },
  express: (app) => {
    // Dev tools stay off on Edgegap: a match server only needs the matchmake route and WebSocket.
    if (onEdgegap) return;
    app.use("/", playground());
    app.use("/monitor", monitor());
  }
});

server.listen(port).then(() => {
  console.log(`Tank Battle server listening on http://localhost:${port}`);
  startLifecycle();
});
