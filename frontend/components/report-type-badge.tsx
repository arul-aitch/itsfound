"use client";

import type { ReportType } from "@/lib/types";

interface ReportTypeBadgeProps {
    type: ReportType;
}

export function ReportTypeBadge({ type }: ReportTypeBadgeProps) {
    if (type === "lost") {
        return (
            <span className="inline-flex items-center rounded border border-red-200 bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-red-700">
                HILANG
            </span>
        );
    }

    return (
        <span className="inline-flex items-center rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-emerald-700">
            TEMUAN
        </span>
    );
}
