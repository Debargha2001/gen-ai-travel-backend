import { Hono } from "hono";
import apiV1 from "./api.v1.js";

const apiRouter = new Hono();

apiRouter.route("/v1", apiV1);

export default { apiRouter };
