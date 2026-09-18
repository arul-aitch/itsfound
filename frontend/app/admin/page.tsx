"use client";

import Link from "next/link";
import {
    Activity,
    AlertCircle,
    CheckCircle2,
    Clock,
    FileText,
} from "lucide-react";
import { useAdminClaims, useAdminReports } from "@/hooks/use-admin";
import { formatRelativeTime } from "@/lib/utils";
import type { Claim } from "@/lib/types";

function SkeletonCard() {
    return (
        <div className="rounded-xl border bg-background p-6">
            <div className="flex items-start justify-between">
                <div className="space-y-3">
                    <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                    <div className="h-9 w-16 animate-pulse rounded bg-muted" />
                </div>
                <div className="size-10 animate-pulse rounded-lg bg-muted" />
            </div>
            <div className="mt-4 h-3 w-24 animate-pulse rounded bg-muted" />
        </div>
    );
}

function SkeletonRow() {
    return (
        <div className="flex items-center justify-between border-b py-3 last:border-0">
            <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-48 animate-pulse rounded bg-muted" />
                <div className="h-3 w-40 animate-pulse rounded bg-muted" />
            </div>
            <div className="ml-4 h-6 w-20 animate-pulse rounded-full bg-muted" />
        </div>
    );
}

function ClaimStatusBadge({ status }: { status: Claim["status"] }) {
    const config = {
        pending: {
            label: "Menunggu",
            className: "border border-amber-200 bg-amber-50 text-amber-700",
        },
        approved: {
            label: "Disetujui",
            className:
                "border border-emerald-200 bg-emerald-50 text-emerald-700",
        },
        rejected: {
            label: "Ditolak",
            className: "border border-red-200 bg-red-50 text-red-700",
        },
    };

    const current = config[status];

    return (
        <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${current.className}`}
        >
            {current.label}
        </span>
    );
}

function StatCard({
    label,
    value,
    subtitle,
    icon: Icon,
    standout = false,
}: {
    label: string;
    value: number;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
    standout?: boolean;
}) {
    return (
        <div
            className={`rounded-xl border bg-background ${
                standout ? "border-primary" : ""
            }`}
        >
            <div className="p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">{label}</p>
                        <p className="mt-2 text-3xl font-bold">{value}</p>
                    </div>

                    <div className="rounded-lg bg-muted p-2">
                        <Icon className="size-5 text-muted-foreground" />
                    </div>
                </div>

                <p className="mt-4 text-xs text-muted-foreground">{subtitle}</p>
            </div>
        </div>
    );
}

export default function AdminPage() {
    const reportsQuery = useAdminReports({ per_page: 100 });
    const claimsQuery = useAdminClaims();

    const isLoading = reportsQuery.isLoading || claimsQuery.isLoading;
    const isError = reportsQuery.isError || claimsQuery.isError;

    if (isLoading) {
        return (
            <div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Dashboard Admin
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        Ringkasan aktivitas ITSFOUND.
                    </p>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <SkeletonCard key={index} />
                    ))}
                </div>

                <div className="mt-8 rounded-xl border bg-background p-6">
                    <div className="flex items-center justify-between">
                        <div className="h-6 w-32 animate-pulse rounded bg-muted" />
                        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                    </div>

                    <div className="mt-4">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <SkeletonRow key={index} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (isError) {
        const retry = () => {
            reportsQuery.refetch();
            claimsQuery.refetch();
        };

        return (
            <div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Dashboard Admin
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        Ringkasan aktivitas ITSFOUND.
                    </p>
                </div>

                <div className="mt-8 flex min-h-64 items-center justify-center rounded-xl border bg-background">
                    <div className="flex flex-col items-center text-center">
                        <div className="rounded-full bg-muted p-3">
                            <AlertCircle className="size-6 text-muted-foreground" />
                        </div>
                        <p className="mt-3 font-medium">Gagal memuat data</p>
                        <button
                            type="button"
                            onClick={retry}
                            className="mt-2 text-sm font-medium text-primary hover:underline"
                        >
                            Coba lagi
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const reports = reportsQuery.data?.data ?? [];
    const claims = claimsQuery.data ?? [];

    const totalReports = reportsQuery.data?.meta.total ?? 0;

    const activeReports = reports.filter(
        (report) => report.status !== "resolved" && report.status !== "removed",
    ).length;

    const pendingClaims = claims.filter(
        (claim) => claim.status === "pending",
    ).length;

    const resolvedReports = reports.filter(
        (report) => report.status === "resolved",
    ).length;

    const latestClaims = [...claims]
        .sort(
            (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime(),
        )
        .slice(0, 5);

    return (
        <div>
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Dashboard Admin
                </h1>
                <p className="mt-1 text-muted-foreground">
                    Ringkasan aktivitas ITSFOUND.
                </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    label="Total Laporan"
                    value={totalReports}
                    subtitle="Semua laporan"
                    icon={FileText}
                />

                <StatCard
                    label="Laporan Aktif"
                    value={activeReports}
                    subtitle="Belum selesai"
                    icon={Activity}
                />

                <StatCard
                    label="Klaim Menunggu"
                    value={pendingClaims}
                    subtitle="Butuh review"
                    icon={Clock}
                    standout={pendingClaims > 0}
                />

                <StatCard
                    label="Laporan Selesai"
                    value={resolvedReports}
                    subtitle="Barang kembali"
                    icon={CheckCircle2}
                />
            </div>

            <section className="mt-8">
                <div className="rounded-xl border bg-background">
                    <div className="flex items-center justify-between gap-4 border-b px-6 py-4">
                        <h2 className="font-semibold">Klaim Terbaru</h2>

                        <Link
                            href="/admin/claims"
                            className="shrink-0 text-sm font-medium text-primary hover:underline"
                        >
                            Lihat semua →
                        </Link>
                    </div>

                    <div className="px-6">
                        {latestClaims.length === 0 ? (
                            <div className="flex min-h-40 items-center justify-center text-sm text-muted-foreground">
                                Belum ada klaim
                            </div>
                        ) : (
                            latestClaims.map((claim) => (
                                <div
                                    key={claim.id}
                                    className="flex items-center justify-between gap-4 border-b py-3 last:border-0"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-medium">
                                            {claim.report.title}
                                        </p>
                                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                            oleh {claim.claimant.name} •{" "}
                                            {formatRelativeTime(
                                                claim.created_at,
                                            )}
                                        </p>
                                    </div>

                                    <ClaimStatusBadge status={claim.status} />
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
