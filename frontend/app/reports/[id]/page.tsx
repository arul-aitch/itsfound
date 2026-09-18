"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle, ArrowLeft } from "lucide-react";

import { ReportDetail } from "@/components/report-detail";
import { Button } from "@/components/ui/button";
import { useReport } from "@/hooks/use-reports";

export default function ReportDetailPage() {
    const params = useParams<{ id: string }>();
    const id = params?.id ?? "";

    const { data, isLoading, isError } = useReport(id);

    if (isLoading) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
                <div className="space-y-6">
                    <div className="aspect-video animate-pulse rounded-xl bg-muted" />

                    <div className="space-y-4">
                        <div className="h-8 w-3/4 animate-pulse rounded-md bg-muted" />
                        <div className="h-4 w-1/2 animate-pulse rounded-md bg-muted" />
                        <div className="h-4 w-2/3 animate-pulse rounded-md bg-muted" />
                    </div>

                    <div className="space-y-3">
                        <div className="h-6 w-24 animate-pulse rounded-md bg-muted" />
                        <div className="h-4 w-full animate-pulse rounded-md bg-muted" />
                        <div className="h-4 w-5/6 animate-pulse rounded-md bg-muted" />
                        <div className="h-4 w-2/3 animate-pulse rounded-md bg-muted" />
                    </div>

                    <div className="h-32 animate-pulse rounded-xl bg-muted" />

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <div className="h-10 flex-1 animate-pulse rounded-md bg-muted" />
                        <div className="h-10 flex-1 animate-pulse rounded-md bg-muted" />
                    </div>
                </div>
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="flex min-h-60 flex-col items-center justify-center gap-3 px-4 py-12 text-center">
                <AlertTriangle size={48} className="text-muted-foreground" />

                <p className="font-medium">Laporan tidak ditemukan</p>

                <p className="text-sm text-muted-foreground">
                    Laporan mungkin sudah dihapus atau tidak tersedia.
                </p>

                <Button variant="outline" asChild className="mt-2">
                    <Link href="/reports">Kembali ke daftar laporan</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
            <Button variant="ghost" size="sm" asChild className="mb-6">
                <Link href="/reports">
                    <ArrowLeft size={16} />
                    Kembali
                </Link>
            </Button>

            <ReportDetail report={data} />
        </div>
    );
}
