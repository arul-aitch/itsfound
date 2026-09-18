"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useMe } from "@/hooks/use-auth";

type AdminGuardProps = {
    children: React.ReactNode;
};

export function AdminGuard({ children }: AdminGuardProps) {
    const router = useRouter();
    const { data: user, isLoading } = useMe();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted || isLoading) {
            return;
        }

        if (!user) {
            router.replace("/login");
            return;
        }

        if (user.role !== "admin") {
            toast.error("Akses admin diperlukan");
            router.replace("/");
        }
    }, [mounted, isLoading, user, router]);

    if (!mounted || isLoading) {
        return (
            <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
                <div className="flex w-full max-w-md flex-col gap-4">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
                    <div className="h-6 w-48 self-center animate-pulse rounded bg-muted" />
                    <div className="h-4 w-64 self-center animate-pulse rounded bg-muted" />
                </div>
            </div>
        );
    }

    if (!user || user.role !== "admin") {
        return (
            <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertCircle className="size-4" />
                    Memeriksa akses...
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
