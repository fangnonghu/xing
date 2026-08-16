# Xing · 地球自转 (Earth Rotation)

An interactive showcase for a pure **SVG + CSS** animated rotating Earth. The
surface, clouds, and meridians each drift at their own speed, wrapped in a small
[Vite](https://vitejs.dev/) app that adds speed and pause/play controls.

The core asset lives at [`public/earth-rotation.svg`](public/earth-rotation.svg)
and animates entirely on its own — the surrounding app only demonstrates it and
adds interactivity.

## Requirements

- Node.js 20+ (developed against Node 22)
- npm 10+

## Getting started

```bash
npm install      # install dependencies
npm run dev      # start the dev server on http://localhost:5173
```

## Available scripts

| Command           | Description                                            |
| ----------------- | ------------------------------------------------------ |
| `npm run dev`     | Start the Vite dev server (`0.0.0.0:5173`).            |
| `npm run build`   | Build the production bundle into `dist/`.              |
| `npm run preview` | Serve the built bundle (`0.0.0.0:4173`).               |
| `npm run lint`    | Run ESLint over the source.                            |

## Project layout

```
.
├── index.html              # Page shell + controls
├── public/
│   └── earth-rotation.svg  # The animated Earth (SVG + CSS)
├── src/
│   ├── main.js             # Wires up speed / pause controls
│   └── style.css           # Showcase styling
└── .cursor/environment.json
```

## Cloud Agent environment

The Cloud Agent development environment is described in
[`.cursor/environment.json`](.cursor/environment.json): `npm install` prepares
dependencies and the `dev-server` terminal runs `npm run dev`.
