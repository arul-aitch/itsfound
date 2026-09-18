"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { useCreateClaim } from "@/hooks/use-claims";
import { ApiClientError } from "@/lib/api";
import type { Report } from "@/lib/types";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ClaimDialogProps {
    report: Report;
    children: React.ReactNode;
}

const claimSchema = z.object({
    evidence: z
        .string()
        .min(10, "Bukti minimal 10 karakter")
        .max(1000, "Maksimal 1000 karakter"),
});

type ClaimFormValues = z.infer<typeof claimSchema>;

export function ClaimDialog({ report, children }: ClaimDialogProps) {
    const [open, setOpen] = useState(false);
    const createClaim = useCreateClaim();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ClaimFormValues>({
        resolver: zodResolver(claimSchema),
        defaultValues: {
            evidence: "",
        },
    });

    useEffect(() => {
        if (!open) {
            reset();
        }
    }, [open, reset]);

    const onSubmit = (values: ClaimFormValues) => {
        createClaim.mutate(
            {
                report_id: report.id,
                evidence: values.evidence.trim(),
            },
            {
                onSuccess: () => {
                    toast.success("Klaim berhasil diajukan");
                    setOpen(false);
                    reset();
                },
                onError: (error) => {
                    if (error instanceof ApiClientError) {
                        switch (error.code) {
                            case "CLAIM_DUPLICATE":
                                toast.error(
                                    "Kamu sudah pernah mengklaim laporan ini",
                                );
                                return;

                            case "NOT_CLAIMABLE":
                                toast.error(
                                    error.message ||
                                        "Laporan ini tidak bisa diklaim saat ini",
                                );
                                return;

                            case "VALIDATION_ERROR":
                                toast.error(
                                    "Periksa kembali bukti yang kamu isi",
                                );
                                return;

                            case "UNAUTHORIZED":
                                toast.error("Silakan login ulang");
                                return;
                        }

                        toast.error(error.message);
                        return;
                    }

                    toast.error(
                        error instanceof Error
                            ? error.message
                            : "Terjadi kesalahan saat mengajukan klaim",
                    );
                },
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>

            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Ajukan Klaim</DialogTitle>
                    <DialogDescription>
                        Jelaskan kenapa barang ini milikmu. Sertakan ciri-ciri
                        khusus yang hanya diketahui pemiliknya.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="rounded-lg bg-muted/50 p-3 text-sm">
                        Klaim kamu akan ditinjau oleh admin. Pastikan bukti yang
                        kamu berikan jelas.
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="evidence">Bukti Kepemilikan *</Label>

                        <Textarea
                            id="evidence"
                            rows={5}
                            placeholder="Contoh: Dompet ini milik saya karena ada kartu identitas dengan nama saya dan tanda khusus di bagian dalam."
                            {...register("evidence")}
                        />

                        <p className="text-xs text-muted-foreground">
                            Minimal 10 karakter. Jelaskan sedetail mungkin.
                        </p>

                        {errors.evidence && (
                            <p className="text-sm text-destructive">
                                {errors.evidence.message}
                            </p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={createClaim.isPending}
                        >
                            Batal
                        </Button>

                        <Button type="submit" disabled={createClaim.isPending}>
                            {createClaim.isPending
                                ? "Mengirim..."
                                : "Kirim Klaim"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
