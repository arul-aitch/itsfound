export type UserRole = "user" | "admin";
export type ReportType = "lost" | "found";
export type ReportStatus = "open" | "in_claim" | "resolved" | "removed";

export interface User {
    id: string;
    email: string;
    name: string;
    wa_number: string | null;
    role: UserRole;
    created_at: string;
}

export interface ReportUserBrief {
    id: string;
    name: string;
    wa_number: string | null;
}

export interface Report {
    id: string;
    user_id: string;
    category_id: number;
    category_name: string;
    location_id: number;
    location_name: string;
    type: ReportType;
    title: string;
    description: string;
    photo_url: string | null;
    status: ReportStatus;
    occurred_at: string;
    created_at: string;
    updated_at: string;
    user: ReportUserBrief;
}

export interface PaginationMeta {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
}

export interface PaginatedReports {
    data: Report[];
    meta: PaginationMeta;
}

export interface ListReportsQuery {
    page?: number;
    per_page?: number;
    type?: string;
    category_id?: number;
    location_id?: number;
    status?: string;
    search?: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    name: string;
    wa_number?: string | null;
}

export interface LoginResponse {
    user: User;
    token: string;
}

export interface CreateReportRequest {
    type: ReportType;
    title: string;
    description: string;
    category_id: number;
    location_id: number;
    occurred_at: string;
    photo_url?: string | null;
}

export interface ApiError {
    error: {
        code: string;
        message: string;
    };
}
