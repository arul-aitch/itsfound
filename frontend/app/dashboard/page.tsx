"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, FileQuestion, Package } from "lucide-react";

import { useMe } from "@/hooks/use-auth";
import { useMyClaims } from "@/hooks/use-claims";
import { useMyReports } from "@/hooks/use-reports";

import { MyClaimCard } from "@/components/my-claim-card";
import { MyReportCard } from "@/components/my-report-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DashboardPage() {
    const router = useRouter();
    const { data: user, isLoading: isUserLoading } = useMe();

    const reportsQuery = useMyReports({ per_page: 20 });
    const claimsQuery = useMyClaims();

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace("/login");
        }
    }, [isUserLoading, user, router]);

    if (isUserLoading || !user) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
                <div className="space-y-6">
                    <div className="h-9 w-40 animate-pulse rounded-md bg-muted" />
                    <div className="h-5 w-72 animate-pulse rounded-md bg-muted" />
                    <div className="h-10 w-72 animate-pulse rounded-md bg-muted" />

                    <div className="space-y-3">
                        <div className="h-28 animate-pulse rounded-lg bg-muted" />
                        <div className="h-28 animate-pulse rounded-lg bg-muted" />
                        <div className="h-28 animate-pulse rounded-lg bg-muted" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
            <header className="mb-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Dashboard
                        </h1>

                        <p className="mt-1 text-muted-foreground">
                            Kelola laporan dan klaim kamu.
                        </p>

                        <p className="mt-2 text-sm text-muted-foreground">
                            Halo, {user.name}
                        </p>
                    </div>

                    <Button asChild className="w-full sm:w-auto">
                        <Link href="/reports/new">+ Buat Laporan</Link>
                    </Button>
                </div>
            </header>

            <Tabs defaultValue="reports">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="reports">Laporan Saya</TabsTrigger>
                    <TabsTrigger value="claims">Klaim Saya</TabsTrigger>
                </TabsList>

                <TabsContent value="reports" className="mt-6">
                    {reportsQuery.isLoading ? (
                        <div className="space-y-3">
                            <div className="h-28 animate-pulse rounded-lg bg-muted" />
                            <div className="h-28 animate-pulse rounded-lg bg-muted" />
                            <div className="h-28 animate-pulse rounded-lg bg-muted" />
                        </div>
                    ) : reportsQuery.isError ? (
                        <div className="flex min-h-60 flex-col items-center justify-center gap-3 text-center">
                            <AlertCircle
                                size={48}
                                className="text-muted-foreground"
                            />
                            <p className="font-medium">Gagal memuat laporan</p>
                            <Button onClick={() => reportsQuery.refetch()}>
                                Coba lagi
                            </Button>
                        </div>
                    ) : reportsQuery.data?.data.length === 0 ? (
                        <div className="flex min-h-60 flex-col items-center justify-center gap-3 rounded-lg border border-dashed text-center">
                            <Package
                                size={48}
                                className="text-muted-foreground"
                            />
                            <p className="font-medium">Belum ada laporan</p>
                            <p className="text-sm text-muted-foreground">
                                Mulai laporkan barang hilang atau temuan.
                            </p>
                            <Button asChild className="mt-1">
                                <Link href="/reports/new">+ Buat Laporan</Link>
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-3">
                                {reportsQuery.data?.data.map((report) => (
                                    <MyReportCard
                                        key={report.id}
                                        report={report}
                                    />
                                ))}
                            </div>

                            {reportsQuery.data && (
                                <p className="mt-4 text-sm text-muted-foreground">
                                    Menampilkan {reportsQuery.data.data.length}{" "}
                                    dari {reportsQuery.data.meta.total} laporan
                                </p>
                            )}
                        </>
                    )}
                </TabsContent>

                <TabsContent value="claims" className="mt-6">
                    {claimsQuery.isLoading ? (
                        <div className="space-y-3">
                            <div className="h-36 animate-pulse rounded-lg bg-muted" />
                            <div className="h-36 animate-pulse rounded-lg bg-muted" />
                        </div>
                    ) : claimsQuery.isError ? (
                        <div className="flex min-h-60 flex-col items-center justify-center gap-3 text-center">
                            <AlertCircle
                                size={48}
                                className="text-muted-foreground"
                            />
                            <p className="font-medium">Gagal memuat klaim</p>
                            <Button onClick={() => claimsQuery.refetch()}>
                                Coba lagi
                            </Button>
                        </div>
                    ) : claimsQuery.data?.length === 0 ? (
                        <div className="flex min-h-60 flex-col items-center justify-center gap-3 rounded-lg border border-dashed text-center">
                            <FileQuestion
                                size={48}
                                className="text-muted-foreground"
                            />
                            <p className="font-medium">Belum ada klaim</p>
                            <p className="text-sm text-muted-foreground">
                                Kamu belum pernah mengajukan klaim.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {claimsQuery.data?.map((claim) => (
                                <MyClaimCard key={claim.id} claim={claim} />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
