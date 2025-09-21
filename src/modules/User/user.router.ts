import { Hono } from "hono";

const UserRouter = new Hono();

import * as UserController from "./user.http.js";

// USER ROUTES

// UserRouter.post("/create", UserController.handleCameraStreamDetails);
UserRouter.post("/login", UserController.handleLogin);

export default UserRouter;
