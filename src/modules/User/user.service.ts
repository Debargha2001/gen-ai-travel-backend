import * as UserRepository from "./user.repository.js";
import { ErrorFirstResponse, ServiceResponse } from "../../utils/response.js";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import {
  CreateUserPayloadSchema,
  VerifyTokenPayloadSchema,
  type CreateUserPayload,
  type VerifyTokenPayload,
} from "./user.schema.js";
import { logger } from "../../utils/logger.js";
import { generateJwtToken } from "../../utils/tokenHelper.js";
// import { config } from "../../utils/config.js";

const MODULE = "User Service";

export async function createUser(payload: CreateUserPayload): Promise<ServiceResponse<unknown>> {
  const verify = CreateUserPayloadSchema.safeParse(payload);
  if (!verify.success) {
    return ServiceResponse.success(null, "Invalid payload", { statusCode: 400 });
  }
  const [userErr, user] = await UserRepository.createUser(verify.data);
  if (userErr) {
    logger.error({
      message: "Error in createUser",
      module: MODULE,
      error: userErr,
    });
    return ServiceResponse.error([], userErr.message, { statusCode: 500 });
  }
  logger.info({
    message: "User created successfully",
    module: MODULE,
    data: user,
  });
  return ServiceResponse.success({ user }, "User created successfully");
}

export async function verifyFirebaseToken(
  payload: VerifyTokenPayload
): Promise<ErrorFirstResponse<DecodedIdToken>> {
  // Validate input with Zod schema
  const verify = VerifyTokenPayloadSchema.safeParse(payload);
  if (!verify.success) {
    return ErrorFirstResponse.error(verify.error.message, verify.error.issues);
  }

  try {
    // Use Firebase Admin SDK to verify ID token
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(verify.data.token);

    logger.info({
      message: "Firebase token verified successfully",
      module: MODULE,
      data: { uid: decodedToken.uid, email: decodedToken.email },
    });

    return ErrorFirstResponse.success(decodedToken);
  } catch (error) {
    logger.error({
      message: "Firebase token verification failed",
      module: MODULE,
      error: error as Error,
    });

    return ErrorFirstResponse.error("Invalid or expired token", { statusCode: 401 });
  }
}

export async function login(data: { token: string }): Promise<ServiceResponse<unknown, unknown>> {
  // const verify = VerifyTokenPayloadSchema.safeParse({ token });
  // if (!verify.success) {
  //     return ServiceResponse.success(null, "Invalid payload", { statusCode: 400 });
  // }

  const [authErr, decodedToken] = await verifyFirebaseToken({ token: data.token });
  if (authErr) {
    return ServiceResponse.error([], authErr.message, { statusCode: 401 });
  }

  const email = decodedToken.email;
  if (!email) {
    return ServiceResponse.error([], "Email not found in token", { statusCode: 400 });
  }

  const [userErr, user] = await UserRepository.getUserByEmail(email);
  if (userErr) {
    logger.error({
      message: "Error fetching user by email",
      module: MODULE,
      error: userErr,
    })
    return ServiceResponse.error([], userErr.message, { statusCode: 404 });
  }

  if (!user) {
    logger.info({
      message: "User not found, creating new user",
      module: MODULE,
      data: { email },
    });
    // Create user if not exists
    await createUser({
      email,
      name: decodedToken.name,
      profile: decodedToken.picture,
      uuid: decodedToken.uid,
    });
  }

  const [jwtError, jwt] = generateJwtToken({
    name: decodedToken.name,
    email: decodedToken.email,
    uuid: decodedToken.uid,
  });

  if (jwtError) {
    logger.error({
      message: "Error generating JWT token",
      module: MODULE,
      error: jwtError,
    })
    return ServiceResponse.error([], jwtError.message, { statusCode: 500 });
  }

  // Proceed with login logic (e.g., create session, return user info)
  return ServiceResponse.success(
    {
      user: {
        name: decodedToken.name,
        email: decodedToken.email,
        profile: decodedToken.picture,
      },
      token: jwt,
    },
    "Login successful"
  );
}
