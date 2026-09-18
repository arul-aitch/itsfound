"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Clock, ImageIcon, MapPin, MessageCircle } from "lucide-react";

import { useMe } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ClaimDialog } from "@/components/claim-dialog";
import { ReportStatusBadge } from "@/components/report-status-badge";
import { ReportTypeBadge } from "@/components/report-type-badge";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";
import type { Report } from "@/lib/types";

interface ReportDetailProps {
    report: Report;
}

function normalizeWANumber(waNumber: string): string {
    const digits = waNumber.replace(/\D/g, "");

    if (digits.startsWith("0")) {
        return `62${digits.slice(1)}`;
    }

    if (digits.startsWith("8")) {
        return `62${digits}`;
    }

    return digits;
}

export function ReportDetail({ report }: ReportDetailProps) {
    const router = useRouter();
    const { data: user } = useMe();

    const initial = report.user.name.trim().charAt(0).toUpperCase() || "U";

    const whatsappNumber = report.user.wa_number
        ? normalizeWANumber(report.user.wa_number)
        : "";

    const message = `Halo, saya melihat laporan "${report.title}" di ITSFOUND. Apakah barang ini masih ada?`;

    const whatsappURL = whatsappNumber
        ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
        : "";

    const isOwner = !!user && report.user_id === user.id;
    const isLoggedIn = !!user;

    const renderClaimAction = () => {
        if (report.status === "removed") {
            return null;
        }

        if (report.type !== "found") {
            return (
                <div className="flex w-full flex-1 flex-col">
                    <Button disabled variant="outline" className="w-full">
                        Ajukan Klaim
                    </Button>
                    <p className="mt-2 text-center text-xs text-muted-foreground">
                        Hanya barang temuan yang bisa diklaim.
                    </p>
                </div>
            );
        }

        if (report.status === "in_claim") {
            return (
                <div className="flex w-full flex-1 flex-col">
                    <Button disabled variant="outline" className="w-full">
                        Sedang Diklaim
                    </Button>
                    <p className="mt-2 text-center text-xs text-muted-foreground">
                        Laporan ini sedang dalam proses klaim.
                    </p>
                </div>
            );
        }

        if (report.status === "resolved") {
            return (
                <div className="flex w-full flex-1 flex-col">
                    <Button disabled variant="outline" className="w-full">
                        Sudah Selesai
                    </Button>
                    <p className="mt-2 text-center text-xs text-muted-foreground">
                        Laporan ini sudah selesai.
                    </p>
                </div>
            );
        }

        if (!isLoggedIn) {
            return (
                <div className="flex w-full flex-1 flex-col">
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => router.push("/login")}
                    >
                        Login untuk Klaim
                    </Button>
                </div>
            );
        }

        if (isOwner) {
            return (
                <div className="flex w-full flex-1 flex-col">
                    <Button disabled variant="outline" className="w-full">
                        Laporan Milikmu
                    </Button>
                    <p className="mt-2 text-center text-xs text-muted-foreground">
                        Kamu tidak bisa mengklaim laporan milik sendiri.
                    </p>
                </div>
            );
        }

        return (
            <div className="flex w-full flex-1 flex-col">
                <ClaimDialog report={report}>
                    <Button variant="outline" className="w-full">
                        Ajukan Klaim
                    </Button>
                </ClaimDialog>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {report.photo_url ? (
                <div className="relative aspect-video overflow-hidden rounded-xl">
                    <Image
                        src={report.photo_url}
                        alt={report.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 896px"
                        className="object-cover"
                    />
                </div>
            ) : (
                <div className="flex aspect-video items-center justify-center rounded-xl bg-muted">
                    <ImageIcon size={48} className="text-muted-foreground/50" />
                </div>
            )}

            <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                    <h1 className="flex-1 text-2xl font-bold leading-tight tracking-tight">
                        {report.title}
                    </h1>

                    <ReportTypeBadge type={report.type} />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                        <MapPin size={16} className="shrink-0" />
                        <span className="font-medium">
                            {report.location_name}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock size={16} className="shrink-0" />
                        <span>
                            Dilaporkan {formatRelativeTime(report.occurred_at)}{" "}
                            • {formatDateTime(report.occurred_at)}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <ReportStatusBadge status={report.status} />
                    </div>
                </div>
            </div>

            <section>
                <h2 className="mb-2 text-lg font-semibold">Deskripsi</h2>
                <p className="whitespace-pre-line text-muted-foreground">
                    {report.description}
                </p>
            </section>

            <Separator />

            <Card className="border-0 bg-muted/50 shadow-none">
                <CardContent className="space-y-3 p-4">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Dilaporkan oleh
                    </h2>

                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarFallback>{initial}</AvatarFallback>
                        </Avatar>

                        <div>
                            <p className="font-semibold">{report.user.name}</p>
                        </div>
                    </div>

                    {report.user.wa_number ? (
                        <p className="text-sm text-muted-foreground">
                            WhatsApp: {report.user.wa_number}
                        </p>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            Nomor WhatsApp tidak tersedia
                        </p>
                    )}
                </CardContent>
            </Card>

            <div className="sticky bottom-4 z-10 flex flex-col gap-3 pt-2 sm:static sm:flex-row">
                {report.user.wa_number ? (
                    <Button asChild className="w-full sm:flex-1">
                        <a
                            href={whatsappURL}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <MessageCircle size={16} />
                            Hubungi via WhatsApp
                        </a>
                    </Button>
                ) : (
                    <Button disabled className="w-full sm:flex-1">
                        <MessageCircle size={16} />
                        Kontak tidak tersedia
                    </Button>
                )}

                {renderClaimAction()}
            </div>
        </div>
    );
}
