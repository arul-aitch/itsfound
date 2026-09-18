import type { ApiError } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const TOKEN_KEY = "itsfound_token";

export class ApiClientError extends Error {
    status: number;
    code: string;

    constructor(status: number, code: string, message: string) {
        super(message);
        this.name = "ApiClientError";
        this.status = status;
        this.code = code;
    }
}

async function request<T>(
    method: string,
    path: string,
    body?: unknown,
): Promise<T> {
    const headers = new Headers();

    if (body !== undefined) {
        headers.set("Content-Type", "application/json");
    }

    if (typeof window !== "undefined") {
        const token = window.localStorage.getItem(TOKEN_KEY);

        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }
    }

    let response: Response;

    try {
        response = await fetch(`${API_URL}${path}`, {
            method,
            headers,
            body: body === undefined ? undefined : JSON.stringify(body),
        });
    } catch {
        throw new ApiClientError(
            0,
            "NETWORK_ERROR",
            "Tidak dapat terhubung ke server",
        );
    }

    if (!response.ok) {
        let code = "INTERNAL_ERROR";
        let message = "Terjadi kesalahan pada server";

        try {
            const data = (await response.json()) as ApiError;

            if (data.error) {
                code = data.error.code || code;
                message = data.error.message || message;
            }
        } catch {
            message = response.statusText || message;
        }

        throw new ApiClientError(response.status, code, message);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    try {
        return (await response.json()) as T;
    } catch {
        throw new ApiClientError(
            response.status,
            "INVALID_RESPONSE",
            "Response server tidak valid",
        );
    }
}

export const api = {
    get<T>(path: string): Promise<T> {
        return request<T>("GET", path);
    },

    post<T>(path: string, body?: unknown): Promise<T> {
        return request<T>("POST", path, body);
    },

    put<T>(path: string, body?: unknown): Promise<T> {
        return request<T>("PUT", path, body);
    },

    patch<T>(path: string, body?: unknown): Promise<T> {
        return request<T>("PATCH", path, body);
    },

    delete<T = void>(path: string): Promise<T> {
        return request<T>("DELETE", path);
    },
};
