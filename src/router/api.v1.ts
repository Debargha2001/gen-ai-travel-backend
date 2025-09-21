import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { ApiResponse } from "../utils/response.js";
import UserRouter from "../modules/User/user.router.js";
import ChatRouter from "../modules/Chat/chat.router.js";
import LogRouter from "../modules/Logs/log.router.js";

const apiV1 = new Hono();

// DO NOT USE CAMEL CASING FOR ROUTES

apiV1.get("/", async (c) => {
  return c.json({ status: "ok", time: new Date().toISOString() });
});

apiV1.route("/users", UserRouter);
apiV1.route("/logs", LogRouter);
// Protected chat routes - require JWT authentication
apiV1.route("/chats", ChatRouter);

apiV1.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse();
  }
  const response = new ApiResponse(c);
  return response.exception(err);
});

export default apiV1;
