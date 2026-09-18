import type { ReportStatus } from "@/lib/types";

interface ReportStatusBadgeProps {
    status: ReportStatus;
}

const STATUS_CONFIG: Record<
    ReportStatus,
    {
        label: string;
        className: string;
    }
> = {
    open: {
        label: "Terbuka",
        className: "border-slate-200 bg-slate-100 text-slate-600",
    },
    in_claim: {
        label: "Dalam Klaim",
        className: "border-amber-200 bg-amber-50 text-amber-700",
    },
    resolved: {
        label: "Selesai",
        className: "border-emerald-200 bg-emerald-100 text-emerald-800",
    },
    removed: {
        label: "Dihapus",
        className: "border-gray-200 bg-gray-100 text-gray-600",
    },
};

function getDefaultLabel(status: string) {
    return status
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function ReportStatusBadge({ status }: ReportStatusBadgeProps) {
    const config = STATUS_CONFIG[status];

    return (
        <span
            className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide ${config?.className ?? "border-gray-200 bg-gray-100 text-gray-600"}`}
        >
            {config?.label ?? getDefaultLabel(status)}
        </span>
    );
}
