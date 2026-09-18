"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    ClipboardList,
    FileText,
    LayoutDashboard,
    Menu,
    X,
} from "lucide-react";
import { AdminGuard } from "@/components/admin/admin-guard";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navItems = [
    {
        href: "/admin",
        label: "Dashboard",
        icon: LayoutDashboard,
    },
    {
        href: "/admin/reports",
        label: "Laporan",
        icon: FileText,
    },
    {
        href: "/admin/claims",
        label: "Klaim",
        icon: ClipboardList,
    },
];

type AdminSidebarProps = {
    mobile?: boolean;
    onNavigate?: () => void;
};

function AdminSidebar({ mobile = false, onNavigate }: AdminSidebarProps) {
    const pathname = usePathname();

    return (
        <aside
            className={cn(
                "bg-background",
                mobile
                    ? "flex h-full w-full flex-col"
                    : "hidden w-60 shrink-0 border-r lg:flex",
            )}
        >
            <div className="px-4 py-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Admin Panel
            </div>

            <nav className="flex flex-col gap-1 px-3">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active =
                        item.href === "/admin"
                            ? pathname === "/admin"
                            : pathname.startsWith(item.href);

                    return mobile ? (
                        <SheetClose asChild key={item.href}>
                            <Link
                                href={item.href}
                                onClick={onNavigate}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                                    active
                                        ? "bg-primary/10 font-medium text-primary"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                )}
                            >
                                <Icon className="size-5" />
                                <span>{item.label}</span>
                            </Link>
                        </SheetClose>
                    ) : (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                                active
                                    ? "bg-primary/10 font-medium text-primary"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                            )}
                        >
                            <Icon className="size-5" />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}

export default function AdminLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const [open, setOpen] = useState(false);

    return (
        <AdminGuard>
            <div className="flex min-h-[calc(100vh-4rem)] bg-muted/20">
                <AdminSidebar />

                <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex h-14 items-center border-b bg-background px-4 lg:hidden">
                        <button
                            type="button"
                            onClick={() => setOpen(true)}
                            className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                            aria-label="Buka menu admin"
                        >
                            <Menu className="size-5" />
                        </button>

                        <span className="ml-3 text-sm font-semibold">
                            Admin Panel
                        </span>
                    </div>

                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetContent
                            side="left"
                            className="w-72 p-0 sm:max-w-none"
                        >
                            <SheetHeader className="sr-only">
                                <SheetTitle>Admin Panel</SheetTitle>
                            </SheetHeader>

                            <div className="flex h-full flex-col pt-4">
                                <div className="flex items-center justify-end px-4 pb-2">
                                    <button
                                        type="button"
                                        onClick={() => setOpen(false)}
                                        className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                                        aria-label="Tutup menu admin"
                                    >
                                        <X className="size-5" />
                                    </button>
                                </div>

                                <AdminSidebar
                                    mobile
                                    onNavigate={() => setOpen(false)}
                                />
                            </div>
                        </SheetContent>
                    </Sheet>

                    <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
                        {children}
                    </main>
                </div>
            </div>
        </AdminGuard>
    );
}
