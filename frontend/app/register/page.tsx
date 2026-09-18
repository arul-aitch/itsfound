"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { useRegister } from "@/hooks/use-auth";
import { ApiClientError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const registerSchema = z.object({
    email: z.string().email("Email tidak valid"),
    password: z.string().min(8, "Password minimal 8 karakter"),
    name: z.string().min(1, "Nama wajib diisi"),
    wa_number: z
        .string()
        .max(20, "Nomor WhatsApp maksimal 20 karakter")
        .optional()
        .or(z.literal("")),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const router = useRouter();
    const registerMutation = useRegister();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: { email: "", password: "", name: "", wa_number: "" },
    });

    const onSubmit = (values: RegisterFormValues) => {
        registerMutation.mutate(values, {
            onSuccess: () => {
                toast.success("Akun berhasil dibuat");
                router.push("/login");
            },
            onError: (error) => {
                if (
                    error instanceof ApiClientError &&
                    error.code === "EMAIL_EXISTS"
                ) {
                    toast.error("Email sudah terdaftar");
                    return;
                }

                toast.error(
                    error instanceof Error
                        ? error.message
                        : "Terjadi kesalahan saat membuat akun",
                );
            },
        });
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-8">
            <Card className="w-full max-w-md rounded-xl border shadow-sm">
                <CardHeader className="space-y-2 pb-2 text-center">
                    <Link href="/" className="text-xl font-bold tracking-tight">
                        ITSFOUND
                    </Link>
                    <p className="text-sm text-muted-foreground">
                        Buat akun untuk mulai melapor
                    </p>
                </CardHeader>

                <CardContent>
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="space-y-5"
                    >
                        <div className="space-y-2">
                            <Label htmlFor="name">Nama</Label>
                            <Input
                                id="name"
                                type="text"
                                autoComplete="name"
                                placeholder="Nama lengkap"
                                className="h-11 rounded-lg"
                                {...register("name")}
                            />
                            {errors.name && (
                                <p className="text-sm text-destructive">
                                    {errors.name.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                autoComplete="email"
                                placeholder="nama@example.com"
                                className="h-11 rounded-lg"
                                {...register("email")}
                            />
                            {errors.email && (
                                <p className="text-sm text-destructive">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                autoComplete="new-password"
                                placeholder="Minimal 8 karakter"
                                className="h-11 rounded-lg"
                                {...register("password")}
                            />
                            {errors.password && (
                                <p className="text-sm text-destructive">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="wa_number">Nomor WhatsApp</Label>
                            <Input
                                id="wa_number"
                                type="tel"
                                autoComplete="tel"
                                placeholder="Opsional"
                                className="h-11 rounded-lg"
                                {...register("wa_number")}
                            />
                            {errors.wa_number && (
                                <p className="text-sm text-destructive">
                                    {errors.wa_number.message}
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="h-11 w-full rounded-lg font-semibold"
                            disabled={registerMutation.isPending}
                        >
                            {registerMutation.isPending
                                ? "Memuat..."
                                : "Daftar"}
                        </Button>
                    </form>

                    <p className="mt-6 text-center text-sm text-muted-foreground">
                        Sudah punya akun?{" "}
                        <Link
                            href="/login"
                            className="font-medium text-foreground underline underline-offset-4"
                        >
                            Masuk
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
