// Owned loopback process only; no remote configuration or provider access.
import next from "next";
import { createServer } from "node:http";
if (process.env.SMOKE_PORT !== "3058" || !process.send)
  throw Error("invalid_chart_smoke");
const app = next({ dev: true, hostname: "127.0.0.1", port: 3058,
  ...(process.env.CHART_SMOKE_WEBPACK === "true" ? { webpack: true } : {}) });
await app.prepare();
const server = createServer(app.getRequestHandler());
const sockets = new Set();
server.on("connection", (socket) => {
  sockets.add(socket);
  socket.on("close", () => sockets.delete(socket));
});
server.on("upgrade", app.getUpgradeHandler());
await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(3058, "127.0.0.1", resolve);
});
process.send({ ready: true });
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  for (const socket of sockets) socket.destroy();
  await new Promise((resolve) => server.close(resolve));
  await app.close();
  process.exit(0);
}
process.on("message", (message) => {
  if (message?.stop === true) void stop();
});
process.on("disconnect", () => void stop());
