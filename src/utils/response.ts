/* eslint-disable @typescript-eslint/no-redeclare */
import type { Context } from "hono";
import { stream } from "hono/streaming";
import { Readable } from "stream";
import { logger } from "../utils/logger.js";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export type SuccessServiceResponse<T> = {
  error: false;
  message: string;
  statusCode?: number;
  data: T;
};

export type ErrorServiceResponse<E> = {
  error: true;
  message: string;
  statusCode?: number;
  errors: E;
};

export interface PaginatedDocument<T> {
  docs: T[];
  totalDocs: number;
  limit: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  page?: number;
  totalPages: number;
  offset?: number;
  prevPage?: number | null;
  nextPage?: number | null;
  pagingCounter: number;
  meta?: {
    [key: string]: unknown;
  };
}

export type ServiceResponse<T, E = T> = SuccessServiceResponse<T> | ErrorServiceResponse<E>;

export type ErrorFirstSuccessResponse<T> = [null, T];
export type ErrorFirstErrorResponse = [Error, null];

export type ErrorFirstResponse<T> = ErrorFirstSuccessResponse<T> | ErrorFirstErrorResponse;

export const ErrorFirstResponse = {
  error: function ee(param: string | Error, cause?: unknown): ErrorFirstErrorResponse {
    if (param instanceof Error) {
      return [param, null];
    }
    return [new Error(param, { cause: cause }), null];
  },
  success: function es<T>(data: T): ErrorFirstSuccessResponse<T> {
    return [null, data];
  },
};

export const ServiceResponse = {
  success: function s<T>(
    data?: T,
    message?: string,
    options?: { statusCode?: number }
  ): SuccessServiceResponse<T> {
    return {
      error: false,
      message: message ?? "ok",
      statusCode: options?.statusCode ?? 200,
      data: data as T,
    };
  },

  error: function e<E>(
    errors?: E,
    message?: string,
    options?: { statusCode?: number }
  ): ErrorServiceResponse<E> {
    return {
      error: true,
      message: message ?? "something went wrong",
      statusCode: options?.statusCode ?? 500,
      errors: errors as E,
    };
  },
};

export class ApiResponse {
  private context: Context;

  constructor(context: Context) {
    this.context = context;
  }

  json<T>(params: ServiceResponse<T>) {
    if (params.error) {
      return this.errorJson(params);
    }
    return this.successJson(params);
  }

  text(params: ServiceResponse<string>, options?: { headers?: Record<string, string> }) {
    if (params.error) {
      return this.errorJson(params);
    }
    return this.successText(params, options?.headers);
  }

  stream<T>(params: ServiceResponse<T>, options?: { headers?: Record<string, string> }) {
    if (params.error) {
      return this.errorJson(params);
    }

    const payload: ErrorServiceResponse<unknown> = {
      statusCode: 500,
      error: true,
      message: "Something went wrong. Please try again later.",
      errors: "Stream instance should be readable",
    };

    const data = params.data;
    if (!(data instanceof Readable)) {
      return this.errorJson(payload);
    }

    return this.successStream(params, options?.headers);
  }

  exception(error: unknown) {
    const payload: ErrorServiceResponse<unknown> = {
      statusCode: 500,
      error: true,
      message: "Something went wrong. Please try again later.",
      errors: error,
    };
    if (error && error instanceof Error && error.message.length > 0) {
      payload.message = error.message;
    }

    return this.json(payload);
  }

  private errorJson<T>(params: Partial<ErrorServiceResponse<T>>) {
    return this.context.json(
      {
        statusCode: params.statusCode ?? 500,
        error: true,
        errors: params.errors,
        message: params.message ?? "something went wrong",
      },
      (params.statusCode ?? 500) as ContentfulStatusCode,
      {
        "Content-Type": "application/json",
      }
    );
  }

  private successJson<T>(params: SuccessServiceResponse<T>) {
    return this.context.json(
      {
        error: false,
        data: params.data,
        message: params.message ?? "ok",
      },
      (params.statusCode ?? 200) as ContentfulStatusCode,
      {
        "Content-Type": "application/json",
      }
    );
  }

  private successText(params: SuccessServiceResponse<string>, headers?: Record<string, string>) {
    return this.context.text(params.data, (params.statusCode ?? 200) as ContentfulStatusCode, {
      "Content-Type": "text/plain",
      ...headers,
    });
  }

  private successStream<T>(params: SuccessServiceResponse<T>, headers?: Record<string, string>) {
    return stream(this.context, async (s) => {
      if (headers) {
        for (const [key, value] of Object.entries(headers)) {
          this.context.header(key, value);
        }
      }

      s.onAbort(() => {
        logger.info({ module: "ApiResponse", message: "Stream aborted by the client" });
        s.close();
      });

      // Convert Node.js Readable to Web Streams API ReadableStream
      const webReadableStream = Readable.toWeb(params.data as Readable);
      return await s.pipe(webReadableStream as ReadableStream<unknown>);
    });
  }
}
