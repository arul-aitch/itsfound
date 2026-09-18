"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { isAuthenticated, removeToken, saveToken } from "@/lib/auth";
import type {
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    User,
} from "@/lib/types";

export function useMe() {
    const [enabled, setEnabled] = useState(() => isAuthenticated());

    useEffect(() => {
        const onChange = () => setEnabled(isAuthenticated());

        window.addEventListener("auth-change", onChange);
        window.addEventListener("storage", onChange);

        return () => {
            window.removeEventListener("auth-change", onChange);
            window.removeEventListener("storage", onChange);
        };
    }, []);

    return useQuery({
        queryKey: ["me"],
        queryFn: async () => {
            const response = await api.get<User>("/api/auth/me");

            if (!response) {
                throw new Error("User tidak ditemukan");
            }

            return response;
        },
        enabled,
        retry: false,
        staleTime: 5 * 60 * 1000,
    });
}

export function useLogin() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: LoginRequest) =>
            api.post<LoginResponse>("/api/auth/login", data),
        onSuccess: async (response) => {
            if (!response) {
                return;
            }

            saveToken(response.token);

            queryClient.setQueryData(["me"], response.user);

            await queryClient.invalidateQueries({
                queryKey: ["me"],
            });
        },
    });
}

export function useRegister() {
    return useMutation({
        mutationFn: (data: RegisterRequest) =>
            api.post<User>("/api/auth/register", data),
    });
}

export function useLogout() {
    const queryClient = useQueryClient();

    const logout = () => {
        removeToken();
        queryClient.setQueryData(["me"], null);
        queryClient.removeQueries({ queryKey: ["me"] });
        queryClient.removeQueries({ queryKey: ["claims"] });
        queryClient.removeQueries({ queryKey: ["reports"] });
        queryClient.clear();
    };

    return { logout };
}
