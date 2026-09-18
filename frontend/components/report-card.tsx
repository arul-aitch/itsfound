"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock, ImageIcon, MapPin } from "lucide-react";

import { Card } from "@/components/ui/card";
import { ReportStatusBadge } from "@/components/report-status-badge";
import { ReportTypeBadge } from "@/components/report-type-badge";
import { formatRelativeTime } from "@/lib/utils";
import type { Report } from "@/lib/types";

interface ReportCardProps {
    report: Report;
}

export function ReportCard({ report }: ReportCardProps) {
    return (
        <Link href={`/reports/${report.id}`} className="block">
            <Card className="overflow-hidden rounded-lg shadow-sm transition-colors hover:border-primary/30 hover:shadow-sm">
                <div className="relative aspect-video bg-muted">
                    {report.photo_url ? (
                        <Image
                            src={report.photo_url}
                            alt={report.title}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover"
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center">
                            <ImageIcon
                                size={32}
                                className="text-muted-foreground/50"
                            />
                        </div>
                    )}
                </div>

                <div className="space-y-3 p-4">
                    <div className="flex items-start gap-2">
                        <h3 className="line-clamp-2 flex-1 font-semibold">
                            {report.title}
                        </h3>
                        <ReportTypeBadge type={report.type} />
                    </div>

                    <div className="flex gap-3 text-sm text-muted-foreground">
                        <div className="flex min-w-0 items-center gap-1.5">
                            <MapPin size={14} className="shrink-0" />
                            <span className="truncate">
                                {report.location_name}
                            </span>
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">
                            <Clock size={14} className="shrink-0" />
                            <span>
                                {formatRelativeTime(report.occurred_at)}
                            </span>
                        </div>
                    </div>

                    <p className="line-clamp-2 text-sm text-muted-foreground">
                        {report.description}
                    </p>

                    <div className="flex items-center gap-2">
                        <ReportStatusBadge status={report.status} />
                        <span className="truncate text-xs text-muted-foreground">
                            oleh {report.user.name}
                        </span>
                    </div>
                </div>
            </Card>
        </Link>
    );
}
