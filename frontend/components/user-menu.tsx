"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut } from "lucide-react";

import { useMe, useLogout } from "@/hooks/use-auth";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export function UserMenu() {
    const router = useRouter();
    const { data: user } = useMe();
    const { logout } = useLogout();

    if (!user) {
        return null;
    }

    const initial = user.name.trim().charAt(0).toUpperCase() || "U";

    const handleLogout = () => {
        logout();
        router.push("/");
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    aria-label="Buka menu pengguna"
                    className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                    <Avatar className="h-9 w-9">
                        <AvatarFallback>{initial}</AvatarFallback>
                    </Avatar>
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-64 p-2">
                <div className="px-2 py-2">
                    <p className="truncate font-semibold">{user.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                        {user.email}
                    </p>
                </div>

                <Separator className="my-2" />

                <Link
                    href="/dashboard"
                    className="block rounded-md px-2 py-2 text-sm hover:bg-muted"
                >
                    Dashboard
                </Link>

                <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-destructive hover:bg-muted"
                >
                    <LogOut size={16} />
                    Keluar
                </button>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
