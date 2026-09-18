"use client";

import Link from "next/link";
import { useState } from "react";
import { Search } from "lucide-react";

import { useReports } from "@/hooks/use-reports";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ReportCard } from "@/components/report-card";

export default function HomePage() {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"all" | "lost" | "found">("all");

    const { data, isLoading, isError } = useReports({
        per_page: 6,
        type: filter === "all" ? undefined : filter,
        search: search || undefined,
    });

    return (
        <div>
            <section className="border-b bg-gradient-to-b from-primary/15 via-primary/5 to-background">
                <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:py-24">
                    <h1 className="text-3xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
                        Barang hilang? Cek ITSFOUND dulu.
                    </h1>

                    <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                        Pusat informasi barang hilang &amp; temuan di lingkungan
                        kampus ITS.
                    </p>

                    <div className="relative mx-auto mt-6 max-w-xl">
                        <Search
                            size={20}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                        />
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Cari barang..."
                            className="h-12 rounded-lg border shadow-xs pl-11 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40"
                        />
                    </div>

                    <div className="mt-4 flex justify-center gap-2">
                        <Button
                            size="sm"
                            variant={filter === "all" ? "default" : "outline"}
                            onClick={() => setFilter("all")}
                            className="rounded-lg"
                        >
                            Semua
                        </Button>

                        <Button
                            size="sm"
                            variant={filter === "lost" ? "default" : "outline"}
                            onClick={() => setFilter("lost")}
                            className="rounded-lg"
                        >
                            Hilang
                        </Button>

                        <Button
                            size="sm"
                            variant={filter === "found" ? "default" : "outline"}
                            onClick={() => setFilter("found")}
                            className="rounded-lg"
                        >
                            Temuan
                        </Button>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-5xl px-4 pt-16 pb-12 sm:px-6 lg:px-8">
                <div className="mb-6 flex items-center justify-between gap-4">
                    <h2 className="text-2xl font-semibold tracking-tight">
                        Laporan Terbaru
                    </h2>

                    <Link
                        href="/reports"
                        className="text-sm font-medium text-primary transition-opacity hover:opacity-80"
                    >
                        Lihat semua →
                    </Link>
                </div>

                {isLoading ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-72 animate-pulse rounded-xl bg-muted"
                            />
                        ))}
                    </div>
                ) : isError ? (
                    <div className="rounded-xl border border-dashed p-10 text-center">
                        <p className="font-medium">Gagal memuat laporan</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Coba refresh halaman.
                        </p>
                    </div>
                ) : !data || data.data.length === 0 ? (
                    <div className="rounded-xl border border-dashed">
                        <div className="flex min-h-60 flex-col items-center justify-center px-6 py-10 text-center">
                            <div className="rounded-full bg-muted p-5">
                                <Search
                                    size={32}
                                    strokeWidth={1.5}
                                    className="text-muted-foreground"
                                />
                            </div>

                            <p className="mt-5 font-medium">
                                {search
                                    ? `Tidak ada hasil untuk "${search}"`
                                    : "Belum ada laporan"}
                            </p>

                            <p className="mt-1 text-sm text-muted-foreground">
                                {search
                                    ? "Coba kata kunci lain atau ubah filter."
                                    : "Jadilah yang pertama melaporkan barang hilang atau temuan."}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {data.data.map((report) => (
                            <ReportCard key={report.id} report={report} />
                        ))}
                    </div>
                )}
            </section>

            <section className="mx-auto max-w-5xl px-4 pb-12 sm:px-6 lg:px-8">
                <Card className="rounded-xl border border-primary/20 bg-primary/10 shadow-xs">
                    <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                        <div>
                            <h2 className="font-semibold">
                                Punya barang hilang atau menemukan barang?
                            </h2>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Buat laporan agar informasi barang bisa
                                ditemukan oleh civitas ITS.
                            </p>
                        </div>

                        <Button asChild className="shrink-0 rounded-lg">
                            <Link href="/reports/new">+ Buat Laporan</Link>
                        </Button>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
