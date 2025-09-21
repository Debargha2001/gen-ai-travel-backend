# Chat API Endpoints

This document describes the Chat API endpoints that have been added to the Gen-AI-Trip-Planner-Backend.

## 🔐 Authentication

All chat endpoints require JWT authentication. Include the JWT token in the Authorization header:

```http
Authorization: Bearer <your_jwt_token>
```

The JWT token can be obtained from the `/users/login` endpoint.

## 📋 Database Schema

### Collection: `chats`
```typescript
{
  id: string;                // Firestore document ID
  user_id: string;           // Reference to user who owns the chat
  last_message?: string;     // Optional preview of the last message
  timestamp: number;         // Created/last updated timestamp
}
```

### Subcollection: `chats/{chatId}/messages`
```typescript
{
  id: string;                        // Firestore document ID
  chat_id: string;                   // Reference to parent chat
  timestamp: number;                 // Message creation timestamp
  sender: "user" | "system" | "ai";  // Message sender type
  text?: string;                     // Message text (optional if attachment)
  attachment?: string;               // URL to image/file if any
  delivery_status: "sent" | "delivered" | "seen";
}
```

## 🛣️ API Endpoints

### 1. Get All Chats

**Endpoint:** `GET /api/v1/chat/all`

**Description:** Fetch all chats belonging to the authenticated user with pagination.

**Query Parameters:**
- `page` (optional): Page number, default = 1
- `limit` (optional): Results per page, default = 20

**Response:**
```typescript
{
  error: false,
  data: {
    chats: [
      {
        id: string,
        user_id: string,
        last_message?: string,
        timestamp: number,
        message_count?: number
      }
    ],
    pagination: {
      page: number,
      limit: number,
      total: number,
      total_pages: number,
      has_next: boolean,
      has_previous: boolean
    }
  },
  message: "Chats retrieved successfully"
}
```

**Example:**
```http
GET /api/v1/chat/all?page=1&limit=10
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

---

### 2. Get Single Chat with Messages

**Endpoint:** `GET /api/v1/chat/:id`

**Description:** Fetch a single chat with its message history.

**Path Parameters:**
- `id`: Chat ID (required)

**Query Parameters:**
- `before` (optional): Timestamp for pagination (get messages before this time)
- `limit` (optional): Number of messages to retrieve, default = 50

**Response:**
```typescript
{
  error: false,
  data: {
    chat: {
      id: string,
      user_id: string,
      last_message?: string,
      timestamp: number
    },
    messages: [
      {
        id: string,
        chat_id: string,
        timestamp: number,
        sender: "user" | "system" | "ai",
        text?: string,
        attachment?: string,
        delivery_status: "sent" | "delivered" | "seen"
      }
    ],
    has_more: boolean
  },
  message: "Chat retrieved successfully"
}
```

**Example:**
```http
GET /api/v1/chat/abc123?before=1726849200000&limit=20
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

---

### 3. Create New Chat

**Endpoint:** `POST /api/v1/chat`

**Description:** Create a new chat for the authenticated user.

**Request Body:**
```typescript
{
  initial_message?: string  // Optional first message
}
```

**Response:**
```typescript
{
  error: false,
  data: {
    id: string,
    user_id: string,
    last_message?: string,
    timestamp: number
  },
  message: "Chat created successfully"
}
```

**Example:**
```http
POST /api/v1/chat
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "initial_message": "Hello, I need help planning a trip"
}
```

---

### 4. Create Message in Chat

**Endpoint:** `POST /api/v1/chat/:id/messages`

**Description:** Add a new message to an existing chat.

**Path Parameters:**
- `id`: Chat ID (required)

**Request Body:**
```typescript
{
  sender: "user" | "system" | "ai",  // Required
  text?: string,                     // Optional if attachment provided
  attachment?: string                // Optional URL to attachment
}
```

**Response:**
```typescript
{
  error: false,
  data: {
    id: string,
    message: "Message created successfully"
  },
  message: "Message sent successfully"
}
```

**Example:**
```http
POST /api/v1/chat/abc123/messages
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "sender": "user",
  "text": "Can you suggest attractions in Paris?"
}
```

## 🔒 Security Features

1. **JWT Authentication**: All endpoints require valid JWT tokens
2. **Chat Ownership**: Users can only access their own chats
3. **Input Validation**: All inputs are validated using Zod schemas
4. **Error Handling**: Comprehensive error responses with proper HTTP status codes

## 📊 Pagination

### Chat List Pagination
- Use `page` and `limit` query parameters
- Response includes pagination metadata

### Message History Pagination
- Use `before` timestamp for cursor-based pagination
- Messages are sorted by timestamp (oldest first in response)
- `has_more` indicates if more messages are available

## 🚨 Error Responses

```typescript
{
  error: true,
  message: string,
  errors: string[],
  statusCode: number
}
```

**Common Error Codes:**
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (missing or invalid JWT)
- `404`: Not Found (chat doesn't exist or access denied)
- `500`: Internal Server Error

## 🔧 Usage Flow

1. **Login** to get JWT token via `/api/v1/users/login`
2. **Create Chat** via `POST /api/v1/chat`
3. **Add Messages** via `POST /api/v1/chat/:id/messages`
4. **Retrieve Chats** via `GET /api/v1/chat/all`
5. **View Messages** via `GET /api/v1/chat/:id`

## 📝 Notes

- Messages are stored as a subcollection under each chat document
- Chat `timestamp` is updated when new messages are added
- `last_message` field provides quick preview without loading full message history
- All timestamps are Unix timestamps (milliseconds)
- The API supports both text messages and file attachments