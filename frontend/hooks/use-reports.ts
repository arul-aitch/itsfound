"use client";

import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";

import { api } from "@/lib/api";
import type {
    CreateReportRequest,
    ListReportsQuery,
    PaginatedReports,
    Report,
} from "@/lib/types";

export function useReports(query: ListReportsQuery) {
    return useQuery({
        queryKey: ["reports", query],
        queryFn: async () => {
            const params = new URLSearchParams();

            Object.entries(query).forEach(([key, value]) => {
                if (value === undefined || value === null || value === "") {
                    return;
                }
                params.set(key, String(value));
            });

            const queryString = params.toString();
            const url = queryString
                ? `/api/reports?${queryString}`
                : "/api/reports";

            return api.get<PaginatedReports>(url);
        },
        staleTime: 30 * 1000,
        placeholderData: keepPreviousData,
    });
}

export function useReport(id: string) {
    return useQuery({
        queryKey: ["report", id],
        queryFn: () => api.get<Report>(`/api/reports/${id}`),
        enabled: !!id,
    });
}

export function useCreateReport() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateReportRequest) =>
            api.post<Report>("/api/reports", data),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["reports"] });
        },
    });
}

export function useMyReports(query: ListReportsQuery) {
    return useQuery({
        queryKey: ["reports", "me", query],
        queryFn: async () => {
            const params = new URLSearchParams();

            Object.entries(query).forEach(([key, value]) => {
                if (value === undefined || value === null || value === "") {
                    return;
                }
                params.set(key, String(value));
            });

            const queryString = params.toString();
            const url = queryString
                ? `/api/reports/me?${queryString}`
                : "/api/reports/me";

            return api.get<PaginatedReports>(url);
        },
        staleTime: 30 * 1000,
        placeholderData: keepPreviousData,
    });
}

export function useDeleteReport() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete(`/api/reports/${id}`),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["reports"] });
            await queryClient.invalidateQueries({
                queryKey: ["admin", "reports"],
            });
        },
    });
}
