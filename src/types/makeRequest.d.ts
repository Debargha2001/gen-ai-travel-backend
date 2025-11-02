/* eslint-disable no-undef */
import { AxiosResponseHeaders, RawAxiosResponseHeaders } from "axios";
import type { Headers } from "got";

export type MakeHttpJsonCallPayload<Body = Record<string | number, unknown>> = {
    url: string;
    username?: string;
    responseType?: "arraybuffer" | "blob" | "document" | "json" | "text" | "stream" | "formdata";
    password?: string;
    method: "get" | "post" | "put" | "patch" | "delete";
    body?: Body;
    headers?: Record<string, string>;
    requestTimeoutSec?: number;
    followRedirect?: boolean;
    searchParams?:
        | string
        | Record<string, string | number | boolean | null | undefined>
        | URLSearchParams;
};

export type SuccessMakeHttpJsonCallResponse<T> = {
    error: false;
    response: {
        body: T;
        headers: Headers | AxiosResponseHeaders | Partial<RawAxiosResponseHeaders>;
        statusCode: number;
        statusMessage?: string;
    };
};

export type ErrorMakeHttpJsonCallResponse<T> = {
    error: true;
    errors: {
        message: string;
        statusCode?: number;
        body?: T;
        cause: unknown;
        headers?: unknown;
        statusMessage?: unknown;
        [key: string]: unknown;
    };
};

export type SuccessMakeHttpStreamCallResponse = {
    error: false;
    response: {
        stream: ReadableStream;
    };
};

export type MakeHttpJsonCallResponse<
    ResponseBody = Record<string | number, unknown> | undefined,
    ResponseError = Body,
> = SuccessMakeHttpJsonCallResponse<ResponseBody> | ErrorMakeHttpJsonCallResponse<ResponseError>;

export type MakeHttpStreamCallResponse<
    ResponseBody = Record<string | number, unknown> | undefined,
    ResponseError = Body,
> = SuccessMakeHttpStreamCallResponse<ResponseBody> | ErrorMakeHttpJsonCallResponse<ResponseError>;
