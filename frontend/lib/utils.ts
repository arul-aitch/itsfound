import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const diff = Date.now() - date.getTime();

    if (diff < 60 * 1000) {
        return "Baru saja";
    }

    if (diff < 60 * 60 * 1000) {
        return `${Math.floor(diff / (60 * 1000))} menit lalu`;
    }

    if (diff < 24 * 60 * 60 * 1000) {
        return `${Math.floor(diff / (60 * 60 * 1000))} jam lalu`;
    }

    if (diff < 7 * 24 * 60 * 60 * 1000) {
        return `${Math.floor(diff / (24 * 60 * 60 * 1000))} hari lalu`;
    }

    return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(date);
}
