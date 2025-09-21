import { z } from "zod";

// Enums for strict typing
export const MessageSenderSchema = z.enum(["user", "model"]);
export const DeliveryStatusSchema = z.enum(["sent", "delivered", "seen"]);

// Chat Schema
export const ChatSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  last_message: z.string().optional(),
  timestamp: z.number().optional(),
});

// Message Schema
export const MessageSchema = z.object({
  id: z.string(),
  chat_id: z.string(),
  timestamp: z.number(),
  sender: MessageSenderSchema,
  text: z.string().optional(),
  attachment: z.string().url().optional(),
  delivery_status: DeliveryStatusSchema,
});

// Request Schemas
export const GetAllChatsQuerySchema = z.object({
  page: z.number(),
  limit: z.number(),
});

export const GetChatByIdParamSchema = z.object({
  id: z.string().min(1, "Chat ID is required"),
});

export const GetChatMessagesQuerySchema = z.object({
  before: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : undefined)),
  limit: z.string().optional().default("50").transform(Number),
});

export const CreateChatPayloadSchema = z.object({
  id: z.string(),
  user_id: z.string().min(1, "User ID is required"),
  initial_message: z.string().optional(),
});

export const CreateMessagePayloadSchema = z
  .object({
    chat_id: z.string().min(1, "Chat ID is required"),
    sender: MessageSenderSchema,
    text: z.string().optional(),
    attachment: z.string().url().optional(),
  })
  .refine((data) => data.text || data.attachment, {
    message: "Either text or attachment must be provided",
  });

// Response Schemas
export const ChatListItemSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  last_message: z.string().optional(),
  timestamp: z.number(),
  message_count: z.number().optional(),
});

export const PaginatedChatsResponseSchema = z.object({
  chats: z.array(ChatListItemSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    total_pages: z.number(),
    has_next: z.boolean(),
    has_previous: z.boolean(),
  }),
});

export const ChatWithMessagesSchema = z.object({
  chat: ChatSchema,
  messages: z.array(MessageSchema),
  has_more: z.boolean(),
});

// Type Exports
export type MessageSender = z.infer<typeof MessageSenderSchema>;
export type DeliveryStatus = z.infer<typeof DeliveryStatusSchema>;
export type Chat = z.infer<typeof ChatSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type GetAllChatsQuery = z.infer<typeof GetAllChatsQuerySchema>;
export type GetChatByIdParam = z.infer<typeof GetChatByIdParamSchema>;
export type GetChatMessagesQuery = z.infer<typeof GetChatMessagesQuerySchema>;
export type CreateChatPayload = z.infer<typeof CreateChatPayloadSchema>;
export type CreateMessagePayload = z.infer<typeof CreateMessagePayloadSchema>;
export type ChatListItem = z.infer<typeof ChatListItemSchema>;
export type PaginatedChatsResponse = z.infer<typeof PaginatedChatsResponseSchema>;
export type ChatWithMessages = z.infer<typeof ChatWithMessagesSchema>;
