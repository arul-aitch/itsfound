import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function ReportsPage() {
    return (
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col items-center justify-center px-4 py-12 text-center">
            <h1 className="text-3xl font-bold tracking-tight">Semua Laporan</h1>

            <p className="mt-4 text-muted-foreground">Segera hadir.</p>

            <Button asChild className="mt-6 rounded-lg">
                <Link href="/">Kembali ke Home</Link>
            </Button>
        </div>
    );
}
