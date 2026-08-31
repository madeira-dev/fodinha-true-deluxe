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

Or create a **Web Service** by hand: runtime Node, build `npm ci --include=dev && npm run build:online`, start `node dist/server.js`, health check `/health`.

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

## Desktop downloads

The website always shows macOS / Windows / Linux buttons. They point at GitHub Releases:

`https://github.com/madeira-dev/fodinha-true-deluxe/releases/latest/download/Fodinha-mac.zip`
(and `Fodinha-windows.zip`, `Fodinha-linux.zip`)

Build and publish:

1. In GitHub: **Actions → Release desktop → Run workflow**
2. After it finishes, a release appears with the three zips
3. Friends click the buttons on the website

The desktop app is built with `VITE_SERVER_URL=wss://fodinha-wtdk.onrender.com`, so it uses the same online tables as the browser.

**The repository must be public** (or the release files will 404 for people who are not logged into GitHub). GitHub does not serve private-release downloads anonymously.

Local unsigned Mac build:

```bash
VITE_SERVER_URL=wss://fodinha-wtdk.onrender.com npm run make
```

The zip lands in `out/make/`.

## Tests

```bash
npm test
```
