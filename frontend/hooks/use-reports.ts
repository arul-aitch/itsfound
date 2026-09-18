"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { ListReportsQuery, PaginatedReports, Report } from "@/lib/types";

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

            const response = await api.get<PaginatedReports>(url);

            if (!response) {
                throw new Error("Data laporan tidak ditemukan");
            }

            return response;
        },
        staleTime: 30 * 1000,
        placeholderData: keepPreviousData,
    });
}

export function useReport(id: string) {
    return useQuery({
        queryKey: ["report", id],
        queryFn: async () => {
            const response = await api.get<Report>(`/api/reports/${id}`);

            if (!response) {
                throw new Error("Laporan tidak ditemukan");
            }

            return response;
        },
        enabled: !!id,
    });
}
