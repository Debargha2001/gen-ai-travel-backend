import * as ChatRepository from "./chat.repository.js";
import { ErrorFirstResponse, ServiceResponse } from "../../utils/response.js";
import {
  type GetAllChatsQuery,
  type CreateChatPayload,
  type CreateMessagePayload,
  type Chat,
  GetAllChatsQuerySchema,
  CreateChatPayloadSchema,
  CreateMessagePayloadSchema,
} from "./chat.schema.js";
import { logger } from "../../utils/logger.js";
import { createTravelAssistant } from "../Itenary/itenary.service.js";

const MODULE = "Chat Service";

/**
 * Get all chats for a user with pagination
 */
export async function getAllChats(
  userId: string,
  query: GetAllChatsQuery
): Promise<ServiceResponse<unknown, string[]>> {
  // Validate query parameters
  const verifyQuery = GetAllChatsQuerySchema.safeParse(query);
  if (!verifyQuery.success) {
    const errorMessages = verifyQuery.error.issues.map((issue) => issue.message);
    return ServiceResponse.error(errorMessages, "Invalid query parameters", {
      statusCode: 400,
    });
  }

  const [chatErr, result] = await ChatRepository.getAllChatsByUserId(userId);

  if (chatErr) {
    logger.error({
      message: "Error fetching chats",
      module: MODULE,
      error: chatErr,
    });
    return ServiceResponse.error([chatErr.message], chatErr.message, {
      statusCode: 500,
    });
  }

  const { chats, total } = result;

  logger.info({
    message: "Chats fetched successfully",
    module: MODULE,
    data: { userId, chats, total },
  });

  return ServiceResponse.success({ chats, total }, "Chats retrieved successfully");
}

/**
 * Get a single chat with its messages
 */
export async function getChatById(
  chatId: string,
  userId: string
): Promise<ServiceResponse<unknown, string[]>> {
  // Verify chat ownership
  const [ownershipErr, isOwner] = await ChatRepository.verifyChatOwnership(chatId, userId);
  if (ownershipErr) {
    logger.error({
      message: "Error verifying chat ownership",
      module: MODULE,
      error: ownershipErr,
    });
    return ServiceResponse.error([ownershipErr.message], ownershipErr.message, {
      statusCode: 500,
    });
  }

  if (!isOwner) {
    return ServiceResponse.error(["Access denied"], "Chat not found or access denied", {
      statusCode: 404,
    });
  }

  // Get chat details
  const [chatErr, chat] = await ChatRepository.getChatById(chatId);
  if (chatErr) {
    logger.error({
      message: "Error fetching chat",
      module: MODULE,
      error: chatErr,
    });
    return ServiceResponse.error([chatErr.message], chatErr.message, {
      statusCode: 500,
    });
  }

  if (!chat) {
    return ServiceResponse.error(["Not found"], "Chat not found", {
      statusCode: 404,
    });
  }

  logger.info({
    message: "Chat and messages fetched successfully",
    module: MODULE,
    data: { chat },
  });

  return ServiceResponse.success(chat, "Chat retrieved successfully");
}

/**
 * Create a new chat
 */
export async function createChat(
  payload: CreateChatPayload
): Promise<ServiceResponse<Chat, string[]>> {
  // Validate payload
  const verify = CreateChatPayloadSchema.safeParse(payload);
  if (!verify.success) {
    const errorMessages = verify.error.issues.map((issue) => issue.message);
    return ServiceResponse.error(errorMessages, "Invalid payload", {
      statusCode: 400,
    });
  }

  const [chatErr, chat] = await ChatRepository.createChat(verify.data);
  if (chatErr) {
    logger.error({
      message: "Error creating chat",
      module: MODULE,
      error: chatErr,
    });
    return ServiceResponse.error([chatErr.message], chatErr.message, {
      statusCode: 500,
    });
  }

  logger.info({
    message: "Chat created successfully",
    module: MODULE,
    data: { chatId: chat.id, userId: chat.user_id },
  });

  return ServiceResponse.success(chat, "Chat created successfully");
}

/**
 * Create a new message in a chat
 */
export async function createMessage(
  payload: CreateMessagePayload,
  userId: string
): Promise<ErrorFirstResponse<{ id: string; message: string }>> {
  // Validate payload
  const verify = CreateMessagePayloadSchema.safeParse(payload);
  if (!verify.success) {
    const errorMessages = verify.error.issues.map((issue) => issue.message);
    return ErrorFirstResponse.error(new Error(errorMessages.join(", ")));
  }

  // Verify chat ownership
  const [ownershipErr, isOwner] = await ChatRepository.verifyChatOwnership(
    verify.data.chat_id,
    userId
  );
  if (ownershipErr) {
    logger.error({
      message: "Error verifying chat ownership",
      module: MODULE,
      error: ownershipErr,
    });
    return ErrorFirstResponse.error(ownershipErr);
  }

  if (!isOwner) {
    return ErrorFirstResponse.error(new Error("Access denied"));
  }

  const [messageErr, message] = await ChatRepository.createMessage(verify.data);
  if (messageErr) {
    logger.error({
      message: "Error creating message",
      module: MODULE,
      error: messageErr,
    });
    return ErrorFirstResponse.error(messageErr);
  }

  logger.info({
    message: "Message created successfully",
    module: MODULE,
    data: { messageId: message.id, chatId: message.chat_id },
  });

  return ErrorFirstResponse.success({ id: message.id, message: "Message created successfully" });
}
const assistant = createTravelAssistant();

export async function chatHandler(payload: {
  sessionId: string;
  userMessage: string;
  initChat?: boolean;
  userId: string;
}): Promise<ServiceResponse<unknown, unknown>> {
  try {
    const [findChatError, existingChat] = await ChatRepository.getChatById(payload.sessionId);
    if (findChatError) {
      return ServiceResponse.error([], findChatError.message, { statusCode: 500 });
    }

    if (!existingChat) {
      const [newChatError, _newChat] = await ChatRepository.createChat({
        id: payload.sessionId,
        user_id: payload.userId,
        // initial_message: responseMessage.id,
      });
      if (newChatError) {
        return ServiceResponse.error([], newChatError.message, { statusCode: 500 });
      }
    }

    const [messageError, _message] = await createMessage(
      {
        chat_id: payload.sessionId,
        sender: "user",
        text: payload.userMessage,
      },
      payload.userId
    );
    if (messageError) {
      return ServiceResponse.error([], messageError.message, { statusCode: 500 });
    }
    const response = await assistant.handleMessage(payload.sessionId, payload.userMessage);
    if (!response) {
      return ServiceResponse.error([], "No response from assistant", { statusCode: 500 });
    }
    console.log("Assistant response:", response);

    const [responseMessageError, _responseMessage] = await createMessage(
      {
        chat_id: payload.sessionId,
        sender: "model",
        text: JSON.stringify(response, null, 2),
      },
      payload.userId
    );
    if (responseMessageError) {
      return ServiceResponse.error([], responseMessageError.message, { statusCode: 500 });
    }
    return ServiceResponse.success(response, "Message processed successfully");
  } catch (error) {
    logger.error({
      message: "Error in chatHandler",
      module: MODULE,
      error: error as Error,
    });
    return ServiceResponse.error([], (error as Error).message, {
      statusCode: 500,
    });
  }
}
