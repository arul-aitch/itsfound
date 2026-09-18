"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ImageIcon, Loader2, MapPin, MoreVertical } from "lucide-react";
import { toast } from "sonner";

import { useDeleteReport } from "@/hooks/use-reports";
import { formatRelativeTime } from "@/lib/utils";
import type { Report } from "@/lib/types";

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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MyReportCardProps {
    report: Report;
}

export function MyReportCard({ report }: MyReportCardProps) {
    const [openConfirm, setOpenConfirm] = useState(false);
    const deleteReport = useDeleteReport();

    const handleDelete = () => {
        deleteReport.mutate(report.id, {
            onSuccess: () => {
                setOpenConfirm(false);
                toast.success("Laporan dihapus");
            },
            onError: (error) => {
                toast.error(
                    error instanceof Error
                        ? error.message
                        : "Gagal menghapus laporan",
                );
            },
        });
    };

    return (
        <>
            <Card className="rounded-lg border">
                <CardContent className="p-4">
                    <div className="flex gap-4">
                        {report.photo_url ? (
                            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
                                <Image
                                    src={report.photo_url}
                                    alt={report.title}
                                    fill
                                    sizes="80px"
                                    className="object-cover"
                                />
                            </div>
                        ) : (
                            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-muted">
                                <ImageIcon
                                    size={24}
                                    className="text-muted-foreground/50"
                                />
                            </div>
                        )}

                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <Link
                                    href={`/reports/${report.id}`}
                                    className="min-w-0 flex-1 truncate font-semibold hover:text-primary"
                                >
                                    {report.title}
                                </Link>

                                <ReportTypeBadge type={report.type} />
                            </div>

                            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                                <div className="flex min-w-0 items-center gap-1.5">
                                    <MapPin size={14} className="shrink-0" />
                                    <span className="truncate">
                                        {report.location_name}
                                    </span>
                                </div>

                                <span aria-hidden="true">•</span>

                                <span className="shrink-0">
                                    {formatRelativeTime(report.occurred_at)}
                                </span>
                            </div>

                            <div className="mt-2">
                                <ReportStatusBadge status={report.status} />
                            </div>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="shrink-0"
                                    aria-label="Menu laporan"
                                >
                                    <MoreVertical size={18} />
                                </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                    <Link href={`/reports/${report.id}`}>
                                        Lihat
                                    </Link>
                                </DropdownMenuItem>

                                <DropdownMenuItem asChild>
                                    <Link href={`/reports/${report.id}/edit`}>
                                        Edit
                                    </Link>
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => setOpenConfirm(true)}
                                >
                                    Hapus
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardContent>
            </Card>

            <Dialog
                open={openConfirm}
                onOpenChange={(open) => {
                    if (!deleteReport.isPending) {
                        setOpenConfirm(open);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Laporan?</DialogTitle>
                        <DialogDescription>
                            Laporan &apos;{report.title}&apos; akan dihapus
                            permanen. Tindakan ini tidak bisa dibatalkan.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpenConfirm(false)}
                            disabled={deleteReport.isPending}
                        >
                            Batal
                        </Button>

                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleteReport.isPending}
                        >
                            {deleteReport.isPending ? (
                                <>
                                    <Loader2
                                        size={16}
                                        className="animate-spin"
                                    />
                                    Menghapus...
                                </>
                            ) : (
                                "Hapus"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
