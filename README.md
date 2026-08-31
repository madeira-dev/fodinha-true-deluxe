# Fodinha

Online multiplayer Fodinha. One public server holds the tables. Friends play in the browser or in the desktop app using a short room code.

## Play locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173). Create a table, send the code, join from another tab.

The Electron app uses the same server:

```bash
npm run server   # terminal 1
npm start        # terminal 2
```

## Production (browser + API on one port)

```bash
npm run build:online
PORT=8080 npm run start:online
```

Or:

```bash
docker compose up --build
```

Then open `http://127.0.0.1:8080`.

## Deploy on Render (free)

The repo includes `render.yaml`. After you connect the GitHub repo in Render:

1. New → Blueprint
2. Pick this repository
3. Apply the `fodinha` web service (free plan)

Or create a **Web Service** by hand: runtime Node, build `npm ci && npm run build:online`, start `node dist/server.js`, health check `/health`.

The first visit after ~15 minutes idle can take about a minute to wake. After that, create a table and send friends the code.

The game code must be on GitHub for Render to build it.

## Other hosts

The `Dockerfile` and `fly.toml` are also ready if you later want Fly.io:

```bash
fly launch --copy-config --yes
fly deploy
```

After deploy, set the Electron production URL so the downloaded app talks to that host:

```
VITE_SERVER_URL=wss://YOUR-APP.fly.dev
VITE_PUBLIC_URL=https://YOUR-APP.fly.dev
```

Build installers with `npm run make` and put the files on GitHub Releases. Then set `VITE_DOWNLOAD_MAC` / `VITE_DOWNLOAD_WIN` / `VITE_DOWNLOAD_LINUX` so the website shows download buttons.

## Tests

```bash
npm test
```
