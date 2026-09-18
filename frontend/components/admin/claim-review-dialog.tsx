"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { useUpdateClaimStatus } from "@/hooks/use-admin";
import { ApiClientError } from "@/lib/api";
import type { Claim } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

interface ClaimReviewDialogProps {
    claim: Claim | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: "approve" | "reject";
}

const reviewSchema = z.object({
    admin_note: z
        .string()
        .max(500, "Maksimal 500 karakter")
        .optional()
        .or(z.literal("")),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

export function ClaimReviewDialog({
    claim,
    open,
    onOpenChange,
    mode,
}: ClaimReviewDialogProps) {
    const updateStatus = useUpdateClaimStatus();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ReviewFormValues>({
        resolver: zodResolver(reviewSchema),
        defaultValues: { admin_note: "" },
    });

    useEffect(() => {
        if (!open) {
            reset();
        }
    }, [open, reset]);

    if (!claim) {
        return null;
    }

    const isApprove = mode === "approve";

    const onSubmit = (values: ReviewFormValues) => {
        updateStatus.mutate(
            {
                id: claim.id,
                status: isApprove ? "approved" : "rejected",
                admin_note: values.admin_note?.trim() || undefined,
            },
            {
                onSuccess: () => {
                    toast.success(
                        isApprove ? "Klaim disetujui" : "Klaim ditolak",
                    );
                    onOpenChange(false);
                    reset();
                },
                onError: (error) => {
                    if (error instanceof ApiClientError) {
                        if (error.code === "INVALID_CLAIM_STATUS") {
                            toast.error("Klaim sudah diproses sebelumnya");
                            return;
                        }
                        toast.error(error.message);
                        return;
                    }
                    toast.error("Terjadi kesalahan");
                },
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {isApprove ? "Setujui Klaim" : "Tolak Klaim"}
                    </DialogTitle>
                    <DialogDescription>
                        {isApprove
                            ? "Klaim akan disetujui dan laporan akan ditandai selesai."
                            : "Klaim akan ditolak. Pastikan alasan yang jelas."}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 rounded-lg bg-muted/50 p-4 text-sm">
                    <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Laporan
                        </p>
                        <p className="font-medium">{claim.report.title}</p>
                    </div>

                    <Separator />

                    <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Pengklaim
                        </p>
                        <p className="font-medium">{claim.claimant.name}</p>
                        {claim.claimant.wa_number && (
                            <p className="text-xs text-muted-foreground">
                                WA: {claim.claimant.wa_number}
                            </p>
                        )}
                    </div>

                    <Separator />

                    <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Bukti
                        </p>
                        <p className="mt-1 whitespace-pre-line">
                            {claim.evidence}
                        </p>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Diajukan</span>
                        <span>{formatDateTime(claim.created_at)}</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="admin_note">
                            Catatan Admin (opsional)
                        </Label>
                        <Textarea
                            id="admin_note"
                            rows={3}
                            placeholder={
                                isApprove
                                    ? "Contoh: Bukti sesuai dengan ciri barang."
                                    : "Contoh: Bukti tidak cukup, tidak ada ciri khusus yang cocok."
                            }
                            {...register("admin_note")}
                        />
                        {errors.admin_note && (
                            <p className="text-sm text-destructive">
                                {errors.admin_note.message}
                            </p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={updateStatus.isPending}
                        >
                            Batal
                        </Button>

                        <Button
                            type="submit"
                            variant={isApprove ? "default" : "destructive"}
                            disabled={updateStatus.isPending}
                        >
                            {updateStatus.isPending ? (
                                <>
                                    <Loader2
                                        size={16}
                                        className="animate-spin"
                                    />
                                    Memproses...
                                </>
                            ) : isApprove ? (
                                "Setujui"
                            ) : (
                                "Tolak"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
