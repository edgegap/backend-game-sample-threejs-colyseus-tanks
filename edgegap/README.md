# Hosting the Tanks server on Edgegap

This fork runs the [Colyseus](https://colyseus.io/) tanks server on [Edgegap](https://edgegap.com/). Each match gets its own server, started near its players, and the server stops itself when the match is over. It supports two ways for players to reach a server:

- **Direct**: you start a deployment (with a script, the dashboard or your own backend) and pass its URL to the clients. Every client has a `server` setting for this, but only the Godot desktop client was run this way on Edgegap (see [What was tested](#what-was-tested)).
- **Edgegap Matchmaker** (optional): players click Play, the matchmaker groups them and starts a server, and every matched client gets its address. The code is in the Three.js, Unity and Godot clients, for web and desktop builds; Three.js in the browser, Godot desktop and a Unity Windows build were run on Edgegap.

```
Direct:      you / your backend --deploy--> Edgegap --wss://<id>.pr.edgegap.net:<port>--> clients
Matchmaker:  clients --tickets--> Edgegap Matchmaker --deploy--> Edgegap --assignment--> clients --wss--> server
```

Nothing in the gameplay changed. Locally, the server still behaves like upstream (`npm run dev`, playground, monitor).

## What changed in the server

| File | Change |
|---|---|
| [`server/src/edgegap.ts`](../server/src/edgegap.ts) | Deployment lifecycle. Only runs when `ARBITRIUM_REQUEST_ID` is set, which Edgegap does for every deployment. |
| [`server/src/rooms/BattleRoom.ts`](../server/src/rooms/BattleRoom.ts) | Counts players for the lifecycle. Optional match end after `MATCH_ROUNDS` won rounds. |
| [`server/src/index.ts`](../server/src/index.ts) | Playground and monitor are off on Edgegap. |
| [`server/Dockerfile`](../server/Dockerfile) | `linux/amd64` image, Node as PID 1, port 2567. |
| [`server/scripts/edgegap-deploy.mjs`](../server/scripts/edgegap-deploy.mjs) | Starts one deployment near you and prints the URL to give clients. |

On Edgegap the server stops its own deployment, which stops billing, when:

- nobody joined within `FIRST_JOIN_TIMEOUT_S` (default 120 s);
- everyone left and nobody came back within `EMPTY_TIMEOUT_S` (default 30 s);
- `MATCH_ROUNDS` is above 0 and that many rounds have been won. The winner shows for 5 s, then players are disconnected. The default, 0, keeps the endless arena.

The version's max duration is the backstop.

## 1. Build and push the server image

Edgegap pulls a `linux/amd64` image from a registry. Your Edgegap project's registry details are on the **Container Registry** page of the [dashboard](https://app.edgegap.com).

```bash
cd server
docker build --platform linux/amd64 -t registry.edgegap.com/<project>/realtime-tanks:v1 .
docker login registry.edgegap.com
docker push registry.edgegap.com/<project>/realtime-tanks:v1
```

Test the image locally first. `ARBITRIUM_REQUEST_ID` makes it act as on Edgegap; with no delete URL set, self-stop logs that and exits:

```bash
docker run --rm -p 2567:2567 -e ARBITRIUM_REQUEST_ID=local -e EMPTY_TIMEOUT_S=10 realtime-tanks:v1
```

## 2. Create the application and version

In the dashboard, create an application named `realtime-tanks` and a version `v1`:

| Setting | Value |
|---|---|
| Image | `registry.edgegap.com/<project>/realtime-tanks`, tag `v1` |
| Registry credentials | the username and token from the Container Registry page |
| vCPU / memory | 0.25 vCPU / 512 MB is plenty |
| Port | `2567`, protocol **WS**, name **`gameport`**, **TLS Upgrade on** |
| Max duration | 60 min for testing |
| Env vars (optional) | `MATCH_ROUNDS`, `EMPTY_TIMEOUT_S`, `FIRST_JOIN_TIMEOUT_S` |

**TLS Upgrade** is what lets the clients, browser builds included, use `wss://<id>.pr.edgegap.net:<port>`. Edgegap terminates TLS and forwards plain HTTP and WebSocket to port 2567. The Colyseus matchmaking HTTP request and the room WebSocket both go through that one port.

## 3a. Direct mode

Start a server near you. The API token stays on your machine:

```bash
cd server
EDGEGAP_API_TOKEN=<token> npm run edgegap:deploy -- realtime-tanks v1
```

It prints `wss://<request_id>.pr.edgegap.net:<port>` and how to pass it to each client:

| Client | How to set the server |
|---|---|
| Three.js, PlayCanvas | `?server=wss://...` in the page URL |
| Construct 3 | `?server=wss://...` in the page URL |
| Godot | `--server=wss://...` (after `--` in the editor's main run args); web export: `?server=wss://...` |
| Unity | `--server=wss://...` on the command line; WebGL: `?server=wss://...`; or the `serverUrl` field |
| Defold | HTML5: `?server=wss://...`; native: `--config=tanks.server_url=wss://...` or `[tanks] server_url` in `game.project` |
| GameMaker | `--server=wss://...` on the command line; HTML5: `?server=wss://...` |
| Haxe | JS: `?server=wss://...`; HashLink: `--server=wss://...` |
| MonoGame | `--server=wss://...` or the `TANKS_SERVER_URL` environment variable |

In a real game, your backend calls the same Deploy API (`POST /v2/deployments`) when a lobby is ready and sends the URL to its players. The API token never goes into a client or the server image.

## 3b. Edgegap Matchmaker

1. In the dashboard, open **Matchmaker → Create Matchmaker**, upload [`matchmaker-config.json`](matchmaker-config.json) and click **Create and Start**. It has one profile, `casual`: 2 to 8 players per match, and after 15 s it starts a match with whoever is waiting (at least 2).
2. When it shows **Online**, copy its **API URL** and **Auth Token**. The Auth Token is meant to ship in game clients: it can only create and read matchmaking tickets. It is not your Edgegap API token.
3. Browser builds call the matchmaker from the page, so each origin that serves the game must be listed in `allowed_cors_origins`. The config allows `http://localhost:5173` (Vite), `:8060` (Godot web) and `:8080`. Add your real domains before going live.
4. Start the clients with the matchmaker settings:

| Client | Settings |
|---|---|
| Three.js | `http://localhost:5173/?mm=<API URL>&mmToken=<Auth Token>`, or `VITE_MM_URL` / `VITE_MM_TOKEN` in `.env.local` |
| Unity | `--mm=<API URL> --mm-token=<Auth Token>`, WebGL `?mm=...&mmToken=...`, or the *Edgegap Matchmaker* fields on `GameManager` |
| Godot | `-- --mm=<API URL> --mm-token=<Auth Token>`, web export `?mm=...&mmToken=...` |

Every client sends a ticket, shows "Searching for players...", and connects when its ticket reaches `HOST_ASSIGNED`. A server that has just started can answer 502 for a few seconds, so the clients retry the join for up to 20 s. Matchmaking needs at least 2 players, so open two clients. They can be different engines. A `server` setting always wins over the matchmaker.

The matchmaker code is small and has no dependencies, so it ports easily to the other clients: [`Matchmaker.ts`](../web-threejs/src/Matchmaker.ts), [`EdgegapMatchmaker.cs`](../unity/Assets/Scripts/EdgegapMatchmaker.cs), [`edgegap_matchmaker.gd`](../godot/scripts/edgegap_matchmaker.gd).

**Playing alone:** with the matchmaker, a single player is never matched. The `casual` profile needs at least 2 players at every stage (the 15 s expansion keeps `min_team_size` at 2), so a lone ticket stays in "Searching for players..." until `ticket_expiration_period` (5 min) cancels it, and the client then stops with "Ticket expired before a match was found". To play alone, use direct mode: start a deployment and pass its URL to one client. The server does not wait for a second player.

**Known limitation:** the server does not check that a connecting player holds a matchmaker ticket for this match, so anyone who learns the server address can join. Deployments stop themselves when no one joins or everyone leaves, which limits cost. Before production, validate each player against the match's tickets (`MM_TICKET_IDS` / the matchmaker API) or an auth token.

## What was tested

Only three of the nine clients have been run end to end on Edgegap: Three.js (web), Godot (desktop) and Unity (Windows). The others have the same `server` setting, and Godot and Unity have the matchmaker code in their web builds too, but none of them has been run against an Edgegap server.

Tested on 2026-10-20 with Colyseus 0.17, matchmaker 3.3.2, Godot 4.5.2 (Colyseus Godot SDK 0.17.12) and Unity 6000.3:

- Direct: Node Colyseus clients and the Godot desktop client joined a deployment over `wss://`; the server stopped itself after everyone left.
- Matchmaker: Three.js in the browser + Godot desktop were matched onto one server, then Three.js + a Unity Windows build; the server received both ticket IDs and stopped itself once empty.

| Client | Direct (`server` setting) | Edgegap Matchmaker |
|---|---|---|
| Three.js (web) | Not run | Tested |
| Godot (desktop) | Tested | Tested |
| Unity (Windows) | Not run | Tested |
| Godot (web export) | Not run | Not run |
| Unity (WebGL) | Not run | Not run |
| PlayCanvas | Not run | No matchmaker code |
| Construct 3 | Not run | No matchmaker code |
| Defold | Not run | No matchmaker code |
| GameMaker | Not run | No matchmaker code |
| Haxe | Not run | No matchmaker code |
| MonoGame | Not run | No matchmaker code |

Other desktop and mobile builds (macOS, Linux, iOS, Android) were not run either.

## Going further

- **Validate joiners.** Matchmaker deployments get `MM_TICKET_IDS` (JSON array). Have clients pass their ticket ID in the join options and check it in `onAuth`, so only matched players can join.
- **Latency-based placement for desktop.** Add a `latencies` rule and ping beacons from desktop clients. Leave it out for browser profiles, since browsers cannot ping.
- **Before launch.** Set `inspect` to `false`, list your real origins, and raise the max duration to fit your matches.

Edgegap docs: [deployments](https://docs.edgegap.com/learn/orchestration/deployments), [matchmaking](https://docs.edgegap.com/learn/matchmaking).
