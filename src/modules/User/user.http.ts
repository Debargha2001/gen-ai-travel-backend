import type { Context } from "hono";
import { ApiResponse } from "../../utils/response.js";
import * as UserService from "../User/user.service.js";

export async function handleCameraStreamDetails(c: Context) {
  const response = new ApiResponse(c);
  try {
    const body = await c.req.json();
    const handle = await UserService.createUser(body);
    return response.json(handle);
  } catch (err) {
    return response.exception(err);
  }
}

export async function handleLogin(c: Context) {
  const response = new ApiResponse(c);
  try {
    const body = await c.req.json();
    const handle = await UserService.login(body);
    return response.json(handle);
  } catch (err) {
    return response.exception(err);
  }
}
