import { ErrorFirstResponse } from "../../utils/response.js";
import db from "../../db/db.js";
import {
  type Chat,
  type Message,
  type CreateChatPayload,
  type CreateMessagePayload,
  type GetChatMessagesQuery,
} from "./chat.schema.js";
import { logger } from "../../utils/logger.js";
// import { FieldValue } from "firebase-admin/firestore";

const CHATS_COLLECTION = "chats";
const MESSAGES_SUBCOLLECTION = "messages";

/**
 * Get all chats for a specific user with pagination
 */
export async function getAllChatsByUserId(
  userId: string
): Promise<ErrorFirstResponse<{ chats: unknown; total: number }>> {
  try {
    const chats = await db
      .collection(CHATS_COLLECTION)
      .where("user_id", "==", userId)
      .orderBy("timestamp", "asc")
      .get();
    const total = chats.docs.length;

    return ErrorFirstResponse.success({
      chats: chats.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      total,
    });
  } catch (error) {
    return ErrorFirstResponse.error(error as Error);
  }
}

/**
 * Get a single chat by ID
 */
export async function getChatById(chatId: string): Promise<ErrorFirstResponse<unknown | null>> {
  try {
    const chatDoc = await db.collection(CHATS_COLLECTION).where("id", "==", chatId).get();

    if (chatDoc.empty) {
      return ErrorFirstResponse.success(null);
    }

    const messages = await db
      .collection(MESSAGES_SUBCOLLECTION)
      .where("chat_id", "==", chatId)
      .orderBy("timestamp", "asc")
      .get();
    const chat = {
      id: chatDoc.docs[0].id,
      ...(chatDoc.docs[0].data() as Omit<Chat, "id">),
      messages: messages.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
    };

    return ErrorFirstResponse.success(chat);
  } catch (error) {
    return ErrorFirstResponse.error(error as Error);
  }
}

/**
 * Get messages for a specific chat with pagination
 */
export async function getMessagesByChatId(
  chatId: string,
  query: GetChatMessagesQuery
): Promise<ErrorFirstResponse<{ messages: Message[]; hasMore: boolean }>> {
  try {
    const { before, limit } = query;

    let messagesQuery = db
      .collection(CHATS_COLLECTION)
      .doc(chatId)
      .collection(MESSAGES_SUBCOLLECTION)
      .orderBy("timestamp", "desc")
      .limit(limit + 1); // Get one extra to check if there are more

    if (before) {
      messagesQuery = messagesQuery.where("timestamp", "<", before);
    }

    const messagesSnapshot = await messagesQuery.get();

    const messages: Message[] = [];
    const docs = messagesSnapshot.docs;
    const hasMore = docs.length > limit;

    // Remove the extra document if exists
    const messageDocs = hasMore ? docs.slice(0, -1) : docs;

    for (const doc of messageDocs) {
      const messageData = doc.data();
      messages.push({
        id: doc.id,
        chat_id: chatId,
        timestamp: messageData.timestamp,
        sender: messageData.sender,
        text: messageData.text,
        attachment: messageData.attachment,
        delivery_status: messageData.delivery_status,
      });
    }

    // Sort messages in ascending order (oldest first)
    messages.sort((a, b) => a.timestamp - b.timestamp);

    return ErrorFirstResponse.success({ messages, hasMore });
  } catch (error) {
    return ErrorFirstResponse.error(error as Error);
  }
}

/**
 * Create a new chat
 */
export async function createChat(payload: CreateChatPayload): Promise<ErrorFirstResponse<Chat>> {
  try {
    const timestamp = Date.now();
    const chatData = {
      user_id: payload.user_id,
      last_message: payload.initial_message ?? "",
      id: payload.id,
      timestamp,
    };

    await db.collection(CHATS_COLLECTION).doc(chatData.id).set(chatData);

    const chat: Chat = {
      ...chatData,
    };

    return ErrorFirstResponse.success(chat);
  } catch (error) {
    return ErrorFirstResponse.error(error as Error);
  }
}

/**
 * Create a new message in a chat
 */
export async function createMessage(
  payload: CreateMessagePayload
): Promise<ErrorFirstResponse<Message>> {
  try {
    const timestamp = Date.now();
    const messageData = {
      chat_id: payload.chat_id,
      timestamp,
      sender: payload.sender,
      text: payload.text ?? "",
      attachment: payload.attachment ?? "",
      delivery_status: "sent" as const,
    };

    // Create the message
    const messageRef = await db.collection(MESSAGES_SUBCOLLECTION).add(messageData);

    // Update the chat's last_message
    await db
      .collection(CHATS_COLLECTION)
      .doc(payload.chat_id)
      .update({
        last_message: payload.text,
        sent_by: payload.sender,
      })
      .catch((error) => {
        logger.error({
          message: "Error updating chat's last_message",
          error,
          module: "ChatRepository",
          data: { chatId: payload.chat_id, last_message: payload.text },
        });
      });

    const message: Message = {
      id: messageRef.id,
      ...messageData,
    };

    return ErrorFirstResponse.success(message);
  } catch (error) {
    return ErrorFirstResponse.error(error as Error);
  }
}

/**
 * Verify chat ownership
 */
export async function verifyChatOwnership(
  chatId: string,
  userId: string
): Promise<ErrorFirstResponse<boolean>> {
  try {
    const chatDoc = await db.collection(CHATS_COLLECTION).where("id", "==", chatId).get();

    if (chatDoc.empty) {
      console.log("Chat document does not exist");
      return ErrorFirstResponse.success(false);
    }

    const chatData = chatDoc.docs[0].data() as Chat;
    console.log("Chat data retrieved:", chatData);
    const isOwner = chatData.user_id === userId;

    return ErrorFirstResponse.success(isOwner);
  } catch (error) {
    return ErrorFirstResponse.error(error as Error);
  }
}
