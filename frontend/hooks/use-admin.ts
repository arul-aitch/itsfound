"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
    Claim,
    ListReportsQuery,
    PaginatedReports,
    Report,
} from "@/lib/types";
import { api, ApiClientError } from "@/lib/api";
import { getToken, isAuthenticated } from "@/lib/auth";

type UpdateClaimStatusVariables = {
    id: string;
    status: "approved" | "rejected";
    admin_note?: string;
};

export function useAdminClaims(status?: string) {
    return useQuery<Claim[]>({
        queryKey: ["admin", "claims", status],
        queryFn: async () => {
            const params = new URLSearchParams();

            if (status) {
                params.set("status", status);
            }

            const query = params.toString();
            const url = query
                ? `/api/admin/claims?${query}`
                : "/api/admin/claims";

            return api.get<Claim[]>(url);
        },
        enabled: isAuthenticated(),
    });
}

export function useUpdateClaimStatus() {
    const queryClient = useQueryClient();

    return useMutation<Claim, ApiClientError, UpdateClaimStatusVariables>({
        mutationFn: async ({ id, status, admin_note }) => {
            const token = getToken();

            if (!token) {
                throw new ApiClientError(
                    401,
                    "UNAUTHORIZED",
                    "Autentikasi diperlukan",
                );
            }

            const baseUrl =
                process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

            const response = await fetch(`${baseUrl}/api/admin/claims/${id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    status,
                    ...(admin_note ? { admin_note } : {}),
                }),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new ApiClientError(
                    response.status,
                    data?.error?.code || "UNKNOWN_ERROR",
                    data?.error?.message || "Terjadi kesalahan",
                );
            }

            return data as Claim;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "claims"] });
            queryClient.invalidateQueries({ queryKey: ["claims"] });
            queryClient.invalidateQueries({ queryKey: ["reports"] });
        },
    });
}

export function useAdminReports(query: ListReportsQuery) {
    return useQuery<PaginatedReports>({
        queryKey: ["admin", "reports", query],
        queryFn: async () => {
            const params = new URLSearchParams();

            if (query.page !== undefined) {
                params.set("page", String(query.page));
            }

            if (query.per_page !== undefined) {
                params.set("per_page", String(query.per_page));
            }

            if (query.type) {
                params.set("type", query.type);
            }

            if (query.status) {
                params.set("status", query.status);
            }

            if (query.search) {
                params.set("search", query.search);
            }

            if (query.category_id !== undefined) {
                params.set("category_id", String(query.category_id));
            }

            if (query.location_id !== undefined) {
                params.set("location_id", String(query.location_id));
            }

            const queryString = params.toString();
            const url = queryString
                ? `/api/reports?${queryString}`
                : "/api/reports";

            return api.get<PaginatedReports>(url);
        },
        staleTime: 30_000,
    });
}

export function useAdminUpdateReportStatus() {
    const queryClient = useQueryClient();

    return useMutation<
        Report,
        ApiClientError,
        { id: string; status: "open" | "in_claim" | "resolved" | "removed" }
    >({
        mutationFn: ({ id, status }) =>
            api.patch<Report>(`/api/reports/${id}/status`, { status }),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ["admin", "reports"],
            });
            await queryClient.invalidateQueries({ queryKey: ["reports"] });
        },
    });
}
