// Test-only process: no shell, taskkill, production server, or remote credentials.
import next from "next";
import { createServer } from "node:http";

const port = Number(process.env.SMOKE_PORT);
if (![3052, 3054, 3056].includes(port) || !process.send) throw new Error("invalid_smoke_process");
const app = next({ dev: process.env.SMOKE_PRODUCTION !== "true", hostname: "127.0.0.1", port });
await app.prepare();
const server = createServer(app.getRequestHandler());
const sockets = new Set();
server.on("connection", socket => {
  sockets.add(socket);
  socket.on("close", () => sockets.delete(socket));
});
server.on("upgrade", app.getUpgradeHandler());
await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(port, "127.0.0.1", resolve);
});
process.send({ ready: true });
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  for (const socket of sockets) socket.destroy();
  await new Promise(resolve => server.close(resolve));
  await app.close();
  process.exit(0);
}
process.on("message", message => { if (message?.stop === true) void stop(); });
process.on("disconnect", () => { void stop(); });
