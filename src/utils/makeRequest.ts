// import { HTTPError, OptionsOfJSONResponseBody, RequestError, got } from "got";
// import axios, { AxiosRequestConfig, AxiosError } from "axios";
// import {
//     ErrorMakeHttpJsonCallResponse,
//     MakeHttpJsonCallPayload,
//     MakeHttpJsonCallResponse,
//     MakeHttpStreamCallResponse,
// } from "../types/utils/makeRequest.js";
// import { logger } from "./logger.js";

// export async function makeHttpJsonCall<
//     RequestBody = Record<string | number, unknown> | undefined,
//     ResponseBody = Record<string | number, unknown> | undefined,
//     ErrorResponseBody = ResponseBody,
// >(
//     payload: MakeHttpJsonCallPayload<RequestBody>
// ): Promise<MakeHttpJsonCallResponse<ResponseBody, ErrorResponseBody>> {
//     const options: OptionsOfJSONResponseBody = {
//         method: payload.method,
//         responseType: "json",
//         retry: {
//             limit: 0,
//         },
//         searchParams: payload.searchParams,
//         timeout: {
//             request:
//                 1000 *
//                 (typeof payload.requestTimeoutSec === "number" ? payload.requestTimeoutSec : 30), // 30 secs
//         },
//     };

//     if (payload.username) {
//         options.username = payload.username;
//     }

//     if (payload.password) {
//         options.password = payload.password;
//     }

//     options.headers = { "trigger-from": "wocam-service" };

//     if ("headers" in payload) {
//         options.headers = { ...options.headers, ...payload.headers };
//     }

//     if (
//         payload.method !== "get" &&
//         "body" in payload &&
//         payload.body &&
//         typeof payload.body === "object"
//     ) {
//         options.json = payload.body;
//     }
//     try {
//         const response = await got<ResponseBody>(new URL(payload.url), options);
//         // console.timeEnd("api time");
//         response?.destroy();
//         return {
//             error: false,
//             response: {
//                 body: response.body,
//                 headers: response.headers,
//                 statusCode: response.statusCode,
//                 statusMessage: response.statusMessage,
//             },
//         };
//     } catch (err) {
//         const errorPayload: ErrorMakeHttpJsonCallResponse<ErrorResponseBody>["errors"] = {
//             message: "something went wrong",
//             cause: {},
//         };

//         if (err instanceof HTTPError) {
//             logger.warn(
//                 "[Http Error] unable to make request to [%s] -> %s",
//                 err.response.requestUrl,
//                 err.message
//             );
//             errorPayload.message = err.response.body.message ?? err.message;
//             errorPayload.cause = err.cause;
//             errorPayload.statusCode = err.response.statusCode;
//             errorPayload.body = err.response.body;
//             errorPayload.headers = err.response.headers;
//             errorPayload.statusMessage = err.response.statusMessage;
//             return { error: true, errors: errorPayload };
//         }

//         if (err instanceof RequestError) {
//             logger.warn(
//                 "[Request Error] unable to make request [%s] -> %s",
//                 err.request?.requestUrl ?? "unknown",
//                 err.message
//             );
//             errorPayload.message = err.message;
//             errorPayload.cause = err.cause;
//             errorPayload.statusCode = err.response?.statusCode;
//             errorPayload.body = err.response?.body;
//             return { error: true, errors: errorPayload };
//         }

//         const { message, stack, cause } = err as Error;
//         logger.error("[Error] unable to make request -> %s", message);
//         return {
//             error: true,
//             errors: {
//                 message,
//                 stack,
//                 cause,
//             },
//         };
//     }
// }

// export async function makeHttpFormDataCall<
//     RequestBody = FormData | undefined,
//     ResponseBody = Record<string | number, unknown> | undefined,
//     ErrorResponseBody = ResponseBody,
// >(
//     payload: MakeHttpJsonCallPayload<RequestBody>
// ): Promise<MakeHttpJsonCallResponse<ResponseBody, ErrorResponseBody>> {
//     const options: OptionsOfJSONResponseBody = {
//         method: payload.method,
//         responseType: "json",
//         retry: {
//             limit: 0,
//         },
//         searchParams: payload.searchParams,
//         timeout: {
//             request:
//                 1000 *
//                 (typeof payload.requestTimeoutSec === "number" ? payload.requestTimeoutSec : 30), // 30 secs
//         },
//     };
//     options.headers = {
//         "trigger-from": "wocam-service",
//         "Content-Type": "application/x-www-form-urlencoded",
//     };

//     if ("headers" in payload) {
//         options.headers = { ...options.headers, ...payload.headers };
//     }

//     if (payload.method !== "get" && "body" in payload) {
//         options.form = payload.body as Record<string, unknown>;
//     }

//     try {
//         const response = await got<ResponseBody>(new URL(payload.url), options);
//         // console.timeEnd("api time");
//         response?.destroy();
//         return {
//             error: false,
//             response: {
//                 body: response.body,
//                 headers: response.headers,
//                 statusCode: response.statusCode,
//                 statusMessage: response.statusMessage,
//             },
//         };
//     } catch (err) {
//         const errorPayload: ErrorMakeHttpJsonCallResponse<ErrorResponseBody>["errors"] = {
//             message: "something went wrong",
//             cause: {},
//         };

//         if (err instanceof HTTPError) {
//             logger.warn(
//                 "[Http Error] unable to make request to [%s] -> %s",
//                 err.response.requestUrl,
//                 err.message
//             );
//             errorPayload.message = err.message;
//             errorPayload.cause = err.cause;
//             errorPayload.statusCode = err.response.statusCode;
//             errorPayload.body = err.response.body;
//             errorPayload.headers = err.response.headers;
//             errorPayload.statusMessage = err.response.statusMessage;
//             return { error: true, errors: errorPayload };
//         }

//         if (err instanceof RequestError) {
//             logger.warn(
//                 "[Request Error] unable to make request [%s] -> %s",
//                 err.request?.requestUrl ?? "unknown",
//                 err.message
//             );
//             errorPayload.message = err.message;
//             errorPayload.cause = err.cause;
//             errorPayload.statusCode = err.response?.statusCode;
//             errorPayload.body = err.response?.body;
//             return { error: true, errors: errorPayload };
//         }

//         const { message, stack, cause } = err as Error;
//         logger.error("[Error] unable to make request -> %s", message);
//         return {
//             error: true,
//             errors: {
//                 message,
//                 stack,
//                 cause,
//             },
//         };
//     }
// }

// export async function makeHttpTextDataCall<
//     RequestBody = FormData | undefined,
//     ResponseBody = string | undefined,
//     ErrorResponseBody = ResponseBody,
// >(
//     payload: MakeHttpJsonCallPayload<RequestBody>
// ): Promise<MakeHttpJsonCallResponse<ResponseBody, ErrorResponseBody>> {
//     const options: OptionsOfJSONResponseBody = {
//         method: payload.method,
//         retry: {
//             limit: 0,
//         },
//         searchParams: payload.searchParams,
//         timeout: {
//             request:
//                 1000 *
//                 (typeof payload.requestTimeoutSec === "number" ? payload.requestTimeoutSec : 30), // 30 secs
//         },
//     };
//     options.headers = {
//         "trigger-from": "wocam-service",
//         "Content-Type": "application/x-www-form-urlencoded",
//     };

//     if ("headers" in payload) {
//         options.headers = { ...options.headers, ...payload.headers };
//     }

//     if (payload.method !== "get" && "body" in payload) {
//         options.json = payload.body;
//     }

//     try {
//         const response = await got<ResponseBody>(new URL(payload.url), options);
//         // console.timeEnd("api time");
//         response?.destroy();
//         let body;
//         try {
//             body = JSON.parse(response.body as string);
//         } catch (_err) {
//             body = response.body as string;
//         }
//         return {
//             error: false,
//             response: {
//                 body,
//                 headers: response.headers,
//                 statusCode: response.statusCode,
//                 statusMessage: response.statusMessage,
//             },
//         };
//     } catch (err) {
//         const errorPayload: ErrorMakeHttpJsonCallResponse<ErrorResponseBody>["errors"] = {
//             message: "something went wrong",
//             cause: {},
//         };

//         if (err instanceof HTTPError) {
//             let body;
//             try {
//                 body = JSON.parse(err.response.body as string);
//             } catch (_err) {
//                 body = err.response.body as string;
//             }

//             logger.warn(
//                 "[Http Error] unable to make request to [%s] -> %s",
//                 err.response.requestUrl,
//                 err.message
//             );
//             errorPayload.message = err.message;
//             errorPayload.cause = err.cause;
//             errorPayload.statusCode = err.response.statusCode;
//             errorPayload.body = body;
//             errorPayload.headers = err.response.headers;
//             errorPayload.statusMessage = err.response.statusMessage;
//             return { error: true, errors: errorPayload };
//         }

//         if (err instanceof RequestError) {
//             let body;
//             if (err.response?.body) {
//                 try {
//                     body = JSON.parse(err.response.body as string);
//                 } catch (_err) {
//                     body = err.response.body as string;
//                 }
//             }

//             logger.warn(
//                 "[Request Error] unable to make request [%s] -> %s",
//                 err.request?.requestUrl ?? "unknown",
//                 err.message
//             );
//             errorPayload.message = err.message;
//             errorPayload.cause = err.cause;
//             errorPayload.statusCode = err.response?.statusCode;
//             errorPayload.body = body;
//             return { error: true, errors: errorPayload };
//         }

//         const { message, stack, cause } = err as Error;
//         logger.error("[Error] unable to make request -> %s", message);
//         return {
//             error: true,
//             errors: {
//                 message,
//                 stack,
//                 cause,
//             },
//         };
//     }
// }

// export async function makeHttpStreamCall<
//     RequestBody = Record<string | number, unknown> | undefined,
//     ResponseBody = string | undefined,
//     ErrorResponseBody = ResponseBody,
// >(
//     payload: MakeHttpJsonCallPayload<RequestBody>
// ): Promise<MakeHttpStreamCallResponse<ResponseBody, ErrorResponseBody>> {
//     const options: AxiosRequestConfig = {
//         method: payload.method,
//         params: payload.searchParams,
//         timeout:
//             1000 * (typeof payload.requestTimeoutSec === "number" ? payload.requestTimeoutSec : 30), // 30 secs,
//         responseType: "stream",
//     };

//     options.headers = { "trigger-from": "wocam-service" };

//     if ("headers" in payload) {
//         options.headers = { ...options.headers, ...payload.headers };
//     }

//     if (payload.method !== "get" && "body" in payload) {
//         options.data = payload.body;
//     }
//     try {
//         const response = await axios(payload.url, options);
//         return {
//             error: false,
//             response: {
//                 stream: response.data as ReadableStream,
//             },
//         };
//     } catch (err) {
//         const errorPayload: ErrorMakeHttpJsonCallResponse<ErrorResponseBody>["errors"] = {
//             message: "something went wrong",
//             cause: {},
//         };

//         if (err instanceof AxiosError) {
//             logger.warn(
//                 "[Http Error] unable to make request to [%s] -> %s",
//                 err.config?.url,
//                 err.message
//             );
//             errorPayload.message = err.response?.data.message ?? err.message;
//             errorPayload.cause = err.cause;
//             errorPayload.statusCode = err.response?.status;
//             errorPayload.body = err.response?.data;
//             errorPayload.headers = err.response?.headers;
//             errorPayload.statusMessage = err.response?.statusText;
//             return { error: true, errors: errorPayload };
//         }

//         // if (err instanceof RequestError) {
//         //     logger.warn(
//         //         "[Request Error] unable to make request [%s] -> %s",
//         //         err.request?.requestUrl ?? "unknown",
//         //         err.message
//         //     );
//         //     errorPayload.message = err.message;
//         //     errorPayload.cause = err.cause;
//         //     errorPayload.statusCode = err.response?.statusCode;
//         //     errorPayload.body = err.response?.body;
//         //     return { error: true, errors: errorPayload };
//         // }

//         const { message, stack, cause } = err as Error;
//         logger.error("[Error] unable to make request -> %s", message);
//         return {
//             error: true,
//             errors: {
//                 message,
//                 stack,
//                 cause,
//             },
//         };
//     }
// }

// export async function makeHttpCall<
//     RequestBody = Record<string | number, unknown> | undefined,
//     ResponseBody = string | undefined,
//     ErrorResponseBody = ResponseBody,
// >(
//     payload: MakeHttpJsonCallPayload<RequestBody>
// ): Promise<MakeHttpStreamCallResponse<ResponseBody, ErrorResponseBody>> {
//     const options: AxiosRequestConfig = {
//         method: payload.method,
//         params: payload.searchParams,
//         timeout:
//             1000 * (typeof payload.requestTimeoutSec === "number" ? payload.requestTimeoutSec : 30), // 30 secs,
//         responseType: "json",
//     };

//     options.headers = { "trigger-from": "wocam-service" };

//     if ("headers" in payload) {
//         options.headers = { ...options.headers, ...payload.headers };
//     }

//     if (payload.responseType) {
//         options.responseType = payload.responseType;
//     }

//     if (payload.method !== "get" && "body" in payload) {
//         options.data = payload.body;
//     }
//     try {
//         const response = await axios(payload.url, options);
//         return {
//             error: false,
//             response: {
//                 data: response.data,
//             },
//         };
//     } catch (err) {
//         const errorPayload: ErrorMakeHttpJsonCallResponse<ErrorResponseBody>["errors"] = {
//             message: "something went wrong",
//             cause: {},
//         };

//         if (err instanceof AxiosError) {
//             logger.warn(
//                 "[Http Error] unable to make request to [%s] -> %s",
//                 err.config?.url,
//                 err.message
//             );
//             errorPayload.message = err.response?.data.message ?? err.message;
//             errorPayload.cause = err.cause;
//             errorPayload.statusCode = err.response?.status;
//             errorPayload.body = err.response?.data;
//             errorPayload.headers = err.response?.headers;
//             errorPayload.statusMessage = err.response?.statusText;
//             return { error: true, errors: errorPayload };
//         }

//         // if (err instanceof RequestError) {
//         //     logger.warn(
//         //         "[Request Error] unable to make request [%s] -> %s",
//         //         err.request?.requestUrl ?? "unknown",
//         //         err.message
//         //     );
//         //     errorPayload.message = err.message;
//         //     errorPayload.cause = err.cause;
//         //     errorPayload.statusCode = err.response?.statusCode;
//         //     errorPayload.body = err.response?.body;
//         //     return { error: true, errors: errorPayload };
//         // }

//         const { message, stack, cause } = err as Error;
//         logger.error("[Error] unable to make request -> %s", message);
//         return {
//             error: true,
//             errors: {
//                 message,
//                 stack,
//                 cause,
//             },
//         };
//     }
// }

// export async function makeHttpBufferCall<
//     RequestBody = Record<string | number, unknown> | undefined,
//     ResponseBody = string | undefined,
//     ErrorResponseBody = ResponseBody,
// >(
//     payload: MakeHttpJsonCallPayload<RequestBody>
// ): Promise<MakeHttpJsonCallResponse<ResponseBody, ErrorResponseBody>> {
//     const options: AxiosRequestConfig = {
//         method: payload.method,
//         params: payload.searchParams,
//         timeout:
//             1000 * (typeof payload.requestTimeoutSec === "number" ? payload.requestTimeoutSec : 30), // 30 secs,
//         responseType: "arraybuffer",
//     };

//     options.headers = { "trigger-from": "wocam-service" };

//     if ("headers" in payload) {
//         options.headers = { ...options.headers, ...payload.headers };
//     }

//     if (payload.method !== "get" && "body" in payload) {
//         options.data = payload.body;
//     }
//     try {
//         const response = await axios<ResponseBody>(payload.url, options);
//         return {
//             error: false,
//             response: {
//                 body: response.data,
//                 headers: response.headers,
//                 statusCode: response.status,
//                 statusMessage: response.statusText,
//             },
//         };
//     } catch (err) {
//         const errorPayload: ErrorMakeHttpJsonCallResponse<ErrorResponseBody>["errors"] = {
//             message: "something went wrong",
//             cause: {},
//         };

//         if (err instanceof AxiosError) {
//             logger.warn(
//                 "[Http Error] unable to make request to [%s] -> %s",
//                 err.config?.url,
//                 err.message
//             );
//             errorPayload.message = err.response?.data.message ?? err.message;
//             errorPayload.cause = err.cause;
//             errorPayload.statusCode = err.response?.status;
//             errorPayload.body = err.response?.data;
//             errorPayload.headers = err.response?.headers;
//             errorPayload.statusMessage = err.response?.statusText;
//             return { error: true, errors: errorPayload };
//         }

//         // if (err instanceof RequestError) {
//         //     logger.warn(
//         //         "[Request Error] unable to make request [%s] -> %s",
//         //         err.request?.requestUrl ?? "unknown",
//         //         err.message
//         //     );
//         //     errorPayload.message = err.message;
//         //     errorPayload.cause = err.cause;
//         //     errorPayload.statusCode = err.response?.statusCode;
//         //     errorPayload.body = err.response?.body;
//         //     return { error: true, errors: errorPayload };
//         // }

//         const { message, stack, cause } = err as Error;
//         logger.error("[Error] unable to make request -> %s", message);
//         return {
//             error: true,
//             errors: {
//                 message,
//                 stack,
//                 cause,
//             },
//         };
//     }
// }
