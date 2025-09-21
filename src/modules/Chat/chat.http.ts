/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Context } from "hono";
import { ApiResponse } from "../../utils/response.js";
import * as ChatService from "./chat.service.js";
import { logger } from "../../utils/logger.js";

const MODULE = "Chat Controller";

/**
 * GET /chat/all - Fetch all chats for a user
 */
export async function handleGetAllChats(c: Context) {
  const response = new ApiResponse(c);

  try {
    // Extract user ID from context (assuming it's set by auth middleware)
    const userId = c.get("userId") as string;
    if (!userId) {
      return response.json({
        error: true,
        message: "User not authenticated",
        statusCode: 401,
        errors: ["Missing user authentication"],
      });
    }

    // Get query parameters and convert to proper types
    const pageStr = c.req.query("page") || "1";
    const limitStr = c.req.query("limit") || "20";

    const queryParams = {
      page: parseInt(pageStr),
      limit: parseInt(limitStr),
    };

    logger.info({
      message: "Fetching all chats",
      module: MODULE,
      data: { userId, queryParams },
    });

    const result = await ChatService.getAllChats(userId, queryParams);
    return response.json(result as any);
  } catch (err) {
    logger.error({
      message: "Error in handleGetAllChats",
      module: MODULE,
      error: err as Error,
    });
    return response.exception(err);
  }
}

/**
 * GET /chat/:id - Fetch single chat history
 */
export async function handleGetChatById(c: Context) {
  const response = new ApiResponse(c);

  try {
    // Extract user ID from context
    const userId = c.get("userId") as string;
    if (!userId) {
      return response.json({
        error: true,
        message: "User not authenticated",
        statusCode: 401,
        errors: ["Missing user authentication"],
      });
    }

    // Get path parameter
    const chatId = c.req.param("id");

    logger.info({
      message: "Fetching chat by ID",
      module: MODULE,
      data: { userId, chatId },
    });

    const result = await ChatService.getChatById(chatId, userId);
    return response.json(result as any);
  } catch (err) {
    logger.error({
      message: "Error in handleGetChatById",
      module: MODULE,
      error: err as Error,
    });
    return response.exception(err);
  }
}

/**
 * POST /chat - Create a new chat
 */
export async function handleCreateChat(c: Context) {
  const response = new ApiResponse(c);

  try {
    // Extract user ID from context
    const userId = c.get("userId") as string;
    if (!userId) {
      return response.json({
        error: true,
        message: "User not authenticated",
        statusCode: 401,
        errors: ["Missing user authentication"],
      });
    }

    const body = await c.req.json();

    // Add user_id to the payload
    const payload = {
      ...body,
      user_id: userId,
    };

    logger.info({
      message: "Creating new chat",
      module: MODULE,
      data: { userId, payload },
    });

    const result = await ChatService.createChat(payload);
    return response.json(result as any);
  } catch (err) {
    logger.error({
      message: "Error in handleCreateChat",
      module: MODULE,
      error: err as Error,
    });
    return response.exception(err);
  }
}

/**
 * POST /chat/:id/messages - Create a new message in a chat
 */
export async function handleCreateMessage(c: Context) {
  const response = new ApiResponse(c);

  try {
    // Extract user ID from context
    const userId = c.get("userId") as string;
    if (!userId) {
      return response.json({
        error: true,
        message: "User not authenticated",
        statusCode: 401,
        errors: ["Missing user authentication"],
      });
    }

    const chatId = c.req.param("id");
    const body = await c.req.json();

    // Add chat_id to the payload
    const payload = {
      ...body,
      chat_id: chatId,
    };

    logger.info({
      message: "Creating new message",
      module: MODULE,
      data: { userId, chatId, payload },
    });

    const result = await ChatService.createMessage(payload, userId);
    return response.json(result as any);
  } catch (err) {
    logger.error({
      message: "Error in handleCreateMessage",
      module: MODULE,
      error: err as Error,
    });
    return response.exception(err);
  }
}

export async function chatHandler(c: Context) {
  const response = new ApiResponse(c);

  try {
    // Extract user ID from context
    const body = await c.req.json();
    const userId = c.get("userId") as string;
    if (!userId) {
      return response.json({
        error: true,
        message: "User not authenticated",
        statusCode: 401,
        errors: ["Missing user authentication"],
      });
    }

    body.userId = userId;
    const result = await ChatService.chatHandler(body);
    return response.json(result as any);
  } catch (err) {
    logger.error({
      message: "Error in handleCreateMessage",
      module: MODULE,
      error: err as Error,
    });
    return response.exception(err);
  }
}
