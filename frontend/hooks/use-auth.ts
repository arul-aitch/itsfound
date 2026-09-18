"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { getToken, isAuthenticated, removeToken, saveToken } from "@/lib/auth";
import type {
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    User,
} from "@/lib/types";

export function useMe() {
    return useQuery({
        queryKey: ["me"],
        queryFn: async () => {
            const response = await api.get<User>("/api/auth/me");

            if (!response) {
                throw new Error("User tidak ditemukan");
            }

            return response;
        },
        enabled: isAuthenticated(),
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
        queryClient.clear();
    };

    return {
        logout,
        isAuthenticated: Boolean(getToken()),
    };
}
