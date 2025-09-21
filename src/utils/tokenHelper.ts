import * as jwt from "jsonwebtoken";
import { config } from "./config.js";
import { logger } from "./logger.js";
import { ErrorFirstResponse } from "./response.js";

const MODULE = "tokenHelper";

export function generateJwtToken(payload: Record<string, unknown>): ErrorFirstResponse<string> {
  try {
    const token = jwt.default.sign(payload, config.get("SECRET"));
    return ErrorFirstResponse.success(token);
  } catch (err) {
    logger.error({
      module: MODULE,
      message: "unable to generate jwt",
      error: err as Error,
    });
    return ErrorFirstResponse.error(err as Error);
  }
}

export function verifyJwtToken<T>(token: string): ErrorFirstResponse<T> {
  try {
    const data = jwt.default.verify(token, config.get("SECRET")) as T;
    return ErrorFirstResponse.success(data);
  } catch (err) {
    logger.error({
      module: MODULE,
      message: "unable to decode jwt",
      error: err as Error,
    });
    return ErrorFirstResponse.error(err as Error);
  }
}
