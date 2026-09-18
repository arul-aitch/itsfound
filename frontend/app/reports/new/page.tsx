"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, PackageCheck, PackageX } from "lucide-react";
import { toast } from "sonner";

import { useMe } from "@/hooks/use-auth";
import { useCreateReport } from "@/hooks/use-reports";
import { ApiClientError } from "@/lib/api";
import { CATEGORIES, LOCATIONS } from "@/lib/constants";
import type { CreateReportRequest } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const reportSchema = z.object({
    type: z.enum(["lost", "found"], {
        message: "Pilih jenis laporan",
    }),
    title: z
        .string()
        .min(3, "Judul minimal 3 karakter")
        .max(255, "Judul maksimal 255 karakter"),
    description: z.string().min(10, "Deskripsi minimal 10 karakter"),
    category_id: z.number().int().positive("Pilih kategori"),
    location_id: z.number().int().positive("Pilih lokasi"),
    occurred_at: z.string().min(1, "Tanggal wajib diisi"),
});

type ReportFormValues = z.infer<typeof reportSchema>;

export default function NewReportPage() {
    const router = useRouter();
    const { data: user, isLoading: isUserLoading } = useMe();
    const createReport = useCreateReport();

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<ReportFormValues>({
        resolver: zodResolver(reportSchema),
        defaultValues: {
            type: "lost",
            title: "",
            description: "",
            category_id: 0,
            location_id: 0,
            occurred_at: "",
        },
    });

    const selectedType = watch("type");
    const selectedCategoryId = watch("category_id");
    const selectedLocationId = watch("location_id");

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace("/login");
        }
    }, [isUserLoading, user, router]);

    const onSubmit = (values: ReportFormValues) => {
        if (!user) {
            return;
        }

        const occurredAt = new Date(values.occurred_at);

        if (Number.isNaN(occurredAt.getTime())) {
            toast.error("Tanggal tidak valid");
            return;
        }

        const payload: CreateReportRequest = {
            type: values.type,
            title: values.title,
            description: values.description,
            category_id: values.category_id,
            location_id: values.location_id,
            occurred_at: occurredAt.toISOString(),
        };

        createReport.mutate(payload, {
            onSuccess: (response) => {
                if (!response) {
                    toast.error("Laporan gagal dibuat");
                    return;
                }

                toast.success("Laporan berhasil dibuat");
                router.push(`/reports/${response.id}`);
            },
            onError: (error) => {
                if (error instanceof ApiClientError) {
                    if (error.code === "VALIDATION_ERROR") {
                        toast.error("Periksa kembali data yang diisi");
                        return;
                    }

                    if (error.code === "UNAUTHORIZED") {
                        router.replace("/login");
                        return;
                    }
                }

                toast.error(
                    error instanceof Error
                        ? error.message
                        : "Terjadi kesalahan saat membuat laporan",
                );
            },
        });
    };

    if (isUserLoading || !user) {
        return (
            <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
                <div className="space-y-6">
                    <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
                    <div className="h-9 w-56 animate-pulse rounded-md bg-muted" />
                    <div className="h-5 w-72 animate-pulse rounded-md bg-muted" />

                    <div className="space-y-6">
                        <div className="h-24 animate-pulse rounded-lg bg-muted" />
                        <div className="h-20 animate-pulse rounded-lg bg-muted" />
                        <div className="h-32 animate-pulse rounded-lg bg-muted" />
                        <div className="h-20 animate-pulse rounded-lg bg-muted" />
                        <div className="h-20 animate-pulse rounded-lg bg-muted" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
            <Button variant="ghost" size="sm" asChild>
                <Link href="/reports">
                    <ArrowLeft size={16} />
                    Kembali
                </Link>
            </Button>

            <h1 className="mt-4 text-3xl font-bold tracking-tight">
                Buat Laporan
            </h1>

            <p className="mt-1 text-muted-foreground">
                Laporkan barang hilang atau temuan.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
                <div className="space-y-2">
                    <Label>Jenis Laporan *</Label>

                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            type="button"
                            size="lg"
                            variant={
                                selectedType === "lost" ? "default" : "outline"
                            }
                            className="h-12"
                            onClick={() =>
                                setValue("type", "lost", {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                })
                            }
                        >
                            <PackageX size={18} />
                            Hilang
                        </Button>

                        <Button
                            type="button"
                            size="lg"
                            variant={
                                selectedType === "found" ? "default" : "outline"
                            }
                            className="h-12"
                            onClick={() =>
                                setValue("type", "found", {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                })
                            }
                        >
                            <PackageCheck size={18} />
                            Temuan
                        </Button>
                    </div>

                    {errors.type && (
                        <p className="text-sm text-destructive">
                            {errors.type.message}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="title">Judul *</Label>

                    <Input
                        id="title"
                        placeholder="Contoh: Dompet hitam hilang"
                        className="h-11 rounded-lg"
                        {...register("title")}
                    />

                    {errors.title && (
                        <p className="text-sm text-destructive">
                            {errors.title.message}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Deskripsi *</Label>

                    <Textarea
                        id="description"
                        rows={4}
                        placeholder="Jelaskan ciri-ciri barang, kronologi, atau detail lain yang membantu."
                        {...register("description")}
                    />

                    {errors.description && (
                        <p className="text-sm text-destructive">
                            {errors.description.message}
                        </p>
                    )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Kategori *</Label>

                        <Select
                            value={
                                selectedCategoryId > 0
                                    ? selectedCategoryId.toString()
                                    : ""
                            }
                            onValueChange={(value) =>
                                setValue("category_id", Number(value), {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                })
                            }
                        >
                            <SelectTrigger className="h-11 rounded-lg">
                                <SelectValue placeholder="Pilih kategori" />
                            </SelectTrigger>

                            <SelectContent>
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

                        {errors.category_id && (
                            <p className="text-sm text-destructive">
                                {errors.category_id.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Lokasi *</Label>

                        <Select
                            value={
                                selectedLocationId > 0
                                    ? selectedLocationId.toString()
                                    : ""
                            }
                            onValueChange={(value) =>
                                setValue("location_id", Number(value), {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                })
                            }
                        >
                            <SelectTrigger className="h-11 rounded-lg">
                                <SelectValue placeholder="Pilih lokasi" />
                            </SelectTrigger>

                            <SelectContent>
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

                        {errors.location_id && (
                            <p className="text-sm text-destructive">
                                {errors.location_id.message}
                            </p>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="occurred_at">Waktu Kejadian *</Label>

                    <Input
                        id="occurred_at"
                        type="datetime-local"
                        className="h-11 rounded-lg"
                        {...register("occurred_at")}
                    />

                    <p className="text-xs text-muted-foreground">
                        Kapan barang hilang atau ditemukan.
                    </p>

                    {errors.occurred_at && (
                        <p className="text-sm text-destructive">
                            {errors.occurred_at.message}
                        </p>
                    )}
                </div>

                <Button
                    type="submit"
                    className="h-12 w-full font-semibold"
                    disabled={createReport.isPending}
                >
                    {createReport.isPending ? "Membuat..." : "Buat Laporan"}
                </Button>
            </form>
        </div>
    );
}
