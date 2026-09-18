"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, Check, ClipboardList, X } from "lucide-react";

import { useAdminClaims } from "@/hooks/use-admin";
import { formatDateTime } from "@/lib/utils";
import type { Claim, ClaimStatus } from "@/lib/types";

import { ClaimReviewDialog } from "@/components/admin/claim-review-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type StatusFilter = "all" | ClaimStatus;

const STATUS_LABEL: Record<ClaimStatus, string> = {
    pending: "Menunggu",
    approved: "Disetujui",
    rejected: "Ditolak",
};

function ClaimStatusBadge({ status }: { status: ClaimStatus }) {
    const config: Record<ClaimStatus, string> = {
        pending: "border-amber-200 bg-amber-50 text-amber-700",
        approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
        rejected: "border-red-200 bg-red-50 text-red-700",
    };

    return (
        <span
            className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-xs font-medium ${config[status]}`}
        >
            {STATUS_LABEL[status]}
        </span>
    );
}

function ClaimCard({
    claim,
    onApprove,
    onReject,
}: {
    claim: Claim;
    onApprove: (claim: Claim) => void;
    onReject: (claim: Claim) => void;
}) {
    return (
        <Card className="rounded-xl">
            <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Klaim untuk
                        </p>
                        <Link
                            href={`/reports/${claim.report.id}`}
                            className="mt-1 block truncate font-semibold hover:text-primary"
                        >
                            {claim.report.title}
                        </Link>
                        <p className="mt-1 text-sm text-muted-foreground">
                            oleh{" "}
                            <span className="font-medium text-foreground">
                                {claim.claimant.name}
                            </span>
                            {claim.claimant.wa_number && (
                                <>
                                    {" • WA: "}
                                    <span>{claim.claimant.wa_number}</span>
                                </>
                            )}
                        </p>
                    </div>

                    <ClaimStatusBadge status={claim.status} />
                </div>

                <div className="rounded-lg bg-muted/50 p-3 text-sm">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Bukti
                    </p>
                    <p className="mt-1 line-clamp-4 whitespace-pre-line">
                        {claim.evidence}
                    </p>
                </div>

                {claim.admin_note && (
                    <div className="rounded-lg border-l-2 border-primary/40 bg-primary/5 p-3 text-sm">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Catatan Admin
                        </p>
                        <p className="mt-1">{claim.admin_note}</p>
                    </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <p className="text-xs text-muted-foreground">
                        Diajukan {formatDateTime(claim.created_at)}
                    </p>

                    {claim.status === "pending" && (
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onReject(claim)}
                                className="gap-1.5"
                            >
                                <X size={14} />
                                Tolak
                            </Button>

                            <Button
                                size="sm"
                                onClick={() => onApprove(claim)}
                                className="gap-1.5"
                            >
                                <Check size={14} />
                                Setujui
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export default function AdminClaimsPage() {
    const [filter, setFilter] = useState<StatusFilter>("all");
    const [reviewClaim, setReviewClaim] = useState<Claim | null>(null);
    const [reviewMode, setReviewMode] = useState<"approve" | "reject">(
        "approve",
    );

    const statusParam = filter === "all" ? undefined : filter;
    const query = useAdminClaims(statusParam);

    const handleApprove = (claim: Claim) => {
        setReviewClaim(claim);
        setReviewMode("approve");
    };

    const handleReject = (claim: Claim) => {
        setReviewClaim(claim);
        setReviewMode("reject");
    };

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">
                    Kelola Klaim
                </h1>
                <p className="mt-1 text-muted-foreground">
                    Review klaim dari pengguna. Setujui atau tolak dengan
                    catatan.
                </p>
            </div>

            <Tabs
                value={filter}
                onValueChange={(v) => setFilter(v as StatusFilter)}
            >
                <TabsList className="mb-6 grid w-full max-w-md grid-cols-4">
                    <TabsTrigger value="all">Semua</TabsTrigger>
                    <TabsTrigger value="pending">Menunggu</TabsTrigger>
                    <TabsTrigger value="approved">Disetujui</TabsTrigger>
                    <TabsTrigger value="rejected">Ditolak</TabsTrigger>
                </TabsList>

                {query.isLoading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-56 animate-pulse rounded-xl bg-muted"
                            />
                        ))}
                    </div>
                ) : query.isError ? (
                    <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed text-center">
                        <AlertCircle
                            size={48}
                            className="text-muted-foreground"
                        />
                        <p className="font-medium">Gagal memuat klaim</p>
                        <Button onClick={() => query.refetch()}>
                            Coba lagi
                        </Button>
                    </div>
                ) : !query.data || query.data.length === 0 ? (
                    <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed text-center">
                        <ClipboardList
                            size={48}
                            className="text-muted-foreground"
                        />
                        <p className="font-medium">Belum ada klaim</p>
                        <p className="text-sm text-muted-foreground">
                            {filter === "all"
                                ? "Klaim dari pengguna akan tampil di sini."
                                : `Tidak ada klaim dengan status "${STATUS_LABEL[filter as ClaimStatus]}".`}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 lg:grid-cols-2">
                        {query.data.map((claim) => (
                            <ClaimCard
                                key={claim.id}
                                claim={claim}
                                onApprove={handleApprove}
                                onReject={handleReject}
                            />
                        ))}
                    </div>
                )}
            </Tabs>

            <ClaimReviewDialog
                claim={reviewClaim}
                open={reviewClaim !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setReviewClaim(null);
                    }
                }}
                mode={reviewMode}
            />
        </div>
    );
}
