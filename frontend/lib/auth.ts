const TOKEN_KEY = "itsfound_token";

export interface DecodedToken {
    user_id: string;
    role: string;
    exp: number;
}

export function saveToken(token: string) {
    if (typeof window === "undefined") {
        return;
    }

    window.localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
    if (typeof window === "undefined") {
        return null;
    }

    return window.localStorage.getItem(TOKEN_KEY);
}

export function removeToken() {
    if (typeof window === "undefined") {
        return;
    }

    window.localStorage.removeItem(TOKEN_KEY);
}

export function decodeToken(token: string): DecodedToken | null {
    try {
        const parts = token.split(".");

        if (parts.length !== 3) {
            return null;
        }

        const payload = parts[1]
            .replace(/-/g, "+")
            .replace(/_/g, "/")
            .padEnd(Math.ceil(parts[1].length / 4) * 4, "=");

        const decoded = JSON.parse(atob(payload)) as Partial<DecodedToken>;

        if (
            typeof decoded.user_id !== "string" ||
            typeof decoded.role !== "string" ||
            typeof decoded.exp !== "number"
        ) {
            return null;
        }

        return {
            user_id: decoded.user_id,
            role: decoded.role,
            exp: decoded.exp,
        };
    } catch {
        return null;
    }
}

export function isAuthenticated(): boolean {
    const token = getToken();

    if (!token) {
        return false;
    }

    const decoded = decodeToken(token);

    if (!decoded) {
        return false;
    }

    return decoded.exp * 1000 > Date.now();
}
