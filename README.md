# Demo: Realtime Tanks Multiplayer

![Realtime Tanks Demo](sharing.webp)

A multiplayer tank battle game built with [Colyseus](https://colyseus.io/). Multiple frontend implementations share the same authoritative game server.

> Inspired by the [Tanx](http://playcanv.as/p/aP0oxhUr) from [PlayCanvas](https://playcanvas.com/), by [Max M](https://github.com/Maksims) - Original server sources: [cvan/tanx-1](https://github.com/cvan/tanx-1).

## Project Structure

The `server/` directory contains the shared game server powered by Colyseus 0.17.

| Client | Directory | Rendering | Platforms | Assets | Screenshot |
|---|---|---|---|---|---|
| PlayCanvas | [`web-playcanvas/`](web-playcanvas/) | 3D | Web | [Pixel Tank](https://sketchfab.com/3d-models/pixel-tank-d04bf57ee1ae4504856032549bcfd810) by [Firewarden3D](https://sketchfab.com/Firewarden) | ![PlayCanvas](web-playcanvas/screenshot.webp) |
| GameMaker | [`gamemaker/`](gamemaker/) | 2D | Windows, macOS, Linux, HTML5 | [Kenney Top-Down Tanks](https://kenney.nl/assets/top-down-tanks-redux) (CC0) | ![GameMaker](gamemaker/screenshot.webp) |
| Godot | [`godot/`](godot/) | 3D | Windows, macOS, Linux, HTML5, iOS, Android | Procedural meshes | ![Godot](godot/screenshot.webp) |
| Defold | [`defold/`](defold/) | 2D | Windows, macOS, Linux, HTML5, iOS, Android | [Kenney Top-Down Tanks](https://kenney.nl/assets/top-down-tanks-redux) (CC0) | ![Defold](defold/screenshot.webp) |
| Haxe + Heaps | [`haxe/`](haxe/) | 3D | Web, Native (HL/C) | Procedural meshes | ![Haxe](haxe/screenshot.webp) |
| Unity | [`unity/`](unity/) | 3D | Windows, macOS, Linux, WebGL, iOS, Android | Procedural primitives | ![Unity](unity/screenshot.webp) |
| Three.js | [`web-threejs/`](web-threejs/) | 3D | Web | [Pixel Tank](https://sketchfab.com/3d-models/pixel-tank-d04bf57ee1ae4504856032549bcfd810) by [Firewarden3D](https://sketchfab.com/Firewarden) | ![Three.js](web-threejs/screenshot.webp) |
| Construct 3 | [`construct3/`](construct3/) | 2D | Web | [Kenney Top-Down Tanks](https://kenney.nl/assets/top-down-tanks-redux) (CC0) | ![Construct 3](construct3/screenshot.webp) |
| MonoGame | [`monogame/`](monogame/) | 2D | Windows, macOS, Linux | Procedural primitives | ![MonoGame](monogame/screenshot.webp) |

## Hosting on Edgegap

This fork adds [Edgegap](https://edgegap.com/) hosting: one server per match, placed near its players, which stops itself when the match is over. Players reach it directly (every client has a `server` setting for a deployment's URL) or through the Edgegap Matchmaker (built into the Three.js, Unity and Godot clients). Only three clients have been run end to end on Edgegap so far: Three.js (web), Godot (desktop) and Unity (Windows). The other clients and builds have the code but were not run; see [What was tested](edgegap/README.md#what-was-tested). Setup is in [`edgegap/README.md`](edgegap/README.md).

## Getting Started

Start the server:

```bash
cd server && npm install
npm run dev
```

See each client's README for setup instructions.

## License

MIT — See [LICENSE](LICENSE) file.
