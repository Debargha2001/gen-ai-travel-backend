import { Hono } from "hono";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { etag } from "hono/etag";
import { cors } from "hono/cors";
import { compress } from "hono/compress";
import { serveStatic } from "@hono/node-server/serve-static";
import HttpRouter from "./router/index.js";

/* initiating db connection */
import "./db/db.js";

const app = new Hono();

// const username = "wobot.pilot@outlook.com..Z6WG7W";
// const password = "Testlab1!";

// // Create the base string
// const baseString = `${username}:${password}`;

// // Encode the base string in Base64
// const base64String = Buffer.from(baseString).toString("base64");

// console.log(base64String); // Output: Base64 encoded string

app.use(logger());
app.use("*", cors());
app.use(secureHeaders());
app.use(compress());

app.route("/api", HttpRouter.apiRouter);

/* serving static files */
app.use("*", etag());
app.use(
  "/*",
  serveStatic({
    root: "./public",
  })
);

async function gracefulExit(errorCode?: number | string) {
  process.exit(typeof errorCode === "number" ? errorCode : 0);
}

process.on("uncaughtException", async (err) => {
  console.error(new Error(`❌UNKNOWN ERROR OCCURRED ${err.message ?? ""}`, { cause: err }));
  await gracefulExit(1);
});

process.on("unhandledRejection", async (err) => {
  console.error(
    new Error(`❌UNKNOWN REJECTION OCCURRED ${err instanceof Error ? err.message : ""}`, {
      cause: err,
    })
  );
  await gracefulExit(2);
});

process.on("❌SIGTERM", gracefulExit);
process.on("❌SIGINT", gracefulExit);

export default app;
