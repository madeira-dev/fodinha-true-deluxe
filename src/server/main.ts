import path from 'node:path';
import { DEFAULT_PORT, startGameServer } from '../net';

const port = Number(process.env.PORT || DEFAULT_PORT);
const staticDir =
  process.env.WEB_ROOT || path.resolve(process.cwd(), 'dist/web');

startGameServer({
  port,
  staticDir,
}).then((server) => {
  const extras = server.addresses.length > 0 ? ` · LAN ${server.addresses.join(', ')}` : '';
  process.stdout.write(`Fodinha listening on :${server.port}${extras}\n`);
}).catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
