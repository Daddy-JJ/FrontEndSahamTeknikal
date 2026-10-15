// Owned production loopback process; callers supply an isolated source/build cwd.
import next from "next";
import { createServer } from "node:http";
const port = Number(process.env.CHART_PERF_PORT);
if (![3062, 3063, 3064].includes(port) || !process.send) throw Error("invalid_chart_performance_process");
const app = next({ dev: false, dir: process.cwd(), hostname: "127.0.0.1", port });
await app.prepare();
const server = createServer(app.getRequestHandler());
const sockets = new Set();
server.on("connection", socket => { sockets.add(socket); socket.on("close", () => sockets.delete(socket)); });
await new Promise((resolve, reject) => { server.once("error", reject); server.listen(port, "127.0.0.1", resolve); });
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
process.on("message", message => { if (message?.stop) void stop(); });
process.on("disconnect", () => void stop());
