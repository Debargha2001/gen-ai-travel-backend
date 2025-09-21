import { Timestamp } from "firebase-admin/firestore";
import db from "../db/db.js";

type LogLevel = "info" | "debug" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  module: string;
  message: string;
  error?: Error | string;
  timestamp: Timestamp;
}

interface LogParams {
  module: string;
  message: string;
  error?: Error | string;
  data?: unknown;
  skipDb?: boolean;
}

interface BatchLogEntry {
  level: LogLevel;
  module: string;
  message: string;
  error?: Error | string;
  skipDb?: boolean;
}

class FirebaseLogger {
  private static instance: FirebaseLogger;
  private db: FirebaseFirestore.Firestore;

  private constructor() {
    this.db = db;
  }

  public static getInstance(): FirebaseLogger {
    if (!FirebaseLogger.instance) {
      FirebaseLogger.instance = new FirebaseLogger();
    }
    return FirebaseLogger.instance;
  }

  private honoLog(params: {
    level: LogLevel;
    module: string;
    message: string;
    error?: Error | string;
  }): void {
    const timestamp = new Date().toISOString();
    const errorStr = params.error
      ? params.error instanceof Error
        ? `${params.error.name}: ${params.error.message}`
        : String(params.error)
      : "";

    // Format similar to Hono's logger output
    const logMessage = `${timestamp} [${params.level.toUpperCase()}] [${params.module}] ${params.message}${errorStr ? ` - ${errorStr}` : ""}`;

    switch (params.level) {
      case "error":
        console.error(logMessage);
        break;
      case "warn":
        console.warn(logMessage);
        break;
      case "info":
        console.info(logMessage);
        break;
      case "debug":
        console.debug(logMessage);
        break;
      default:
        console.log(logMessage);
    }
  }

  private writeLog(params: {
    level: LogLevel;
    module: string;
    message: string;
    error?: Error | string;
    skipDb?: boolean;
  }): void {
    // Always log to console first using Hono format
    this.honoLog({
      level: params.level,
      module: params.module,
      message: params.message,
      error: params.error,
    });

    // Skip Firebase logging if skipDb is true
    if (params.skipDb === true) {
      return;
    }

    // Then attempt to log to Firebase asynchronously (fire and forget)
    const logEntry: LogEntry = {
      level: params.level,
      module: params.module,
      message: params.message,
      timestamp: Timestamp.now(),
    };

    if (params.error) {
      if (params.error instanceof Error) {
        logEntry.error = `${params.error.name}: ${params.error.message}\n${params.error.stack}`;
      } else {
        logEntry.error = String(params.error);
      }
    }

    // Fire and forget Firebase logging
    this.db
      .collection("logs")
      .add(logEntry)
      .catch((writeError) => {
        // Only log Firebase errors to console, don't recursively call writeLog
        const timestamp = new Date().toISOString();
        console.error(
          `${timestamp} [ERROR] [Firebase] Failed to write log to Firebase - ${writeError.message}`
        );
      });
  }

  public info(params: LogParams): void {
    this.writeLog({
      level: "info",
      module: params.module,
      message: params.message,
      error: params.error,
      skipDb: params.skipDb,
    });
  }

  public debug(params: LogParams): void {
    this.writeLog({
      level: "debug",
      module: params.module,
      message: params.message,
      error: params.error,
      skipDb: params.skipDb,
    });
  }

  public warn(params: LogParams): void {
    this.writeLog({
      level: "warn",
      module: params.module,
      message: params.message,
      error: params.error,
      skipDb: params.skipDb,
    });
  }

  public error(params: LogParams): void {
    this.writeLog({
      level: "error",
      module: params.module,
      message: params.message,
      error: params.error,
      skipDb: params.skipDb,
    });
  }

  // Batch logging for multiple entries
  public logBatch(entries: BatchLogEntry[]): void {
    // Log each entry to console immediately
    entries.forEach((entry) => {
      this.honoLog({
        level: entry.level,
        module: entry.module,
        message: entry.message,
        error: entry.error,
      });
    });

    // Filter entries that should be saved to Firebase
    const entriesToSave = entries.filter((entry) => entry.skipDb !== true);

    // If no entries to save to Firebase, return early
    if (entriesToSave.length === 0) {
      return;
    }

    // Then attempt to batch write to Firebase asynchronously (fire and forget)
    const batch = this.db.batch();
    const logsCollection = this.db.collection("logs");

    entriesToSave.forEach((entry) => {
      const logEntry: LogEntry = {
        level: entry.level,
        module: entry.module,
        message: entry.message,
        timestamp: Timestamp.now(),
      };

      if (entry.error) {
        if (entry.error instanceof Error) {
          logEntry.error = `${entry.error.name}: ${entry.error.message}\n${entry.error.stack}`;
        } else {
          logEntry.error = String(entry.error);
        }
      }

      const docRef = logsCollection.doc();
      batch.set(docRef, logEntry);
    });

    // Fire and forget batch commit
    batch.commit().catch((writeError) => {
      const timestamp = new Date().toISOString();
      console.error(
        `${timestamp} [ERROR] [Firebase] Failed to write batch logs to Firebase - ${writeError.message}`
      );
    });
  }
}

// Export the singleton instance
export const logger = FirebaseLogger.getInstance();

// Export the class for testing purposes
export { FirebaseLogger };

// Export types for external use
export type { LogLevel, LogEntry, LogParams, BatchLogEntry };
