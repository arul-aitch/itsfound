"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
    AlertCircle,
    FileText,
    ImageIcon,
    Loader2,
    MapPin,
    RotateCcw,
    Search,
    Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { useAdminReports, useAdminUpdateReportStatus } from "@/hooks/use-admin";
import { useDeleteReport } from "@/hooks/use-reports";
import { ApiClientError } from "@/lib/api";
import { CATEGORIES, LOCATIONS, PER_PAGE } from "@/lib/constants";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";
import type { ListReportsQuery, Report, ReportStatus } from "@/lib/types";

import { ReportStatusBadge } from "@/components/report-status-badge";
import { ReportTypeBadge } from "@/components/report-type-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type StatusFilter = "all" | ReportStatus;

function AdminReportCard({
    report,
    onSoftDelete,
    onRestore,
    onHardDelete,
}: {
    report: Report;
    onSoftDelete: (report: Report) => void;
    onRestore: (report: Report) => void;
    onHardDelete: (report: Report) => void;
}) {
    const isRemoved = report.status === "removed";

    return (
        <Card className="rounded-xl">
            <CardContent className="p-4 sm:p-5">
                <div className="flex gap-4">
                    {report.photo_url ? (
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg sm:h-24 sm:w-24">
                            <Image
                                src={report.photo_url}
                                alt={report.title}
                                fill
                                sizes="96px"
                                className="object-cover"
                            />
                        </div>
                    ) : (
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-muted sm:h-24 sm:w-24">
                            <ImageIcon
                                size={28}
                                className="text-muted-foreground/50"
                            />
                        </div>
                    )}

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <Link
                                        href={`/reports/${report.id}`}
                                        className="min-w-0 truncate font-semibold hover:text-primary"
                                    >
                                        {report.title}
                                    </Link>
                                    <ReportTypeBadge type={report.type} />
                                </div>

                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1.5">
                                        <MapPin
                                            size={14}
                                            className="shrink-0"
                                        />
                                        <span className="truncate">
                                            {report.location_name}
                                        </span>
                                    </span>
                                    <span className="hidden sm:inline">•</span>
                                    <span>{report.category_name}</span>
                                </div>

                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <ReportStatusBadge status={report.status} />
                                    <span className="text-xs text-muted-foreground">
                                        oleh {report.user.name}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        •{" "}
                                        {formatRelativeTime(report.created_at)}
                                    </span>
                                </div>
                            </div>

                            {isRemoved ? (
                                <div className="flex shrink-0 gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onRestore(report)}
                                    >
                                        <RotateCcw size={14} />
                                        <span className="ml-1 hidden sm:inline">
                                            Pulihkan
                                        </span>
                                    </Button>

                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                        onClick={() => onHardDelete(report)}
                                    >
                                        <Trash2 size={14} />
                                        <span className="ml-1 hidden sm:inline">
                                            Hapus Permanen
                                        </span>
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => onSoftDelete(report)}
                                >
                                    <Trash2 size={16} />
                                    <span className="ml-1 hidden sm:inline">
                                        Hapus
                                    </span>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function AdminReportsPage() {
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [categoryId, setCategoryId] = useState<number | null>(null);
    const [locationId, setLocationId] = useState<number | null>(null);
    const [page, setPage] = useState(1);

    const [softDeleteTarget, setSoftDeleteTarget] = useState<Report | null>(
        null,
    );
    const [restoreTarget, setRestoreTarget] = useState<Report | null>(null);
    const [hardDeleteTarget, setHardDeleteTarget] = useState<Report | null>(
        null,
    );

    const updateStatus = useAdminUpdateReportStatus();
    const hardDelete = useDeleteReport();

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        setPage(1);
    }, [statusFilter, categoryId, locationId]);

    const query: ListReportsQuery = {
        page,
        per_page: PER_PAGE,
        status: statusFilter === "all" ? undefined : statusFilter,
        category_id: categoryId ?? undefined,
        location_id: locationId ?? undefined,
        search: search || undefined,
    };

    const reportsQuery = useAdminReports(query);

    const handleSoftDelete = () => {
        if (!softDeleteTarget) return;

        updateStatus.mutate(
            { id: softDeleteTarget.id, status: "removed" },
            {
                onSuccess: () => {
                    toast.success("Laporan dipindahkan ke Dihapus");
                    setSoftDeleteTarget(null);
                    reportsQuery.refetch();
                },
                onError: (error) => {
                    toast.error(
                        error instanceof ApiClientError
                            ? error.message
                            : "Gagal menghapus laporan",
                    );
                },
            },
        );
    };

    const handleRestore = () => {
        if (!restoreTarget) return;

        updateStatus.mutate(
            { id: restoreTarget.id, status: "open" },
            {
                onSuccess: () => {
                    toast.success("Laporan dipulihkan");
                    setRestoreTarget(null);
                    reportsQuery.refetch();
                },
                onError: (error) => {
                    toast.error(
                        error instanceof ApiClientError
                            ? error.message
                            : "Gagal memulihkan laporan",
                    );
                },
            },
        );
    };

    const handleHardDelete = () => {
        if (!hardDeleteTarget) return;

        hardDelete.mutate(hardDeleteTarget.id, {
            onSuccess: () => {
                toast.success("Laporan dihapus permanen");
                setHardDeleteTarget(null);
                reportsQuery.refetch();
            },
            onError: (error) => {
                toast.error(
                    error instanceof ApiClientError
                        ? error.message
                        : "Gagal menghapus laporan",
                );
            },
        });
    };

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">
                    Kelola Laporan
                </h1>
                <p className="mt-1 text-muted-foreground">
                    Lihat semua laporan. Sembunyikan, pulihkan, atau hapus
                    permanen.
                </p>
            </div>

            <div className="mb-6 space-y-4">
                <div className="relative">
                    <Search
                        size={20}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Cari judul atau deskripsi..."
                        className="h-11 rounded-lg pl-11"
                    />
                </div>

                <Tabs
                    value={statusFilter}
                    onValueChange={(v) => setStatusFilter(v as StatusFilter)}
                >
                    <TabsList className="grid w-full grid-cols-3 sm:max-w-xl sm:grid-cols-5">
                        <TabsTrigger value="all">Semua</TabsTrigger>
                        <TabsTrigger value="open">Terbuka</TabsTrigger>
                        <TabsTrigger value="in_claim">Dalam Klaim</TabsTrigger>
                        <TabsTrigger value="resolved">Selesai</TabsTrigger>
                        <TabsTrigger value="removed">Dihapus</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="flex flex-wrap gap-2">
                    <Select
                        value={categoryId?.toString() ?? "all"}
                        onValueChange={(v) =>
                            setCategoryId(v === "all" ? null : Number(v))
                        }
                    >
                        <SelectTrigger className="w-[180px] rounded-lg">
                            <SelectValue placeholder="Semua Kategori" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Kategori</SelectItem>
                            {CATEGORIES.map((c) => (
                                <SelectItem key={c.id} value={c.id.toString()}>
                                    {c.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={locationId?.toString() ?? "all"}
                        onValueChange={(v) =>
                            setLocationId(v === "all" ? null : Number(v))
                        }
                    >
                        <SelectTrigger className="w-[180px] rounded-lg">
                            <SelectValue placeholder="Semua Lokasi" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Lokasi</SelectItem>
                            {LOCATIONS.map((l) => (
                                <SelectItem key={l.id} value={l.id.toString()}>
                                    {l.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {reportsQuery.isLoading ? (
                <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-32 animate-pulse rounded-xl bg-muted"
                        />
                    ))}
                </div>
            ) : reportsQuery.isError ? (
                <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed text-center">
                    <AlertCircle size={48} className="text-muted-foreground" />
                    <p className="font-medium">Gagal memuat laporan</p>
                    <Button onClick={() => reportsQuery.refetch()}>
                        Coba lagi
                    </Button>
                </div>
            ) : !reportsQuery.data || reportsQuery.data.data.length === 0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed text-center">
                    <FileText size={48} className="text-muted-foreground" />
                    <p className="font-medium">
                        {statusFilter === "removed"
                            ? "Belum ada laporan dihapus"
                            : "Belum ada laporan"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Coba ubah filter atau kata kunci pencarian.
                    </p>
                </div>
            ) : (
                <>
                    <p className="mb-4 text-sm text-muted-foreground">
                        Menampilkan {reportsQuery.data.data.length} dari{" "}
                        {reportsQuery.data.meta.total} laporan
                    </p>

                    <div className="space-y-3">
                        {reportsQuery.data.data.map((report) => (
                            <AdminReportCard
                                key={report.id}
                                report={report}
                                onSoftDelete={setSoftDeleteTarget}
                                onRestore={setRestoreTarget}
                                onHardDelete={setHardDeleteTarget}
                            />
                        ))}
                    </div>

                    {reportsQuery.data.meta.total_pages > 1 && (
                        <div className="flex items-center justify-between gap-4 pt-6">
                            <p className="text-sm text-muted-foreground">
                                Halaman {page} dari{" "}
                                {reportsQuery.data.meta.total_pages}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page === 1}
                                    onClick={() => setPage(page - 1)}
                                >
                                    Sebelumnya
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={
                                        page >=
                                        reportsQuery.data.meta.total_pages
                                    }
                                    onClick={() => setPage(page + 1)}
                                >
                                    Berikutnya
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Dialog: Soft delete */}
            <Dialog
                open={softDeleteTarget !== null}
                onOpenChange={(open) => {
                    if (!open && !updateStatus.isPending)
                        setSoftDeleteTarget(null);
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Sembunyikan Laporan?</DialogTitle>
                        <DialogDescription>
                            Laporan &apos;{softDeleteTarget?.title}&apos; akan
                            disembunyikan dari publik. Data tetap tersimpan dan
                            bisa dipulihkan nanti.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setSoftDeleteTarget(null)}
                            disabled={updateStatus.isPending}
                        >
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleSoftDelete}
                            disabled={updateStatus.isPending}
                        >
                            {updateStatus.isPending ? (
                                <>
                                    <Loader2
                                        size={16}
                                        className="animate-spin"
                                    />
                                    Menyembunyikan...
                                </>
                            ) : (
                                "Sembunyikan"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog: Restore */}
            <Dialog
                open={restoreTarget !== null}
                onOpenChange={(open) => {
                    if (!open && !updateStatus.isPending)
                        setRestoreTarget(null);
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Pulihkan Laporan?</DialogTitle>
                        <DialogDescription>
                            Laporan &apos;{restoreTarget?.title}&apos; akan
                            tampil kembali dengan status Terbuka.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setRestoreTarget(null)}
                            disabled={updateStatus.isPending}
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={handleRestore}
                            disabled={updateStatus.isPending}
                        >
                            {updateStatus.isPending ? (
                                <>
                                    <Loader2
                                        size={16}
                                        className="animate-spin"
                                    />
                                    Memulihkan...
                                </>
                            ) : (
                                "Pulihkan"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog: Hard delete */}
            <Dialog
                open={hardDeleteTarget !== null}
                onOpenChange={(open) => {
                    if (!open && !hardDelete.isPending)
                        setHardDeleteTarget(null);
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-destructive">
                            Hapus Permanen?
                        </DialogTitle>
                        <DialogDescription>
                            Laporan &apos;{hardDeleteTarget?.title}&apos; akan
                            dihapus permanen dari database. Tindakan ini tidak
                            bisa dibatalkan.
                        </DialogDescription>
                    </DialogHeader>

                    {hardDeleteTarget && (
                        <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
                            <p className="font-medium text-destructive">
                                ⚠️ Data akan hilang selamanya
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {hardDeleteTarget.title} — oleh{" "}
                                {hardDeleteTarget.user.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Dihapus:{" "}
                                {formatDateTime(hardDeleteTarget.updated_at)}
                            </p>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setHardDeleteTarget(null)}
                            disabled={hardDelete.isPending}
                        >
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleHardDelete}
                            disabled={hardDelete.isPending}
                        >
                            {hardDelete.isPending ? (
                                <>
                                    <Loader2
                                        size={16}
                                        className="animate-spin"
                                    />
                                    Menghapus...
                                </>
                            ) : (
                                "Hapus Permanen"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
