# Orca Notes

Desktop-only private notes app built with Electron + React + Tailwind.

## Features

- Local-only note storage in Electron `userData` (no cloud sync)
- 4-digit PIN lock required each app start
- First launch PIN setup flow
- PIN change in Settings (requires current PIN)
- Markdown note editing in a single writing pane
- Apple Notes style layout (note list + active note editor)
- System / light / dark mode switch
- Minimal glass / blur interface
- Hidden inset title bar (traffic lights only on macOS)

## Run

```bash
npm install
npm start
```

## Project Structure

- `src/main.js`: Electron main process, secure local data handling, IPC
- `src/preload.js`: safe renderer API bridge
- `index.html`: Vite entry HTML
- `src/renderer/App.jsx`: React app logic and UI
- `src/renderer/index.css`: Tailwind + custom glassmorphism styles
- `vite.config.js`: frontend build config for Electron file loading
