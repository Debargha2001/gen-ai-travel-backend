import { Hono } from "hono";
import * as ChatController from "./chat.http.js";
import { jwtAuthMiddleware } from "../../utils/authMiddleware.js";

const ChatRouter = new Hono();

ChatRouter.use("/*", jwtAuthMiddleware);

// POST /chat - Create a new chat
ChatRouter.post("/", ChatController.chatHandler);

// GET /chat/all - Fetch all chats for a user
ChatRouter.get("/", ChatController.handleGetAllChats);

// GET /chat/:id - Fetch single chat history
ChatRouter.get("/:id", ChatController.handleGetChatById);

// POST /chat/:id/messages - Create a new message in a chat
ChatRouter.post("/:id/messages", ChatController.handleCreateMessage);

export default ChatRouter;
