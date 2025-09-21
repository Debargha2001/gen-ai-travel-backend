import db from "../../db/db.js";
import { ErrorFirstResponse } from "../../utils/response.js";
import type { CreateUserPayload } from "./user.schema.js";

export async function createUser(payload: CreateUserPayload): Promise<ErrorFirstResponse<unknown>> {
  try {
    const user = await db.collection("users").add(payload);
    return ErrorFirstResponse.success(user);
  } catch (error) {
    return ErrorFirstResponse.error(error as Error);
  }
}

export const getUserByEmail = async (email: string): Promise<ErrorFirstResponse<unknown>> => {
  try {
    const user = await db.collection("users").where("email", "==", email).get();
    if (user.empty) {
      return ErrorFirstResponse.success(null);
    }
    return ErrorFirstResponse.success(user.docs[0]);
  } catch (error) {
    return ErrorFirstResponse.error(error as Error);
  }
};
