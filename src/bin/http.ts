import { serve } from "@hono/node-server";
import app from "../app.js";
import { logger } from "../utils/logger.js";

export function listen(port?: number) {
  logger.info({
    message: `✅Server is running on port ${port ?? 3000}`,
    module: "HTTP Server",
    skipDb: true,
  });
  serve({
    fetch: app.fetch,
    port: port ?? 3000,
  });
}
