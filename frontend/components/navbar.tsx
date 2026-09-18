"use client";

import Link from "next/link";
import { Menu, Search } from "lucide-react";

import { useMe, useLogout } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { UserMenu } from "@/components/user-menu";

export function Navbar() {
    const { data: user, isLoading } = useMe();
    const { logout } = useLogout();

    const isLoggedIn = !isLoading && !!user;

    return (
        <header className="sticky top-0 z-40 border-b bg-background/80 shadow-xs backdrop-blur-sm">
            <nav className="mx-auto flex h-14 items-center justify-between px-4 sm:h-16 sm:px-6 lg:px-8">
                <div className="flex items-center gap-2">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-lg font-bold tracking-tight transition-opacity hover:opacity-80 sm:text-xl"
                    >
                        <span>ITSFOUND</span>
                        <Search size={20} strokeWidth={2.25} />
                    </Link>
                </div>

                <div className="hidden items-center gap-6 md:flex">
                    <Link
                        href="/reports"
                        className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                        Laporan
                    </Link>

                    {isLoggedIn && (
                        <Link
                            href="/dashboard"
                            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                            Dashboard
                        </Link>
                    )}
                </div>

                <div className="hidden items-center gap-2 md:flex">
                    {isLoggedIn ? (
                        <>
                            <Button asChild>
                                <Link href="/reports/new">+ Lapor</Link>
                            </Button>
                            <UserMenu />
                        </>
                    ) : (
                        <>
                            <Button variant="ghost" asChild>
                                <Link href="/login">Masuk</Link>
                            </Button>
                            <Button asChild>
                                <Link href="/register">Daftar</Link>
                            </Button>
                        </>
                    )}
                </div>

                <div className="md:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Buka menu"
                            >
                                <Menu size={20} />
                            </Button>
                        </SheetTrigger>

                        <SheetContent
                            side="right"
                            className="w-[85%] sm:max-w-sm"
                        >
                            <SheetHeader>
                                <SheetTitle>ITSFOUND</SheetTitle>
                            </SheetHeader>

                            <div className="mt-6 flex flex-col gap-2">
                                {isLoggedIn ? (
                                    <div className="mb-4 border-b pb-4">
                                        <p className="font-semibold">
                                            {user.name}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {user.email}
                                        </p>
                                    </div>
                                ) : null}

                                <Link
                                    href="/reports"
                                    className="rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                                >
                                    Laporan
                                </Link>

                                {isLoggedIn && (
                                    <Link
                                        href="/dashboard"
                                        className="rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                                    >
                                        Dashboard
                                    </Link>
                                )}

                                {isLoggedIn ? (
                                    <>
                                        <Link
                                            href="/reports/new"
                                            className="rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                                        >
                                            + Lapor
                                        </Link>

                                        <Button
                                            variant="ghost"
                                            className="justify-start rounded-lg px-3"
                                            onClick={logout}
                                        >
                                            Keluar
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            href="/login"
                                            className="rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                                        >
                                            Masuk
                                        </Link>

                                        <Link
                                            href="/register"
                                            className="rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                                        >
                                            Daftar
                                        </Link>
                                    </>
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </nav>
        </header>
    );
}
