"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import type { Claim, CreateClaimRequest } from "@/lib/types";

export function useCreateClaim() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateClaimRequest) =>
            api.post<Claim>("/api/claims", data),
        onSuccess: async (_data, variables) => {
            await queryClient.invalidateQueries({
                queryKey: ["report", variables.report_id],
            });
            await queryClient.invalidateQueries({ queryKey: ["reports"] });
            await queryClient.invalidateQueries({ queryKey: ["claims"] });
        },
    });
}

export function useMyClaims() {
    return useQuery({
        queryKey: ["claims", "me"],
        queryFn: () => api.get<Claim[]>("/api/claims/me"),
        enabled: isAuthenticated(),
    });
}
