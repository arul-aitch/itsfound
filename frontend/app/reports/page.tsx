"use client";

import { useEffect, useState } from "react";
import {
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Inbox,
    Search,
} from "lucide-react";

import { ReportCard } from "@/components/report-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, LOCATIONS, PER_PAGE } from "@/lib/constants";
import { useReports } from "@/hooks/use-reports";
import type { ReportType } from "@/lib/types";

export default function ReportsPage() {
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [type, setType] = useState<"" | ReportType>("");
    const [categoryId, setCategoryId] = useState<number | null>(null);
    const [locationId, setLocationId] = useState<number | null>(null);
    const [page, setPage] = useState(1);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        setPage(1);
    }, [type, categoryId, locationId]);

    const { data, isLoading, isError, refetch } = useReports({
        page,
        per_page: PER_PAGE,
        type: type || undefined,
        category_id: categoryId ?? undefined,
        location_id: locationId ?? undefined,
        search: search || undefined,
    });

    return (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">
                    Semua Laporan
                </h1>
                <p className="mt-2 text-muted-foreground">
                    Cari barang hilang atau temuan di kampus ITS.
                </p>
            </header>

            <div className="mb-6 space-y-4">
                <div className="relative">
                    <Search
                        size={20}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                        value={searchInput}
                        onChange={(event) => setSearchInput(event.target.value)}
                        placeholder="Cari berdasarkan judul atau deskripsi..."
                        className="h-11 rounded-lg pl-11"
                    />
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button
                        size="sm"
                        variant={type === "" ? "default" : "outline"}
                        onClick={() => {
                            setType("");
                            setPage(1);
                        }}
                        className="rounded-lg"
                    >
                        Semua
                    </Button>

                    <Button
                        size="sm"
                        variant={type === "lost" ? "default" : "outline"}
                        onClick={() => {
                            setType("lost");
                            setPage(1);
                        }}
                        className="rounded-lg"
                    >
                        Hilang
                    </Button>

                    <Button
                        size="sm"
                        variant={type === "found" ? "default" : "outline"}
                        onClick={() => {
                            setType("found");
                            setPage(1);
                        }}
                        className="rounded-lg"
                    >
                        Temuan
                    </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Select
                        value={categoryId?.toString() ?? "all"}
                        onValueChange={(value) => {
                            setCategoryId(
                                value === "all" ? null : Number(value),
                            );
                            setPage(1);
                        }}
                    >
                        <SelectTrigger className="w-[180px] rounded-lg">
                            <SelectValue placeholder="Semua Kategori" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Kategori</SelectItem>
                            {CATEGORIES.map((category) => (
                                <SelectItem
                                    key={category.id}
                                    value={category.id.toString()}
                                >
                                    {category.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={locationId?.toString() ?? "all"}
                        onValueChange={(value) => {
                            setLocationId(
                                value === "all" ? null : Number(value),
                            );
                            setPage(1);
                        }}
                    >
                        <SelectTrigger className="w-[180px] rounded-lg">
                            <SelectValue placeholder="Semua Lokasi" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Lokasi</SelectItem>
                            {LOCATIONS.map((location) => (
                                <SelectItem
                                    key={location.id}
                                    value={location.id.toString()}
                                >
                                    {location.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div
                            key={index}
                            className="h-72 rounded-xl bg-muted animate-pulse"
                        />
                    ))}
                </div>
            ) : isError ? (
                <div className="flex min-h-60 flex-col items-center justify-center gap-3 text-center">
                    <AlertCircle size={48} className="text-muted-foreground" />
                    <p className="font-medium">Gagal memuat laporan</p>
                    <Button onClick={() => refetch()}>Coba lagi</Button>
                </div>
            ) : data?.data.length === 0 ? (
                <div className="flex min-h-60 flex-col items-center justify-center gap-3 rounded-xl border border-dashed text-center">
                    <Inbox size={48} className="text-muted-foreground" />
                    <p className="font-medium">Belum ada laporan</p>
                    <p className="text-sm text-muted-foreground">
                        Coba ubah filter atau kata kunci pencarian.
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {data?.data.map((report) => (
                            <ReportCard key={report.id} report={report} />
                        ))}
                    </div>

                    {data && data.meta.total_pages > 1 && (
                        <div className="flex items-center justify-between gap-4 pt-8">
                            <span className="text-sm text-muted-foreground">
                                Menampilkan {(page - 1) * PER_PAGE + 1}–
                                {Math.min(page * PER_PAGE, data.meta.total)}{" "}
                                dari {data.meta.total} laporan
                            </span>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page === 1}
                                    onClick={() => setPage(page - 1)}
                                >
                                    <ChevronLeft size={16} />
                                </Button>

                                <span className="whitespace-nowrap text-sm font-medium">
                                    Halaman {page} dari {data.meta.total_pages}
                                </span>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page >= data.meta.total_pages}
                                    onClick={() => setPage(page + 1)}
                                >
                                    <ChevronRight size={16} />
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
    