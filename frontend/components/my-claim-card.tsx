"use client";

import Link from "next/link";

import type { Claim, ClaimStatus } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface MyClaimCardProps {
    claim: Claim;
}

const STATUS_CONFIG: Record<ClaimStatus, { label: string; className: string }> =
    {
        pending: {
            label: "Menunggu",
            className: "border-amber-200 bg-amber-50 text-amber-700",
        },
        approved: {
            label: "Disetujui",
            className: "border-emerald-200 bg-emerald-50 text-emerald-700",
        },
        rejected: {
            label: "Ditolak",
            className: "border-red-200 bg-red-50 text-red-700",
        },
    };

export function MyClaimCard({ claim }: MyClaimCardProps) {
    const status = STATUS_CONFIG[claim.status];

    return (
        <Card className="rounded-lg border">
            <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Klaim untuk
                        </p>

                        <Link
                            href={`/reports/${claim.report.id}`}
                            className="mt-1 block truncate font-semibold hover:text-primary"
                        >
                            {claim.report.title}
                        </Link>
                    </div>

                    <span
                        className={`inline-flex shrink-0 items-center rounded border px-2 py-0.5 text-xs font-semibold ${status.className}`}
                    >
                        {status.label}
                    </span>
                </div>

                <p className="line-clamp-2 text-sm text-muted-foreground">
                    {claim.evidence}
                </p>

                <div className="flex min-w-0 items-center justify-between gap-4 text-xs text-muted-foreground">
                    <span className="shrink-0">
                        Diajukan {formatRelativeTime(claim.created_at)}
                    </span>

                    {claim.admin_note && (
                        <span
                            className="min-w-0 truncate text-right"
                            title={`Catatan admin: ${claim.admin_note}`}
                        >
                            Catatan admin: {claim.admin_note}
                        </span>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
